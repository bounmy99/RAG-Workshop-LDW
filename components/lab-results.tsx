import type { ChunkView, CragStep, LabResult, SearchHit } from "@/lib/rag/types";

/**
 * ຄວາມຍາວຂອງສ່ວນທີ່ chunk ນີ້ຊ້ຳກັບທ້າຍຂອງ chunk ກ່ອນໜ້າ (ຈາກ chunkOverlap)
 *
 * splitter ຍົກ "ທັງຕ່ອນ" (ຄຳ/ແຖວ) ຈາກທ້າຍ chunk ກ່ອນມາໃສ່ ສະນັ້ນສ່ວນທີ່ຊ້ຳຕ້ອງ:
 * ບໍ່ຍາວເກີນ chunkOverlap ແລະ ເລີ່ມຫຼັງຊ່ອງຫວ່າງໃນ chunk ກ່ອນ — ກັນການຈັບຄູ່ທີ່ບັງເອີນຄືກັນ
 */
function overlapLength(prev: string, current: string, chunkOverlap: number): number {
  const max = Math.min(prev.length, current.length - 1, chunkOverlap);
  for (let k = max; k > 0; k--) {
    const startsAtBoundary = k === prev.length || /\s/.test(prev[prev.length - k - 1]);
    if (startsAtBoundary && prev.endsWith(current.slice(0, k))) return k;
  }
  return 0;
}

