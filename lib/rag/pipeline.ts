/**
 * RAG pipeline ຝັ່ງ server ສຳລັບໜ້າແຊັດ — ແຕ່ລະຟັງຊັນຄູ່ກັບ CLI lab 1 ບົດ
 * (prompt ແລະ graph ຂຽນແບບດຽວກັບ labs/04-rag-chain.ts ແລະ labs/05-crag-graph.ts)
 */
import 'server-only';
import { Document } from '@langchain/core/documents';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import type { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';
import {
    EMBEDDING_MODEL,
    buildVectorStore,
    cosineSimilarity,
    getEmbeddings,
    getLLM,
    loadDocuments,
    splitDocuments,
} from '@/labs/core';
import type { CragStep, LabOptions, LabResult, SearchHit } from './types';

// ===============================================
// Vector store cache — index ຄັ້ງດຽວຕໍ່ການຕັ້ງຄ່າ chunk
// ===============================================
// ເກັບໃນ globalThis ເພື່ອບໍ່ໃຫ້ຫາຍຕອນ hot reload ຂອງ next dev (ບໍ່ດັ່ງນັ້ນຈະ embed ໃໝ່ທຸກຄັ້ງທີ່ແກ້ໄຟລ໌)
const globalStores = globalThis as typeof globalThis & {
    __labStores?: Map<string, Promise<MemoryVectorStore>>;
};
const stores = (globalStores.__labStores ??= new Map());

function getVectorStore(chunkSize: number, chunkOverlap: number): Promise<MemoryVectorStore> {
    const key = `${chunkSize}:${chunkOverlap}`;
    let store = stores.get(key);
    if (!store) {
        store = buildVectorStore(chunkSize, chunkOverlap);
        // ຖ້າ embed ລົ້ມເຫຼວ ຢ່າ cache error ໄວ້ ໃຫ້ລອງໃໝ່ຮອບໜ້າ
        store.catch(() => stores.delete(key));
        stores.set(key, store);
    }
    return store;
}

function toHit([doc, score]: [Document, number], minScore = 0): SearchHit {
    return { source: String(doc.metadata.source), content: doc.pageContent, score, kept: score >= minScore };
}

// ===============================================
// Lab 1 — Load & Chunk
// ===============================================
async function runChunking(input: string, options: LabOptions): Promise<LabResult> {
    const docs = input.trim()
        ? [new Document({ pageContent: input, metadata: { source: 'ຂໍ້ຄວາມຂອງທ່ານ' } })]
        : await loadDocuments();
    const chunks = await splitDocuments(docs, options.chunkSize, options.chunkOverlap);
    return {
        mode: 'chunking',
        docCount: docs.length,
        chunkSize: options.chunkSize,
        chunkOverlap: options.chunkOverlap,
        chunks: chunks.map((c) => ({ source: String(c.metadata.source), content: c.pageContent })),
    };
}

// ===============================================
// Lab 2 — Embeddings & Cosine Similarity
// ===============================================
async function runEmbeddings(query: string, options: LabOptions): Promise<LabResult> {
    const embeddings = getEmbeddings();
    const [queryVector, sentenceVectors] = await Promise.all([
        embeddings.embedQuery(query),
        embeddings.embedDocuments(options.sentences),
    ]);
    return {
        mode: 'embeddings',
        model: EMBEDDING_MODEL,
        dimensions: queryVector.length,
        sample: queryVector.slice(0, 6),
        results: options.sentences
            .map((text, i) => ({ text, score: cosineSimilarity(queryVector, sentenceVectors[i]) }))
            .sort((a, b) => b.score - a.score),
    };
}

// ===============================================
// Lab 3 — Vector Search
// ===============================================
async function runSearch(query: string, options: LabOptions): Promise<LabResult> {
    const store = await getVectorStore(options.chunkSize, options.chunkOverlap);
    const results = await store.similaritySearchWithScore(query, options.topK);
    return {
        mode: 'search',
        chunkCount: store.memoryVectors.length,
        hits: results.map((r) => toHit(r, options.minScore)),
    };
}

// ===============================================
// Lab 4 — RAG: Retrieve → Augment → Generate
// ===============================================
function buildRagPrompt(context: string, strict: boolean): string {
    const rules = strict
        ? `ກົດ:
1. ຕອບໂດຍອີງໃສ່ "ຂໍ້ມູນອ້າງອີງ" ຂ້າງລຸ່ມເທົ່ານັ້ນ ຫ້າມໃຊ້ຄວາມຮູ້ພາຍນອກ
2. ຖ້າຂໍ້ມູນອ້າງອີງບໍ່ພໍທີ່ຈະຕອບ ໃຫ້ຕອບວ່າ "ຂໍອະໄພ, ບໍ່ພົບຂໍ້ມູນນີ້ໃນເອກະສານ"
3. ທ້າຍຄຳຕອບ ໃຫ້ລະບຸໝາຍເລກແຫຼ່ງທີ່ໃຊ້ ເຊັ່ນ [1], [3]`
        : `ກົດ:
1. ທ້າຍຄຳຕອບ ໃຫ້ລະບຸໝາຍເລກແຫຼ່ງທີ່ໃຊ້ ເຊັ່ນ [1], [3]`;

    return `ທ່ານແມ່ນຜູ້ຊ່ວຍ HR ຂອງບໍລິສັດ ຕອບເປັນພາສາລາວ.

${rules}

ຂໍ້ມູນອ້າງອີງ:
${context}`;
}

async function runRag(question: string, options: LabOptions): Promise<LabResult> {
    // 1) Retrieve
    const store = await getVectorStore(options.chunkSize, options.chunkOverlap);
    const hits = (await store.similaritySearchWithScore(question, options.topK)).map((r) => toHit(r, options.minScore));
    const used = hits.filter((h) => h.kept);

    // 2) Augment — ໃສ່ໝາຍເລກ [1], [2] ເພື່ອໃຫ້ LLM ອ້າງອີງໄດ້
    const context = used.length
        ? used.map((h, i) => `[${i + 1}] (ແຫຼ່ງ: ${h.source})\n${h.content}`).join('\n\n')
        : '(ບໍ່ມີຂໍ້ມູນທີ່ຄະແນນຜ່ານເກນ)';
    const systemPrompt = buildRagPrompt(context, options.strictPrompt);

    // 3) Generate
    const response = await getLLM().invoke([new SystemMessage(systemPrompt), new HumanMessage(question)]);
    return { mode: 'rag', answer: response.text, sources: hits, systemPrompt };
}

// ===============================================
// Lab 5 — Corrective RAG ດ້ວຍ LangGraph
// ===============================================
const CragState = Annotation.Root({
    question: Annotation<string>,
    searchQuery: Annotation<string>,
    documents: Annotation<Document[]>,
    documentsRelevant: Annotation<boolean>,
    retries: Annotation<number>,
    answer: Annotation<string>,
});
type CragStateType = typeof CragState.State;

async function runCrag(question: string, options: LabOptions): Promise<LabResult> {
    const store = await getVectorStore(options.chunkSize, options.chunkOverlap);
    const llm = getLLM();
    // ບັນທຶກແຕ່ລະ node ທີ່ທຳງານ ເພື່ອສະແດງໃນໜ້າແຊັດ (ແທນ console.log ໃນ CLI lab)
    const steps: CragStep[] = [];

    async function retrieve(state: CragStateType): Promise<Partial<CragStateType>> {
        const query = state.searchQuery || state.question;
        const documents = await store.similaritySearch(query, 3);
        steps.push({ node: 'retrieve', detail: `“${query}” → ${documents.map((d) => d.metadata.source).join(', ')}` });
        return { documents };
    }

    async function grade(state: CragStateType): Promise<Partial<CragStateType>> {
        const docsText = state.documents.map((d, i) => `[${i + 1}] ${d.pageContent}`).join('\n\n');
        const response = await llm.invoke([
            new HumanMessage(`ເອກະສານຂ້າງລຸ່ມມີຂໍ້ມູນທີ່ໃຊ້ຕອບຄຳຖາມນີ້ໄດ້ບໍ່?
ຄຳຖາມ: "${state.question}"

${docsText}

ຕອບພຽງຄຳດຽວ: yes ຫຼື no`),
        ]);
        const documentsRelevant = response.text.trim().toLowerCase().startsWith('yes');
        steps.push({ node: 'grade', detail: documentsRelevant ? 'ກ່ຽວຂ້ອງ ✓' : 'ບໍ່ກ່ຽວຂ້ອງ ✗' });
        return { documentsRelevant };
    }

    async function transform(state: CragStateType): Promise<Partial<CragStateType>> {
        const response = await llm.invoke([
            new HumanMessage(`ຂຽນຄຳຄົ້ນຫາໃໝ່ທີ່ຊັດເຈນກວ່າເກົ່າ ສຳລັບຄົ້ນຫາໃນຄູ່ມືພະນັກງານ (HR, ໄອທີ, ສະຫວັດດີການ)
ຄຳຖາມເດີມ: "${state.question}"
ຕອບພຽງຄຳຄົ້ນຫາໃໝ່ເທົ່ານັ້ນ:`),
        ]);
        const searchQuery = response.text.trim();
        steps.push({ node: 'transform', detail: `ຄຳຄົ້ນໃໝ່: “${searchQuery}”` });
        return { searchQuery, retries: (state.retries ?? 0) + 1 };
    }

    async function generate(state: CragStateType): Promise<Partial<CragStateType>> {
        const context = state.documentsRelevant
            ? state.documents.map((d, i) => `[${i + 1}] (${d.metadata.source}) ${d.pageContent}`).join('\n\n')
            : '(ບໍ່ມີຂໍ້ມູນທີ່ກ່ຽວຂ້ອງ)';
        const response = await llm.invoke([
            new SystemMessage(`ທ່ານແມ່ນຜູ້ຊ່ວຍ HR ຕອບເປັນພາສາລາວ ໂດຍອີງໃສ່ຂໍ້ມູນອ້າງອີງເທົ່ານັ້ນ.
ຖ້າບໍ່ມີຂໍ້ມູນ ໃຫ້ຕອບວ່າ "ຂໍອະໄພ, ບໍ່ພົບຂໍ້ມູນນີ້ໃນເອກະສານ". ລະບຸແຫຼ່ງ [n] ທ້າຍຄຳຕອບ.

ຂໍ້ມູນອ້າງອີງ:
${context}`),
            new HumanMessage(state.question),
        ]);
        steps.push({ node: 'generate', detail: state.documentsRelevant ? 'ຕອບຈາກເອກະສານ' : 'ບໍ່ມີເອກະສານທີ່ກ່ຽວ → ຕອບວ່າບໍ່ພົບ' });
        return { answer: response.text };
    }

    const graph = new StateGraph(CragState)
        .addNode('retrieve', retrieve)
        .addNode('grade', grade)
        .addNode('transform', transform)
        .addNode('generate', generate)
        .addEdge(START, 'retrieve')
        .addEdge('retrieve', 'grade')
        .addConditionalEdges(
            'grade',
            (state) => {
                if (state.documentsRelevant) return 'generate';
                if ((state.retries ?? 0) >= options.maxRetries) return 'generate';
                return 'transform';
            },
            { generate: 'generate', transform: 'transform' },
        )
        .addEdge('transform', 'retrieve')
        .addEdge('generate', END)
        .compile();

    const result = await graph.invoke({ question, retries: 0 });
    return { mode: 'crag', answer: result.answer, steps, retries: result.retries };
}

export async function runLab(mode: LabResult['mode'], input: string, options: LabOptions): Promise<LabResult> {
    switch (mode) {
        case 'chunking':
            return runChunking(input, options);
        case 'embeddings':
            return runEmbeddings(input, options);
        case 'search':
            return runSearch(input, options);
        case 'rag':
            return runRag(input, options);
        case 'crag':
            return runCrag(input, options);
    }
}
