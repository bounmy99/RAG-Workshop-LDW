"use client";

import { DEFAULT_OPTIONS, MAX_SENTENCES, OPTION_LIMITS } from "@/lib/rag/labs-config";
import type { LabMode, LabOptions } from "@/lib/rag/types";

type NumericKey = keyof typeof OPTION_LIMITS;

/** ຄ່າທີ່ມີຜົນຕໍ່ແຕ່ລະ lab */
const FIELDS: Record<LabMode, (NumericKey | "strictPrompt" | "sentences")[]> = {
  chunking: ["chunkSize", "chunkOverlap"],
  embeddings: ["sentences"],
  search: ["topK", "minScore", "chunkSize", "chunkOverlap"],
  rag: ["strictPrompt", "topK", "minScore", "chunkSize", "chunkOverlap"],
  crag: ["maxRetries", "chunkSize", "chunkOverlap"],
};

const LABELS: Record<NumericKey, { label: string; hint: string }> = {
  chunkSize: { label: "chunkSize", hint: "ຂະໜາດສູງສຸດຂອງ chunk (ຕົວອັກສອນ)" },
  chunkOverlap: { label: "chunkOverlap", hint: "ສ່ວນທີ່ຊ້ຳກັນລະຫວ່າງ chunk" },
  topK: { label: "top-k", hint: "ຈຳນວນ chunk ທີ່ດຶງມາ" },
  minScore: { label: "minScore", hint: "ຕັດ chunk ທີ່ຄະແນນຕ່ຳກວ່ານີ້" },
  maxRetries: { label: "maxRetries", hint: "ວົນ transform ໄດ້ສູງສຸດຈັກຮອບ" },
};

function Slider({ name, value, onChange }: { name: NumericKey; value: number; onChange: (v: number) => void }) {
  const limits = OPTION_LIMITS[name];
  const { label, hint } = LABELS[name];
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-sm font-semibold">{label}</span>
        <span className="font-mono text-sm tabular-nums text-accent">{name === "minScore" ? value.toFixed(2) : value}</span>
      </span>
      <input
        type="range"
        min={limits.min}
        max={limits.max}
        step={limits.step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-accent"
      />
      <span className="text-xs text-muted">{hint}</span>
    </label>
  );
}

interface LabSettingsProps {
  mode: LabMode;
  options: LabOptions;
  onChange: (options: LabOptions) => void;
}

export function LabSettings({ mode, options, onChange }: LabSettingsProps) {
  const set = <K extends keyof LabOptions>(key: K, value: LabOptions[K]) => onChange({ ...options, [key]: value });
  const fields = FIELDS[mode];

  return (
    <div className="flex flex-col gap-5">
      {fields.map((field) => {
        if (field === "strictPrompt") {
          return (
            <label key={field} className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={options.strictPrompt}
                onChange={(e) => set("strictPrompt", e.target.checked)}
                className="mt-1 size-4 accent-accent"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">ກົດກັນ hallucination</span>
                <span className="text-xs text-muted">“ຕອບຈາກ context ເທົ່ານັ້ນ ບໍ່ພົບໃຫ້ບອກວ່າບໍ່ພົບ”</span>
              </span>
            </label>
          );
        }
        if (field === "sentences") {
          return (
            <label key={field} className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold">ປະໂຫຍກທີ່ໃຊ້ທຽບ</span>
              <textarea
                rows={8}
                value={options.sentences.join("\n")}
                onChange={(e) => set("sentences", e.target.value.split("\n").slice(0, MAX_SENTENCES))}
                className="w-full resize-y rounded-lg border border-line bg-background p-2 text-sm leading-relaxed outline-none focus:border-accent"
              />
              <span className="text-xs text-muted">1 ແຖວ = 1 ປະໂຫຍກ (ສູງສຸດ {MAX_SENTENCES})</span>
            </label>
          );
        }
        return <Slider key={field} name={field} value={options[field]} onChange={(v) => set(field, v)} />;
      })}

      {fields.includes("chunkSize") && mode !== "chunking" && (
        <p className="rounded-lg bg-subtle p-2.5 text-xs text-muted">
          ປ່ຽນ chunkSize/overlap ແລ້ວ ຄຳຖາມທຳອິດຈະຊ້າ ເພາະຕ້ອງ embed ເອກະສານໃໝ່
        </p>
      )}

      <button
        type="button"
        onClick={() => onChange(DEFAULT_OPTIONS)}
        className="self-start text-sm text-muted underline underline-offset-4 hover:text-foreground"
      >
        ຄືນຄ່າເລີ່ມຕົ້ນ
      </button>
    </div>
  );
}
