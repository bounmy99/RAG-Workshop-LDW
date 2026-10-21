"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { LabResultView } from "@/components/lab-results";
import { LabSettings } from "@/components/lab-settings";
import { DEFAULT_OPTIONS, LABS, MAX_INPUT_LENGTH } from "@/lib/rag/labs-config";
import type { LabMode, LabOptions, LabResponse, LabResult } from "@/lib/rag/types";

type ChatMessage =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; status: "pending" }
  | { id: number; role: "assistant"; status: "done"; result: LabResult; elapsedMs: number }
  | { id: number; role: "assistant"; status: "error"; error: string };

const EMPTY_CHUNK_LABEL = "📄 ແບ່ງເອກະສານທັງໝົດໃນ data/";

const emptyHistory = (): Record<LabMode, ChatMessage[]> => ({
  chunking: [],
  embeddings: [],
  search: [],
  rag: [],
  crag: [],
});

let nextId = 1;

function takeIds(): [number, number] {
  nextId += 2;
  return [nextId - 2, nextId - 1];
}

/** ເອີ້ນ /api/lab ແລ້ວແປງຜົນເປັນຂໍ້ຄວາມຂອງ assistant ພ້ອມເວລາທີ່ໃຊ້ */
async function requestLab(id: number, mode: LabMode, input: string, options: LabOptions): Promise<ChatMessage> {
  const started = performance.now();
  try {
    const res = await fetch("/api/lab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, input, options }),
    });
    const data = (await res.json()) as LabResponse;
    return data.ok
      ? { id, role: "assistant", status: "done", result: data.result, elapsedMs: performance.now() - started }
      : { id, role: "assistant", status: "error", error: data.error };
  } catch (error) {
    return {
      id,
      role: "assistant",
      status: "error",
      error: `ເຊື່ອມຕໍ່ server ບໍ່ໄດ້: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export function LabChat() {
  const [mode, setMode] = useState<LabMode>("chunking");
  const [options, setOptions] = useState<LabOptions>(DEFAULT_OPTIONS);
  const [history, setHistory] = useState(emptyHistory);
  const [pending, setPending] = useState<Record<LabMode, boolean>>({
    chunking: false,
    embeddings: false,
    search: false,
    rag: false,
    crag: false,
  });
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const lab = LABS.find((l) => l.mode === mode)!;
  const messages = history[mode];
  const isPending = pending[mode];
  const canSend = !isPending && (input.trim() !== "" || mode === "chunking");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, mode]);

  function update(target: LabMode, id: number, message: ChatMessage) {
    setHistory((h) => ({ ...h, [target]: h[target].map((m) => (m.id === id ? message : m)) }));
  }

  async function send(text: string) {
    // ຈັບ mode ແລະ options ໄວ້ ເພື່ອໃຫ້ຜົນລົງຖືກແທັບ ເຖິງຜູ້ໃຊ້ຈະສະຫຼັບແທັບລະຫວ່າງລໍຖ້າ
    const target = mode;
    const question = text.trim();
    const [userId, replyId] = takeIds();
    const userMessage: ChatMessage = { id: userId, role: "user", text: question || EMPTY_CHUNK_LABEL };

    setHistory((h) => ({ ...h, [target]: [...h[target], userMessage, { id: replyId, role: "assistant", status: "pending" }] }));
    setPending((p) => ({ ...p, [target]: true }));
    setInput("");

    const reply = await requestLab(replyId, target, question, options);
    update(target, replyId, reply);
    setPending((p) => ({ ...p, [target]: false }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (canSend) send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (canSend) send(input);
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 md:px-6">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">RAG Workshop Playground</h1>
          <p className="truncate text-xs text-muted">ທົດລອງແຕ່ລະຫົວຂໍ້ຂອງ workshop ກັບເອກະສານໃນ labs/data/</p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => setHistory((h) => ({ ...h, [mode]: [] }))}
            disabled={isPending}
            className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-subtle disabled:opacity-50"
          >
            ລ້າງແຊັດ
          </button>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        {/* ລາຍການ lab — desktop */}
        <nav className="hidden w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r border-line p-3 md:flex">
          {LABS.map((l) => (
            <button
              key={l.mode}
              type="button"
              onClick={() => setMode(l.mode)}
              className={`flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                l.mode === mode ? "bg-primary text-on-primary" : "hover:bg-subtle"
              }`}
            >
              <span className="font-mono text-sm font-bold opacity-70">{l.number}</span>
              <span className="flex flex-col">
                <span className="font-semibold">{l.title}</span>
                <span className={`font-mono text-xs ${l.mode === mode ? "opacity-75" : "text-muted"}`}>{l.file}</span>
              </span>
              {pending[l.mode] && <span className="ml-auto mt-1.5 size-2 animate-pulse rounded-full bg-accent" />}
            </button>
          ))}
        </nav>

        <main className="flex min-w-0 flex-1 flex-col">
          {/* ລາຍການ lab — mobile */}
          <div className="flex gap-2 overflow-x-auto border-b border-line px-4 py-2 md:hidden">
            {LABS.map((l) => (
              <button
                key={l.mode}
                type="button"
                onClick={() => setMode(l.mode)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                  l.mode === mode ? "bg-primary text-on-primary" : "bg-subtle"
                }`}
              >
                {l.number}. {l.title}
              </button>
            ))}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 md:px-8">
            <div className="mx-auto flex max-w-3xl flex-col gap-5">
              <section className="rounded-2xl border border-line bg-card p-4">
                <p className="text-xs font-semibold tracking-widest text-accent">LAB {lab.number}</p>
                <h2 className="mt-1 text-xl font-bold">{lab.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{lab.summary}</p>
                <ul className="mt-3 flex flex-col gap-1 text-sm">
                  {lab.tips.map((tip) => (
                    <li key={tip}>🧪 {tip}</li>
                  ))}
                </ul>
              </section>

              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2">
                  {lab.suggestions.map((s) => (
                    <button
                      key={s || "empty"}
                      type="button"
                      onClick={() => send(s)}
                      disabled={isPending}
                      className="rounded-full border border-line bg-card px-3 py-1.5 text-sm hover:border-accent disabled:opacity-50"
                    >
                      {s || EMPTY_CHUNK_LABEL}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-on-primary">
                    <p className="whitespace-pre-wrap wrap-break-word">{m.text}</p>
                  </div>
                ) : (
                  <div key={m.id} className="max-w-full rounded-2xl rounded-bl-md border border-line bg-card px-4 py-3">
                    {m.status === "pending" && (
                      <p className="flex items-center gap-2 text-sm text-muted">
                        <span className="size-2 animate-pulse rounded-full bg-accent" />
                        ກຳລັງປະມວນຜົນ…
                      </p>
                    )}
                    {m.status === "error" && <p className="whitespace-pre-wrap text-sm text-accent">⚠️ {m.error}</p>}
                    {m.status === "done" && (
                      <>
                        <LabResultView result={m.result} />
                        <p className="mt-3 text-right text-xs text-muted">{(m.elapsedMs / 1000).toFixed(1)} ວິນາທີ</p>
                      </>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="border-t border-line bg-background px-4 py-3 md:px-8">
            <div className="mx-auto flex max-w-3xl flex-col gap-2">
              {/* ຕັ້ງຄ່າ — ຈໍນ້ອຍ */}
              <details className="rounded-xl border border-line bg-card lg:hidden">
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium">⚙️ ຕັ້ງຄ່າ Lab {lab.number}</summary>
                <div className="max-h-72 overflow-y-auto border-t border-line p-3">
                  <LabSettings mode={mode} options={options} onChange={setOptions} />
                </div>
              </details>

              <form onSubmit={onSubmit} className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={lab.placeholder}
                  maxLength={MAX_INPUT_LENGTH}
                  rows={mode === "chunking" ? 3 : 1}
                  className="max-h-48 min-h-11 flex-1 resize-y rounded-xl border border-line bg-card px-3 py-2.5 leading-relaxed outline-none focus:border-accent"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="h-11 shrink-0 rounded-xl bg-primary px-5 font-semibold text-on-primary disabled:opacity-40"
                >
                  {isPending ? "…" : "ສົ່ງ"}
                </button>
              </form>
              <p className="text-xs text-muted">Enter = ສົ່ງ · Shift+Enter = ແຖວໃໝ່</p>
            </div>
          </div>
        </main>

        {/* ຕັ້ງຄ່າ — desktop */}
        <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-line p-5 lg:block">
          <h2 className="mb-4 text-sm font-semibold tracking-widest text-muted">ຕັ້ງຄ່າ LAB {lab.number}</h2>
          <LabSettings mode={mode} options={options} onChange={setOptions} />
        </aside>
      </div>
    </div>
  );
}