function ScoreBar({ score, dim = false }: { score: number; dim?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-14 shrink-0 font-mono text-sm tabular-nums ${dim ? "text-muted" : "font-semibold"}`}>
        {score.toFixed(3)}
      </span>
      <div className="h-2.5 flex-1 rounded-full bg-subtle">
        <div
          className={`h-full rounded-full ${dim ? "bg-muted/40" : "bg-accent"}`}
          style={{ width: `${Math.max(0, Math.min(1, score)) * 100}%` }}
        />
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: string }) {
  return <span className="rounded-md bg-subtle px-2 py-0.5 font-mono text-xs text-muted">{source}</span>;
}

function ChunkingResult({ result }: { result: Extract<LabResult, { mode: "chunking" }> }) {
  const sharedLengths = result.chunks.map((chunk: ChunkView, i) => {
    const prev = result.chunks[i - 1];
    return prev && prev.source === chunk.source ? overlapLength(prev.content, chunk.content, result.chunkOverlap) : 0;
  });
  const overlapCount = sharedLengths.filter(Boolean).length;
  const singleChunkDocs = result.chunks.length === result.docCount;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        <b>{result.docCount}</b> ເອກະສານ → <b>{result.chunks.length}</b> chunks
        <span className="text-muted"> (chunkSize {result.chunkSize} / overlap {result.chunkOverlap})</span>
        {overlapCount > 0 && <span className="text-accent"> · {overlapCount} chunk ມີສ່ວນຊ້ຳ</span>}
      </p>
      {result.chunkOverlap > 0 && overlapCount === 0 && (
        <p className="rounded-lg bg-subtle p-2.5 text-xs leading-relaxed text-muted">
          {singleChunkDocs
            ? "ແຕ່ລະເອກະສານສັ້ນກວ່າ chunkSize ຈຶ່ງບໍ່ຖືກແບ່ງ — overlap ມີຜົນສະເພາະເມື່ອເອກະສານຖືກແບ່ງເປັນຫຼາຍ chunk."
            : "ບໍ່ມີ chunk ໃດຊ້ຳກັນ: splitter ແບ່ງຕາມຫົວຂໍ້ ແລະ ແຖວກ່ອນ ແລ້ວຍົກ “ທັງຕ່ອນ” ຈາກທ້າຍ chunk ກ່ອນມາເປັນ overlap — ຖ້າແຕ່ລະຕ່ອນຍາວກວ່າ overlap ກໍຍົກມາບໍ່ໄດ້. ລອງ chunkSize 100 / overlap 50."}
        </p>
      )}
      <ol className="flex flex-col gap-2">
        {result.chunks.map((chunk: ChunkView, i) => {
          const shared = sharedLengths[i];
          return (
            <li key={i} className="rounded-xl border border-line bg-background p-3">
              <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="font-semibold text-foreground">#{i + 1}</span>
                <SourceBadge source={chunk.source} />
                <span>{chunk.content.length} ຕົວອັກສອນ</span>
                {shared > 0 && <span className="text-accent">ຊ້ຳກັບ chunk ກ່ອນ {shared} ຕົວ</span>}
              </div>
              <p className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed">
                {shared > 0 && <mark className="rounded bg-accent-soft text-foreground">{chunk.content.slice(0, shared)}</mark>}
                {chunk.content.slice(shared)}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function EmbeddingsResult({ result }: { result: Extract<LabResult, { mode: "embeddings" }> }) {
  const top = result.results[0]?.score ?? 0;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        <span className="font-mono">{result.model}</span> · vector {result.dimensions} ມິຕິ ·{" "}
        <span className="font-mono">[{result.sample.map((v) => v.toFixed(4)).join(", ")}, …]</span>
      </p>
      <ul className="flex flex-col gap-3">
        {result.results.map(({ text, score }) => (
          <li key={text} className="flex flex-col gap-1">
            <span className="text-sm">{text}</span>
            <ScoreBar score={score} dim={score < top - 0.1} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function HitList({ hits }: { hits: SearchHit[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {hits.map((hit, i) => (
        <li key={i} className={`rounded-xl border border-line bg-background p-3 ${hit.kept ? "" : "opacity-55"}`}>
          <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold">[{i + 1}]</span>
            <SourceBadge source={hit.source} />
            {!hit.kept && <span className="text-accent">ຕ່ຳກວ່າ minScore → ຕັດອອກ</span>}
          </div>
          <ScoreBar score={hit.score} dim={!hit.kept} />
          <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-muted">{hit.content}</p>
        </li>
      ))}
    </ol>
  );
}

function SearchResult({ result }: { result: Extract<LabResult, { mode: "search" }> }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">
        ຄົ້ນຈາກ {result.chunkCount} chunks · ສົ່ງກັບ top-{result.hits.length}
      </p>
      <HitList hits={result.hits} />
    </div>
  );
}

function Answer({ text }: { text: string }) {
  return <p className="whitespace-pre-wrap wrap-break-word leading-relaxed">{text}</p>;
}

function RagResult({ result }: { result: Extract<LabResult, { mode: "rag" }> }) {
  return (
    <div className="flex flex-col gap-4">
      <Answer text={result.answer} />
      <details className="group rounded-xl border border-line">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">
          ① Retrieve — chunk ທີ່ຄົ້ນເຈີ ({result.sources.filter((s) => s.kept).length}/{result.sources.length} ຖືກໃຊ້)
        </summary>
        <div className="border-t border-line p-3">
          <HitList hits={result.sources} />
        </div>
      </details>
      <details className="rounded-xl border border-line">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">② Augment — ເບິ່ງ prompt ທີ່ສົ່ງໃຫ້ LLM</summary>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap wrap-break-word border-t border-line p-3 font-mono text-xs leading-relaxed">
          {result.systemPrompt}
        </pre>
      </details>
    </div>
  );
}

const NODE_STYLE: Record<CragStep["node"], string> = {
  retrieve: "bg-subtle text-foreground",
  grade: "bg-accent text-on-primary",
  transform: "border border-dashed border-accent text-accent",
  generate: "bg-primary text-on-primary",
};

function CragResult({ result }: { result: Extract<LabResult, { mode: "crag" }> }) {
  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-2">
        {result.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className={`w-24 shrink-0 rounded-lg px-2 py-1 text-center font-mono text-xs font-semibold ${NODE_STYLE[step.node]}`}>
              {step.node}
            </span>
            <span className="pt-0.5 text-sm wrap-break-word">{step.detail}</span>
          </li>
        ))}
      </ol>
      <p className="text-xs text-muted">ໃຊ້ transform {result.retries} ຮອບ</p>
      <Answer text={result.answer} />
    </div>
  );
}

export function LabResultView({ result }: { result: LabResult }) {
  switch (result.mode) {
    case "chunking":
      return <ChunkingResult result={result} />;
    case "embeddings":
      return <EmbeddingsResult result={result} />;
    case "search":
      return <SearchResult result={result} />;
    case "rag":
      return <RagResult result={result} />;
    case "crag":
      return <CragResult result={result} />;
  }
}
