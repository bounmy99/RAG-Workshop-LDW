/**
 * Helper ກາງສຳລັບທຸກ lab
 *
 * ຕັ້ງຄ່າ LLM ແລະ Embeddings ແບບດຽວກັບ src/lib/llm-pool.ts ຂອງ repo Langchang-chatbot
 * (ໃຊ້ OpenRouter ຜ່ານ OpenAI-compatible API) ແຕ່ຂຽນແຍກອອກມາ ເພື່ອໃຫ້ຮັນດ້ວຍ
 * `node` ໄດ້ໂດຍກົງ ໂດຍບໍ່ຕ້ອງເປີດ Next.js server.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';

const OPENROUTER_BASE_URL = process.env.OPENROUTER_API_BASE;

export const CHAT_MODEL = process.env.OPENROUTER_MODEL_NAME;

// ⚠️ model ແລະ dimensions ຕ້ອງກົງກັນທັງຕອນ index ແລະ ຕອນ query
// ບໍ່ດັ່ງນັ້ນ vector ຈະຢູ່ຄົນລະ space ແລ້ວການຄົ້ນຫາຈະຜິດແບບງຽບໆ
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL_NAME;
export const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS);

if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ ບໍ່ພົບ OPENROUTER_API_KEY — ຮັນດ້ວຍ: cp .env.example .env ແລ້ວໃສ່ key, ຈາກນັ້ນ pnpm lab:1');
    process.exit(1);
}

export function getLLM(temperature = 0): ChatOpenAI {
    return new ChatOpenAI({
        model: CHAT_MODEL,
        apiKey: process.env.OPENROUTER_API_KEY,
        temperature,
        // ຕ້ອງລະບຸສະເໝີ ບໍ່ດັ່ງນັ້ນ OpenRouter ຈະຈອງ credit ເທົ່າ max output ຂອງ model
        maxTokens: 2048,
        configuration: { baseURL: OPENROUTER_BASE_URL },
    });
}

export function getEmbeddings(): OpenAIEmbeddings {
    return new OpenAIEmbeddings({
        model: EMBEDDING_MODEL,
        dimensions: EMBEDDING_DIMENSIONS,
        apiKey: process.env.OPENROUTER_API_KEY,
        // Google embedding ຜ່ານ OpenRouter ປະຕິເສດ base64 → ບັງຄັບເປັນ float
        encodingFormat: 'float',
        configuration: { baseURL: OPENROUTER_BASE_URL },
    });
}

/** ໂຫຼດທຸກໄຟລ໌ .md ໃນໂຟນເດີ data/ ເປັນ Document (1 ໄຟລ໌ = 1 Document) */
export async function loadDocuments(dir = path.join(import.meta.dirname, 'data')): Promise<Document[]> {
    const files = (await readdir(dir)).filter((f) => f.endsWith('.md'));
    return Promise.all(
        files.map(async (file) => new Document({
            pageContent: await readFile(path.join(dir, file), 'utf8'),
            metadata: { source: file },
        })),
    );
}

/** ແບ່ງເອກະສານເປັນ chunk — project ຈິງໃຊ້ chunkSize 1000 / overlap 200 */
export async function splitDocuments(docs: Document[], chunkSize = 300, chunkOverlap = 50): Promise<Document[]> {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
        // ແບ່ງຕາມຫົວຂໍ້ markdown ກ່ອນ ແລ້ວຈຶ່ງແບ່ງຕາມແຖວ
        separators: ['\n## ', '\n', ' ', ''],
    });
    return splitter.splitDocuments(docs);
}

/** ສ້າງ vector store ໃນ memory ຈາກໂຟນເດີ data/ (ແທນ Pinecone/pgvector ໃນ project ຈິງ) */
export async function buildVectorStore(): Promise<MemoryVectorStore> {
    const chunks = await splitDocuments(await loadDocuments());
    console.log(`📦 Indexing ${chunks.length} chunks ດ້ວຍ ${EMBEDDING_MODEL} ...`);
    return MemoryVectorStore.fromDocuments(chunks, getEmbeddings());
}

/** ຕັດຂໍ້ຄວາມໃຫ້ສັ້ນ ແລະ ເປັນແຖວດຽວ ສຳລັບພິມໃນ console */
export function preview(text: string, max = 80): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}
