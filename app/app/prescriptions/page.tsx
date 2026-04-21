import { requireRole } from "@/lib/auth";
import { Placeholder } from "@/components/portal/Placeholder";

export const metadata = { title: "Prescriptions" };

export default async function PrescriptionsPage() {
  await requireRole("coach");
  return (
    <Placeholder
      eyebrow="Coach · Prescriptions"
      title="Templates you reach for again and again."
    >
      The prescription layer that sits between a client&apos;s current behavior and their desired
      behavior. Pull a template, tweak the resource list, save the variant back to the library —
      or fork a fresh one inline on a client&apos;s board.
    </Placeholder>
  );
}
