// src/components/question-detective/types.ts
// 「題目偵探」核心資料結構

/** 題幹中的關鍵線索標記 */
export interface Clue {
  /** 要標記的原文片段 */
  text: string;
  /** 該片段在題幹中的起始位置（字元索引） */
  startIndex: number;
  /** 片段長度 */
  length: number;
  /** 為什麼這是關鍵（收合提示，學生按了才看到） */
  why: string;
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
  /** 來源 e.g. "112會考-自然-第15題" */
  source: string;
  /** 科目 */
  subject: '自然' | '數學' | '社會' | '國文' | '英文';
  /** 難度等級 */
  difficulty: 1 | 2 | 3;
  /** 知識標籤，用於弱點分析 */
  tags: string[];

  // ── 原始題目 ──
  /** 題幹文字 */
  stem: string;
  /** 附圖文字描述（當沒有圖片時的替代說明） */
  figure?: string;
  /** 附圖圖片路徑，放在 public/images/detective/ 下（選填） */
  figureImage?: string;
  /** 選項（選擇題） */
  options?: string[];
  /** 正確答案 */
  answer: string;

  // ── 四階段偵探引導 ──

  /** 階段 1：線索收集 — 標記題幹中的關鍵資訊 */
  clues: Clue[];

  /** 階段 2：蘇格拉底提問 — 引導思考方向 */
  questions: SocraticQuestion[];

  /** 階段 3：概念定位 — 揭示考的是什麼 */
  concept: ConceptAnchor;

  /** 階段 4：完整解析 */
  solution: Solution;
}
