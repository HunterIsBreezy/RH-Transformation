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
      "Client-facing markdown: a 2–4 sentence opening summary (no heading), then ## The cheat sheet (5–10 imperative bullets the reader can act on), then ## Key concepts (3–5 bold term + one-line definitions), then ## When to pull this up (2–3 sentences). Second person, direct to the reader. No disclaimers.",
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
The coach is cataloging a resource (book, article, video, PDF, podcast). Your output renders
on a client-facing detail page the coach will send to the man in the program. Write to HIM,
not about him. No meta commentary. No "the coach should…". Second person and imperatives.

SUMMARY REQUIREMENTS — the output becomes a short summary + cheat sheet the reader can pull
up on his phone when he needs it. Produce GitHub-flavored markdown in this exact shape:

1. **Opening summary (no heading).** 2–4 plain sentences. Open with what changes if he
   actually runs this. State the core thesis. No hedging.

2. **## The cheat sheet.** A bulleted list of 5–10 short imperative moves he can act on.
   Each bullet: 1 line, starts with a verb, no fluff. Examples:
   - "Track sleep before anything else. Without the data, you're guessing."
   - "Caffeine cutoff: 2pm. No exceptions for the first four weeks."
   - "When you feel the urge to scroll, stand up and walk to the kitchen instead."

3. **## Key concepts.** This is the meat. Capture EVERY distinct idea, frame, or term the
   resource introduces — not a token 3-5, but all of them. If the source has 12 ideas, write
   12 entries. Each entry:
   - Bold the concept name, em-dash, then a 2–5 sentence explanation in plain English.
   - Explain the mechanism (why it works), not just the label.
   - If the author uses a specific phrase, quote it once, then translate.
   - If two concepts are related, say how in the later entry.
   Example:
   - **Sleep debt** — the cumulative cost of every hour you shorted in the last 14 days.
     Unlike financial debt, you can't pay it all back at once; one long sleep recovers
     some but not most. It compounds silently: day 3 of 5-hour nights feels like day 1.
     Coffee masks the symptoms without repaying the principal.

4. **## When to pull this up.** 2–3 sentences naming the exact moment or trigger where
   this resource earns its spot. "Open this when you…" or "Come back to this if…".

NEVER include: disclaimers, "as always consult a professional", "this article explores",
"I hope this helps", bullet summaries that just restate obvious facts, or anything that
sounds like an LLM ate a wellness blog.

TAGS
- 3 to 8 tags. Lowercase kebab-case. Never more than 8.
- Tags are behaviors, not topics. Good: morning-routine, sleep-hygiene, identity-capital,
  boundary-setting, deep-work. Bad: productivity, mental-health, wellness.

FILE SUGGESTION
- Only set suggestAsFile=true when the summary is long enough (3+ sections) that a standalone
  markdown file would be more useful than a URL.

TITLE + AUTHOR + TAGS — ALWAYS RETURN THESE. Never leave blank.
- title: the canonical title of the resource. If the coach's input is a placeholder or
  generic, replace it with the real title you find. If no title exists anywhere, invent a
  tight, descriptive one based on content — not a vague category.
- author: the creator/author if discoverable from the URL, the page content, or well-known
  attribution. null ONLY if truly unknowable.
- tags: 3 to 8 behavior-oriented tags. These are mandatory, not optional.`;

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
