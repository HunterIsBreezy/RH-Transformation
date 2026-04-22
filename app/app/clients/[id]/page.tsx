import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { checkIns, intakeResponses, meetings } from "@/db/schema";
import { getClientDetail } from "@/lib/queries";
import { Eyebrow, Display, Body } from "@/components/type";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadBoardForClient } from "@/components/behavior/actions";
import { BehaviorBoard } from "@/components/behavior/BehaviorBoard";
import { NotesField } from "./NotesField";

export const metadata = { title: "Client" };

export default async function ClientDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("coach");
  const { id } = await props.params;

  const detail = await getClientDetail(id);
  if (!detail) notFound();

  const [intake, meetingRows, checkInRows, board] = await Promise.all([
    db
      .select()
      .from(intakeResponses)
      .where(eq(intakeResponses.clientId, id))
      .orderBy(desc(intakeResponses.submittedAt))
      .limit(1),
    db
      .select()
      .from(meetings)
      .where(eq(meetings.clientId, id))
      .orderBy(desc(meetings.scheduledAt))
      .limit(20),
    db
      .select()
      .from(checkIns)
      .where(eq(checkIns.clientId, id))
      .orderBy(desc(checkIns.day))
      .limit(14),
    loadBoardForClient(id),
  ]);

  const { user, client } = detail;
  const intakePayload = intake[0]?.payload as Record<string, unknown> | null;

  return (
    <div className="max-w-6xl">
      <Link href="/app/roster" className="text-[11px] uppercase tracking-eyebrow text-bone-faint hover:text-copper">
        ← Roster
      </Link>
      <div className="mt-6 mb-10">
        <Eyebrow wide className="text-copper">Client</Eyebrow>
        <Display as="h1" size="md" tight className="mt-4">
          {user.fullName ?? user.email}
        </Display>
        <div className="mt-2 text-sm text-bone tracking-body">
          {user.email} · <span className="uppercase tracking-eyebrow text-[10px]">{client.status}</span>
          {client.startDate ? ` · Started ${new Date(client.startDate).toLocaleDateString()}` : null}
          {client.transcriptConsent ? " · Transcript consent signed" : " · No transcript consent"}
        </div>
      </div>

      <div className="mb-10">
        <div className="text-[11px] uppercase tracking-eyebrow text-bone-faint mb-4">
          Behavior board
        </div>
        <BehaviorBoard
          clientId={client.id}
          entries={board.entries}
          resources={board.resources}
          libraryResources={board.libraryResources}
          templates={board.templates}
          canEdit={true}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Intake</CardTitle></CardHeader>
          <CardContent>
            {intakePayload ? (
              <pre className="text-xs text-bone whitespace-pre-wrap tracking-body leading-relaxed">
                {JSON.stringify(intakePayload, null, 2)}
              </pre>
            ) : (
              <Body size="sm" muted tight>No intake on record yet.</Body>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Coach notes</CardTitle></CardHeader>
          <CardContent>
            <NotesField clientId={client.id} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Meetings</CardTitle></CardHeader>
          <CardContent>
            {meetingRows.length === 0 ? (
              <Body size="sm" muted tight>No meetings scheduled yet.</Body>
            ) : (
              <ul className="flex flex-col gap-3">
                {meetingRows.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between border-b border-line pb-3 last:border-b-0"
                  >
                    <div>
                      <div className="text-sm text-paper tracking-body">
                        {new Date(m.scheduledAt).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-[11px] uppercase tracking-eyebrow text-bone-faint">
                        {m.kind} · {m.source}
                      </div>
                    </div>
                    <div className="text-[11px] uppercase tracking-eyebrow text-bone-faint">
                      {m.canceledAt
                        ? "Canceled"
                        : m.endedAt
                          ? "Completed"
                          : "Scheduled"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Recent check-ins</CardTitle></CardHeader>
          <CardContent>
            {checkInRows.length === 0 ? (
              <Body size="sm" muted tight>No daily check-ins yet.</Body>
            ) : (
              <ul className="flex flex-col gap-3">
                {checkInRows.map((c) => (
                  <li key={c.id} className="border-b border-line pb-3 last:border-b-0">
                    <div className="flex items-center gap-4 text-xs uppercase tracking-eyebrow text-bone-faint">
                      <span>{new Date(c.day).toLocaleDateString()}</span>
                      {c.mood != null ? <span>Mood {c.mood}/5</span> : null}
                      {c.energy != null ? <span>Energy {c.energy}/5</span> : null}
                      {c.sleepHours != null ? <span>Sleep {c.sleepHours}h</span> : null}
                      {c.training ? <span>Trained</span> : null}
                    </div>
                    {(c.win || c.friction || c.note) ? (
                      <div className="mt-2 text-sm text-paper tracking-body">
                        {c.win ? <div><span className="text-copper">Win:</span> {c.win}</div> : null}
                        {c.friction ? <div><span className="text-bone-faint">Friction:</span> {c.friction}</div> : null}
                        {c.note ? <div className="text-bone">{c.note}</div> : null}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
