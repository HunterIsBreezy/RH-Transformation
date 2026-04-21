import { requireRole } from "@/lib/auth";
import { Placeholder } from "@/components/portal/Placeholder";

export const metadata = { title: "Behavior Board" };

export default async function BehaviorBoardPage() {
  await requireRole("client");
  return (
    <Placeholder eyebrow="Behavior Board" title="Current. Desired. Prescribed. Done.">
      Four columns. Every behavior you&apos;re rewriting this program, with the exact
      prescription and resources your coaches attached. Move cards as you work through them.
      Your coaches see the same board, in real time.
    </Placeholder>
  );
}
