# Question Admin — 開發指南

本文件是給 AI 讀的開發規格。讀完後應能獨立實作或修改此工具的任何部分，不需要再問架構問題。

---

## 這個工具是什麼

一個跑在 localhost 的題目管理介面，供題目編輯者：

1. 貼入或編輯一道「題目偵探」的 JSON
2. 一鍵呼叫 Gemini API，自動對空白區間做語意詞段切分（產生 `stemTokens`）
3. 在視覺化介面上即時看到切分結果，並手動調整
4. 編輯 JSON 的其他欄位（clues、scaffolding、hints 等）
5. 匯出最終的 JSON 檔

**不需要部署、不需要登入、不需要資料庫。** 所有資料存在 localStorage 或直接匯出檔案。

---

## 技術棧

| 層 | 選擇 | 原因 |
|---|---|---|
| 框架 | Vite + React + TypeScript | 輕量，啟動快，localhost 夠用 |
| 樣式 | Tailwind CSS v4 | 與主站一致 |
| AI | Google Gemini API（`gemini-2.0-flash`） | 免費額度夠用，延遲低 |
| 狀態管理 | React useState / useReducer | 無需引入外部 store |
| 持久化 | localStorage | 不需要後端 |

---

## 資料夾結構

```
tools/question-admin/
├── GUIDE.md              ← 本文件
├── package.json
├── vite.config.ts
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── types.ts           ← 複製自主站 types.ts（DetectiveQuestion）
    ├── gemini.ts          ← Gemini API 呼叫邏輯
    ├── tokenize.ts        ← prompt 組裝 + 結果解析
    ├── components/
    │   ├── JsonEditor.tsx     ← 左側：原始 JSON 文字編輯器
    │   ├── StemVisualizer.tsx ← 中央：題幹視覺化 + 詞段調整
    │   ├── FieldEditor.tsx    ← 右側：clues / scaffolding / hints 等欄位
    │   └── Toolbar.tsx        ← 頂部：API key 輸入、執行按鈕、匯出
    └── hooks/
        └── useQuestion.ts     ← 題目狀態的 CRUD 操作
```

---

## 核心資料型別

`DetectiveQuestion` 型別定義在主站 `web/src/components/question-detective/types.ts`。
開發時直接複製到本工具的 `src/types.ts`，兩邊保持同步。

關鍵欄位說明：

```typescript
interface DetectiveQuestion {
  mainStem: string;       // 題幹全文
  figure?: string;        // 附圖文字（選填）
  clues: Clue[];          // 線索標記（startIndex + length 定位）
  scaffolding?: ScaffoldingRegion[]; // 鷹架標記（同上）
  stemTokens?: string[];  // ← 本工具主要產出，AI 切分的詞段陣列
  // ... 其他欄位見 types.ts
}
```

`stemTokens` 的不變式：`stemTokens.join('') === mainStem`

---

## Gemini API 整合

### 設定

API key 由使用者在 Toolbar 輸入，存在 `localStorage['gemini-api-key']`。
不要 hardcode，不要寫進任何設定檔。

呼叫端點：
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={API_KEY}
```

### gemini.ts 介面

```typescript
export async function callGemini(apiKey: string, prompt: string): Promise<string>
// 回傳 model 的純文字回應，呼叫端自行解析 JSON
// 錯誤時 throw Error，message 為 API 回傳的錯誤說明
```

### 請求格式

```json
{
  "contents": [{ "parts": [{ "text": "<prompt>" }] }],
  "generationConfig": {
    "temperature": 0.2,
    "responseMimeType": "application/json"
  }
}
```

`temperature: 0.2` — 保持輸出穩定，避免每次切法差異太大。
`responseMimeType: "application/json"` — 強制 Gemini 回傳合法 JSON，省去剝 markdown code block 的工。

---

## Tokenization Prompt

### 組裝邏輯（tokenize.ts）

```typescript
export function buildTokenizePrompt(question: DetectiveQuestion): string
// 輸入：完整的 DetectiveQuestion 物件
// 輸出：給 Gemini 的 prompt 字串
```

### Prompt 模板

```
你是一個繁體中文文本切分助手，協助教育遊戲進行防作弊詞段混淆。

