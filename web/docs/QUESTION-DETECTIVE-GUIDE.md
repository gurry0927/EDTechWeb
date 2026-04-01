# 題目偵探 (Question Detective) — 完整開發指南

> 本文件是給 AI 開發者或人類接手者的完整交接文件。
> 涵蓋設計理念、技術架構、資料結構、維護方式與內容撰寫規範。

---

## 一、設計理念

### 1.1 解決的痛點
國中生在應考時最大的問題不是「不會算」，而是「看不懂題目在問什麼」。
傳統的題庫網站是：看題目 → 看詳解 → 下一題。學生只是被動接收答案，沒有訓練閱讀和推理能力。

### 1.2 核心概念：偵探式分層引導
把解題過程從「看題 → 直接算」改成偵探辦案的四個階段：

| 階段 | 比喻 | 學生做的事 | 目的 |
|------|------|-----------|------|
| 1. 線索收集 | 調查現場 | 點選題幹/附圖中的關鍵字 | 訓練「讀題」能力 (找齊關鍵線索才能通關) |
| 2. 推理指證 | 逆轉裁判 | 點選正確的答案並指認對應的證據 | 建立邏輯閉環 (Evidence-based Reasoning) |
| 3. 蘇格拉底提問 | 偵探推理 | 思考引導問題、決定是否看提示 | 訓練「拆解核心概念」能力 |
| 4. 破案 | 結案報告 | 看完整解析、常見錯誤、漏掉的線索 | 補足盲點 |

學生可以在任一階段嘗試作答（「真相只有一個」），但只有在收集完所有**「批判性線索 (Critical Clues)」**後才能鎖定嫌疑犯並進入推理。

### 1.3 為什麼是對話式 UI
- **符合使用習慣**：國中生最熟悉的介面就是聊天（LINE、IG DM），對話泡泡讓學習感覺像在跟偵探教練聊天，不像在考試。
- **自然的互動節奏**：偵探問一句、學生答一句，比一次把所有資訊倒給學生好。
- **未來可擴展**：現在是靜態對話（JSON 驅動），未來接 RAG 或即時 AI 對話，前端幾乎不用改。
- **成熟但不幼稚**：用文案和微互動製造偵探氛圍，不靠花花綠綠的 UI。

### 1.4 關鍵設計決策
- **批判性線索守門員**：防止盲目亂點，標記為 `isCritical` 的線索必須全數找齊。
- **選項模糊化 (Blurred Suspects)**：在收集線索階段，選項按鈕為鎖定狀態，且題幹中的選項文字套用 `blur-md` 濾鏡。偵探會說：「目前還無法鎖定嫌疑犯清單。」
- **「真相只有一個」機制**：收集完線索後，進入「推理模式」。學生選完答案後，需進行「指認证据」動作，點選正確的線索片段才能通過。
- **現代感與紙質融合**：背景使用 Dotted Paper（點狀紙），線索圈選為紅色手繪動畫，結合 `backdrop-blur` 的現代介面。

---

## 二、技術架構

### 2.1 技術棧
- **框架**：Next.js 16 App Router + React 19
- **語言**：TypeScript
- **樣式**：Tailwind CSS v4（`@custom-variant dark`）
- **資料**：靜態 JSON 檔案（未來可接 API/資料庫）
- **部署**：Vercel（push to main 自動部署）

### 2.2 檔案結構
```
web/src/
├── components/question-detective/
│   ├── types.ts              # 核心型別定義（DetectiveQuestion）
│   └── DetectivePlayer.tsx   # 主互動元件（聊天 UI）
├── data/detective-questions/
│   ├── 114-history-20.json   # 範例題目：清代糖業
│   └── 114-history-31.json   # 範例題目：高砂義勇隊
├── app/question-detective/
│   └── page.tsx              # 入口頁面（題目列表 + 路由到 Player）
└── public/images/detective/  # 題目附圖（PNG/JPG）
```

### 2.3 資料流
```
JSON 檔案 → page.tsx import → DetectivePlayer props → 渲染對話
                                    ↓
                              使用者互動（點線索、答題）
                                    ↓
                              React state 驅動對話進展
```

---

## 三、核心型別定義

完整型別在 `types.ts`，以下是重點欄位說明：

