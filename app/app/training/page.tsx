import { requireRole } from "@/lib/auth";
import { Placeholder } from "@/components/portal/Placeholder";

export const metadata = { title: "Training" };

export default async function TrainingPage() {
  await requireRole("client");
  return (
    <Placeholder eyebrow="Training" title="This week, block by block.">
      Rylan&apos;s weekly plan, laid out by day. Drag blocks to reschedule inside the week —
      you can move them, but you can&apos;t delete them. Marking a block complete sends a ping
      to your coach.
    </Placeholder>
  );
}
