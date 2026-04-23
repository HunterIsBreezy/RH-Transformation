import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { exercises } from "@/db/schema";
import { getClientDetail } from "@/lib/queries";
import { fullProgram } from "@/app/app/training/actions";
import { currentWeekStart, toMondayUtc } from "@/lib/week";
import { ProgramBuilder } from "./ProgramBuilder";

export const metadata = { title: "Program builder" };
const WEEKS = 15;

export default async function ProgramBuilderPage(props: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("coach");
  const { id } = await props.params;
  const detail = await getClientDetail(id);
  if (!detail) notFound();

  const firstWeek = detail.client.startDate ? toMondayUtc(new Date(detail.client.startDate)) : currentWeekStart();
  const [blocks, library] = await Promise.all([
    fullProgram(id, firstWeek, WEEKS),
    db.select().from(exercises).where(eq(exercises.inLibrary, true)).orderBy(desc(exercises.createdAt)),
  ]);

  return (
    <ProgramBuilder
      clientId={id}
      clientName={detail.user.fullName ?? detail.user.email}
      firstWeekStart={firstWeek.toISOString().slice(0, 10)}
      weeks={WEEKS}
      blocks={blocks}
      library={library}
    />
  );
}
