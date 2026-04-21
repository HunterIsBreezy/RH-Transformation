import { requireRole } from "@/lib/auth";
import { Placeholder } from "@/components/portal/Placeholder";

export const metadata = { title: "Meetings" };

export default async function MeetingsPage() {
  await requireRole("client");
  return (
    <Placeholder eyebrow="Meetings" title="Every call, every recording, every transcript.">
      Your upcoming calls with Rylan and Hunter, plus the archive of everything already on the
      record. Transcripts show the quotes you underlined and the behaviors your coaches flagged
      — only after you&apos;ve opted into transcript consent.
    </Placeholder>
  );
}
