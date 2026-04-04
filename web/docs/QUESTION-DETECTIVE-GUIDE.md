# 題目偵探 — 開發與內容指南

> 最後更新：2026-04。以實際程式碼為準，舊版內容已全面改寫。

---

## 一、設計理念

### 痛點
國中生看不懂題目，不是不會算，是「沒有讀題習慣」。傳統題庫是：看題 → 看答案 → 下一題，學生只是被動接收，沒有訓練推理。

### 解法：偵探式分層引導

| 階段 | 學生做的事 | 目的 |
|------|-----------|------|
| 線索收集 | 點擊題幹中的可疑字詞 | 訓練讀題、找關鍵資訊 |
| 推理小題 | 針對找到的線索回答問題 | 建立邏輯閉環 |
| 指認嫌疑犯 | 選出最終答案 ABCD | 做出有根據的判斷 |
| 結案報告 | 看完整解析與常見錯誤 | 補足盲點 |

### 核心機制
- **線索守門**：所有 `isCritical` 線索必須全部找到，才能進入推理
- **選項模糊**：嫌疑犯名單在線索收集階段全部 blur，找越多線索越清晰
- **輔助線索**：`isAuxiliary` 不阻擋主線，但找到後也會解一層模糊
- **鷹架區域**：`scaffolding` 讓非線索片段有意義的回應，而非一律扣血

---

## 二、技術架構

### 檔案結構
```
web/src/
├── app/question-detective/
│   ├── page.tsx              # 題目列表頁（/question-detective）
│   └── [id]/
│       └── page.tsx          # 遊戲頁（/question-detective/114-social-history-20）
├── components/question-detective/
│   ├── types.ts              # 核心型別定義
│   ├── detective-config.ts   # 遊戲參數、偵探台詞、成就判定
│   ├── DetectivePlayer.tsx   # 主互動元件
│   └── DetectiveGamePage.tsx # 路由 wrapper（接 router.back()）
├── data/detective-questions/
│   ├── index.ts              # 題庫索引（加題只改這裡）
│   ├── 114-history-20.json
│   └── 114-history-31.json
└── public/images/detective/  # 題目附圖
```

### 資料流
```
JSON → index.ts → [id]/page.tsx (Server Component)
                        ↓ 傳 question prop
                  DetectiveGamePage (Client, 接 router)
                        ↓
                  DetectivePlayer（所有互動邏輯與 UI）
```

每道題有獨立 URL，`generateStaticParams` 在 build 時預生成全部題目頁面。

---

## 三、新增一道題目：需要準備什麼

### 必填資訊清單

**基本資料**
- 題目來源（幾年會考/基測、科目、題號）
- 正確答案（A/B/C/D 的哪個）
- 難度（1-3）
- 科目分類（社會 → 歷史/地理/公民）

**題目素材**
- 題幹全文（mainStem）
- 附圖文字描述（figure，若有）
- 附圖圖片（figureImage，放到 `public/images/detective/`）
- 四個選項文字

**偵探引導內容（最費時，這是核心）**

| 要寫的 | 說明 |
|-------|------|
| 線索 clues | 在題幹/附圖中標哪幾個字是線索（含位置、偵探回應） |
| 推理小題 reasoning | 每個關鍵線索要附一個推理問答（可選） |
| 鷹架區域 scaffolding | 標記容易誤點但不算線索的字詞（可選但建議加） |
| 保底提示 pityHint | 連續錯 3 次給的針對性提示 |
| 筆記本初始提示 startHint | 學生第一次開筆記本、還沒找到任何線索時顯示 |
| 開場問題 caseQuestion | 偵探在開場問出的核心問題（可選） |
| 解析 solution | 推理步驟 + 各錯誤選項分析 |

---

## 四、JSON 結構完整說明

### 最外層（題目本體）

