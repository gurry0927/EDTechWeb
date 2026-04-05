// src/components/question-detective/types.ts
// 「題目偵探」核心資料結構

// ─────────────────────────────────────────────────────────────────────────────
// [NEW] ScaffoldingRegion — 動態鷹架：區分「脈絡區」與「雜訊區」
//
// 設計說明：
//   這個型別讓內容作者在題幹/附圖中標記「非線索但有語意」的文字片段。
//   與 Clue 不同，ScaffoldingRegion 不會推進遊戲進度，只改變偵探的回應語氣。
//
//   type: 'context' → 有用的背景資訊，不扣血，偵探給「溫暖提示」
//   type: 'noise'   → 無關的雜訊，扣 1 血，偵探給「冷靜提示」
//
// 在 JSON 中的範例（見 114-history-20.json 的 "scaffolding" 欄位）：
// {
//   "text": "陶製漏斗狀",
//   "startIndex": 8,
//   "length": 5,
//   "type": "context",
//   "hint": "這描述了工具的外形，但我們更需要知道它的用途。"
// }
// ─────────────────────────────────────────────────────────────────────────────
export interface ScaffoldingRegion {
  /** 要標記的原文片段 */
  text: string;
  /** 起始位置（字元索引），-1 = 在 figure 中 */
  startIndex: number;
  /** 片段長度 */
  length: number;
  /** 'context' = 脈絡區（不扣血）；'noise' = 雜訊區（扣 1 血） */
  type: 'context' | 'noise';
  /** 點擊後偵探的回應（context 給方向、noise 給冷場） */
  hint: string;
}

/** 線索附帶的推理小題（方案二：每個線索各自出題） */
export interface ClueReasoning {
  /** 推理問題，如 "這個稱呼是哪個時代的用語？" */
  prompt: string;
  /** 選項 */
  choices: string[];
  /** 正確選項 index（0-based） */
  answerIndex: number;
  /** 答對時偵探的回應 */
  correct: string;
  /** 答錯時偵探的引導 */
  wrong: string;
}

/** 題幹中的關鍵線索標記 */
export interface Clue {
  /** 要標記的原文片段 */
  text: string;
  /** 該片段在 mainStem 中的起始位置（字元索引），-1 = 在 figure 中 */
  startIndex: number;
  /** 片段長度 */
  length: number;
  /** 聊天室顯示的一句話鉤子（點到線索後立刻說，話說一半留懸念，引導去筆記本） */
  teaser?: string;
  /** 筆記本中顯示的完整說明（為什麼這是線索） */
  why: string;
  /** 同義詞/相關詞，點到任一個都算找到這條線索（選填） */
  aliases?: string[];
  /** 是否為必找的關鍵線索，預設 false */
  isCritical?: boolean;
  /** 是否為輔助線索：不阻擋主線進度，但收集後解鎖額外推理題，結案報告會揭示未收集的輔助線索 */
  isAuxiliary?: boolean;
  /** 該線索的推理小題（選填，只有需要出題的線索才有） */
  reasoning?: ClueReasoning;
}

/** 蘇格拉底式引導提問 */
export interface SocraticQuestion {
  /** 引導問題 */
  prompt: string;
  /** 如果學生答不出來的進一步提示 */
  hint: string;
}

/** 概念定位 */
export interface ConceptAnchor {
  /** 對應課綱單元 e.g. "力與運動" */
  unit: string;
  /** 關鍵公式/定義（若有） */
  keyFormula?: string;
  /** 一句話說明為什麼是這個概念 */
  brief: string;
  /** 延伸田野筆記 — 連結現實場域，例如可參訪的遺址或現存設施（選填） */
  fieldNote?: string;
}

/** 完整解析 */
export interface Solution {
  /** 逐步解題 */
  steps: string[];
  /** 常見錯誤（選填） */
  commonMistakes?: string[];
}

/** 一道題目的完整結構 */
export interface DetectiveQuestion {
  /** 唯一識別碼 */
  id: string;
  /** 來源 e.g. "114年會考-社會-第20題" */
  source: string;
  /** 科目 */
  subject: '自然' | '數學' | '社會' | '國文' | '英文';
  /** 難度等級 */
  difficulty: 1 | 2 | 3;
  /** 知識標籤，用於弱點分析（結案報告才顯示，避免洩漏答案） */
  tags: string[];
  /** 細分科目，如 "歷史"、"地理"、"公民"、"生物" 等（社會/自然需細分） */
  subSubject?: string;
  /** 對應年級，如 "一上"、"二下" */
  gradeLevel?: string;

  // ── 原始題目 ──
  /** 題幹主文（不含選項） */
  mainStem: string;
  /** 附圖文字描述（當沒有圖片時的替代說明） */
  figure?: string;
  /** 附圖圖片路徑，放在 public/images/detective/ 下（選填） */
  figureImage?: string;
  /** 選項陣列，如 ["甲", "乙", "丙", "丁"] */
  options: string[];
  /** 正確答案，如 "C" */
  answer: string;

  // ── 偵探引導階段 ──

  /** 階段 1：線索收集 — 標記題幹/附圖中的關鍵資訊 */
  clues: Clue[];

  // [NEW] 動態鷹架區域（選填）
  // 若有，buildSegs 會同時解析 clues 與 scaffolding，區分三種 Seg 類型：
  //   1. clue segment    → clueIndex != null
  //   2. scaffold segment → scaffoldIndex != null
  //   3. plain text      → 兩者皆 null（點擊 = 失誤）
  // 不填此欄位則行為與舊版完全相同（所有非線索點擊都算失誤）。
  scaffolding?: ScaffoldingRegion[];

  /** 階段 2：蘇格拉底提問 — 引導思考方向 */
  questions: SocraticQuestion[];

  /** 階段 3：概念定位 — 揭示考的是什麼 */
  concept: ConceptAnchor;

  /** 階段 4：完整解析 */
  solution: Solution;

  /** 保底提示（選填）：連續失誤達閾值時顯示，比 pityCategoryHint 更具題目針對性 */
  pityHint?: string;

  /** AI 預先切分的語意詞段（選填）
   *  填寫後，buildSegs 會優先使用這份詞段清單，而非執行時自動切碎。
   *  格式：完整 mainStem 的分割結果，所有元素串接後必須等於 mainStem。
   *  用途：
   *    1. 語意詞段比機械切碎更自然，偽裝效果更好
   *    2. 每個空白詞段有固定的 tokenIndex，可供後端記錄「學生點擊了哪個詞段」
   *  不填：退回自動切碎（2-4 字規則），行為與舊版相同。
   */
  stemTokens?: string[];

  /** 筆記本初始提示（選填）：尚未找到任何線索時開啟筆記本顯示的引導語 */
  startHint?: string;

  /** 偵探開場問出的案件問題（選填）
   *  填寫後：偵探以泡泡形式提問，讓學生帶著問題去閱讀上方証詞找線索
   *  不填：行為與舊版相同（向後相容）
   */
  caseQuestion?: string;
}
