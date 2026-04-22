import { desc } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { Eyebrow, Display, Body } from "@/components/type";
import { ResourcesPanel } from "./ResourcesPanel";

export const metadata = { title: "Resources" };

export default async function ResourcesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const role = user.publicMetadata?.role === "coach" ? "coach" : "client";

  if (role === "client") {
    const rows = await db
      .select()
      .from(resources)
      .orderBy(desc(resources.createdAt))
      .limit(50);
    return (
      <div className="max-w-4xl">
        <Eyebrow wide className="text-copper">Your Library</Eyebrow>
        <Display as="h1" size="md" tight className="mt-6 mb-10">
          What Rylan &amp; Hunter have put in your hands.
        </Display>
        {rows.length === 0 ? (
          <Body muted tight>Nothing here yet — your coaches will load resources as your program progresses.</Body>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="py-4 flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] uppercase tracking-eyebrow text-bone-faint">{r.kind}</div>
                  <div className="text-base font-semibold text-paper tracking-display leading-tight mt-1">{r.title}</div>
                  {r.author ? <div className="text-xs text-bone mt-1">{r.author}</div> : null}
                </div>
                {r.url ? (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[11px] uppercase tracking-eyebrow text-copper hover:text-paper shrink-0">
                    Open →
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const rows = await db.select().from(resources).orderBy(desc(resources.createdAt));
  return <ResourcesPanel initial={rows} />;
}
