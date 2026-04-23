import type { ReactNode } from "react";

type TallyField = {
  key?: string;
  label?: string;
  type?: string;
  value?: unknown;
  options?: Array<{ id: string; text: string }>;
};

type TallyData = {
  fields?: TallyField[];
  submissionId?: string;
  createdAt?: string;
  formName?: string;
};

export function IntakeDisplay({ payload }: { payload: Record<string, unknown> | null }) {
  if (!payload) {
    return <p className="text-sm text-bone tracking-body">No intake on record yet.</p>;
  }

  const data = payload as TallyData;
  const fields = data.fields ?? [];

  if (!fields.length) {
    return (
      <div>
        <p className="text-xs text-bone-faint tracking-body mb-2">
          No Tally fields detected. Raw payload:
        </p>
        <pre className="text-xs text-bone whitespace-pre-wrap tracking-body leading-relaxed">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </div>
    );
  }

  const rendered: { label: string; value: ReactNode }[] = [];
  for (const f of fields) {
    const label = f.label?.trim() || f.key || "(no label)";
    const val = formatValue(f);
    if (val == null) continue;
    rendered.push({ label, value: val });
  }

  return (
    <div className="flex flex-col divide-y divide-line">
      {data.createdAt ? (
        <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint pb-3">
          Submitted {new Date(data.createdAt).toLocaleString()}
        </div>
      ) : null}
      {rendered.map((r, i) => (
        <div key={i} className="py-3 flex flex-col gap-1">
          <div className="text-[10px] uppercase tracking-eyebrow text-bone-faint">{r.label}</div>
          <div className="text-sm text-paper tracking-body whitespace-pre-wrap">{r.value}</div>
        </div>
      ))}
    </div>
  );
}

function formatValue(f: TallyField): ReactNode | null {
  const v = f.value;
  if (v == null || v === "") return null;

  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return String(v);

  if (typeof v === "string") {
    if (/^https?:\/\//.test(v)) {
      return (
        <a href={v} target="_blank" rel="noopener noreferrer" className="text-copper hover:text-paper break-all">
          {v}
        </a>
      );
    }
    if (/@/.test(v) && /\./.test(v)) {
      return (
        <a href={`mailto:${v}`} className="text-copper hover:text-paper">
          {v}
        </a>
      );
    }
    return v;
  }

  if (Array.isArray(v)) {
    const options = f.options ?? [];
    const labels = v.map((id) => {
      if (typeof id !== "string") return String(id);
      const match = options.find((o) => o.id === id);
      return match?.text ?? id;
    });
    return labels.join(", ");
  }

  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
