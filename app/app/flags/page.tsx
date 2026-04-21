import { requireRole } from "@/lib/auth";
import { Placeholder } from "@/components/portal/Placeholder";

export const metadata = { title: "Flags" };

export default async function FlagsPage() {
  await requireRole("coach");
  return (
    <Placeholder eyebrow="Coach · Flags" title="Who needs you this week.">
      Every open flag — missed check-ins, language that signals drift, transcript keywords, coach
      hunches. Sorted by severity, oldest-unresolved first. Resolving a flag writes a note back
      to the client&apos;s timeline.
    </Placeholder>
  );
}
