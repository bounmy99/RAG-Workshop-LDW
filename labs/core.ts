/**
 * Core ຂອງ workshop — ໃຊ້ຮ່ວມກັນລະຫວ່າງ CLI labs (labs/*.ts) ແລະ ໜ້າແຊັດ (app/)
 *
 * ຕັ້ງຄ່າ LLM ແລະ Embeddings ແບບດຽວກັບ src/lib/llm-pool.ts ຂອງ repo Langchang-chatbot
 * (ໃຊ້ OpenRouter ຜ່ານ OpenAI-compatible API).
 *
 * ⚠️ ໄຟລ໌ນີ້ຕ້ອງບໍ່ມີ side effect ຕອນ import (ເຊັ່ນ process.exit) ເພາະ Next.js server import ມັນນຳ
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory';

const OPENROUTER_BASE_URL = process.env.OPENROUTER_API_BASE || 'https://openrouter.ai/api/v1';

export const CHAT_MODEL = process.env.OPENROUTER_MODEL_NAME || 'google/gemini-2.5-flash';

// ⚠️ model ແລະ dimensions ຕ້ອງກົງກັນທັງຕອນ index ແລະ ຕອນ query
// ບໍ່ດັ່ງນັ້ນ vector ຈະຢູ່ຄົນລະ space ແລ້ວການຄົ້ນຫາຈະຜິດແບບງຽບໆ
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL_NAME || 'google/gemini-embedding-001';
export const EMBEDDING_DIMENSIONS = Number(process.env.EMBEDDING_DIMENSIONS) || 1536;

export const DEFAULT_CHUNK_SIZE = 300;
export const DEFAULT_CHUNK_OVERLAP = 50;

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

/**
 * ໂຫຼດທຸກໄຟລ໌ .md ໃນ labs/data/ ເປັນ Document (1 ໄຟລ໌ = 1 Document)
 *
 * path ອີງຈາກ root ຂອງ repo (pnpm lab:N ແລະ next dev ຮັນຈາກ root) ແລະ ຂຽນໃຫ້ຄົງທີ່
 * ເພື່ອໃຫ້ Next.js trace ສະເພາະໂຟນເດີ data ບໍ່ແມ່ນທັງ project
 */
export async function loadDocuments(): Promise<Document[]> {
    const files = (await readdir(path.join(process.cwd(), 'labs', 'data'))).filter((f) => f.endsWith('.md')).sort();
    return Promise.all(
        files.map(async (file) => new Document({
            pageContent: await readFile(path.join(process.cwd(), 'labs', 'data', file), 'utf8'),
            metadata: { source: file },
        })),
    );
}

/** ແບ່ງເອກະສານເປັນ chunk — project ຈິງໃຊ້ chunkSize 1000 / overlap 200 */
export async function splitDocuments(
    docs: Document[],
    chunkSize = DEFAULT_CHUNK_SIZE,
    chunkOverlap = DEFAULT_CHUNK_OVERLAP,
): Promise<Document[]> {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
        // ແບ່ງຕາມຫົວຂໍ້ markdown ກ່ອນ ແລ້ວຈຶ່ງແບ່ງຕາມແຖວ
        separators: ['\n## ', '\n', ' ', ''],
    });
    return splitter.splitDocuments(docs);
}

/** ສ້າງ vector store ໃນ memory ຈາກໂຟນເດີ data/ (ແທນ Pinecone/pgvector ໃນ project ຈິງ) */
export async function buildVectorStore(
    chunkSize = DEFAULT_CHUNK_SIZE,
    chunkOverlap = DEFAULT_CHUNK_OVERLAP,
): Promise<MemoryVectorStore> {
    const chunks = await splitDocuments(await loadDocuments(), chunkSize, chunkOverlap);
    console.log(`📦 Indexing ${chunks.length} chunks ດ້ວຍ ${EMBEDDING_MODEL} ...`);
    return MemoryVectorStore.fromDocuments(chunks, getEmbeddings());
}

export function cosineSimilarity(a: number[], b: number[]): number {
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

/** ຕັດຂໍ້ຄວາມໃຫ້ສັ້ນ ແລະ ເປັນແຖວດຽວ ສຳລັບພິມໃນ console */
export function preview(text: string, max = 80): string {
    const flat = text.replace(/\s+/g, ' ').trim();
    return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}
