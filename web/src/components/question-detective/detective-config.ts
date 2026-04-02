// ── 題目偵探：集中設定檔 ──
// 新增題目只需要加 JSON，這裡控制遊戲參數、台詞、成就判定。

/** 遊戲參數 */
export const GAME = {
  maxLives: 3,
  typingDelay: { short: 500, medium: 800, long: 1200 } as const,
  scanDuration: 4000,
  scrollDelay: 300,
  reasoningAdvanceDelay: 600,
  answerAdvanceDelay: 800,
};

/** 偵探台詞（可替換語氣/語言） */
export const DIALOGUE = {
  // 線索階段
  intro: '有一份文件送到了偵探社。裡面藏著破案的關鍵線索。',
  introHint: '👆 點選題目中你覺得可疑的地方',
  clueMiss: '這裡沒什麼線索，再看看別的。',
  clueReactions: ['有道理。', '說得沒錯。', '好眼力。', '這很關鍵。'],
  clueLocked: '調查機會用完了。帶著目前的線索繼續推理吧。',
  clueHintMore: '還有關鍵線索沒找到，繼續調查吧。',
  clueReady: '🔎 關鍵線索到手，開始推理',
  clueForceAdvance: '帶著現有線索繼續 →',

  // 推理階段
  reasoningIntro: '好，根據你找到的線索，我有幾個問題要確認。',
  reasoningWrongPrefix: '不太對。',
  reasoningCorrect: '✓',
  reasoningCorrectMsg: '方向正確！',
  reasoningAskEvidence: '請指出題目中支持這個結論的證據',
  reasoningPointingBanner: '👆 請在題目中指認支持你推理的證據',
  wrongEvidence: [
    '嗯⋯這條線索好像跟結論沒有直接關係。',
    '不太對，這個無法佐證你的推理。',
    '再想想，哪個線索才是關鍵證據？',
  ],
  evidenceSuccess: '✓ 指證成功！',
  reasoningDone: '推理完成！',
  reasoningDoneAction: '真相只有一個——指認你的答案吧。',

  // 作答階段
  answerPrompt: '真相只有一個——指認你的答案吧。',
  answerWrongPrefix: '不對。',
  answerWrongSuffix: '不是正確答案。再看看線索，想想你剛才的推理。',
  answerCorrect: '🎉 破案了！',
  answerCorrectSuffix: '完全正確。',

  // 結案報告
  solutionConceptLabel: '這題考的是：',
  solutionExtendLabel: '💡 延伸思考：',
  solutionStepsLabel: '📋 完整推理：',
  solutionMistakesLabel: '⚠️ 常見錯誤：',
  solutionMissedLabel: '🔍 你漏掉的線索：',

  // 圖片
  figureExpand: '展開附圖',
  figureCollapse: '收合附圖',
};

/** 成就判定（依序檢查，第一個符合的生效） */
export const ACHIEVEMENTS = [
  { check: (clues: number, total: number, misses: number, wrongs: number) => clues === total && misses === 0 && wrongs === 0, label: '完美偵探 🏆', color: 'text-amber-600 dark:text-amber-300' },
  { check: (clues: number, total: number) => clues >= total * 0.75, label: '觀察敏銳', color: 'text-emerald-600 dark:text-emerald-300' },
  { check: () => true, label: '下次再仔細看看', color: 'text-slate-400 dark:text-white/40' },
];

/** 隨機選一個 */
export function pick(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
