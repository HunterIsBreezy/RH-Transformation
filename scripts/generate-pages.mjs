#!/usr/bin/env node
// One-shot migration helper: converts each legacy HTML page into a Next.js
// App Router route. Deletes itself after successful run (manually).
//
// For each (htmlFile, routeDir, activeNav, calendlyOverride?):
//   - extracts <style>...</style> -> app/<route>/legacy.css (scoped via import)
//   - extracts <script>...</script> -> app/<route>/legacy-script.ts (runtime-eval'd)
//   - extracts body content, strips <nav>, <footer>, <script>, <style>
//   - rewrites absolute href/src paths (images/foo.jpg -> /images/foo.jpg)
//   - rewrites inter-page hrefs (fitness.html -> /fitness, etc.)
//   - emits app/<route>/page.tsx that composes <Nav>, dangerously-set content, <Footer>

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(decodeURIComponent(new URL("..", import.meta.url).pathname));
const pages = [
  {
    file: "index.html",
    route: "", // -> app/page.tsx
    dir: "app",
    active: "home",
    title: "RH Transformation — The 15-Week Lock-In",
    desc: "A 15-week 1-on-1 coaching program for men done drifting. Body, mind, and systems — rebuilt with Rylan & Hunter.",
  },
  {
    file: "fitness.html",
    route: "fitness",
    dir: "app/fitness",
    active: "fitness",
    title: "Fitness — RH Transformation",
    desc: "The Body Pillar of RH Transformation. Custom fitness, personalized nutrition, and weekly coaching with Rylan — rebuilt over 15 weeks.",
  },
  {
    file: "mindset.html",
    route: "mindset",
    dir: "app/mindset",
    active: "mindset",
    title: "Mindset — RH Transformation",
    desc: "The Mind Pillar of RH Transformation. Identity architecture, mental frameworks, and systems design — the internal rebuild that makes everything else stick.",
  },
  {
    file: "testimonials.html",
    route: "testimonials",
    dir: "app/testimonials",
    active: "testimonials",
    title: "Testimonials — RH Transformation",
    desc: "Real transformations from real men. See the results, read the testimonials, and decide if RH Transformation is the move.",
  },
];

function extract(html) {
  // Pull out and delete <style> blocks
  const styles = [];
  html = html.replace(/<style[^>]*>([\s\S]*?)<\/style>/g, (_, inner) => {
    styles.push(inner.trim());
    return "";
  });

  // Pull out and delete <script> blocks
  const scripts = [];
  html = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/g, (_, inner) => {
    scripts.push(inner.trim());
    return "";
  });

  // Isolate the <body> inner content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let body = bodyMatch ? bodyMatch[1] : html;

  // Strip the legacy <nav>...</nav> and <footer>...</footer>
  body = body.replace(/<nav>[\s\S]*?<\/nav>/g, "");
  body = body.replace(/<footer>[\s\S]*?<\/footer>/g, "");

  // Rewrite asset paths: src="images/ -> src="/images/
  body = body.replace(/(src|href)="images\//g, '$1="/images/');
  // Rewrite inter-page links to clean URLs
  body = body.replace(/href="index\.html"/g, 'href="/"');
  body = body.replace(/href="fitness\.html"/g, 'href="/fitness"');
  body = body.replace(/href="mindset\.html"/g, 'href="/mindset"');
  body = body.replace(/href="testimonials\.html"/g, 'href="/testimonials"');
  body = body.replace(/href="\/terms\.html"/g, 'href="/terms"');
  body = body.replace(/href="\/privacy\.html"/g, 'href="/privacy"');
  body = body.replace(/href="\/disclaimer\.html"/g, 'href="/disclaimer"');

  return { style: styles.join("\n\n"), script: scripts.join("\n\n"), body: body.trim() };
}

function writePage(p) {
  const abs = path.join(ROOT, p.file);
  const raw = fs.readFileSync(abs, "utf8");
  const { style, script, body } = extract(raw);

  const outDir = path.join(ROOT, p.dir);
  fs.mkdirSync(outDir, { recursive: true });

  // CSS
  fs.writeFileSync(path.join(outDir, "legacy.css"), style + "\n");

  // Escape body content for embedding as a template literal
  const bodyEscaped = body.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  fs.writeFileSync(
    path.join(outDir, "content.ts"),
    `export const CONTENT_HTML = \`${bodyEscaped}\`;\n\nexport const LEGACY_SCRIPT = \`${script.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${")}\`;\n`,
  );

  const pageRel = p.dir === "app" ? "" : `/${p.route}`;
  const pageTsx = `import type { Metadata } from "next";
import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { LegacyPage } from "@/components/marketing/LegacyPage";
import { CONTENT_HTML, LEGACY_SCRIPT } from "./content";
import "./legacy.css";

export const metadata: Metadata = {
  title: ${JSON.stringify(p.title)},
  description: ${JSON.stringify(p.desc)},
  alternates: { canonical: "https://rhtransformation.xyz${pageRel}" },
};

export default function Page() {
  return (
    <>
      <Nav active="${p.active}" ${p.active !== "home" ? 'calendlyUrl="https://calendly.com/unlockaxia/30min"' : ""} />
      <LegacyPage html={CONTENT_HTML} script={LEGACY_SCRIPT} />
      <Footer />
    </>
  );
}
`;
  fs.writeFileSync(path.join(outDir, "page.tsx"), pageTsx);
  console.log(`✔ ${p.file} → ${p.dir}/page.tsx`);
}

for (const p of pages) writePage(p);
