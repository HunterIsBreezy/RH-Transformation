import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db } from "@/db";
import { prescriptionTemplates, resources } from "@/db/schema";
import { PrescriptionsPanel } from "./PrescriptionsPanel";

export const metadata = { title: "Prescriptions" };

export default async function PrescriptionsPage() {
  await requireRole("coach");
  const [templates, libraryResources] = await Promise.all([
    db.select().from(prescriptionTemplates).orderBy(desc(prescriptionTemplates.createdAt)),
    db.select().from(resources).where(eq(resources.inLibrary, true)).orderBy(resources.title),
  ]);
  return <PrescriptionsPanel initial={templates} resources={libraryResources} />;
}
