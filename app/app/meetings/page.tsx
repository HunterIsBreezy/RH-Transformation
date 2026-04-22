import { desc, eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { getClientByClerkId } from "@/lib/queries";
import { Eyebrow, Display, Body } from "@/components/type";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Meetings" };

export default async function MeetingsPage() {
  await requireRole("client");
  const user = await currentUser();
  if (!user) return null;

  const detail = await getClientByClerkId(user.id);
  if (!detail) {
    return (
      <div className="max-w-3xl">
        <Eyebrow wide className="text-copper">Meetings</Eyebrow>
        <Display as="h1" size="md" tight className="mt-6 mb-6">
          Your program isn&apos;t linked yet.
        </Display>
      </div>
    );
  }

  const rows = await db
    .select()
    .from(meetings)
    .where(eq(meetings.clientId, detail.client.id))
    .orderBy(desc(meetings.scheduledAt));

  const now = new Date();
  const upcoming = rows.filter((r) => !r.canceledAt && new Date(r.scheduledAt) >= now);
  const past = rows.filter((r) => r.canceledAt || new Date(r.scheduledAt) < now);

  return (
    <div className="max-w-4xl">
      <Eyebrow wide className="text-copper">Meetings</Eyebrow>
      <Display as="h1" size="md" tight className="mt-6 mb-10">
        Every call, every recording.
      </Display>

      <div className="grid gap-6">
        <Section title="Upcoming" empty="Nothing on the books. Your coaches will schedule the next one.">
          {upcoming.map((m) => (
            <MeetingRow key={m.id} meeting={m} upcoming />
          ))}
        </Section>

        <Section title="Past" empty="No past meetings yet.">
          {past.map((m) => (
            <MeetingRow key={m.id} meeting={m} upcoming={false} />
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm uppercase tracking-eyebrow text-bone-faint">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasChildren ? (
          <ul className="flex flex-col gap-3">{children}</ul>
        ) : (
          <Body size="sm" muted tight>{empty}</Body>
        )}
      </CardContent>
    </Card>
  );
}

function MeetingRow({
  meeting,
  upcoming,
}: {
  meeting: typeof meetings.$inferSelect;
  upcoming: boolean;
}) {
  return (
    <li className="flex items-start justify-between border-b border-line pb-3 last:border-b-0">
      <div>
        <div className="text-sm text-paper tracking-body">
          {new Date(meeting.scheduledAt).toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </div>
        <div className="text-[11px] uppercase tracking-eyebrow text-bone-faint mt-1">
          {meeting.kind} · {meeting.source}
        </div>
      </div>
      <div className="text-right">
        {meeting.canceledAt ? (
          <span className="text-[11px] uppercase tracking-eyebrow text-bone-faint">Canceled</span>
        ) : upcoming ? (
          <span className="text-[11px] uppercase tracking-eyebrow text-copper">Confirmed</span>
        ) : meeting.zoomRecordingUrl ? (
          <a
            href={meeting.zoomRecordingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] uppercase tracking-eyebrow text-copper hover:text-paper"
          >
            Recording →
          </a>
        ) : (
          <span className="text-[11px] uppercase tracking-eyebrow text-bone-faint">
            Recording pending
          </span>
        )}
      </div>
    </li>
  );
}
