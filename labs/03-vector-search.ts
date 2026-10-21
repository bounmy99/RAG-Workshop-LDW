/**
 * Lab 3 — Vector Store & Similarity Search
 *
 * ເປົ້າໝາຍ: index chunk ທັງໝົດເຂົ້າ vector store ແລ້ວຄົ້ນຫາ top-k ດ້ວຍຄຳຖາມ
 * ທຽບກັບ project: src/app/api/chat_rag_tool_calling/graph/retriever.ts
 *   (project ຈິງໃຊ້ Pinecone/pgvector ແທນ MemoryVectorStore)
 *
 * ຮັນ: pnpm lab:3 "ຄຳຖາມຂອງທ່ານ"
 */
import { buildVectorStore, preview } from './lib.ts';

const query = process.argv[2] || 'ລືມລະຫັດຜ່ານ ຕ້ອງປ່ຽນເລື້ອຍປານໃດ?';

// 🧪 TODO(ແບບຝຶກຫັດ 3.1): ລອງ k = 1 ແລະ k = 8 ແລ້ວສັງເກດວ່າ chunk ທີ່ບໍ່ກ່ຽວເລີ່ມເຂົ້າມາຕອນໃດ
const TOP_K = 4;
// 🧪 TODO(ແບບຝຶກຫັດ 3.2): ຕັ້ງ threshold ເພື່ອຕັດ chunk ທີ່ຄະແນນຕ່ຳອອກ (project ຈິງມີ searchThreshold)
const MIN_SCORE = 0;

const store = await buildVectorStore();
const results = await store.similaritySearchWithScore(query, TOP_K);

console.log(`\n❓ Query: "${query}"\n`);
results
    .filter(([, score]) => score >= MIN_SCORE)
    .forEach(([doc, score], i) => {
        console.log(`#${i + 1} score=${score.toFixed(3)} [${doc.metadata.source}]`);
        console.log(`   ${preview(doc.pageContent, 140)}\n`);
    });
