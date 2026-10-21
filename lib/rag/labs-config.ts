import type { LabMode, LabOptions } from './types';

export interface LabInfo {
    mode: LabMode;
    number: number;
    title: string;
    summary: string;
    /** ໄຟລ໌ CLI lab ທີ່ຄູ່ກັນ */
    file: string;
    placeholder: string;
    suggestions: string[];
    /** ແບບຝຶກຫັດສັ້ນໆ ຈາກ README */
    tips: string[];
}

export const LABS: LabInfo[] = [
    {
        mode: 'chunking',
        number: 1,
        title: 'Load & Chunk',
        summary: 'ແບ່ງເອກະສານເປັນ chunk — ລອງປັບ chunkSize / overlap ແລ້ວເບິ່ງວ່າປະໂຫຍກຖືກຕັດແນວໃດ',
        file: 'labs/01-chunking.ts',
        placeholder: 'ວາງຂໍ້ຄວາມທີ່ຢາກແບ່ງ (ເວັ້ນວ່າງ = ແບ່ງເອກະສານໃນ data/)',
        suggestions: [''],
        tips: ['ປ່ຽນ chunkSize ເປັນ 100 / 300 / 1000 ແລ້ວສັງເກດຈຳນວນ chunk', 'ຕັ້ງ overlap = 0 ກັບ chunkSize = 100 → ມີປະໂຫຍກຖືກຕັດກາງບໍ່?', 'ສ່ວນທີ່ຊ້ຳ (overlap) ຖືກໄຮໄລ້ສີ — ເຫັນຊັດທີ່ chunkSize 100 / overlap 50'],
    },
    {
        mode: 'embeddings',
        number: 2,
        title: 'Embeddings',
        summary: 'ທຽບຄວາມໝາຍຂອງຄຳຖາມກັບປະໂຫຍກຕ່າງໆ ດ້ວຍ cosine similarity',
        file: 'labs/02-embeddings.ts',
        placeholder: 'ພິມຄຳຖາມເພື່ອທຽບກັບປະໂຫຍກໃນແຖບຕັ້ງຄ່າ',
        suggestions: ['ຂ້ອຍລາພັກໄດ້ຈັກມື້ຕໍ່ປີ?', 'How many vacation days do I get?', 'ລາ'],
        tips: ['ເພີ່ມປະໂຫຍກພາສາອັງກິດ ຫຼື ຄຳສະແລງໃນແຖບຕັ້ງຄ່າ', 'ຖາມສັ້ນໆ ເຊັ່ນ “ລາ” → ຄະແນນສູງສຸດຫຼຸດລົງບໍ່?', 'ສັງເກດ: ປະໂຫຍກທີ່ບໍ່ກ່ຽວກໍບໍ່ເຄີຍໄດ້ 0'],
    },
    {
        mode: 'search',
        number: 3,
        title: 'Vector Search',
        summary: 'ຄົ້ນ top-k chunk ທີ່ໃກ້ກັບຄຳຖາມທີ່ສຸດ — ສັງເກດຄະແນນຂອງຄຳຖາມທີ່ບໍ່ມີໃນເອກະສານ',
        file: 'labs/03-vector-search.ts',
        placeholder: 'ພິມຄຳຖາມເພື່ອຄົ້ນຫາ chunk',
        suggestions: ['ລືມລະຫັດຜ່ານ ຕ້ອງປ່ຽນເລື້ອຍປານໃດ?', 'WFH ໄດ້ຈັກມື້?', 'ບໍລິສັດມີໂບນັດທ້າຍປີບໍ່?'],
        tips: ['ລອງ top-k = 1 ແລະ 8 → chunk ທີ່ບໍ່ກ່ຽວເຂົ້າມາຕັ້ງແຕ່ອັນດັບໃດ?', 'ຖາມສິ່ງທີ່ບໍ່ມີໃນເອກະສານ ແລ້ວຕັ້ງ minScore ໃຫ້ຕັດອອກໄດ້', 'ປ່ຽນ chunkSize ແລ້ວຄົ້ນຄຳຖາມເດີມ → ຜົນປ່ຽນແນວໃດ?'],
    },
    {
        mode: 'rag',
        number: 4,
        title: 'RAG',
        summary: 'Retrieve → Augment → Generate — ລອງປິດກົດກັນ hallucination ແລ້ວຖາມສິ່ງທີ່ບໍ່ມີໃນເອກະສານ',
        file: 'labs/04-rag-chain.ts',
        placeholder: 'ຖາມຫຍັງກໍໄດ້ກ່ຽວກັບລະບຽບບໍລິສັດ',
        suggestions: [
            'ເຮັດວຽກມາ 6 ປີແລ້ວ ລາພັກປະຈຳປີໄດ້ຈັກມື້?',
            'ພະນັກງານໃໝ່ທີ່ຍັງບໍ່ຜ່ານທົດລອງວຽກ WFH ໄດ້ບໍ່?',
            'ບໍລິສັດມີໂບນັດທ້າຍປີບໍ່?',
        ],
        tips: ['ປິດ “ກົດກັນ hallucination” ແລ້ວຖາມເລື່ອງໂບນັດ → LLM ແຕ່ງບໍ່?', 'ຖາມຄຳຖາມທີ່ຕ້ອງໃຊ້ 2 ເອກະສານ', 'ກົດ “ເບິ່ງ prompt” ເພື່ອເບິ່ງວ່າ context ຖືກແນບແນວໃດ'],
    },
    {
        mode: 'crag',
        number: 5,
        title: 'Corrective RAG',
        summary: 'LangGraph: retrieve → grade → (transform → retrieve) → generate — ເບິ່ງແຕ່ລະ node ທຳງານ',
        file: 'labs/05-crag-graph.ts',
        placeholder: 'ລອງຖາມແບບອ້ອມໆ ຫຼື ຖາມສິ່ງທີ່ບໍ່ມີໃນເອກະສານ',
        suggestions: [
            'ລູກຂ້ອຍອາຍຸ 10 ປີ ເຂົ້າປະກັນສຸຂະພາບນຳໄດ້ບໍ່?',
            'ຖ້າໂນດບຸກຫາຍ ຕ້ອງເຮັດແນວໃດ?',
            'ບໍລິສັດມີໂບນັດທ້າຍປີບໍ່?',
        ],
        tips: ['ຖາມສິ່ງທີ່ບໍ່ມີໃນເອກະສານ → ເບິ່ງ transform ວົນ', 'ຕັ້ງ maxRetries = 0 ແລ້ວຖາມຄືນ', 'ທຽບກັບ graph ຈິງໃນ graph/workflow.ts ຂອງ Langchang-chatbot'],
    },
];

