/**
 * Lab 1 — Load & Chunk
 *
 * ເປົ້າໝາຍ: ເຂົ້າໃຈວ່າເປັນຫຍັງຕ້ອງແບ່ງເອກະສານເປັນ chunk ແລະ chunkSize/overlap ມີຜົນແນວໃດ
 * ທຽບກັບ project: src/app/api/document_loader_embeding_pgvector/text_csv_pdf_docx/route.ts
 *
 * ຮັນ: pnpm lab:1
 */
import { loadDocuments, splitDocuments, preview } from './lib.ts';

const docs = await loadDocuments();
console.log(`📄 ໂຫຼດ ${docs.length} ເອກະສານ:`);
for (const doc of docs) {
    console.log(`   - ${doc.metadata.source} (${doc.pageContent.length} ຕົວອັກສອນ)`);
}

// 🧪 TODO(ແບບຝຶກຫັດ 1.1): ລອງປ່ຽນ chunkSize ເປັນ 100, 300, 1000 ແລ້ວສັງເກດຈຳນວນ chunk
// 🧪 TODO(ແບບຝຶກຫັດ 1.2): ລອງ chunkOverlap = 0 ແລ້ວເບິ່ງວ່າປະໂຫຍກຖືກຕັດກາງບໍ່
const CHUNK_SIZE = 300;
const CHUNK_OVERLAP = 50;

const chunks = await splitDocuments(docs, CHUNK_SIZE, CHUNK_OVERLAP);
console.log(`\n✂️  chunkSize=${CHUNK_SIZE}, overlap=${CHUNK_OVERLAP} → ${chunks.length} chunks\n`);

chunks.forEach((chunk, i) => {
    console.log(`#${i + 1} [${chunk.metadata.source}] (${chunk.pageContent.length} ຕົວ)`);
    console.log(`   ${preview(chunk.pageContent, 120)}`);
});
