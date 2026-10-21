/**
 * Lab 4 — RAG ຄົບວົງຈອນ: Retrieve → Augment → Generate
 *
 * ເປົ້າໝາຍ: ເອົາ chunk ທີ່ຄົ້ນເຈີມາໃສ່ prompt ແລ້ວໃຫ້ LLM ຕອບໂດຍອີງໃສ່ context ເທົ່ານັ້ນ
 * ພ້ອມອ້າງອີງແຫຼ່ງ ແລະ ຕອບ "ບໍ່ພົບຂໍ້ມູນ" ເມື່ອ context ບໍ່ພໍ
 * ທຽບກັບ project: src/app/api/chat_rag_tool_calling/graph/nodes-generation.ts → generateAnswer()
 *
 * ຮັນ: pnpm lab:4 "ຄຳຖາມຂອງທ່ານ"
 */
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { buildVectorStore, getLLM } from './lib.ts';

const question = process.argv[2] || 'ເຮັດວຽກມາ 6 ປີແລ້ວ ລາພັກປະຈຳປີໄດ້ຈັກມື້?';

// 1) Retrieve
const store = await buildVectorStore();
const results = await store.similaritySearchWithScore(question, 4);

// 2) Augment — ໃສ່ໝາຍເລກ [1], [2] ເພື່ອໃຫ້ LLM ອ້າງອີງໄດ້
const context = results
    .map(([doc], i) => `[${i + 1}] (ແຫຼ່ງ: ${doc.metadata.source})\n${doc.pageContent}`)
    .join('\n\n');

// 🧪 TODO(ແບບຝຶກຫັດ 4.1): ລຶບກົດຂໍ້ 1 ແລະ 2 ອອກ ແລ້ວຖາມຄຳຖາມທີ່ບໍ່ມີໃນເອກະສານ ເຊັ່ນ "ບໍລິສັດມີໂບນັດທ້າຍປີບໍ່?"
//                          ສັງເກດວ່າ LLM ເລີ່ມ "ແຕ່ງ" ຄຳຕອບ (hallucination) ບໍ່
const systemPrompt = `ທ່ານແມ່ນຜູ້ຊ່ວຍ HR ຂອງບໍລິສັດ ຕອບເປັນພາສາລາວ.

ກົດ:
1. ຕອບໂດຍອີງໃສ່ "ຂໍ້ມູນອ້າງອີງ" ຂ້າງລຸ່ມເທົ່ານັ້ນ ຫ້າມໃຊ້ຄວາມຮູ້ພາຍນອກ
2. ຖ້າຂໍ້ມູນອ້າງອີງບໍ່ພໍທີ່ຈະຕອບ ໃຫ້ຕອບວ່າ "ຂໍອະໄພ, ບໍ່ພົບຂໍ້ມູນນີ້ໃນເອກະສານ"
3. ທ້າຍຄຳຕອບ ໃຫ້ລະບຸໝາຍເລກແຫຼ່ງທີ່ໃຊ້ ເຊັ່ນ [1], [3]

ຂໍ້ມູນອ້າງອີງ:
${context}`;

// 3) Generate
const llm = getLLM();
console.log(`\n❓ ${question}\n`);
const stream = await llm.stream([new SystemMessage(systemPrompt), new HumanMessage(question)]);
for await (const chunk of stream) {
    process.stdout.write(chunk.text);
}

console.log('\n\n📚 ແຫຼ່ງທີ່ຄົ້ນເຈີ:');
results.forEach(([doc, score], i) => console.log(`   [${i + 1}] ${doc.metadata.source} (score ${score.toFixed(3)})`));
