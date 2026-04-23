/** Monday-rooted week utilities. All dates in UTC. */
export function toMondayUtc(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  const wd = x.getUTCDay(); // 0 = Sun
  const offset = wd === 0 ? -6 : 1 - wd;
  x.setUTCDate(x.getUTCDate() + offset);
  return x;
}

export function currentWeekStart(): Date {
  return toMondayUtc(new Date());
}

export function addWeeks(base: Date, n: number): Date {
  const x = new Date(base);
  x.setUTCDate(x.getUTCDate() + n * 7);
  return x;
}

export function sameDay(a: Date, b: Date): boolean {
  return a.toISOString().slice(0, 10) === b.toISOString().slice(0, 10);
}

export function isPastWeek(weekStart: Date): boolean {
  return weekStart.getTime() < currentWeekStart().getTime();
}

export function weekLabel(weekStart: Date): string {
  const end = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);
  const fmt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${weekStart.toLocaleDateString(undefined, fmt)} – ${end.toLocaleDateString(undefined, fmt)}`;
}

export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
