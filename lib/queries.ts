import { and, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  checkIns,
  clients,
  coachFlags,
  meetings,
  users,
} from "@/db/schema";

export type RosterRow = {
  clientId: string;
  userId: string;
  name: string | null;
  email: string;
  status: (typeof clients.$inferSelect)["status"];
  weekNumber: number | null;
  lastCheckInDays: number | null;
  nextMeetingAt: Date | null;
  openFlagCount: number;
};

export async function getRoster(): Promise<RosterRow[]> {
  const now = new Date();
  const rows = await db
    .select({
      clientId: clients.id,
      userId: users.id,
      name: users.fullName,
      email: users.email,
      status: clients.status,
      startDate: clients.startDate,
      lastCheckIn: sql<Date | null>`max(${checkIns.day})`.as("lastCheckIn"),
      nextMeetingAt: sql<Date | null>`min(${meetings.scheduledAt}) filter (where ${meetings.scheduledAt} > now() and ${meetings.canceledAt} is null)`.as(
        "nextMeetingAt",
      ),
      openFlagCount: sql<number>`count(distinct ${coachFlags.id}) filter (where ${coachFlags.resolvedAt} is null)`.as(
        "openFlagCount",
      ),
    })
    .from(clients)
    .innerJoin(users, eq(users.id, clients.userId))
    .leftJoin(checkIns, eq(checkIns.clientId, clients.id))
    .leftJoin(meetings, eq(meetings.clientId, clients.id))
    .leftJoin(coachFlags, eq(coachFlags.clientId, clients.id))
    .groupBy(clients.id, users.id)
    .orderBy(desc(clients.createdAt));

  return rows.map((r) => {
    const start = r.startDate ? new Date(r.startDate) : null;
    const weekNumber = start
      ? Math.max(1, Math.floor((now.getTime() - start.getTime()) / (7 * 86_400_000)) + 1)
      : null;
    const lastCheckInDays =
      r.lastCheckIn != null
        ? Math.floor((now.getTime() - new Date(r.lastCheckIn).getTime()) / 86_400_000)
        : null;
    return {
      clientId: r.clientId,
      userId: r.userId,
      name: r.name,
      email: r.email,
      status: r.status,
      weekNumber,
      lastCheckInDays,
      nextMeetingAt: r.nextMeetingAt ? new Date(r.nextMeetingAt) : null,
      openFlagCount: Number(r.openFlagCount ?? 0),
    };
  });
}

export async function getClientDetail(clientId: string) {
  const row = await db
    .select({
      client: clients,
      user: users,
    })
    .from(clients)
    .innerJoin(users, eq(users.id, clients.userId))
    .where(eq(clients.id, clientId))
    .limit(1);
  return row[0] ?? null;
}

export async function getStreak(clientId: string) {
  const rows = await db
    .select({ day: checkIns.day })
    .from(checkIns)
    .where(eq(checkIns.clientId, clientId))
    .orderBy(desc(checkIns.day))
    .limit(180);

  let streak = 0;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = 0; i < rows.length; i++) {
    const expected = new Date(today);
    expected.setUTCDate(today.getUTCDate() - i);
    const day = new Date(rows[i].day);
    day.setUTCHours(0, 0, 0, 0);
    if (day.getTime() === expected.getTime()) streak++;
    else break;
  }
  return streak;
}

export async function getTodayCheckIn(clientId: string) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const [row] = await db
    .select()
    .from(checkIns)
    .where(and(eq(checkIns.clientId, clientId), eq(checkIns.day, today)))
    .limit(1);
  return row ?? null;
}

export async function getNextMeeting(clientId: string) {
  const now = new Date();
  const [row] = await db
    .select()
    .from(meetings)
    .where(
      and(
        eq(meetings.clientId, clientId),
        gte(meetings.scheduledAt, now),
        isNull(meetings.canceledAt),
      ),
    )
    .orderBy(meetings.scheduledAt)
    .limit(1);
  return row ?? null;
}

export async function getClientByClerkId(clerkId: string) {
  const [row] = await db
    .select({ client: clients, user: users })
    .from(users)
    .innerJoin(clients, eq(clients.userId, users.id))
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return row ?? null;
}
