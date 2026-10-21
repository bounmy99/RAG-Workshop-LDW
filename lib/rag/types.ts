/** Types ທີ່ໃຊ້ຮ່ວມກັນລະຫວ່າງ API (/api/lab) ແລະ ໜ້າແຊັດ — ຫ້າມ import code ຝັ່ງ server ໃນໄຟລ໌ນີ້ */

export const LAB_MODES = ['chunking', 'embeddings', 'search', 'rag', 'crag'] as const;
export type LabMode = (typeof LAB_MODES)[number];

export interface LabOptions {
    chunkSize: number;
    chunkOverlap: number;
    topK: number;
    minScore: number;
    /** ເປີດກົດ "ຕອບຈາກ context ເທົ່ານັ້ນ" ໃນ prompt ຂອງ Lab 4 */
    strictPrompt: boolean;
    maxRetries: number;
    /** ປະໂຫຍກທີ່ໃຊ້ທຽບໃນ Lab 2 */
    sentences: string[];
}

export interface LabRequest {
    mode: LabMode;
    input: string;
    options: LabOptions;
}

export interface ChunkView {
    source: string;
    content: string;
}

export interface SearchHit {
    source: string;
    content: string;
    score: number;
    /** false = ຄະແນນຕ່ຳກວ່າ minScore ຈຶ່ງຖືກຕັດອອກ */
    kept: boolean;
}

export interface CragStep {
    node: 'retrieve' | 'grade' | 'transform' | 'generate';
    detail: string;
}

export type LabResult =
    | { mode: 'chunking'; docCount: number; chunkSize: number; chunkOverlap: number; chunks: ChunkView[] }
    | { mode: 'embeddings'; model: string; dimensions: number; sample: number[]; results: { text: string; score: number }[] }
    | { mode: 'search'; chunkCount: number; hits: SearchHit[] }
    | { mode: 'rag'; answer: string; sources: SearchHit[]; systemPrompt: string }
    | { mode: 'crag'; answer: string; steps: CragStep[]; retries: number };

export type LabResponse = { ok: true; result: LabResult } | { ok: false; error: string };
