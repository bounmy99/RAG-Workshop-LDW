import { runLab } from '@/lib/rag/pipeline';
import { DEFAULT_OPTIONS, MAX_INPUT_LENGTH, MAX_SENTENCES, OPTION_LIMITS } from '@/lib/rag/labs-config';
import { LAB_MODES, type LabMode, type LabOptions, type LabResponse } from '@/lib/rag/types';

function clamp(value: unknown, { min, max }: { min: number; max: number }, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

/** ຮັບຄ່າຈາກ client ແບບບໍ່ໄວ້ໃຈ — ທຸກຄ່າຖືກ clamp ຫຼື ໃຊ້ຄ່າ default */
function parseOptions(raw: Partial<LabOptions> | undefined): LabOptions {
    const o = raw ?? {};
    const chunkSize = Math.round(clamp(o.chunkSize, OPTION_LIMITS.chunkSize, DEFAULT_OPTIONS.chunkSize));
    const sentences = Array.isArray(o.sentences)
        ? o.sentences.filter((s): s is string => typeof s === 'string' && s.trim() !== '')
            .map((s) => s.trim().slice(0, 300))
            .slice(0, MAX_SENTENCES)
        : [];
    return {
        chunkSize,
        // overlap ຕ້ອງນ້ອຍກວ່າ chunkSize ບໍ່ດັ່ງນັ້ນ text splitter ຈະ throw
        chunkOverlap: Math.min(
            Math.round(clamp(o.chunkOverlap, OPTION_LIMITS.chunkOverlap, DEFAULT_OPTIONS.chunkOverlap)),
            chunkSize - 1,
        ),
        topK: Math.round(clamp(o.topK, OPTION_LIMITS.topK, DEFAULT_OPTIONS.topK)),
        minScore: clamp(o.minScore, OPTION_LIMITS.minScore, DEFAULT_OPTIONS.minScore),
        strictPrompt: typeof o.strictPrompt === 'boolean' ? o.strictPrompt : DEFAULT_OPTIONS.strictPrompt,
        maxRetries: Math.round(clamp(o.maxRetries, OPTION_LIMITS.maxRetries, DEFAULT_OPTIONS.maxRetries)),
        sentences: sentences.length ? sentences : DEFAULT_OPTIONS.sentences,
    };
}

const KEY_HELP =
    'ຍັງບໍ່ໄດ້ຕັ້ງ OPENROUTER_API_KEY — ເປີດໄຟລ໌ .env ແລ້ວປ່ຽນ sk-or-... ເປັນ key ແທ້ຈາກ https://openrouter.ai/keys ຈາກນັ້ນ restart pnpm dev (Lab 1 ໃຊ້ໄດ້ໂດຍບໍ່ຕ້ອງມີ key)';

function fail(error: string, status: number) {
    return Response.json({ ok: false, error } satisfies LabResponse, { status });
}

export async function POST(request: Request) {
    let body: { mode?: unknown; input?: unknown; options?: Partial<LabOptions> };
    try {
        body = await request.json();
    } catch {
        return fail('Request body ຕ້ອງເປັນ JSON', 400);
    }

    if (!LAB_MODES.includes(body.mode as LabMode)) {
        return fail(`mode ຕ້ອງເປັນໜຶ່ງໃນ: ${LAB_MODES.join(', ')}`, 400);
    }
    const mode = body.mode as LabMode;
    // Lab 1 ເຮັດໃນເຄື່ອງທັງໝົດ — ຕັ້ງແຕ່ Lab 2 ຈຶ່ງເອີ້ນ embedding/LLM ຜ່ານ OpenRouter
    const apiKey = process.env.OPENROUTER_API_KEY ?? '';
    if (mode !== 'chunking' && (!apiKey || apiKey === 'sk-or-...')) {
        return fail(KEY_HELP, 500);
    }
    const input = typeof body.input === 'string' ? body.input.trim() : '';
    if (input.length > MAX_INPUT_LENGTH) {
        return fail(`ຂໍ້ຄວາມຍາວເກີນ ${MAX_INPUT_LENGTH} ຕົວອັກສອນ`, 400);
    }
    // Lab 1 ເວັ້ນວ່າງໄດ້ (= ແບ່ງເອກະສານໃນ data/) — lab ອື່ນຕ້ອງມີຄຳຖາມ
    if (!input && mode !== 'chunking') {
        return fail('ກະລຸນາພິມຄຳຖາມ', 400);
    }

    try {
        const result = await runLab(mode, input, parseOptions(body.options));
        return Response.json({ ok: true, result } satisfies LabResponse);
    } catch (error) {
        console.error(`❌ [/api/lab] mode=${mode}`, error);
        const message = error instanceof Error ? error.message : String(error);
        // 401 = OpenRouter ປະຕິເສດ key (ຜິດ, ໝົດອາຍຸ ຫຼື ຖືກລຶບ)
        if (/\b401\b/.test(message)) {
            return fail(`OpenRouter ປະຕິເສດ API key (401) — ກວດ OPENROUTER_API_KEY ໃນ .env ວ່າຖືກຕ້ອງ ແລ້ວ restart pnpm dev`, 500);
        }
        return fail(`ເກີດຂໍ້ຜິດພາດ: ${message}`, 500);
    }
}
