"use server";

import { generateText, Output } from "ai";
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
    .max(8)
    .describe(
      "3-8 behavior-oriented tags (lowercase, kebab-case). Favor verbs/behaviors over topics, e.g. 'morning-routine', 'sleep-hygiene', 'identity-capital'.",
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

  const system = `You are a strategist for RH Transformation — a 15-week men's coaching program covering Body (training, nutrition), Mind (identity, psychology, philosophy), and Systems (daily routines, productivity). Two coaches, 20 clients max.

You're helping a coach catalog a resource (book, article, video, PDF, podcast) into their library so they can prescribe it to clients. Be decisive, direct, no filler. Behavioral precision over generic summary. Tags should describe behaviors this resource helps change, not just topics.`;

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
    model: "anthropic/claude-opus-4.7",
    output: Output.object({ schema: AssistOutput }),
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