任務：
將以下題幹切成語意詞段陣列。題幹中有些區間已被標記為「線索」或「鷹架」，
這些區間必須以原文字串保留為單一元素，不可拆分。
其餘空白區間請做語意切分。

切分規則（嚴格遵守）：
1. 所有元素串接後必須完全等於原始題幹，不得增刪任何字元
2. 括號內容（如「(八)」「（九）」）連同緊鄰的漢字一起保持為單一元素
3. 空白區間每個元素 2–5 字，不得出現單字孤兒
4. 在助詞（的、了、在、與）、介詞、連接詞前後優先斷開
5. 切分應「自然但不規律」，避免等長切分讓學生發現規律
6. 標記區間（線索、鷹架）原文原樣放入陣列，不可修改內容

題幹：
{STEM}

標記區間（這些字串必須原樣出現在輸出陣列中）：
{MARKS}

只回傳 JSON 陣列，不要任何解釋文字。
```

### 標記區間格式化（填入 `{MARKS}`）

從 `clues` 和 `scaffolding` 提取所有 `startIndex >= 0` 的項目，格式如下：

```
- "{text}"（線索，位置 {startIndex}）
- "{text}"（鷹架-脈絡，位置 {startIndex}）
- "{text}"（鷹架-雜訊，位置 {startIndex}）
```

aliases 的處理：若線索有 `aliases`，同樣列出並標記「別名」，因為 aliases 也可能出現在題幹中。

### 結果驗證

```typescript
export function validateTokens(tokens: string[], originalStem: string): boolean
// 驗證 tokens.join('') === originalStem
// 失敗時 UI 顯示錯誤，讓使用者重試或手動修正
```

---

## UI 規格

### 整體佈局

```
┌─────────────────── Toolbar ───────────────────┐
│  [API Key: ••••••] [載入 JSON] [匯出 JSON]      │
│  [▶ 執行 AI 切分]  狀態：就緒                    │
└───────────────────────────────────────────────┘
┌──────────────┬──────────────────┬─────────────┐
│  JSON Editor │  Stem Visualizer │ Field Editor │
│  （左 1/3）  │   （中 1/3）     │  （右 1/3）  │
└──────────────┴──────────────────┴─────────────┘
```

### Stem Visualizer（核心元件）

- 顯示 `mainStem` 全文，以不同底色區分三種詞段：
  - 線索（clue）：藍色底
  - 鷹架-脈絡（context）：橘色底
  - 鷹架-雜訊（noise）：紅色底  
  - 空白詞段：灰色底，顯示 tokenIndex
- 點擊兩個相鄰詞段 → 合併
- 點擊一個詞段 → 出現拆分游標，可手動指定斷點

### JSON Editor

- `<textarea>` 顯示當前 JSON
- 使用者直接編輯後，點「套用」解析並更新 Visualizer
- 解析錯誤時紅框提示

### Toolbar

- API key 欄位（type="password"，存 localStorage）
- 「執行 AI 切分」按鈕：呼叫 Gemini，結果寫入 `stemTokens`，Visualizer 即時更新
- 「載入 JSON」：file input，讀取 `.json` 檔
- 「匯出 JSON」：下載當前狀態為 `.json` 檔

---

## 開發啟動

```bash
cd tools/question-admin
npm install
npm run dev
# → http://localhost:5173
```

---

## 常見錯誤排查

| 現象 | 原因 | 處理 |
|---|---|---|
| `tokens.join('') !== mainStem` | Gemini 漏字或多字 | 顯示錯誤，讓使用者手動修正或重試 |
| API 回傳非 JSON | `responseMimeType` 未生效 | 嘗試剝 ` ```json ` code block 後再解析 |
| 標記區間被拆分 | prompt 沒有清楚列出所有標記 | 檢查 `buildTokenizePrompt` 的 `{MARKS}` 是否完整 |
| `aliases` 出現在題幹中但未被識別 | 只列了主要 `text`，未列 `aliases` | 在 `{MARKS}` 區塊補上 aliases |