### DetectiveQuestion（一道題目）
```typescript
{
  id: string;           // 唯一識別碼，如 "114-social-history-20"
  source: string;       // 來源，如 "114年會考-社會-第20題"
  subject: string;      // 科目
  difficulty: 1|2|3;    // 難度
  tags: string[];       // 知識標籤，用於未來弱點分析

  mainStem: string;      // 主要題幹文字（不含選項）
  figure?: string;        // 附圖文字描述
  figureImage?: string;   // 附圖路徑
  options: string[];      // 選項陣列（用於顯示 A B C D 按鈕與選單）
  answer: string;         // 正確答案，如 "C"

  clues: Clue[];                // 階段 1：線索
  deduction?: Deduction;        // 階段 2：推理與指證
  questions: SocraticQuestion[];// 階段 3：蘇格拉底提問
  concept: ConceptAnchor;       // 階段 4：概念定位
  solution: Solution;           // 階段 5：完整解析
}
```

### Clue（線索）
```typescript
{
  text: string;       // 要標記的原文片段，如 "高砂族"
  startIndex: number; // 在 stem 中的字元位置（-1 = 在 figure 中）
  length: number;     // 片段長度
  why: string;        // 為什麼重要（點擊後展開）
  isCritical?: boolean; // 是否為必找的「關鍵線索」，預設 false
}
```

### Deduction（推理階段）
```typescript
{
  prompt: string;         // "這發生在什麼時代？"
  options: string[];      // ["荷西時期", "鄭氏時期", "清領時期"]
  answer: string;         // 正確解讀
  evidenceClueIdx: number; // 學生必須點選第幾個線索（0-based index）來佐證
}
```

**重要**：`startIndex` 決定線索在哪裡被互動：
- `>= 0`：在題幹文字中，學生點擊題幹對應位置觸發
- `= -1`：在附圖描述中，系統會在 `figure` 字串裡搜尋 `text` 並標記

---

## 四、DetectivePlayer 元件架構

### 4.1 狀態管理
```
phase: 'clue' | 'question' | 'concept' | 'solution'  // 當前階段
foundClues: Set<number>      // 已找到的線索 index
missCount: number            // 失誤次數（上限 3）
revealedQuestions: number    // 已顯示幾個蘇格拉底提問
revealedHints: Set<number>   // 已展開的提示
showingOptions: boolean      // 是否正在顯示 ABCD 選項
wrongAttempts: string[]      // 錯誤的答案記錄（按順序對應 question index）
answeredCorrectly: boolean   // 是否已答對
```

### 4.2 互動文字分段機制
題幹和附圖文字被切成 `Segment[]`，每段是 `{ text, clueIndex }` —
- `clueIndex !== null`：這段是線索，點擊觸發命中
- `clueIndex === null`：這段不是線索，點擊觸發失誤

**切段規則**：以線索位置為斷點，非線索區域保持為完整字串（不按標點切），避免 span 間距洩漏線索位置。

### 4.3 對話泡泡元件
```
<Detective>  🕵️ 偵探教練（左側藍色泡泡）
<Student>    🧑‍🎓 學生（右側青色泡泡）
<ActionBtn>  居中的行動按鈕
```

### 4.4 指證流程 (Phoenix Wright Style)
```
1. 線索找齊 (Found all isCritical clues)
   ↓
2. [開始推理] 按鈕出現
   ↓
3. 推理問題顯示 (Deduction Prompt)
   ↓
4. 指證環節 (Point to Evidence)
   [環境變暗，線索高亮]
   ↓
5. 點擊正確線索 → [🎉 指證成功] → 進入蘇格拉底引導
```

---

## 五、內容撰寫規範

### 5.1 線索 (clues) 的 `why`
- **可以**：解釋這個詞是什麼、為什麼重要、連結到什麼知識
- **禁止**：提及任何選項字母（A/B/C/D）、直接排除某選項、暗示答案

✅ 好的：「『高砂族』是日治時期對台灣原住民的稱呼，看到這個詞就能鎖定時代。」
❌ 壞的：「看到『南洋』就能排除 (B) 日俄戰爭。」

### 5.2 蘇格拉底提問 (questions)
- **prompt**：開放式問題，引導學生自己推理，不能包含答案
- **hint**：給推理方向，不直接告訴結論

