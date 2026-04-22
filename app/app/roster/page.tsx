import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getRoster } from "@/lib/queries";
import { Eyebrow, Display, Body } from "@/components/type";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const metadata = { title: "Roster" };

export default async function RosterPage() {
  await requireRole("coach");
  const rows = await getRoster();

  return (
    <div className="max-w-6xl">
      <Eyebrow wide className="text-copper">Coach · Roster</Eyebrow>
      <Display as="h1" size="md" tight className="mt-6 mb-10">
        Your active men, at a glance.
      </Display>

      {rows.length === 0 ? (
        <div className="rounded-sm border border-line bg-bg-card px-8 py-14 text-center">
          <Body muted tight>
            No clients yet. As soon as a Calendly booking, Tally intake, or Stripe payment lands,
            rows will appear here.
          </Body>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-6" />
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Week</TableHead>
              <TableHead>Last check-in</TableHead>
              <TableHead>Next meeting</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.clientId} className="cursor-pointer">
                <TableCell>
                  <FlagDot count={r.openFlagCount} />
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/app/clients/${r.clientId}`} className="hover:text-copper">
                    {r.name ?? r.email}
                  </Link>
                  <div className="text-xs text-bone-faint tracking-body">{r.email}</div>
                </TableCell>
                <TableCell>
                  <StatusPill status={r.status} />
                </TableCell>
                <TableCell>
                  {r.weekNumber ? `Week ${r.weekNumber}` : <span className="text-bone-faint">—</span>}
                </TableCell>
                <TableCell>{formatCheckIn(r.lastCheckInDays)}</TableCell>
                <TableCell>
                  {r.nextMeetingAt ? (
                    formatMeeting(r.nextMeetingAt)
                  ) : (
                    <span className="text-bone-faint">Nothing scheduled</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function FlagDot({ count }: { count: number }) {
  if (count === 0) return <span className="block w-2 h-2 rounded-full bg-bg-elevated" />;
  return (
    <span
      className="block w-2 h-2 rounded-full bg-copper shadow-[0_0_10px_var(--copper-glow)]"
      title={`${count} open flag${count === 1 ? "" : "s"}`}
    />
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "active" || status === "paid"
      ? "text-copper border-line-hover"
      : status === "graduated"
        ? "text-gold border-line-strong"
        : status === "paused" || status === "declined"
          ? "text-bone-faint border-line"
          : "text-bone border-line-strong";
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] uppercase tracking-eyebrow px-2 py-1 rounded-sm border",
        tone,
      )}
    >
      {status}
    </span>
  );
}

function formatCheckIn(days: number | null) {
  if (days == null) return <span className="text-bone-faint">Never</span>;
  if (days === 0) return <span className="text-copper">Today</span>;
  if (days === 1) return "Yesterday";
  if (days <= 7) return `${days}d ago`;
  return <span className="text-bone-faint">{days}d ago</span>;
}

function formatMeeting(d: Date) {
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
