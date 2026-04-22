"use client";

import { useState, useTransition } from "react";
import { saveCoachNotes } from "./actions";

export function NotesField({
  clientId,
  initial,
}: {
  clientId: string;
  initial?: string;
}) {
  const [value, setValue] = useState(initial ?? "");
  const [saved, setSaved] = useState<null | "ok" | "err">(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(null);
        }}
        rows={8}
        placeholder="Private to coaches. Patterns, quotes, what to ask next week…"
        className="w-full rounded-sm border border-line-strong bg-bg-soft text-sm text-paper tracking-body leading-relaxed p-3 focus:outline-none focus:border-copper focus:ring-1 focus:ring-copper resize-y"
      />
      <div className="flex items-center justify-between text-[11px] uppercase tracking-eyebrow">
        <span className="text-bone-faint">
          {saved === "ok" ? "Saved" : saved === "err" ? "Error" : pending ? "Saving…" : ""}
        </span>
        <button
          type="button"
          disabled={pending}
          className="inline-flex items-center text-copper hover:text-paper transition-colors disabled:opacity-50"
          onClick={() => {
            startTransition(async () => {
              try {
                await saveCoachNotes(clientId, value);
                setSaved("ok");
              } catch {
                setSaved("err");
              }
            });
          }}
        >
          Save notes
        </button>
      </div>
    </div>
  );
}
