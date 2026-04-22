import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { currentUser } from "@clerk/nextjs/server";
import {
  getClientByClerkId,
  getNextMeeting,
  getStreak,
  getTodayCheckIn,
} from "@/lib/queries";
import { Eyebrow, Display, Body } from "@/components/type";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Today" };

export default async function TodayPage() {
  await requireRole("client");
  const user = await currentUser();
  if (!user) return null;

  const detail = await getClientByClerkId(user.id);
  if (!detail) {
    return (
      <div className="max-w-3xl">
        <Eyebrow wide className="text-copper">Today</Eyebrow>
        <Display as="h1" size="md" tight className="mt-6 mb-6">
          Welcome. Your program isn&apos;t linked yet.
        </Display>
        <Body muted tight>
          Once Rylan or Hunter confirms your enrollment, this page lights up with your check-in,
          streak, and next meeting.
        </Body>
      </div>
    );
  }

  const [streak, todaysCheckIn, nextMeeting] = await Promise.all([
    getStreak(detail.client.id),
    getTodayCheckIn(detail.client.id),
    getNextMeeting(detail.client.id),
  ]);

  return (
    <div className="max-w-4xl">
      <Eyebrow wide className="text-copper">Today</Eyebrow>
      <Display as="h1" size="md" tight className="mt-6 mb-10">
        {firstName(detail.user.fullName ?? user.firstName ?? "One")}. One day. One direction. Move.
      </Display>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-eyebrow text-bone-faint">
              Today&apos;s check-in
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todaysCheckIn ? (
              <>
                <div className="text-2xl font-semibold text-copper tracking-display-tight">Logged</div>
                <Body size="sm" muted tight className="mt-2">
                  You checked in today. Edit or re-submit anytime.
                </Body>
              </>
            ) : (
              <>
                <div className="text-2xl font-semibold text-paper tracking-display-tight">Open</div>
                <Body size="sm" muted tight className="mt-2">
                  Two minutes. The guarantee starts here.
                </Body>
              </>
            )}
            <Link
              href="/app/check-in"
              className="mt-4 inline-flex items-center text-[11px] uppercase tracking-eyebrow text-copper hover:text-paper transition-colors"
            >
              {todaysCheckIn ? "Edit today's check-in →" : "Log today's check-in →"}
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-eyebrow text-bone-faint">
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-5xl font-semibold text-paper tracking-display-tight leading-none">
              {streak}
            </div>
            <Body size="sm" muted tight className="mt-2">
              {streak === 0 ? "Today starts the streak." : `${streak === 1 ? "day" : "days"} in a row. Don't skip.`}
            </Body>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-eyebrow text-bone-faint">
              Next meeting
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextMeeting ? (
              <>
                <div className="text-xl font-semibold text-paper tracking-display-tight">
                  {new Date(nextMeeting.scheduledAt).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <Body size="sm" muted tight className="mt-2">
                  {new Date(nextMeeting.scheduledAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {nextMeeting.kind}
                </Body>
              </>
            ) : (
              <>
                <div className="text-xl font-semibold text-bone tracking-display-tight">
                  Nothing scheduled
                </div>
                <Body size="sm" muted tight className="mt-2">
                  Your coaches will book the next one.
                </Body>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function firstName(full: string) {
  return full.split(/\s+/)[0] ?? "One";
}
