"use server";

import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { put } from "@vercel/blob";
import { requireRole } from "@/lib/auth";

const AssistOutput = z.object({
  title: z.string().describe("A short, specific title for the resource. Keep it punchy."),
  author: z
    .string()
    .nullable()
    .describe("Author/creator if known. Use null if unknown or not applicable."),
  summary: z
    .string()
    .describe(
      "A tight, coach-useful summary in markdown. Front-load the thesis. Bullet key moves. Skip filler.",
    ),
  tags: z
    .array(z.string())
    .describe(
      "Return 3 to 8 behavior-oriented tags (lowercase, kebab-case). Favor verbs/behaviors over topics, e.g. 'morning-routine', 'sleep-hygiene', 'identity-capital'. Never return more than 8.",
    ),
  suggestAsFile: z
    .boolean()
    .describe(
      "Return true when the summary is substantive enough (multiple paragraphs or detailed steps) that saving it as a file would be more useful than a URL.",
    ),
});

export type AssistOutputT = z.infer<typeof AssistOutput>;

export async function askClaudeForResource(input: {
  prompt: string;
  kind: string;
  title?: string;
  author?: string;
  url?: string;
  existingNotes?: string;
}): Promise<AssistOutputT> {
  await requireRole("coach");

  const system = `You are a content strategist for RH Transformation — a 15-week 1-on-1 men's coaching program ($2,497, $19 discovery call, 20 clients max at a time, two coaches: Rylan and Hunter).

PROGRAM SHAPE
- Audience: men 18–40 who are done drifting. Rebuilding body, mind, and systems in 15 weeks.
- Three pillars:
  • Body → training, nutrition, sleep, recovery (Rylan leads)
  • Mind → identity, psychology, philosophy, mindset (Hunter leads)
  • Systems → daily routines, productivity, habit design, environment
- Every client has a behavior board: one row per behavior, flowing left→right across
  Current → Desired → Prescribed → Progress. Resources attach inside the Prescribed column.

VOICE (match exactly)
- Decisive. Direct. No hedging, no filler, no "in this article we will explore."
- Editorial and serious. Short sentences when weight matters. Long ones when nuance demands.
- Use em dashes and semicolons; avoid exclamation points.
- Address the reader as the man in the program — never corporate-speak, never "individual."
- Skip wellness-industry buzzwords: "journey", "holistic", "unlock your potential", "best self", "mindful."
- Prefer verbs over nouns. Behavior over theory.

YOUR JOB ON THIS CALL
The coach is cataloging a resource (book, article, video, PDF, podcast) into the library so
it can be prescribed. You produce the structured metadata + a long-form summary formatted in
GitHub-flavored markdown that will render on an RH-branded detail page on the site.

SUMMARY REQUIREMENTS
- Lead with the thesis in one bolded sentence.
- Then 2–5 short sections with H2 headings (## Heading) that mirror the prescription flow:
  the problem behavior it targets, the mechanism it prescribes, the concrete moves, and (if
  applicable) who this resource is NOT for.
- Under each heading: 2–4 tight sentences or a bulleted list of concrete behaviors.
- Close with a "When to prescribe this" section naming the client archetype or behavior
  pattern where this resource lands hardest.
- No promo language. No "I think." No AI throat-clearing.

TAGS
- 3 to 8 tags. Lowercase kebab-case. Never more than 8.
- Tags are behaviors, not topics. Good: morning-routine, sleep-hygiene, identity-capital,
  boundary-setting, deep-work. Bad: productivity, mental-health, wellness.

FILE SUGGESTION
- Only set suggestAsFile=true when the summary is long enough (3+ sections) that a standalone
  markdown file would be more useful than a URL.

TITLE + AUTHOR
- Refine the title if the coach's input was incomplete. If the resource has a canonical author,
  include them.`;

  const context = [
    `Resource type: ${input.kind}`,
    input.title ? `Current title: ${input.title}` : null,
    input.author ? `Current author: ${input.author}` : null,
    input.url ? `URL: ${input.url}` : null,
    input.existingNotes ? `Existing coach notes:\n${input.existingNotes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const userPrompt = `${context}\n\nCoach asks: ${input.prompt}`;

  const { output } = await generateText({
    model: anthropic("claude-opus-4-7"),
    output: Output.object({ schema: AssistOutput }),
    tools: {
      web_fetch: anthropic.tools.webFetch_20250910({ maxUses: 2 }),
      web_search: anthropic.tools.webSearch_20250305({ maxUses: 3 }),
    },
    stopWhen: ({ steps }) => steps.length >= 6,
    system,
    prompt: userPrompt,
    temperature: 0.3,
  });

  return output;
}

export async function saveClaudeAsFile(args: {
  title: string;
  markdown: string;
}): Promise<{ url: string }> {
  await requireRole("coach");
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error("BLOB_READ_WRITE_TOKEN not set — provision Vercel Blob first");
  }
  const safe = args.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "resource";
  const filename = `resources/${Date.now()}-${safe}.md`;
  const blob = await put(filename, args.markdown, {
    access: "public",
    contentType: "text/markdown; charset=utf-8",
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return { url: blob.url };
}
