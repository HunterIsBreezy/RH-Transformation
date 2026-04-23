import { desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { ExercisesPanel } from "./ExercisesPanel";

export const metadata = { title: "Exercises" };

export default async function ExercisesPage() {
  await requireRole("coach");
  const rows = await db.select().from(exercises).orderBy(desc(exercises.createdAt));
  return <ExercisesPanel initial={rows} />;
}
