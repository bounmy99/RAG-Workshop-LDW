/**
 * Lab 2 — Embeddings & Cosine Similarity
 *
 * ເປົ້າໝາຍ: ເຫັນວ່າ embedding ປ່ຽນຂໍ້ຄວາມເປັນ vector ແລະ ປະໂຫຍກທີ່ "ຄວາມໝາຍໃກ້ກັນ"
 * ຈະມີ cosine similarity ສູງ ເຖິງວ່າຈະໃຊ້ຄຳຕ່າງກັນ
 * ທຽບກັບ project: src/lib/llm-pool.ts → getEmbeddings()
 *
 * ຮັນ: pnpm lab:2
 */
import { getEmbeddings, EMBEDDING_MODEL, preview } from './lib.ts';

function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

const query = 'ຂ້ອຍລາພັກໄດ້ຈັກມື້ຕໍ່ປີ?';

// 🧪 TODO(ແບບຝຶກຫັດ 2.1): ເພີ່ມປະໂຫຍກຂອງທ່ານເອງ ເຊັ່ນ ພາສາອັງກິດທີ່ມີຄວາມໝາຍດຽວກັນ
const sentences = [
    'ພະນັກງານມີສິດລາພັກປະຈຳປີ 15 ວັນເຮັດວຽກ',
    'Employees are entitled to 15 days of annual leave',
    'ວັນພັກຜ່ອນປະຈຳປີຂອງພະນັກງານ',
    'ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 12 ຕົວອັກສອນ',
    'ຄ່າອາຫານທ່ຽງ 25,000 ກີບຕໍ່ວັນ',
];

const embeddings = getEmbeddings();
const queryVector = await embeddings.embedQuery(query);
const sentenceVectors = await embeddings.embedDocuments(sentences);

console.log(`🔢 Model: ${EMBEDDING_MODEL}`);
console.log(`   vector ມີ ${queryVector.length} ມິຕິ, 5 ຄ່າທຳອິດ: [${queryVector.slice(0, 5).map((v) => v.toFixed(4)).join(', ')}, …]\n`);
console.log(`❓ Query: "${query}"\n`);

sentences
    .map((text, i) => ({ text, score: cosineSimilarity(queryVector, sentenceVectors[i]) }))
    .sort((a, b) => b.score - a.score)
    .forEach(({ text, score }) => {
        const bar = '█'.repeat(Math.round(score * 30));
        console.log(`${score.toFixed(3)} ${bar} ${preview(text, 60)}`);
    });