```json
{
  "id": "114-social-history-20",
  "source": "114年會考-社會-第20題",
  "subject": "社會",
  "subSubject": "歷史",
  "gradeLevel": "一上",
  "difficulty": 2,
  "tags": ["清領時期", "台灣糖業"],

  "mainStem": "圖(八)是博物館展覽對臺灣歷史上某陶製漏斗狀工具...",
  "figure": "圖(八)：❶ 將黏稠的糖汁倒入...",
  "figureImage": "/images/detective/114-history-20.png",
  "options": ["甲", "乙", "丙", "丁"],
  "answer": "C",

  "caseQuestion": "這個工具最多被用於圖(九)中的哪個地區？",
  "pityHint": "...",
  "startHint": "...",

  "scaffolding": [...],
  "clues": [...],
  "questions": [...],
  "concept": {...},
  "solution": {...}
}
```

**欄位說明**

| 欄位 | 必填 | 說明 |
|------|------|------|
| `id` | ✅ | **直接決定頁面 URL**，如 `"114-social-history-20"` → `/question-detective/114-social-history-20`。只能用英數字和連字號，不可含中文或空格。建議格式：`{年份}-{科目英文}-{細分英文}-{題號}`，例如 `114-social-history-20`、`113-science-biology-5` |
| `source` | ✅ | 顯示在列表與遊戲頁標題 |
| `subject` | ✅ | `'社會'` `'自然'` `'數學'` `'國文'` `'英文'` |
| `subSubject` | 建議 | 歷史 / 地理 / 公民 / 生物 等，列表頁顯示 |
| `gradeLevel` | 建議 | 一上 / 一下 / 二上 等，列表頁顯示 |
| `difficulty` | ✅ | 1=基本 2=中等 3=進階 |
| `tags` | ✅ | 結案報告顯示，不要含答案關鍵字（避免洩漏） |
| `mainStem` | ✅ | 題幹主文，不含選項 |
| `figure` | 若有附圖文字 | 附圖的文字說明，startIndex=-1 的線索從這裡找 |
| `figureImage` | 若有圖片 | 圖片路徑，放到 public/images/detective/ |
| `options` | ✅ | 四選項陣列，如 `["甲", "乙", "丙", "丁"]` |
| `answer` | ✅ | 正確答案字母，如 `"C"` |
| `caseQuestion` | 建議 | 偵探在開場說出的核心問題，幫助學生帶著目的讀題 |
| `pityHint` | 建議 | 連續失誤 3 次後給的提示，應針對本題核心概念 |
| `startHint` | 建議 | 尚未找到線索時開筆記本顯示，給第一步方向 |

---

### clues（線索陣列）

每道題至少要有 **1 個 `isCritical: true` 的線索**，否則學生永遠無法進入推理階段。

```json
"clues": [
  {
    "text": "十八至十九世紀",
    "startIndex": 37,
    "length": 7,
    "teaser": "這是案件的時代背景——翻開筆記本，看看這個時期留下了什麼線索。",
    "why": "清領時期的時間座標。這段期間台灣的產業版圖已經成形，南北分工明確。",
    "isAuxiliary": true,
    "reasoning": {
      "prompt": "十八至十九世紀，統治台灣的政權是哪一個？",
      "choices": ["明鄭時期", "清朝", "日本"],
      "answerIndex": 1,
      "correct": "正確！十八至十九世紀正是清領時期。",
      "wrong": "再想想：明鄭約十七世紀末結束，日本從1895年才開始。"
    }
  },
  {
    "text": "糖",
    "startIndex": -1,
    "length": 1,
    "aliases": ["糖汁", "糖蜜", "糖塊"],
    "teaser": "這個字洩漏了工具的真實用途——翻開筆記本看看。",
    "why": "倒入糖汁、承接糖蜜、取出糖塊——這是完整的製糖流程。",
    "isCritical": true,
    "reasoning": {
      "prompt": "這個製糖產業主要集中在台灣哪個區域？",
      "choices": ["茶葉產區", "稻米產區", "甘蔗產區"],
      "answerIndex": 2,
      "correct": "沒錯！甘蔗需要熱帶氣候，糖業集中在嘉南平原。",
      "wrong": "想想圖(八)的流程：這跟茶葉或稻米的加工方式一樣嗎？"
    }
  }
]
```

**欄位說明**

