// src/components/question-detective/types.ts
// 「題目偵探」核心資料結構

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
  /** 點擊後偵探的回應（隱晦補充，不直接透露答案） */
  why: string;
  /** 同義詞/相關詞，點到任一個都算找到這條線索（選填） */
  aliases?: string[];
  /** 是否為必找的關鍵線索，預設 false */
  isCritical?: boolean;
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

  /** 階段 2：蘇格拉底提問 — 引導思考方向 */
  questions: SocraticQuestion[];

  /** 階段 3：概念定位 — 揭示考的是什麼 */
  concept: ConceptAnchor;

  /** 階段 4：完整解析 */
  solution: Solution;
}
