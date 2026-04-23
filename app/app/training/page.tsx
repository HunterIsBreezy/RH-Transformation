import { and, eq, gte, lt } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { clientSchedule } from "@/db/schema";
import { getClientByClerkId } from "@/lib/queries";
import { TrainingWeek } from "./TrainingWeek";
import { Eyebrow, Display, Body } from "@/components/type";
import { addWeeks, currentWeekStart } from "@/lib/week";

export const metadata = { title: "Training" };

export default async function TrainingPage() {
  await requireRole("client");
  const user = await currentUser();
  if (!user) return null;

  const detail = await getClientByClerkId(user.id);
  if (!detail) {
    return (
      <div className="max-w-3xl">
        <Eyebrow wide className="text-copper">Training</Eyebrow>
        <Display as="h1" size="md" tight className="mt-6 mb-6">
          Your program isn&apos;t linked yet.
        </Display>
        <Body muted tight>Your coaches will populate your first week once enrollment is confirmed.</Body>
      </div>
    );
  }

  const thisMonday = currentWeekStart();
  // Pull a 3-week window (prev / current / next) so navigation is instant.
  const windowStart = addWeeks(thisMonday, -1);
  const windowEnd = addWeeks(thisMonday, 2);
  const blocks = await db
    .select()
    .from(clientSchedule)
    .where(
      and(
        eq(clientSchedule.clientId, detail.client.id),
        gte(clientSchedule.weekStart, windowStart),
        lt(clientSchedule.weekStart, windowEnd),
      ),
    );

  return (
    <TrainingWeek
      clientId={detail.client.id}
      weekStartISO={thisMonday.toISOString().slice(0, 10)}
      blocks={blocks}
      allowNavigate={true}
    />
  );
}