| 欄位 | 必填 | 說明 |
|------|------|------|
| `text` | ✅ | 要標記的原文片段（完全一致） |
| `startIndex` | ✅ | 在 mainStem 的字元位置（0-based）；`-1` = 在 figure 中 |
| `length` | ✅ | 片段長度（字元數） |
| `why` | ✅ | 筆記本中顯示的完整說明，**不可提及選項字母**。`teaser` 有填時，`why` 只出現在筆記本；`teaser` 未填時，`why` 會直接顯示在聊天室（筆記本教學失效）。 |
| `teaser` | **強烈建議** | 點到線索後在聊天室說的第一句話。**應刻意留懸念、話說一半**，讓學生帶著好奇心去開筆記本讀完整的 `why`。這是偵探筆記本教學機制的核心：聊天室只透露線索的存在，筆記本才揭露分析。沒有填 `teaser` 時，完整的 `why` 會直接出現在聊天室，導致學生沒有動機去開筆記本。 |
| `isCritical` | 擇一 | 必找線索，找齊才能進推理 |
| `isAuxiliary` | 擇一 | 非必找，但找到可解一層模糊，且有推理小題 |
| `aliases` | 若適用 | 同義詞，點任一個都算找到（如「糖汁」「糖蜜」都算找到「糖」） |
| `reasoning` | 建議加 | 推理小題，見下方說明 |

> 每個線索必須是 `isCritical`、`isAuxiliary`、或兩者都不填（普通線索）其中一種。

**計算 startIndex**
```javascript
const stem = "圖(八)是博物館展覽對臺灣歷史上某陶製漏斗狀工具使用方式的介紹。此種工具在十八至十九世紀之間...";
console.log(stem.indexOf("十八至十九世紀")); // → 37
```

**reasoning（推理小題）**

| 欄位 | 說明 |
|------|------|
| `prompt` | 推理問題 |
| `choices` | 選項陣列（通常 3 個） |
| `answerIndex` | 正確選項的 index（0-based） |
| `correct` | 答對時偵探的回應，可補充延伸知識 |
| `wrong` | 答錯時的引導，給方向而非直接說答案 |

---

### scaffolding（鷹架區域）

標記容易誤點但不是線索的字詞，讓偵探有話說而不是一律扣血。

```json
"scaffolding": [
  {
    "text": "陶製漏斗狀",
    "startIndex": 17,
    "length": 5,
    "type": "context",
    "hint": "這描述了工具的外形，但關鍵是它被用來製作什麼產品。"
  },
  {
    "text": "博物館展覽",
    "startIndex": 5,
    "length": 5,
    "type": "noise",
    "hint": "這只是文件出處，重點不在誰展覽它，而是這個工具用來生產什麼。"
  }
]
```

| `type` | 扣血 | 偵探語氣 | 適合標記 |
|--------|------|---------|---------|
| `context` | 否 | 溫和引導 | 有意義的背景詞（題目情境、工具描述） |
| `noise` | 是 | 冷靜提示 | 無關字詞（來源、地名裝飾詞） |

---

### questions（蘇格拉底提問）

推理完成後顯示，引導學生舉一反三。

```json
"questions": [
  {
    "prompt": "清領時期台灣最重要的出口商品是什麼？糖業為什麼集中在南部？",
    "hint": "清領時期有句俗諺：「一府二鹿三艋舺」。府城在台南，跟當地的主要產業有關。"
  }
]
```

---

### concept（概念定位）

結案後顯示，連結課綱單元。

```json
"concept": {
  "unit": "清領時期台灣的經濟發展",
  "brief": "清代台灣以米和糖為兩大出口商品。糖業集中在南部平原，因為甘蔗需要熱帶氣候與平坦耕地。",
  "fieldNote": "臺南市新營區至今仍保有清代糖廍遺跡，可見當時製糖規模。"
}
```

`fieldNote` 選填，連結現實場域。客觀陳述，不打廣告。

---

### solution（完整解析）

