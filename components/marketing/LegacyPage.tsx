"use client";

import { useEffect, useRef } from "react";

export function LegacyPage({ html, script }: { html: string; script?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!script) return;
    const fn = new Function(script);
    try {
      fn();
    } catch (err) {
      console.error("Legacy page script error:", err);
    }
  }, [script]);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}
