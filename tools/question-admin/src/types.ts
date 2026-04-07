// 與主站 web/src/components/question-detective/types.ts 保持同步

export interface ScaffoldingRegion {
  text: string;
  location: 'stem' | 'figure';
  startIndex: number;
  length: number;
  type: 'context' | 'noise';
  hint: string;
  aliases?: string[];
}

export interface ClueReasoning {
  prompt: string;
  choices: string[];
  answerIndex: number;
  correct: string;
  wrong: string;
}

export interface Clue {
  text: string;
  location: 'stem' | 'figure';
  startIndex: number;
  length: number;
  teaser?: string;
  why: string;
  aliases?: string[];
  isCritical?: boolean;
  isAuxiliary?: boolean;
  reasoning?: ClueReasoning;
}

export interface SocraticQuestion {
  prompt: string;
  hint: string;
}

export interface ConceptAnchor {
  unit: string;
  keyFormula?: string;
  brief: string;
  fieldNote?: string;
}

export interface Solution {
  steps: string[];
  commonMistakes?: string[];
}

export interface DetectiveQuestion {
  id: string;
  source: string;
  subject: '自然' | '數學' | '社會' | '國文' | '英文';
  difficulty: 1 | 2 | 3;
  tags: string[];
  subSubject?: string;
  gradeLevel?: string;
  mainStem: string;
  figure?: string;
  figureImage?: string;
  options: string[];
  answer: string;
  caseQuestion?: string;
  clues: Clue[];
  scaffolding?: ScaffoldingRegion[];
  questions: SocraticQuestion[];
  concept: ConceptAnchor;
  solution: Solution;
  pityHint?: string;
  startHint?: string;
  stemTokens?: string[];
  figureTokens?: string[];
}

// ── API Key 管理 ──

export type Provider = 'gemini' | 'openai';

export const PROVIDER_MODELS: Record<Provider, string[]> = {
  gemini: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash-8b'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
};

export interface ApiKey {
  id: string;
  label: string;
  value: string;
  provider: Provider;
  model: string;
}