✅ 好的 prompt：「18-19 世紀的台灣是哪個政權統治？那個時期最重要的出口商品是什麼？」
✅ 好的 hint：「想想看，戰爭期間政府需要人民有什麼樣的身份認同？」
❌ 壞的 hint：「答案是皇民化運動。」

### 5.3 概念定位 (concept)
- `unit`：對應課綱單元名稱
- `brief`：1-3 句話說明核心概念
- `fieldNote`（選填）：連結現實場域（可參訪遺址、現存設施），客觀陳述不打廣告

### 5.4 解析 (solution)
- `steps`：逐步推理過程，每步一句話
- `commonMistakes`：說明為什麼其他選項是錯的（排除法分析只在這裡出現）

### 5.5 mainStem 與 options 欄位格式
- **mainStem**：僅包含題目正文。
- **options**：獨立陣列，依序填寫 A, B, C, D 的內容。
```json
"mainStem": "圖(八)是博物館展覽對臺灣歷史上某陶製漏斗狀工具使用方式的介紹...",
"options": ["甲", "乙", "丙", "丁"]
```

---

## 六、維護操作手冊

### 6.1 新增一道題目
1. 在 `web/src/data/detective-questions/` 建立 JSON 檔案
   - 命名規則：`{年份}-{科目}-{題號}.json`，如 `114-history-20.json`
2. 按照 `DetectiveQuestion` 型別填寫所有欄位
3. 如果有附圖：
   - 將圖片放到 `web/public/images/detective/`
   - 在 JSON 中加 `"figureImage": "/images/detective/{檔名}.png"`
4. 在 `web/src/app/question-detective/page.tsx` 加上 import：
   ```typescript
   import q3 from '@/data/detective-questions/114-history-XX.json';
   // 加到陣列
   const ALL_QUESTIONS: DetectiveQuestion[] = [q1, q2, q3] as DetectiveQuestion[];
   ```
5. `git add` → `git commit` → `git push origin main`（Vercel 自動部署）

### 6.2 修改現有題目
直接編輯對應的 JSON 檔案，注意：
- 修改 `stem` 後要重新計算所有 `clue.startIndex`
- `startIndex` 是從 `stem` 字串的第 0 個字元開始數（包含標點符號）

### 6.3 新增題目附圖
1. 圖片放到 `web/public/images/detective/`
2. 在 JSON 中加上 `"figureImage": "/images/detective/114-history-20.png"`
3. `figure` 欄位（文字描述）建議保留作為無圖片時的 fallback
4. 圖片和文字描述可以同時存在（圖片顯示在上方，文字在下方）

### 6.4 計算 startIndex 的方法
```javascript
const stem = "圖(八)是博物館展覽對臺灣歷史上某陶製漏斗狀工具使用方式的介紹。";
const clueText = "陶製漏斗狀工具";
console.log(stem.indexOf(clueText)); // → 17
```
在瀏覽器 console 或 Node.js 裡跑即可。如果線索在 `figure` 欄位中（不在 stem），`startIndex` 設為 `-1`。

---

## 七、未來擴展方向

### 7.1 Agent 自動生成題目
- 輸入：題目原文 + 詳解
- Prompt 指令讓 Claude API 自動產出四階段 JSON
- 硬規則：clues.why 和 questions.hint 禁止提及選項字母
- 產出後人工快速審閱再入庫

### 7.2 RAG 即時對話
- 現在的對話是靜態（JSON 定義好的問答）
- 未來可接 AI 即時回應：學生打字提問，AI 根據題目 context 回答
- 前端 `<Detective>` 和 `<Student>` 泡泡元件不用改，只需要把資料來源從 JSON 換成 streaming API

### 7.3 學習數據追蹤
- 記錄每題：找到幾個線索、失誤次數、用了幾個提示、答對/答錯
- 透過 `tags` 欄位做弱點分析（哪些概念一直答錯）
- 需要後端（Supabase）+ 會員系統

### 7.4 跨科支援
- 目前型別已支援 `'自然' | '數學' | '社會' | '國文' | '英文'`
- 數學題可能需要額外的 `keyFormula` 欄位和公式渲染（MathJax/KaTeX）
- 自然科可能需要實驗圖片支援
