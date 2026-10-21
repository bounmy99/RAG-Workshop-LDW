# Workshop: RAG ເບື້ອງຕົ້ນ ດ້ວຍ TypeScript + LangChain


| | |
|---|---|
| **ຜູ້ຮຽນ** | ນັກພັດທະນາທີ່ຂຽນ JavaScript/TypeScript ໄດ້ ແຕ່ຍັງບໍ່ເຄີຍເຮັດ RAG |
| **ໄລຍະເວລາ** | 1 ຊົ່ວໂມງ |
| **ຮູບແບບ** | Live demo ຜ່ານໜ້າແຊັດ (`pnpm dev`) — ຜູ້ຮຽນລອງຕາມໄດ້ ແລະ ເຮັດແບບຝຶກຫັດ CLI ຕໍ່ເອງຫຼັງ workshop |
| **ຜົນທີ່ໄດ້** | ສ້າງ RAG pipeline ເອງໄດ້ຕັ້ງແຕ່ chunk → embed → search → generate ແລະ ອ່ານ RAG graph ຂອງ project ຈິງເຂົ້າໃຈ |

---

## ກຳນົດການ

| ເວລາ | ຫົວຂໍ້ | ຮູບແບບ | ແບບຝຶກຫັດໃນຫ້ອງ |
|---|---|---|---|
| 0:00 – 0:08 | RAG ແມ່ນຫຍັງ? ເປັນຫຍັງຕ້ອງໃຊ້? + ສອງເສັ້ນທາງຂອງ RAG | Slides | — |
| 0:08 – 0:15 | **Lab 1** Load & Chunk | Demo | 1.2 (overlap 0 vs 50) |
| 0:15 – 0:23 | **Lab 2** Embeddings | Demo | 2.2 (query “ລາ”) |
| 0:23 – 0:33 | **Lab 3** Vector Search + “score ບໍ່ເຄີຍເປັນ 0” | Demo | 3.2 (ຄຳຖາມໂບນັດ) |
| 0:33 – 0:43 | **Lab 4** RAG ຄົບວົງຈອນ | Demo | 4.1 (ປິດກົດກັນ hallucination) |
| 0:43 – 0:53 | **Lab 5** CRAG ດ້ວຍ LangGraph + graph ຂອງ project ຈິງ | Demo + Code | 5.1 (ຖາມອ້ອມໆ) |
| 0:53 – 1:00 | ສູ່ production + ຖາມ-ຕອບ | ສົນທະນາ | — |

> ⏱ ເພື່ອໃຫ້ທັນ 1 ຊົ່ວໂມງ:
> - **ກ່ອນ workshop** ໃຫ້ຜູ້ຮຽນ `pnpm install` ແລະ ຕັ້ງ `.env` ໃຫ້ຮຽບຮ້ອຍ (ເບິ່ງຫົວຂໍ້ 0) — ຢ່າເສຍເວລາຕິດຕັ້ງໃນຫ້ອງ
> - **ກ່ອນເລີ່ມ** ຜູ້ສອນເປີດ `pnpm dev` ແລະ ຖາມຄຳຖາມໃນ Lab 3 ໄວ້ 1 ຄັ້ງ ເພື່ອໃຫ້ vector store ຖືກ index ແລ້ວ (demo ຈະບໍ່ຊ້າ)
> - ແບບຝຶກຫັດທີ່ບໍ່ໄດ້ຢູ່ໃນຕາຕະລາງ ແລະ CLI lab (`pnpm lab:N`) ເປັນ **ການບ້ານ** ຫຼັງ workshop

---

## 0. ການຕິດຕັ້ງ

ຕ້ອງການ:

- **Node.js 22.18+** (ແນະນຳ 24) — ຮັນໄຟລ໌ `.ts` ໄດ້ໂດຍກົງ ບໍ່ຕ້ອງ build
- **pnpm**
- **OpenRouter API key** ([openrouter.ai](https://openrouter.ai))

```bash
pnpm install
pnpm lab:1                # Lab 1 ບໍ່ຕ້ອງໃຊ້ key — ເລີ່ມໄດ້ເລີຍ
cp .env.example .env      # ແລ້ວໃສ່ OPENROUTER_API_KEY ຂອງທ່ານ (ຕ້ອງໃຊ້ຕັ້ງແຕ່ Lab 2)
```

> 💡 Lab 1 (Load & Chunk) ເຮັດໃນເຄື່ອງທັງໝົດ ບໍ່ເອີ້ນ API ໃດໆ. ຕັ້ງແຕ່ Lab 2 ຈຶ່ງຕ້ອງໃຊ້ key ເພາະເລີ່ມສ້າງ embedding ແລະ ເອີ້ນ LLM ຜ່ານ OpenRouter.

> ⚠️ ຫ້າມ commit `.env` — ມັນຖືກ ignore ໄວ້ແລ້ວໃນ `.gitignore`

| ຄຳສັ່ງ | ໜ້າທີ່ |
|---|---|
| `pnpm lab:1` … `pnpm lab:5` | ຮັນ lab ແຕ່ລະບົດ (lab 3-5 ຮັບຄຳຖາມໄດ້ ເຊັ່ນ `pnpm lab:4 "ຄຳຖາມ"`) |
| `pnpm typecheck:labs` | ກວດ TypeScript ຂອງ lab |
| `pnpm dev` | ເປີດໜ້າແຊັດ **RAG Workshop Playground** ທີ່ http://localhost:3000 |

### ໜ້າແຊັດ (Playground)

ທຸກ lab ທົດລອງຜ່ານໜ້າເວັບໄດ້ ໂດຍບໍ່ຕ້ອງຮັນ CLI. ເລືອກ lab ທາງຊ້າຍ, ປັບຄ່າ (chunkSize, top-k, minScore, ກົດກັນ hallucination, maxRetries) ທາງຂວາ, ແລ້ວພິມຄຳຖາມ. ແຕ່ລະຄຳຕອບສະແດງລາຍລະອຽດຂອງຂັ້ນຕອນນັ້ນ:

| Lab | ສິ່ງທີ່ເຫັນໃນໜ້າແຊັດ |
|---|---|
| 1 Load & Chunk | chunk ທັງໝົດ ພ້ອມໄຮໄລ້ສ່ວນທີ່ຊ້ຳ (overlap) |
| 2 Embeddings | ຄະແນນ cosine ຂອງແຕ່ລະປະໂຫຍກ (ແກ້ປະໂຫຍກໄດ້ໃນແຖບຕັ້ງຄ່າ) |
| 3 Vector Search | top-k chunk ພ້ອມຄະແນນ ແລະ chunk ທີ່ຖືກຕັດດ້ວຍ minScore |
| 4 RAG | ຄຳຕອບ + chunk ທີ່ໃຊ້ + prompt ເຕັມທີ່ສົ່ງໃຫ້ LLM |
| 5 Corrective RAG | ລຳດັບ node ທີ່ທຳງານ (retrieve → grade → transform → generate) |

ໜ້າແຊັດ ແລະ CLI lab ໃຊ້ code ຊຸດດຽວກັນໃນ [labs/core.ts](labs/core.ts). Pipeline ຂອງໜ້າແຊັດຢູ່ໃນ [lib/rag/pipeline.ts](lib/rag/pipeline.ts) ເຊິ່ງຂຽນຕາມ lab 1-5 ແລະ ເກັບ vector store ໄວ້ໃນ memory ຂອງ server (embed ໃໝ່ສະເພາະເມື່ອປ່ຽນ chunkSize/overlap).

> 💡 code ຂອງ project ຈິງທີ່ອ້າງເຖິງໃນຄູ່ມືນີ້ ຢູ່ໃນ repo [Langchang-chatbot](https://github.com/bounmy99/Langchang-chatbot) (branch `dev`)

### ໂຄງສ້າງໂຟນເດີ

```text
labs/
├── data/                  # ເອກະສານຕົວຢ່າງ (ບໍລິສັດສົມມຸດ "ຈຳປາ ດິຈິຕອນ")
│   ├── leave-policy.md    #   ນະໂຍບາຍການລາພັກ
│   ├── it-security.md     #   ລະບຽບຄວາມປອດໄພໄອທີ
│   └── benefits.md        #   ສະຫວັດດີການ
├── core.ts                # code ກາງ (ໃຊ້ຮ່ວມກັບໜ້າແຊັດ): getLLM, getEmbeddings, loadDocuments, splitDocuments, buildVectorStore
├── lib.ts                 # re-export core.ts + ກວດ API key ສຳລັບ CLI lab
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

## Lab 1 — Load & Chunk

```bash
pnpm lab:1
```

**ແນວຄິດ:** LLM ແລະ embedding model ຮັບຂໍ້ຄວາມໄດ້ຈຳກັດ ແລະ ຖ້າ vector ຕາງໜ້າເອກະສານທັງເຫຼັ້ມ ຄວາມໝາຍຈະ "ເຈືອຈາງ". ເຮົາຈຶ່ງແບ່ງເອກະສານເປັນ **chunk** ນ້ອຍໆ ທີ່ແຕ່ລະອັນເວົ້າເລື່ອງດຽວ.

- `chunkSize` — ຂະໜາດສູງສຸດຂອງ chunk (ຕົວອັກສອນ)
- `chunkOverlap` — ຈຳນວນຕົວອັກສອນທີ່ຊ້ຳກັນລະຫວ່າງ chunk ທີ່ຕິດກັນ ເພື່ອບໍ່ໃຫ້ປະໂຫຍກຖືກຕັດຂາດຄວາມໝາຍ
- `separators` — `RecursiveCharacterTextSplitter` ພະຍາຍາມຕັດທີ່ຕົວແຍກທຳອິດກ່ອນ (`\n## ` = ຫົວຂໍ້), ຖ້າຍັງໃຫຍ່ເກີນ ຈຶ່ງຕັດທີ່ `\n`, ແລ້ວ ` `

**ໃນ project ຈິງ:** ໃຊ້ `chunkSize: 1000, chunkOverlap: 200` ແລະມີຂັ້ນຕອນ clean ຂໍ້ຄວາມ PDF/DOCX ກ່ອນ (ລຶບຊ່ອງຫວ່າງທີ່ PDF ແຊກລະຫວ່າງຕົວອັກສອນ).

**ແບບຝຶກຫັດ** (🎯 = ເຮັດໃນຫ້ອງ, ຂໍ້ອື່ນເປັນການບ້ານ)

- **1.1** ປ່ຽນ `CHUNK_SIZE` ເປັນ 100, 300, 1000 → ຈຳນວນ chunk ປ່ຽນແນວໃດ? chunk ໃດທີ່ "ອ່ານແລ້ວບໍ່ເຂົ້າໃຈ" ເມື່ອແຍກອອກມາດ່ຽວໆ?
- 🎯 **1.2** ຕັ້ງ `CHUNK_OVERLAP = 0` ກັບ `CHUNK_SIZE = 100` → ມີປະໂຫຍກທີ່ຖືກຕັດກາງບໍ່?

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

**ແບບຝຶກຫັດ** (🎯 = ເຮັດໃນຫ້ອງ, ຂໍ້ອື່ນເປັນການບ້ານ)

- **2.1** ເພີ່ມປະໂຫຍກຂອງທ່ານເອງ ເຊັ່ນ ຄຳສະແລງ, ຄຳຂຽນຜິດ, ຫຼື ພາສາໄທ → ຄະແນນເປັນແນວໃດ?
- 🎯 **2.2** ລອງ query ທີ່ສັ້ນຫຼາຍ ເຊັ່ນ "ລາ" → ຄະແນນສູງສຸດຫຼຸດລົງບໍ່? ເປັນຫຍັງ?

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

**ແບບຝຶກຫັດ** (🎯 = ເຮັດໃນຫ້ອງ, ຂໍ້ອື່ນເປັນການບ້ານ)

- **3.1** ລອງ `TOP_K = 1` ແລະ `TOP_K = 8` → chunk ທີ່ບໍ່ກ່ຽວເລີ່ມເຂົ້າມາຕັ້ງແຕ່ອັນດັບໃດ?
- 🎯 **3.2** ຖາມ "ບໍລິສັດມີໂບນັດທ້າຍປີບໍ່?" (ບໍ່ມີໃນເອກະສານ) → ຄະແນນສູງສຸດແມ່ນເທົ່າໃດ? ລອງຕັ້ງ `MIN_SCORE` ໃຫ້ຕັດອອກໄດ້ ໂດຍບໍ່ຕັດຄຳຖາມດີໆອອກ
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

**ແບບຝຶກຫັດ** (🎯 = ເຮັດໃນຫ້ອງ, ຂໍ້ອື່ນເປັນການບ້ານ)

- 🎯 **4.1** ຖາມ "ບໍລິສັດມີໂບນັດທ້າຍປີບໍ່?" → ຄວນໄດ້ "ບໍ່ພົບຂໍ້ມູນ". ຈາກນັ້ນ **ລຶບກົດຂໍ້ 1 ແລະ 2** ອອກຈາກ prompt ແລ້ວຖາມໃໝ່ → LLM ເລີ່ມແຕ່ງບໍ່?
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

**ແບບຝຶກຫັດ** (🎯 = ເຮັດໃນຫ້ອງ, ຂໍ້ອື່ນເປັນການບ້ານ)

- 🎯 **5.1** ຖາມອ້ອມໆ ເຊັ່ນ "ຖ້າໂນດບຸກຫາຍ ຕ້ອງເຮັດແນວໃດ?" → ມີ transform ບໍ່? ຄຳຄົ້ນໃໝ່ດີກວ່າເກົ່າບໍ່?
- **5.2** ເພີ່ມ node `validate` ກ່ອນ `retrieve` ທີ່ປະຕິເສດຄຳຖາມນອກເລື່ອງ HR/IT (ເຊັ່ນ "ສອນເຮັດເຂົ້າໜົມແດ່") ໂດຍໄປ `END` ທັນທີ
- **5.3** ສັງເກດວ່າ grade ໃນ Lab 5 ເອີ້ນ LLM **ທຸກຄັ້ງ**. ເພີ່ມ fast-path ແບບ project: ຖ້າ score ສູງສຸດ ≥ 0.75 ໃຫ້ຖືວ່າກ່ຽວເລີຍ (ຄຳໃບ້: ໃຊ້ `similaritySearchWithScore` ແລະ ເກັບ score ໃນ state)

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
