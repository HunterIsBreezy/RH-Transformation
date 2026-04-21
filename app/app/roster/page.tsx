import { requireRole } from "@/lib/auth";
import { Placeholder } from "@/components/portal/Placeholder";

export const metadata = { title: "Roster" };

export default async function RosterPage() {
  await requireRole("coach");
  return (
    <Placeholder eyebrow="Coach · Roster" title="Your active men, at a glance.">
      The roster lands next: every client&apos;s status, last check-in, open flags, and week
      number — one row per man, sorted by who needs attention first. You&apos;ll click through to
      their behavior board, training, and meeting history from here.
    </Placeholder>
  );
}
