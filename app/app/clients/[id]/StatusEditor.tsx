"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateClientStatus } from "./actions";
import type { clients } from "@/db/schema";

type Status = (typeof clients.$inferSelect)["status"];

const ALL: Status[] = [
  "applicant",
  "applied",
  "scheduled",
  "paid",
  "active",
  "graduated",
  "paused",
  "declined",
];

export function StatusEditor({
  clientId,
  initial,
  initialStart,
}: {
  clientId: string;
  initial: Status;
  initialStart: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initial);
  const [startDate, setStartDate] = useState<string>(initialStart ?? "");
  const [saving, startTransition] = useTransition();
  const [saved, setSaved] = useState<null | "ok" | "err">(null);

  function save() {
    setSaved(null);
    startTransition(async () => {
      try {
        await updateClientStatus(clientId, {
          status,
          startDate: startDate ? new Date(startDate).toISOString() : null,
        });
        setSaved("ok");
        router.refresh();
      } catch {
        setSaved("err");
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-eyebrow text-bone-faint">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="h-10 rounded-sm border border-line-strong bg-bg-soft px-3 text-sm text-paper tracking-body"
          >
            {ALL.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-eyebrow text-bone-faint">Start date</label>
          <input
            type="date"
            value={startDate ? startDate.slice(0, 10) : ""}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-10 rounded-sm border border-line-strong bg-bg-soft px-3 text-sm text-paper tracking-body"
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-10 px-4 rounded-sm bg-copper text-paper text-[11px] uppercase tracking-eyebrow hover:bg-copper-deep disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved === "ok" ? (
          <span className="text-[11px] uppercase tracking-eyebrow text-copper self-center">Saved</span>
        ) : saved === "err" ? (
          <span className="text-[11px] uppercase tracking-eyebrow text-[#b33a3a] self-center">Error</span>
        ) : null}
      </div>
    </div>
  );
}
