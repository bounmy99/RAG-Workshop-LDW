/**
 * Lab 5 — Corrective RAG (CRAG) ດ້ວຍ LangGraph
 *
 * ເປົ້າໝາຍ: ເພີ່ມຂັ້ນຕອນ "ກວດຄວາມກ່ຽວຂ້ອງ" ຫຼັງ retrieve — ຖ້າບໍ່ກ່ຽວ ໃຫ້ຂຽນຄຳຖາມໃໝ່ແລ້ວຄົ້ນອີກຮອບ
 * ນີ້ແມ່ນສະບັບຫຍໍ້ຂອງ graph ຈິງໃນ project:
 *   src/app/api/chat_rag_tool_calling/graph/workflow.ts
 *   (validate → contextualize → router → retrieve → grade → transform/generate → grounding)
 *
 *   START → retrieve → grade ─(ກ່ຽວ)──────────────→ generate → END
 *                ↑         └─(ບໍ່ກ່ຽວ)→ transform ─┘ (ວົນກັບໄປ retrieve, ສູງສຸດ MAX_RETRIES ຮອບ)
 *
 * ຮັນ: pnpm lab:5 "ຄຳຖາມຂອງທ່ານ"
 */
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { Document } from '@langchain/core/documents';
import { buildVectorStore, getLLM, preview } from './lib.ts';

const MAX_RETRIES = 2;

const RAGState = Annotation.Root({
    question: Annotation<string>,
    searchQuery: Annotation<string>,
    documents: Annotation<Document[]>,
    documentsRelevant: Annotation<boolean>,
    retries: Annotation<number>,
    answer: Annotation<string>,
});
type State = typeof RAGState.State;

const store = await buildVectorStore();
const llm = getLLM();

async function retrieve(state: State): Promise<Partial<State>> {
    const query = state.searchQuery || state.question;
    const documents = await store.similaritySearch(query, 3);
    console.log(`🔍 [retrieve] "${query}" → ${documents.map((d) => d.metadata.source).join(', ')}`);
    return { documents };
}

async function grade(state: State): Promise<Partial<State>> {
    const docsText = state.documents.map((d, i) => `[${i + 1}] ${d.pageContent}`).join('\n\n');
    const response = await llm.invoke([
        new HumanMessage(`ເອກະສານຂ້າງລຸ່ມມີຂໍ້ມູນທີ່ໃຊ້ຕອບຄຳຖາມນີ້ໄດ້ບໍ່?
ຄຳຖາມ: "${state.question}"

${docsText}

ຕອບພຽງຄຳດຽວ: yes ຫຼື no`),
    ]);
    const documentsRelevant = response.text.trim().toLowerCase().startsWith('yes');
    console.log(`⚖️  [grade] relevant = ${documentsRelevant}`);
    return { documentsRelevant };
}

async function transform(state: State): Promise<Partial<State>> {
    const response = await llm.invoke([
        new HumanMessage(`ຂຽນຄຳຄົ້ນຫາໃໝ່ທີ່ຊັດເຈນກວ່າເກົ່າ ສຳລັບຄົ້ນຫາໃນຄູ່ມືພະນັກງານ (HR, ໄອທີ, ສະຫວັດດີການ)
ຄຳຖາມເດີມ: "${state.question}"
ຕອບພຽງຄຳຄົ້ນຫາໃໝ່ເທົ່ານັ້ນ:`),
    ]);
    const searchQuery = response.text.trim();
    console.log(`✏️  [transform] ຄຳຄົ້ນໃໝ່: "${searchQuery}"`);
    return { searchQuery, retries: (state.retries ?? 0) + 1 };
}

async function generate(state: State): Promise<Partial<State>> {
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
    return { answer: response.text };
}

const graph = new StateGraph(RAGState)
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
            if ((state.retries ?? 0) >= MAX_RETRIES) return 'generate';
            return 'transform';
        },
        { generate: 'generate', transform: 'transform' },
    )
    .addEdge('transform', 'retrieve')
    .addEdge('generate', END)
    .compile();

// 🧪 TODO(ແບບຝຶກຫັດ 5.1): ລອງຖາມແບບອ້ອມໆ ເຊັ່ນ "ຖ້າໂນດບຸກຫາຍ ຕ້ອງເຮັດແນວໃດ?" ແລ້ວເບິ່ງ log ວ່າມີ transform ບໍ່
// 🧪 TODO(ແບບຝຶກຫັດ 5.2): ເພີ່ມ node "validate" ກ່ອນ retrieve ເພື່ອປະຕິເສດຄຳຖາມນອກເລື່ອງ (ເບິ່ງ nodes-validation.ts)
const question = process.argv[2] || 'ລູກຂ້ອຍອາຍຸ 10 ປີ ເຂົ້າປະກັນສຸຂະພາບນຳໄດ້ບໍ່?';
console.log(`\n❓ ${question}\n`);
const result = await graph.invoke({ question, retries: 0 });
console.log(`\n💬 ${result.answer}`);
console.log(`\n(ໃຊ້ ${result.retries} ຮອບ transform, ເອກະສານສຸດທ້າຍ: ${result.documents.map((d) => preview(d.metadata.source, 30)).join(', ')})`);
