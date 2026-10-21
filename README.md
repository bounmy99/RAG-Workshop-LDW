# Workshop: RAG ເບື້ອງຕົ້ນ ດ້ວຍ TypeScript + LangChain

> ຮຽນຮູ້ການສ້າງ chatbot ທີ່ຕອບຄຳຖາມຈາກເອກະສານຂອງອົງກອນ ໂດຍໃຊ້ project **AI KhamHu Chatbot** ([Langchang-chatbot](https://github.com/bounmy99/Langchang-chatbot)) ເປັນຕົວຢ່າງຈິງ

| | |
|---|---|
| **ຜູ້ຮຽນ** | ນັກພັດທະນາທີ່ຂຽນ JavaScript/TypeScript ໄດ້ ແຕ່ຍັງບໍ່ເຄີຍເຮັດ RAG |
| **ໄລຍະເວລາ** | ເຄິ່ງມື້ (~3.5 ຊົ່ວໂມງ) |
| **ຜົນທີ່ໄດ້** | ສ້າງ RAG pipeline ເອງໄດ້ຕັ້ງແຕ່ chunk → embed → search → generate ແລະ ອ່ານ RAG graph ຂອງ project ຈິງເຂົ້າໃຈ |

---

## ກຳນົດການ

| ເວລາ | ຫົວຂໍ້ | ຮູບແບບ |
|---|---|---|
| 0:00 – 0:30 | RAG ແມ່ນຫຍັງ? ເປັນຫຍັງຕ້ອງໃຊ້? + ພາບລວມ project | Slides |
| 0:30 – 0:50 | ຕິດຕັ້ງ + **Lab 1** Load & Chunk | Hands-on |
| 0:50 – 1:20 | **Lab 2** Embeddings & Cosine Similarity | Hands-on |
| 1:20 – 1:50 | **Lab 3** Vector Store & Similarity Search | Hands-on |
| 1:50 – 2:00 | ພັກ ☕ | |
| 2:00 – 2:30 | **Lab 4** RAG ຄົບວົງຈອນ + ກັນ hallucination | Hands-on |
| 2:30 – 3:10 | **Lab 5** Corrective RAG ດ້ວຍ LangGraph + ອ່ານ `workflow.ts` ຂອງ project | Hands-on + Code walkthrough |
| 3:10 – 3:30 | ຈາກ workshop ສູ່ production + ຖາມ-ຕອບ | ສົນທະນາ |

---

## 0. ການຕິດຕັ້ງ

ຕ້ອງການ:

- **Node.js 22.18+** (ແນະນຳ 24) — ຮັນໄຟລ໌ `.ts` ໄດ້ໂດຍກົງ ບໍ່ຕ້ອງ build
- **pnpm**
- **OpenRouter API key** ([openrouter.ai](https://openrouter.ai))

```bash
pnpm install
cp .env.example .env      # ແລ້ວໃສ່ OPENROUTER_API_KEY ຂອງທ່ານ
pnpm lab:1                # ທົດລອງຮັນ lab ທຳອິດ
```

> ⚠️ ຫ້າມ commit `.env` — ມັນຖືກ ignore ໄວ້ແລ້ວໃນ `.gitignore`

| ຄຳສັ່ງ | ໜ້າທີ່ |
|---|---|
| `pnpm lab:1` … `pnpm lab:5` | ຮັນ lab ແຕ່ລະບົດ (lab 3-5 ຮັບຄຳຖາມໄດ້ ເຊັ່ນ `pnpm lab:4 "ຄຳຖາມ"`) |
| `pnpm typecheck:labs` | ກວດ TypeScript ຂອງ lab |

> 💡 code ຂອງ project ຈິງທີ່ອ້າງເຖິງໃນຄູ່ມືນີ້ ຢູ່ໃນ repo [Langchang-chatbot](https://github.com/bounmy99/Langchang-chatbot) (branch `dev`)

### ໂຄງສ້າງໂຟນເດີ

```text
labs/
├── data/                  # ເອກະສານຕົວຢ່າງ (ບໍລິສັດສົມມຸດ "ຈຳປາ ດິຈິຕອນ")
│   ├── leave-policy.md    #   ນະໂຍບາຍການລາພັກ
│   ├── it-security.md     #   ລະບຽບຄວາມປອດໄພໄອທີ
│   └── benefits.md        #   ສະຫວັດດີການ
├── lib.ts                 # helper ກາງ: getLLM, getEmbeddings, loadDocuments, splitDocuments, buildVectorStore
├── 01-chunking.ts
├── 02-embeddings.ts
├── 03-vector-search.ts
├── 04-rag-chain.ts
└── 05-crag-graph.ts
```

> 💡 ຂໍ້ມູນໃນ `data/` ເປັນບໍລິສັດສົມມຸດ ເພື່ອໃຫ້ຮູ້ແນ່ນອນວ່າຄຳຕອບໃດ "ຖືກ" ແລະ ຄຳຕອບໃດ "ແຕ່ງຂຶ້ນ".
> ທຸກ lab ໃຊ້ vector store ໃນ memory — **ບໍ່ແຕະ Supabase/Pinecone ຂອງ production**.

---

## 1. RAG ແມ່ນຫຍັງ?

**RAG (Retrieval-Augmented Generation)** = ກ່ອນໃຫ້ LLM ຕອບ ໃຫ້ **ຄົ້ນຫາ** ເອກະສານທີ່ກ່ຽວຂ້ອງກ່ອນ ແລ້ວ **ແນບ** ເນື້ອຫານັ້ນເຂົ້າໄປໃນ prompt ເພື່ອໃຫ້ LLM **ຕອບ** ຈາກຂໍ້ມູນຈິງ.

ເປັນຫຍັງບໍ່ຖາມ LLM ໂດຍກົງ?

| ບັນຫາຂອງ LLM ລ້າໆ | RAG ແກ້ແນວໃດ |
|---|---|
| ບໍ່ຮູ້ຂໍ້ມູນພາຍໃນອົງກອນ (ລະບຽບ, ຄູ່ມື, ກົດໝາຍສະເພາະ) | ດຶງຈາກເອກະສານຂອງເຮົາເອງ |
| ຄວາມຮູ້ຢຸດຢູ່ທີ່ວັນ train | ອັບໂຫຼດເອກະສານໃໝ່ໄດ້ທັນທີ ບໍ່ຕ້ອງ train ໃໝ່ |
| ແຕ່ງຄຳຕອບ (hallucination) | ບັງຄັບໃຫ້ຕອບຈາກ context + ອ້າງອີງແຫຼ່ງ |
| fine-tune ລາຄາແພງ ແລະ ຊ້າ | ພຽງແຕ່ index ເອກະສານ |

### ສອງເສັ້ນທາງຂອງ RAG

```text
① Ingestion (ເຮັດຄັ້ງດຽວ ຕອນອັບໂຫຼດເອກະສານ)
   ເອກະສານ ─► Load ─► Clean ─► Chunk ─► Embed ─► ເກັບໃນ Vector DB

② Query (ທຸກຄັ້ງທີ່ຜູ້ໃຊ້ຖາມ)
   ຄຳຖາມ ─► Embed ─► ຄົ້ນຫາ top-k ─► ແນບເຂົ້າ prompt ─► LLM ─► ຄຳຕອບ + ແຫຼ່ງອ້າງອີງ
```

### ທຽບກັບ project ນີ້

| ຂັ້ນຕອນ | ໄຟລ໌ໃນ project | ໃນ workshop |
|---|---|---|
| Load + Clean + Chunk + Embed | [`src/app/api/document_loader_embeding_pgvector/text_csv_pdf_docx/route.ts`](https://github.com/bounmy99/Langchang-chatbot/blob/dev/src/app/api/document_loader_embeding_pgvector/text_csv_pdf_docx/route.ts), [`src/app/api/document_loader_embedding_pinecone/route.ts`](https://github.com/bounmy99/Langchang-chatbot/blob/dev/src/app/api/document_loader_embedding_pinecone/route.ts) | Lab 1, `lib.ts` |
| ຕັ້ງຄ່າ LLM / Embedding model | [`src/lib/llm-pool.ts`](https://github.com/bounmy99/Langchang-chatbot/blob/dev/src/lib/llm-pool.ts) | `lib.ts` |
| Vector store | [`src/lib/pinecone.ts`](https://github.com/bounmy99/Langchang-chatbot/blob/dev/src/lib/pinecone.ts), pgvector (`match_documents`) | `MemoryVectorStore` |
| Retrieve + Query expansion + Rerank | [`src/app/api/chat_rag_tool_calling/graph/retriever.ts`](https://github.com/bounmy99/Langchang-chatbot/blob/dev/src/app/api/chat_rag_tool_calling/graph/retriever.ts) | Lab 3 |
| Generate | [`.../graph/nodes-generation.ts`](https://github.com/bounmy99/Langchang-chatbot/blob/dev/src/app/api/chat_rag_tool_calling/graph/nodes-generation.ts) | Lab 4 |
| Grade / Transform (CRAG) | [`.../graph/nodes-retrieval.ts`](https://github.com/bounmy99/Langchang-chatbot/blob/dev/src/app/api/chat_rag_tool_calling/graph/nodes-retrieval.ts), [`.../graph/workflow.ts`](https://github.com/bounmy99/Langchang-chatbot/blob/dev/src/app/api/chat_rag_tool_calling/graph/workflow.ts) | Lab 5 |

---

## Lab 1 — Load & Chunk

```bash
pnpm lab:1
```

**ແນວຄິດ:** LLM ແລະ embedding model ຮັບຂໍ້ຄວາມໄດ້ຈຳກັດ ແລະ ຖ້າ vector ຕາງໜ້າເອກະສານທັງເຫຼັ້ມ ຄວາມໝາຍຈະ "ເຈືອຈາງ". ເຮົາຈຶ່ງແບ່ງເອກະສານເປັນ **chunk** ນ້ອຍໆ ທີ່ແຕ່ລະອັນເວົ້າເລື່ອງດຽວ.

- `chunkSize` — ຂະໜາດສູງສຸດຂອງ chunk (ຕົວອັກສອນ)
- `chunkOverlap` — ຈຳນວນຕົວອັກສອນທີ່ຊ້ຳກັນລະຫວ່າງ chunk ທີ່ຕິດກັນ ເພື່ອບໍ່ໃຫ້ປະໂຫຍກຖືກຕັດຂາດຄວາມໝາຍ
- `separators` — `RecursiveCharacterTextSplitter` ພະຍາຍາມຕັດທີ່ຕົວແຍກທຳອິດກ່ອນ (`\n## ` = ຫົວຂໍ້), ຖ້າຍັງໃຫຍ່ເກີນ ຈຶ່ງຕັດທີ່ `\n`, ແລ້ວ ` `

**ໃນ project ຈິງ:** ໃຊ້ `chunkSize: 1000, chunkOverlap: 200` ແລະມີຂັ້ນຕອນ clean ຂໍ້ຄວາມ PDF/DOCX ກ່ອນ (ລຶບຊ່ອງຫວ່າງທີ່ PDF ແຊກລະຫວ່າງຕົວອັກສອນ).

**ແບບຝຶກຫັດ**

- **1.1** ປ່ຽນ `CHUNK_SIZE` ເປັນ 100, 300, 1000 → ຈຳນວນ chunk ປ່ຽນແນວໃດ? chunk ໃດທີ່ "ອ່ານແລ້ວບໍ່ເຂົ້າໃຈ" ເມື່ອແຍກອອກມາດ່ຽວໆ?
- **1.2** ຕັ້ງ `CHUNK_OVERLAP = 0` ກັບ `CHUNK_SIZE = 100` → ມີປະໂຫຍກທີ່ຖືກຕັດກາງບໍ່?

> 💬 ຄຳຖາມສົນທະນາ: ເອກະສານກົດໝາຍທີ່ແບ່ງເປັນ "ມາດຕາ" ຄວນແບ່ງ chunk ແນວໃດ? (ຄຳໃບ້: project ມີ "article-aware strategy")

---

## Lab 2 — Embeddings & Cosine Similarity

```bash
pnpm lab:2
```

**ແນວຄິດ:** **Embedding** ແມ່ນການປ່ຽນຂໍ້ຄວາມເປັນ vector ຂອງຕົວເລກ (ທີ່ນີ້ 1536 ມິຕິ) ທີ່ຂໍ້ຄວາມ **ຄວາມໝາຍໃກ້ກັນ → vector ຊີ້ໄປທາງດຽວກັນ**. ເຮົາວັດຄວາມໃກ້ດ້ວຍ **cosine similarity** (1 = ຄືກັນ, 0 = ບໍ່ກ່ຽວ).

```text
cos(A, B) = (A · B) / (|A| × |B|)
```

ຜົນທີ່ຄາດໄວ້ (ຕົວເລກອາດຕ່າງເລັກນ້ອຍ):

```text
0.823 █████████████████████████ ພະນັກງານມີສິດລາພັກປະຈຳປີ 15 ວັນເຮັດວຽກ
0.788 ████████████████████████  ວັນພັກຜ່ອນປະຈຳປີຂອງພະນັກງານ
0.698 █████████████████████     Employees are entitled to 15 days of annual leave
0.611 ██████████████████        ຄ່າອາຫານທ່ຽງ 25,000 ກີບຕໍ່ວັນ
0.557 █████████████████         ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 12 ຕົວອັກສອນ
```

ສັງເກດ:

1. "ວັນພັກຜ່ອນ" ກັບ "ລາພັກ" ໃຊ້ຄຳຕ່າງກັນ ແຕ່ຄະແນນສູງ → ນີ້ຄື **semantic search** ບໍ່ແມ່ນການຈັບຄູ່ຄຳ
2. ປະໂຫຍກພາສາອັງກິດກໍຍັງໃກ້ → embedding model ນີ້ເປັນ multilingual
3. ປະໂຫຍກທີ່ບໍ່ກ່ຽວກໍຍັງໄດ້ ~0.55 — **ຄະແນນບໍ່ເຄີຍເປັນ 0** ນີ້ສຳຄັນຫຼາຍໃນ Lab 3-4

**ກົດເຫຼັກ (ຈາກ `src/lib/llm-pool.ts`):** embedding model ແລະ dimensions **ຕ້ອງຄືກັນ** ທັງຕອນ index ແລະ ຕອນ query. ຖ້າປ່ຽນ model ຕ້ອງ re-index ເອກະສານທັງໝົດ ບໍ່ດັ່ງນັ້ນການຄົ້ນຫາຈະຜິດແບບບໍ່ມີ error ໃຫ້ເຫັນ.

**ແບບຝຶກຫັດ**

- **2.1** ເພີ່ມປະໂຫຍກຂອງທ່ານເອງ ເຊັ່ນ ຄຳສະແລງ, ຄຳຂຽນຜິດ, ຫຼື ພາສາໄທ → ຄະແນນເປັນແນວໃດ?
- **2.2** ລອງ query ທີ່ສັ້ນຫຼາຍ ເຊັ່ນ "ລາ" → ຄະແນນສູງສຸດຫຼຸດລົງບໍ່? ເປັນຫຍັງ?

---

## Lab 3 — Vector Store & Similarity Search

```bash
pnpm lab:3 "ລືມລະຫັດຜ່ານ ຕ້ອງປ່ຽນເລື້ອຍປານໃດ?"
```

**ແນວຄິດ:** **Vector store** ເກັບ `(vector, ເນື້ອຫາ chunk, metadata)` ແລະ ຄົ້ນຫາ **top-k** chunk ທີ່ໃກ້ກັບ vector ຂອງຄຳຖາມທີ່ສຸດ.

| | Workshop | Project ຈິງ |
|---|---|---|
| Vector store | `MemoryVectorStore` (ໃນ RAM, ຫາຍເມື່ອປິດ) | Pinecone ແລະ Supabase pgvector |
| ການຄົ້ນ | `similaritySearchWithScore(query, k)` | ຄືກັນ + metadata filter (ກະຊວງ/ບໍລິການ) |
| ຕັດຄະແນນຕ່ຳ | `MIN_SCORE` | `searchThreshold` ໃນ `retriever.ts` |

**pgvector ໃນ project** ໃຊ້ SQL function ຊື່ `match_documents` ທີ່ Supabase ເອີ້ນຜ່ານ `SupabaseVectorStore({ queryName: 'match_documents' })`. ພາຍໃນມັນແມ່ນ query ປະມານນີ້:

```sql
select id, content, metadata, 1 - (embedding <=> query_embedding) as similarity
from documents
order by embedding <=> query_embedding   -- <=> = cosine distance
limit match_count;
```

**ແບບຝຶກຫັດ**

- **3.1** ລອງ `TOP_K = 1` ແລະ `TOP_K = 8` → chunk ທີ່ບໍ່ກ່ຽວເລີ່ມເຂົ້າມາຕັ້ງແຕ່ອັນດັບໃດ?
- **3.2** ຖາມ "ບໍລິສັດມີໂບນັດທ້າຍປີບໍ່?" (ບໍ່ມີໃນເອກະສານ) → ຄະແນນສູງສຸດແມ່ນເທົ່າໃດ? ລອງຕັ້ງ `MIN_SCORE` ໃຫ້ຕັດອອກໄດ້ ໂດຍບໍ່ຕັດຄຳຖາມດີໆອອກ
- **3.3** ຖາມ "WFH ໄດ້ຈັກມື້?" → ຕົວຫຍໍ້ພາສາອັງກິດຫາເຈີບໍ່?

---

## Lab 4 — RAG ຄົບວົງຈອນ

```bash
pnpm lab:4 "ເຮັດວຽກມາ 6 ປີແລ້ວ ລາພັກປະຈຳປີໄດ້ຈັກມື້?"
```

**ແນວຄິດ:** ສາມຂັ້ນ **R-A-G**

1. **Retrieve** — ຄົ້ນ top-k chunk (Lab 3)
2. **Augment** — ໃສ່ chunk ເຂົ້າ system prompt ພ້ອມເລກ `[1]`, `[2]` ໃຫ້ອ້າງອີງໄດ້
3. **Generate** — LLM ຕອບ ໂດຍມີກົດ: ຕອບຈາກ context ເທົ່ານັ້ນ, ບໍ່ພົບໃຫ້ບອກວ່າບໍ່ພົບ, ລະບຸແຫຼ່ງ

ຜົນທີ່ຄາດໄວ້:

```text
ສຳລັບພະນັກງານທີ່ເຮັດວຽກຄົບ 5 ປີຂຶ້ນໄປ ຈະໄດ້ຮັບວັນລາພັກປະຈຳປີເພີ່ມອີກ 3 ວັນ, ລວມເປັນ 18 ວັນ. [1]
```

ສັງເກດວ່າ LLM **ໃຫ້ເຫດຜົນ** ໄດ້ (6 ປີ ≥ 5 ປີ → 18 ວັນ) ເຖິງວ່າເອກະສານບໍ່ໄດ້ຂຽນ "6 ປີ" ໄວ້.

**ແບບຝຶກຫັດ**

- **4.1** ຖາມ "ບໍລິສັດມີໂບນັດທ້າຍປີບໍ່?" → ຄວນໄດ້ "ບໍ່ພົບຂໍ້ມູນ". ຈາກນັ້ນ **ລຶບກົດຂໍ້ 1 ແລະ 2** ອອກຈາກ prompt ແລ້ວຖາມໃໝ່ → LLM ເລີ່ມແຕ່ງບໍ່?
- **4.2** ຖາມຄຳຖາມທີ່ຕ້ອງໃຊ້ຂໍ້ມູນ 2 ເອກະສານ ເຊັ່ນ "ພະນັກງານໃໝ່ທີ່ຍັງບໍ່ຜ່ານທົດລອງວຽກ WFH ໄດ້ບໍ່ ແລະ ລາພັກໄດ້ບໍ່?"
- **4.3** ປ່ຽນ prompt ໃຫ້ຕອບເປັນ bullet ແລະ ສະແດງວັນທີ/ຕົວເລກເປັນໂຕໜາ

> 💬 ຄຳຖາມສົນທະນາ: ເປີດ `nodes-generation.ts` ຂອງ project — prompt ຈິງມີກົດຫຍັງເພີ່ມອີກ? ເປັນຫຍັງຕ້ອງມີ `[[NO_INTERNAL_ANSWER]]`?

---

## Lab 5 — Corrective RAG (CRAG) ດ້ວຍ LangGraph

```bash
pnpm lab:5 "ລູກຂ້ອຍອາຍຸ 10 ປີ ເຂົ້າປະກັນສຸຂະພາບນຳໄດ້ບໍ່?"
pnpm lab:5 "ບໍລິສັດມີໂບນັດທ້າຍປີບໍ່?"
```

**ແນວຄິດ:** RAG ທຳມະດາ "ເຊື່ອ" ຜົນການຄົ້ນຫາສະເໝີ. **CRAG** ເພີ່ມຂັ້ນຕອນ **ກວດ (grade)** — ຖ້າເອກະສານບໍ່ກ່ຽວ ໃຫ້ **ຂຽນຄຳຄົ້ນໃໝ່ (transform)** ແລ້ວຄົ້ນອີກ ສູງສຸດ N ຮອບ.

```text
START → retrieve → grade ─(ກ່ຽວ)──────────────→ generate → END
           ↑          └─(ບໍ່ກ່ຽວ)→ transform ─┘
           └────────────────────────┘ (ວົນກັບ ສູງສຸດ MAX_RETRIES ຮອບ)
```

**LangGraph** ຊ່ວຍໃຫ້ຂຽນ flow ແບບນີ້ເປັນ graph:

- `Annotation.Root({...})` — ກຳນົດ **state** ທີ່ທຸກ node ແບ່ງປັນກັນ
- `addNode(name, fn)` — node ແມ່ນ function ທີ່ຮັບ state ແລ້ວ return ສ່ວນທີ່ຈະອັບເດດ
- `addEdge(a, b)` — ໄປຕໍ່ແບບຕາຍຕົວ
- `addConditionalEdges(a, fn, map)` — ເລືອກທາງຕາມ state

ຜົນຂອງຄຳຖາມນອກເລື່ອງ:

```text
🔍 [retrieve] "ບໍລິສັດມີໂບນັດທ້າຍປີບໍ່?" → leave-policy.md, leave-policy.md, benefits.md
⚖️  [grade] relevant = false
✏️  [transform] ຄຳຄົ້ນໃໝ່: "ນະໂຍບາຍໂບນັດທ້າຍປີ"
🔍 [retrieve] ...
⚖️  [grade] relevant = false
...
💬 ຂໍອະໄພ, ບໍ່ພົບຂໍ້ມູນນີ້ໃນເອກະສານ.
```

### Code walkthrough: graph ຂອງ project ຈິງ

ເປີດ [`src/app/api/chat_rag_tool_calling/graph/workflow.ts`](https://github.com/bounmy99/Langchang-chatbot/blob/dev/src/app/api/chat_rag_tool_calling/graph/workflow.ts) ທຽບກັບ Lab 5:

```text
START → validate ─(ບໍ່ຜ່ານ)→ generate (ຕອບປະຕິເສດຢ່າງສຸພາບ)
           └─(ຜ່ານ)→ contextualize → router ─┬→ generate      (ທັກທາຍ / ບໍ່ຕ້ອງຄົ້ນ)
                                            ├→ ministries ──→ generate
                                            ├→ services ────→ generate
                                            └→ retrieve → grade ─┬→ generate → END
                                                    ↑            ├→ transform ─┘(ວົນ)
                                                    └────────────┘
                                                                 └→ grounding → END (ຄົບ max retries → ຄົ້ນເວັບ)
```

| Node ໃນ project | ໜ້າທີ່ | ມີໃນ Lab 5 ບໍ່? |
|---|---|---|
| `validate` | ກັນຄຳຖາມອັນຕະລາຍ / jailbreak / ນອກເລື່ອງ | ❌ (ແບບຝຶກຫັດ 5.2) |
| `contextualize` | ຂຽນຄຳຖາມຕໍ່ເນື່ອງ ("ຂໍເອກະສານ") ເປັນຄຳຖາມສົມບູນຈາກປະຫວັດແຊັດ | ❌ |
| `router` | ຕັດສິນວ່າຕ້ອງຄົ້ນເອກະສານ, ດຶງລາຍຊື່ກະຊວງ, ຫຼື ຕອບເລີຍ | ❌ |
| `retrieve` | query expansion → ຄົ້ນ Pinecone → rerank ດ້ວຍ LLM | ✅ (ແບບງ່າຍ) |
| `grade` | ກວດຄວາມກ່ຽວຂ້ອງ + fast-path ຖ້າ score ≥ 0.72 | ✅ |
| `transform` | ຂຽນຄຳຄົ້ນໃໝ່ | ✅ |
| `generate` | ຕອບຈາກ context | ✅ |
| `grounding` | fallback ໄປຄົ້ນຫາເວັບ | ❌ |

**ແບບຝຶກຫັດ**

- **5.1** ຖາມອ້ອມໆ ເຊັ່ນ "ຖ້າໂນດບຸກຫາຍ ຕ້ອງເຮັດແນວໃດ?" → ມີ transform ບໍ່? ຄຳຄົ້ນໃໝ່ດີກວ່າເກົ່າບໍ່?
- **5.2** ເພີ່ມ node `validate` ກ່ອນ `retrieve` ທີ່ປະຕິເສດຄຳຖາມນອກເລື່ອງ HR/IT (ເຊັ່ນ "ສອນເຮັດເຂົ້າໜົມແດ່") ໂດຍໄປ `END` ທັນທີ
- **5.3** ສັງເກດວ່າ grade ໃນ Lab 5 ເອີ້ນ LLM **ທຸກຄັ້ງ**. ເພີ່ມ fast-path ແບບ project: ຖ້າ score ສູງສຸດ ≥ 0.75 ໃຫ້ຖືວ່າກ່ຽວເລີຍ (ຄຳໃບ້: ໃຊ້ `similaritySearchWithScore` ແລະ ເກັບ score ໃນ state)

---

## 6. ຈາກ Workshop ສູ່ Production

ສິ່ງທີ່ project ຈິງເຮັດເພີ່ມ ແລະ ເຫດຜົນ:

| ເຕັກນິກ | ຢູ່ໃສ | ແກ້ບັນຫາຫຍັງ |
|---|---|---|
| **Query expansion** — ໃຫ້ LLM ສ້າງຄຳຄົ້ນສຳຮອງ 3 ແບບ | `retriever.ts` | ຄຳຖາມຜູ້ໃຊ້ສັ້ນ/ກຳກວມ ຄົ້ນຫາບໍ່ເຈີ |
| **Rerank ດ້ວຍ LLM** — ດຶງ 20-100 chunk ແລ້ວໃຫ້ LLM ໃຫ້ຄະແນນ 0-10 | `retriever.ts` | vector score ບໍ່ສະທ້ອນຄວາມກ່ຽວຂ້ອງແທ້ສະເໝີ |
| **Metadata filter** — ກອງຕາມກະຊວງ/ບໍລິການ | `retriever.ts` | ຄົ້ນເຈີເອກະສານຂອງໜ່ວຍງານອື່ນ |
| **Contextualize** — ຂຽນຄຳຖາມໃໝ່ຈາກປະຫວັດແຊັດ | `nodes-context.ts` | "ແລ້ວອັນນັ້ນເດ?" ຄົ້ນຫາບໍ່ໄດ້ |
| **Cache** — query cache + embedding cache | `query-cache`, `createCachedEmbeddings` | ຄ່າໃຊ້ຈ່າຍ ແລະ ຄວາມໄວ |
| **Input validation** | `nodes-validation.ts` | prompt injection, ຄຳຖາມອັນຕະລາຍ |
| **Web grounding** | `generateAnswer` / `grounding` | ຂໍ້ມູນພາຍໃນບໍ່ພໍ |
| **Streaming** | `route.ts` | ຜູ້ໃຊ້ບໍ່ຕ້ອງລໍຖ້າຄຳຕອບທັງໝົດ |

### ບົດຮຽນທີ່ project ຈ່າຍຄ່າຮຽນມາແລ້ວ (ອ່ານ comment ໃນ `src/lib/llm-pool.ts`)

1. **Embedding model ຕ້ອງຄືກັນທຸກບ່ອນ** — ຈຶ່ງມີ `getEmbeddings()` ບ່ອນດຽວ ຫ້າມ `new OpenAIEmbeddings()` ບ່ອນອື່ນ
2. **`encodingFormat: 'float'`** — Google embedding ຜ່ານ OpenRouter ປະຕິເສດ base64 ດ້ວຍ HTTP 400
3. **ຕ້ອງລະບຸ `maxTokens` ສະເໝີ** — ບໍ່ດັ່ງນັ້ນ OpenRouter ຈອງ credit ເທົ່າ max output ຂອງ model ແລ້ວຕອບ HTTP 402
4. **Cache embedding ສຳລັບ query ເທົ່ານັ້ນ** ບໍ່ແມ່ນຕອນ ingest
5. **Router ເດົາຜິດ ຢ່າຖິ້ມຄຳຖາມ** — ຖ້າ filter ທີ່ເດົາບໍ່ເຈີໄຟລ໌ ໃຫ້ຄົ້ນທົ່ວແທນ (`filterIsGuess` ໃນ `retriever.ts`)

---

## ຄຳໃບ້ແບບຝຶກຫັດ

<details>
<summary>3.2 — ຕັ້ງ MIN_SCORE ເທົ່າໃດດີ?</summary>

ຈາກການທົດລອງ ຄຳຖາມນອກເລື່ອງໄດ້ສູງສຸດ ~0.60-0.62 ແລະ ຄຳຖາມທີ່ກ່ຽວໄດ້ ~0.75-0.80. ຄ່າປະມານ 0.68-0.70 ແຍກໄດ້ດີສຳລັບຂໍ້ມູນຊຸດນີ້ — ແຕ່ **ຄ່າທີ່ເໝາະສົມຂຶ້ນກັບ model ແລະ ຂໍ້ມູນ** ຕ້ອງວັດຈາກຊຸດຄຳຖາມທົດສອບຂອງຕົນເອງສະເໝີ. ນີ້ຄືເຫດຜົນທີ່ project ໃຊ້ threshold ຕ່ຳ ແລ້ວໃຫ້ grade/rerank ດ້ວຍ LLM ຕັດສິນແທນ.
</details>

<details>
<summary>5.2 — node validate</summary>

```ts
const RAGState = Annotation.Root({
    // ...state ເດີມ
    inputValid: Annotation<boolean>,
});

async function validate(state: State): Promise<Partial<State>> {
    const response = await llm.invoke([
        new HumanMessage(`ຄຳຖາມນີ້ກ່ຽວກັບ HR, ໄອທີ ຫຼື ສະຫວັດດີການພະນັກງານບໍ່? "${state.question}"
ຕອບພຽງ yes ຫຼື no`),
    ]);
    const inputValid = response.text.trim().toLowerCase().startsWith('yes');
    return inputValid
        ? { inputValid }
        : { inputValid, answer: 'ຂໍອະໄພ, ຂ້ອຍຕອບໄດ້ສະເພາະຄຳຖາມກ່ຽວກັບລະບຽບ ແລະ ສະຫວັດດີການຂອງບໍລິສັດ' };
}

// ...
    .addNode('validate', validate)
    .addEdge(START, 'validate')
    .addConditionalEdges('validate', (s) => (s.inputValid ? 'retrieve' : END), { retrieve: 'retrieve', [END]: END })
```

ຢ່າລືມລຶບ `.addEdge(START, 'retrieve')` ເດີມອອກ ແລະ ລະວັງວ່າ `result.documents` ຈະເປັນ `undefined` ເມື່ອບໍ່ຜ່ານ validate.
</details>

<details>
<summary>5.3 — grade fast-path</summary>

ໃນ `retrieve` ໃຊ້ `store.similaritySearchWithScore(query, 3)` ແລ້ວເກັບ `topScore` ໃນ state. ໃນ `grade` ເພີ່ມກ່ອນເອີ້ນ LLM:

```ts
if (state.topScore >= 0.75) return { documentsRelevant: true };
```

ທຽບກັບ `HIGH_CONFIDENCE_THRESHOLD = 0.72` ໃນ `nodes-retrieval.ts` ຂອງ project.
</details>

---

## ຄຳສັບ

| ຄຳສັບ | ຄວາມໝາຍ |
|---|---|
| **LLM** | Large Language Model — model ທີ່ສ້າງຂໍ້ຄວາມ ເຊັ່ນ Gemini, GPT, Claude |
| **Chunk** | ສ່ວນນ້ອຍຂອງເອກະສານທີ່ຖືກແບ່ງອອກມາ |
| **Embedding** | vector ຕົວເລກທີ່ຕາງໜ້າຄວາມໝາຍຂອງຂໍ້ຄວາມ |
| **Vector store / Vector DB** | ຖານຂໍ້ມູນທີ່ຄົ້ນຫາດ້ວຍຄວາມໃກ້ຂອງ vector (Pinecone, pgvector) |
| **Cosine similarity** | ຄ່າວັດຄວາມໃກ້ຂອງ 2 vector (0-1) |
| **Top-k** | ຈຳນວນ chunk ທີ່ໃກ້ທີ່ສຸດ k ອັນທີ່ດຶງມາ |
| **Context** | ເນື້ອຫາ chunk ທີ່ແນບເຂົ້າ prompt |
| **Hallucination** | LLM ແຕ່ງຄຳຕອບທີ່ບໍ່ມີໃນຂໍ້ມູນ |
| **Rerank** | ຈັດອັນດັບຜົນການຄົ້ນຫາໃໝ່ດ້ວຍ model ທີ່ແມ່ນຍຳກວ່າ |
| **CRAG** | Corrective RAG — RAG ທີ່ກວດ ແລະ ແກ້ຜົນການຄົ້ນຫາເອງ |
| **Grounding** | ການອີງຄຳຕອບໃສ່ແຫຼ່ງຂໍ້ມູນທີ່ກວດສອບໄດ້ |
