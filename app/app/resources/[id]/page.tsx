import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { resources } from "@/db/schema";
import { Eyebrow, Display, Body } from "@/components/type";
import { toDisplayUrl } from "@/lib/blob";

export const metadata = { title: "Resource" };

export default async function ResourceViewPage(props: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const { id } = await props.params;
  const [r] = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  if (!r) notFound();

  return (
    <article className="max-w-3xl">
      <Link
        href="/app/resources"
        className="text-[11px] uppercase tracking-eyebrow text-bone-faint hover:text-copper"
      >
        ← Resources
      </Link>

      <header className="mt-6 mb-10">
        <Eyebrow wide className="text-copper">{r.kind}</Eyebrow>
        <Display as="h1" size="lg" tight className="mt-6">
          {r.title}
        </Display>
        {r.author ? (
          <div className="mt-4 text-sm text-bone tracking-body uppercase tracking-eyebrow">
            by {r.author}
          </div>
        ) : null}
        {r.url ? (
          <a
            href={toDisplayUrl(r.url) ?? r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-[11px] uppercase tracking-eyebrow text-copper hover:text-paper border-b border-copper/50 hover:border-paper"
          >
            Open source →
          </a>
        ) : null}
      </header>

      {r.bodyMd ? (
        <div className="rh-prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{r.bodyMd}</ReactMarkdown>
        </div>
      ) : (
        <Body muted tight>No summary on file. Edit this resource to add one.</Body>
      )}

      {r.behaviorsTargeted.length > 0 ? (
        <div className="mt-12 pt-8 border-t border-line">
          <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint mb-3">
            Targets these behaviors
          </div>
          <div className="flex flex-wrap gap-2">
            {r.behaviorsTargeted.map((t) => (
              <span
                key={t}
                className="text-[11px] uppercase tracking-eyebrow text-bone border border-line-strong px-2.5 py-1 rounded-sm"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}
