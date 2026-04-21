import { requireRole } from "@/lib/auth";
import { Placeholder } from "@/components/portal/Placeholder";

export const metadata = { title: "Exercises" };

export default async function ExercisesPage() {
  await requireRole("coach");
  return (
    <Placeholder eyebrow="Coach · Exercises" title="The movement library, curated.">
      Every exercise Rylan has programmed, with demo clips, cues, and default set/rep ranges.
      Drag an exercise into a block template or drop it straight onto a client&apos;s week —
      with or without saving it back to the library.
    </Placeholder>
  );
}
