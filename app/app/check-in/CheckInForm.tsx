"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { saveCheckIn } from "./actions";

type Initial = {
  mood: number | null;
  energy: number | null;
  sleepHours: number | null;
  training: string;
  nutrition: string;
  win: string;
  friction: string;
  note: string;
} | null;

export function CheckInForm({ clientId, initial }: { clientId: string; initial: Initial }) {
  const [mood, setMood] = useState<number>(initial?.mood ?? 3);
  const [energy, setEnergy] = useState<number>(initial?.energy ?? 3);
  const [sleepHours, setSleepHours] = useState<string>(initial?.sleepHours?.toString() ?? "");
  const [training, setTraining] = useState<boolean>(
    initial?.training ? initial.training !== "no" : false,
  );
  const [nutrition, setNutrition] = useState<number>(
    initial?.nutrition ? Number(initial.nutrition) || 3 : 3,
  );
  const [win, setWin] = useState(initial?.win ?? "");
  const [friction, setFriction] = useState(initial?.friction ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("idle");
    startTransition(async () => {
      try {
        await saveCheckIn({
          clientId,
          mood,
          energy,
          sleepHours: sleepHours ? Math.max(0, Math.min(16, Number(sleepHours))) : null,
          training: training ? "yes" : "no",
          nutrition: String(nutrition),
          win,
          friction,
          note,
        });
        setStatus("ok");
      } catch {
        setStatus("err");
      }
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      <Scale label="Mood" value={mood} onChange={setMood} />
      <Scale label="Energy" value={energy} onChange={setEnergy} />
      <Scale label="Nutrition" value={nutrition} onChange={setNutrition} />

      <Field label="Sleep (hours)">
        <Input
          type="number"
          min={0}
          max={16}
          step="0.5"
          value={sleepHours}
          onChange={(e) => setSleepHours(e.target.value)}
          className="max-w-[120px]"
        />
      </Field>

      <Field label="Training done today?">
        <label className="inline-flex items-center gap-3 text-sm tracking-body text-paper">
          <input
            type="checkbox"
            checked={training}
            onChange={(e) => setTraining(e.target.checked)}
            className="h-4 w-4 accent-copper"
          />
          Yes, I trained.
        </label>
      </Field>

      <Field label="One win">
        <textarea
          value={win}
          onChange={(e) => setWin(e.target.value)}
          rows={2}
          placeholder="What worked today?"
          className="w-full rounded-sm border border-line-strong bg-bg-soft text-sm text-paper tracking-body p-3 focus:outline-none focus:border-copper"
        />
      </Field>

      <Field label="One friction point">
        <textarea
          value={friction}
          onChange={(e) => setFriction(e.target.value)}
          rows={2}
          placeholder="What got in the way?"
          className="w-full rounded-sm border border-line-strong bg-bg-soft text-sm text-paper tracking-body p-3 focus:outline-none focus:border-copper"
        />
      </Field>

      <Field label="Anything else">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-sm border border-line-strong bg-bg-soft text-sm text-paper tracking-body p-3 focus:outline-none focus:border-copper"
        />
      </Field>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : initial ? "Update check-in" : "Log check-in"}
        </Button>
        {status === "ok" ? (
          <span className="text-[11px] uppercase tracking-eyebrow text-copper">Saved</span>
        ) : status === "err" ? (
          <span className="text-[11px] uppercase tracking-eyebrow text-[#b33a3a]">
            Something broke. Try again.
          </span>
        ) : null}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[11px] uppercase tracking-eyebrow text-bone-faint">{label}</div>
      {children}
    </div>
  );
}

function Scale({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <Field label={`${label} (1–5)`}>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-10 w-10 rounded-sm border text-sm tracking-body transition-colors ${
              value === n
                ? "border-copper bg-copper-subtle text-paper"
                : "border-line-strong text-bone hover:border-line-hover hover:text-paper"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </Field>
  );
}