export const DEFAULT_OPTIONS: LabOptions = {
    chunkSize: 300,
    chunkOverlap: 50,
    topK: 4,
    minScore: 0,
    strictPrompt: true,
    maxRetries: 2,
    sentences: [
        'ພະນັກງານມີສິດລາພັກປະຈຳປີ 15 ວັນເຮັດວຽກ',
        'Employees are entitled to 15 days of annual leave',
        'ວັນພັກຜ່ອນປະຈຳປີຂອງພະນັກງານ',
        'ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 12 ຕົວອັກສອນ',
        'ຄ່າອາຫານທ່ຽງ 25,000 ກີບຕໍ່ວັນ',
    ],
};

/** ຂອບເຂດຂອງແຕ່ລະຄ່າ — ໃຊ້ທັງ UI (slider) ແລະ API (clamp) */
export const OPTION_LIMITS = {
    chunkSize: { min: 50, max: 2000, step: 50 },
    chunkOverlap: { min: 0, max: 500, step: 10 },
    topK: { min: 1, max: 10, step: 1 },
    minScore: { min: 0, max: 1, step: 0.01 },
    maxRetries: { min: 0, max: 3, step: 1 },
} as const;

export const MAX_INPUT_LENGTH = 4000;
export const MAX_SENTENCES = 12;
