import { currentUser } from "@clerk/nextjs/server";
import { requireRole } from "@/lib/auth";
import { getClientByClerkId } from "@/lib/queries";
import { loadBoardForClient } from "@/components/behavior/actions";
import { BehaviorBoard } from "@/components/behavior/BehaviorBoard";
import { Eyebrow, Display, Body } from "@/components/type";

export const metadata = { title: "Behavior Board" };

export default async function BehaviorBoardPage() {
  await requireRole("client");
  const user = await currentUser();
  if (!user) return null;

  const detail = await getClientByClerkId(user.id);
  if (!detail) {
    return (
      <div className="max-w-3xl">
        <Eyebrow wide className="text-copper">Behavior Board</Eyebrow>
        <Display as="h1" size="md" tight className="mt-6 mb-6">
          Your program isn&apos;t linked yet.
        </Display>
        <Body muted tight>
          Your coaches will seed your board once enrollment is confirmed.
        </Body>
      </div>
    );
  }

  const board = await loadBoardForClient(detail.client.id);

  return (
    <div className="max-w-6xl">
      <Eyebrow wide className="text-copper">Behavior Board</Eyebrow>
      <Display as="h1" size="md" tight className="mt-6 mb-10">
        Current. Desired. Prescribed. Done.
      </Display>

      <BehaviorBoard
        clientId={detail.client.id}
        entries={board.entries}
        resources={board.resources}
        libraryResources={board.libraryResources}
        templates={board.templates}
        canEdit={true}
      />
    </div>
  );
}