```json
"solution": {
  "steps": [
    "從圖(八)判斷：倒入糖汁、承接糖蜜、取出糖塊 → 製糖器具",
    "時間定位：十八至十九世紀 = 清領時期",
    "地理對應：糖業集中在嘉南平原，對照地圖為丙（西南部）"
  ],
  "commonMistakes": [
    "甲（北部）：清代以茶業為主，非糖業核心",
    "乙（中部）：以稻米為主，氣候條件不如南部適合甘蔗",
    "丁（東部）：清領時期開發較晚，並非糖業核心"
  ]
}
```

`steps` 逐步推理，每步一句話。`commonMistakes` 解釋為什麼錯誤選項是錯的——**排除法分析只在這裡出現，其他地方禁止提及選項字母**。

---

## 五、操作手冊

### 新增一道題目（常用流程）

> 完整 JSON 範例請參考 `src/data/detective-questions/114-history-20.json`

**總共只需要改兩個檔案：**

**步驟 1**：在 `web/src/data/detective-questions/` 建立新 JSON

命名規則：`{年份}-{科目縮寫}-{題號}.json`，如 `114-history-31.json`

**步驟 2**：在 `web/src/data/detective-questions/index.ts` 加兩行

```typescript
import q114hXX from './114-history-XX.json';  // ← 加這行 import

export const ALL_QUESTIONS: DetectiveQuestion[] = [
  q114h20,
  q114h31,
  q114hXX,  // ← 加這行
] as DetectiveQuestion[];
```

**步驟 3**：`git push origin main` → Vercel 自動部署，新題目立即上線

> ⚠️ 光是把 JSON 放進資料夾是不夠的，一定要在 `index.ts` 補上 import 和陣列項目，否則網站讀不到這道題。

---

### 分類是如何運作的

列表頁的「按科目」和「按年份」分組**完全自動**，由 JSON 欄位決定：

| 列表頁功能 | 讀取的 JSON 欄位 |
|-----------|----------------|
| 按科目分組 | `subject`（如 `"社會"`） |
| 按年份分組 | `source` 開頭的年份（如 `"114年會考..."` → `114年`） |
| 細分標籤（歷史/地理） | `subSubject` |
| 年級標籤（一上/二下） | `gradeLevel` |
| 難度點點 | `difficulty` |

新增題目只要在 JSON 裡把這些欄位填正確，列表頁會自動歸類，不需要額外設定。

### 修改偵探台詞或遊戲參數

編輯 `detective-config.ts`：

| 要改的東西 | 對應位置 |
|-----------|---------|
| 生命值數量 | `GAME.maxLives` |
| 連續失誤觸發憐憫的次數 | `GAME.pityScanThreshold` |
| 掃描動畫持續時間 | `GAME.scanActiveDuration` |
| 偵探開場白 | `DIALOGUE.intro` / `DIALOGUE.introWithFigure` |
| 找到線索的隨機回應 | `DIALOGUE.clueReactions` 陣列 |
| 成就判定邏輯 | `ACHIEVEMENTS` 陣列 |

### 修改視覺風格

編輯 `web/src/app/globals.css` 的 CSS 變數：

```css
:root {
  --det-paper: #f4efe4;       /* 紙張底色（淺色模式） */
  --det-paper-dark: #111119;  /* 紙張底色（深色模式） */
  --det-accent: #c2553a;      /* 紅色強調線 */
}
```

---

## 六、未來遷移至 Supabase

### 何時需要遷移

| 情況 | 建議 |
|------|------|
| 題目 < 30 題，無會員系統 | 繼續用 JSON，不需要資料庫 |
| 題目 > 30 題，或需要會員/進度追蹤 | 遷移至 Supabase |

### Supabase 資料表設計

**`questions` 資料表**（一對一對應現有 JSON）

```sql
create table questions (
  id            text primary key,       -- "114-social-history-20"
  source        text not null,
  subject       text not null,
  sub_subject   text,
  grade_level   text,
  difficulty    smallint not null,
  tags          text[],
  main_stem     text not null,
  figure        text,
  figure_image  text,
  options       text[] not null,
  answer        text not null,
  case_question text,
  pity_hint     text,
  start_hint    text,
  clues         jsonb not null,         -- Clue[] 直接存 JSON
  scaffolding   jsonb,                  -- ScaffoldingRegion[]
  questions     jsonb not null,         -- SocraticQuestion[]
  concept       jsonb not null,         -- ConceptAnchor
  solution      jsonb not null,         -- Solution
  created_at    timestamptz default now()
);
```

