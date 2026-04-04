// ── 題目偵探：集中設定檔 ──
// 新增題目只需要加 JSON，這裡控制遊戲參數、台詞、成就判定。

/** 遊戲參數 */
export const GAME = {
  maxLives: 5,
  typingDelay: { short: 500, medium: 800, long: 1200 } as const,
  scanDuration: 4000,
  scrollDelay: 300,
  reasoningAdvanceDelay: 600,
  answerAdvanceDelay: 800,
  toastDuration: 4000,

  // [NEW] 掃描器（放大鏡模式）
  // scanActiveDuration：按下掃描鈕後，掃描高亮持續幾毫秒
  // scanCooldown：掃描鈕冷卻時間（毫秒），防止連續觸發
  scanActiveDuration: 3500,
  scanCooldown: 6000,

  // [NEW] 憐憫機制：連續失誤幾次後觸發高價值提示
  // pityScanThreshold = 3 → 第 3 次連續失誤時觸發
  // 「連續」的定義：命中真實線索或 context 區域可重置計數器；noise 與空白失誤會累計
  pityScanThreshold: 3,
};

/** 偵探台詞（可替換語氣/語言） */
export const DIALOGUE = {
  // 線索階段
  intro: '案件送達！一份証詞送到了偵探社。',
  introWithFigure: '案件送達！一份証詞送到了偵探社，另附有照片證物。📓 照片已收進右上方的偵探筆記本，記得翻開來看。',
  introHint: '👆 點選上方證詞中你覺得可疑的字詞',
  caseQuestionPrompt: '仔細閱讀上方證詞，點擊你認為證詞中和案件相關的關鍵字詞！',
  clueMiss: '這裡沒什麼線索，再看看別的。',
  clueMissReactions: [
    '這裡似乎只是背景細節，試著找找能決定「時間」或「位置」的關鍵詞？',
    '冷靜點，偵探。觀察一下，這個片段對案件的進展有幫助嗎？',
    '沒什麼特別的。再仔細讀讀看，哪些資訊是解開謎題必不可少的？',
    '直覺告訴我，這不是我們要找的關鍵。往更具體的名詞看。',
  ],

  // [NEW] 三種分層回饋台詞：
  // contextHit：點到「脈絡區」— 有用但非關鍵，不扣血，給方向感
  // noiseHit：點到「雜訊區」— 無關，扣血，讓偵探冷冷回應
  // plainMiss：點到完全空白區— 現有行為，扣血
  //
  // 這三個 key 在 onContextHit / onNoiseMiss / onClueMiss 中使用（見 DetectivePlayer.tsx）
  contextHitReactions: [
    '這個細節有點意思，但還不是最關鍵的線索。',
    '記下來，但我們先繼續找其他證據。',
    '有背景知識，但還不足以定案。',
  ],
  noiseHitReactions: [
    '這個跟案子沒關係。',
    '調查機會消耗了，要謹慎選擇。',
    '這不是我們要找的線索。',
  ],
  clueReactions: ['有道理。', '說得沒錯。', '好眼力。', '這很關鍵。'],
  auxiliaryClueReactions: [
    '好眼力！這條線索不是主線，但能幫我們深入理解案情——收進筆記本。',
    '有意思。這個細節揭示了更多背景，值得深入追查。',
    '這條線索另有玄機，等一下我們再回來看。',
  ],
  clueLocked: '調查機會用完了。帶著目前的線索繼續推理吧。',
  clueHintMore: '還有關鍵線索沒找到，繼續調查吧。',

  // [NEW] 憐憫機制台詞
  // pityCategoryHint：連續失誤達 GAME.pityScanThreshold 次後觸發。
  // 接受一個 tag 字串（通常是 question.tags[1] 或最具體的那個），
  // 組成一句明確的分類提示。
  // 呼叫方式：DIALOGUE.pityCategoryHint(question.tags[1])
  // 範例輸出：「提示：這道題的關鍵與「台灣糖業」有關，試著往那個方向找。」
  pityCategoryHint: (tag: string) => `提示：這道題的關鍵與「${tag}」有關，試著往那個方向找。`,

  // [NEW] 掃描器台詞
  scanActivate: '🔍 掃描模式啟動，注意高亮的區域。',
  scanCooldownMsg: '掃描器冷卻中…',
  clueReady: '🔎 線索到手，開始推理',
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
  solutionAuxiliaryMissed: '現場其實還留有一條線索未採集…下次試試能否找到全部線索。',
  solutionAuxiliaryFound: '你連隱藏的背景線索也沒放過——真正的完美結案。',

  // 圖片
  figureExpand: '展開附圖',
  figureCollapse: '收合附圖',

  // [NEW] 偵探筆記本 UI 台詞
  notebookTitle: '偵探筆記本',
  notebookSubtitle: '這是我專門記錄關鍵細節的地方。只要在證詞中捕捉到可疑字詞，它們就會出現在這；集齊後，我就能鎖定嫌疑人了。',
  evidencePhotoReactions: [
    '別盯著照片看啦，真相隱含在『案件證詞』裡喔！',
    '照片只是參考。關掉筆記本，回主畫面找線索吧。',
    '證物已封存。請回到主畫面分析證詞內容。',
  ],
  insufficientEvidenceReactions: [
    '冷靜點！證據還不夠，回『案件證詞』再找找吧。',
    '別急著抓人！去主畫面證詞中揪出更多馬腳吧。',
    '指控還太早。請關掉筆記本，仔細比對證詞內容。',
  ],
  notebookCluesSection: '已收集的線索',
  notebookHintsSection: '偵探提示',
  notebookEmpty: '還沒有找到任何線索',
  notebookClose: '收合',
};

/** 成就判定（依序檢查，第一個符合的生效）
 *  參數：clues=找到線索數, total=全部線索數（含輔助）, misses=失誤次數, wrongs=答錯次數,
 *        auxFound=找到輔助線索數, auxTotal=輔助線索總數
 */
export const ACHIEVEMENTS = [
  { check: (clues: number, total: number, misses: number, wrongs: number, auxFound: number, auxTotal: number) => clues === total && misses === 0 && wrongs === 0 && auxFound === auxTotal, label: '完美偵探 🏆', color: 'text-amber-600 dark:text-amber-300' },
  { check: (clues: number, total: number, misses: number, wrongs: number, auxFound: number, auxTotal: number) => clues === total && misses === 0 && wrongs === 0 && auxTotal > 0 && auxFound < auxTotal, label: '優秀偵探 🔍', color: 'text-cyan-600 dark:text-cyan-300' },
  { check: (clues: number, total: number) => clues >= total * 0.75, label: '觀察敏銳', color: 'text-emerald-600 dark:text-emerald-300' },
  { check: () => true, label: '下次再仔細看看', color: 'text-slate-400 dark:text-white/40' },
];

/** 隨機選一個 */
export function pick(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
