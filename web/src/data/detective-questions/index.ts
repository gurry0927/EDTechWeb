// ── 題庫索引 ──
// 新增題目：1) 在此目錄放 JSON  2) 在下方加一行 import + push
// 其他檔案不需要改動。

import type { DetectiveQuestion } from '@/components/question-detective/types';

import q114h20 from './114-social-history-20.json';
import q114h31 from './114-social-history-31.json';
import q114sg1 from './114-social-geography-1.json';

export const ALL_QUESTIONS: DetectiveQuestion[] = [
  q114h20,
  q114h31,
  q114sg1,
] as DetectiveQuestion[];
