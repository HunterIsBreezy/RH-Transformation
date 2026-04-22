import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, payments, users } from "@/db/schema";
import { stripeClient } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROGRAM_FEE_KIND = "program_fee";
const APPLICATION_FEE_KIND = "application_fee";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "missing signature" }, { status: 400 });
  }

  const body = await req.text();
  const stripe = stripeClient();

  let event: import("stripe").Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, secret);
  } catch (err) {
    console.error("[stripe] bad signature", err);
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "payment_intent.succeeded": {
      const obj = event.data.object as
        | import("stripe").Stripe.Checkout.Session
        | import("stripe").Stripe.PaymentIntent;

      const email =
        "customer_details" in obj ? obj.customer_details?.email : undefined;
      const amount =
        "amount_total" in obj
          ? obj.amount_total
          : "amount" in obj
            ? obj.amount
            : 0;
      const currency = obj.currency ?? "usd";
      const stripeId = obj.id;
      const kind =
        (obj.metadata && (obj.metadata as Record<string, string>).kind) ??
        ((amount ?? 0) >= 100_000 ? PROGRAM_FEE_KIND : APPLICATION_FEE_KIND);

      const client = email ? await findClientByEmail(email) : null;

      if (client) {
        await db
          .insert(payments)
          .values({
            clientId: client.id,
            stripeId,
            amountCents: amount ?? 0,
            currency,
            status: "succeeded",
            kind,
            paidAt: new Date(),
          })
          .onConflictDoNothing({ target: payments.stripeId });

        if (kind === PROGRAM_FEE_KIND) {
          await db
            .update(clients)
            .set({ status: "paid", startDate: new Date(), updatedAt: new Date() })
            .where(eq(clients.id, client.id));
        }
      } else {
        console.warn(`[stripe] payment for unknown client email=${email}`);
      }
      break;
    }

    case "charge.refunded":
    case "payment_intent.payment_failed": {
      const obj = event.data.object as { id: string };
      console.log(`[stripe] ${event.type} id=${obj.id}`);
      break;
    }

    default:
      // swallow — we only care about the events above
      break;
  }

  return NextResponse.json({ received: true });
}

async function findClientByEmail(email: string) {
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  if (!user) return null;
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(eq(clients.userId, user.id))
    .limit(1);
  return client ?? null;
}