> `clues`、`scaffolding`、`questions`、`concept`、`solution` 這幾個結構複雜的欄位直接用 `jsonb` 儲存，不需要拆成子資料表。PostgreSQL 的 jsonb 支援索引和查詢，未來要做統計也沒問題。

**`user_progress` 資料表**（未來加會員時使用）

```sql
create table user_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users not null,
  question_id     text references questions(id) not null,
  completed       boolean default false,
  lives_remaining smallint,
  clues_found     text[],               -- 找到的線索 text 陣列
  wrong_attempts  text[],
  answered_at     timestamptz,
  unique(user_id, question_id)
);
```

### 遷移步驟

**Step 1：匯入現有 JSON 到 Supabase**

```typescript
// scripts/seed-questions.ts
import { createClient } from '@supabase/supabase-js';
import { ALL_QUESTIONS } from '../src/data/detective-questions';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

await supabase.from('questions').upsert(
  ALL_QUESTIONS.map(q => ({
    id: q.id,
    source: q.source,
    subject: q.subject,
    sub_subject: q.subSubject,
    // ... 其餘欄位對應
    clues: q.clues,
    scaffolding: q.scaffolding ?? null,
    // ...
  }))
);
```

**Step 2：改 `[id]/page.tsx`**（Server Component，只改資料來源）

```typescript
// 現在
import { ALL_QUESTIONS } from '@/data/detective-questions';
const question = ALL_QUESTIONS.find(q => q.id === id);

// 改成
import { createClient } from '@/lib/supabase/server';
const { data: question } = await createClient()
  .from('questions')
  .select('*')
  .eq('id', id)
  .single();
```

**Step 3：改 `page.tsx`（列表頁）**

```typescript
// 改成從 Supabase 取列表，只撈需要的欄位（不撈完整 clues/solution）
const { data: questions } = await supabase
  .from('questions')
  .select('id, source, subject, sub_subject, grade_level, difficulty, tags, main_stem');
```

**Step 4：`generateStaticParams` 改成動態**

題目來自資料庫後，`generateStaticParams` 可以繼續保留（build 時撈一次），或改成 ISR（`revalidate`）讓新題目不用重新 build。

### `DetectivePlayer.tsx` 完全不需要改

所有改動都在資料層（`page.tsx`）。Player 只吃 `DetectiveQuestion` 型別的 prop，型別結構不變。

---

## 七、內容撰寫原則

### teaser 與 why 的分工（核心機制）

這是筆記本教學機制能否運作的關鍵，每條線索都應該遵守：

```
聊天室（teaser）：話說一半，製造懸念，指引去筆記本
筆記本（why）  ：完整的分析，學生主動打開才能看到
```

**`teaser` 寫法**
- ✅ 說出「發現了什麼」，但不說「為什麼重要」
- ✅ 結尾指向筆記本（「翻開筆記本看看」、「去看看嫌疑犯有沒有變化」）
- ❌ 把 `why` 的內容直接寫進 `teaser`（這樣筆記本就沒有額外資訊）

```
✅ "這個字洩漏了工具的真實用途——翻開筆記本看看。"
❌ "這個字說明這是製糖工具，糖業集中在南部平原。"  ← why 的內容直接說完了
```

**`why` 寫法**
- ✅ 解釋這個詞是什麼、為什麼是線索、連結到什麼知識
- ❌ 提及選項字母（A/B/C/D）
- ❌ 直接說「所以答案是南部」

> 如果 `teaser` 沒有填，`why` 的完整內容會直接顯示在聊天室，學生就沒有動機去開筆記本。**每條線索都應該填 `teaser`。**

---

### 其他欄位原則

**`reasoning.correct` / `reasoning.wrong`**
- 答對回應可以補充延伸知識，讓學生感覺「收穫」
- 答錯引導給方向，不直接說答案

**`solution.commonMistakes`**
- 這是**唯一可以**分析各選項的地方
- 每個錯誤選項說明為什麼不對（排除法）
