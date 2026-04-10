// ── 題目偵探：集中設定檔 ──
// 新增題目只需要加 JSON，這裡控制遊戲參數、台詞、成就判定。

/** 遊戲參數（所有 magic number 集中管理，Player 不應出現裸數字） */
export const GAME = {
  maxLives: 5,
  typingDelay: { short: 400, medium: 700, long: 1000, intro: 1800 } as const,
  scrollDelay: 300,
  // 焦點模式高度
  stemDefaultHeight: '25dvh',     // 進場分割模式
  stemExpandedHeight: '55dvh',    // 展開（掃描/指證/stem 模式）
  stemCollapsedHeight: '4dvh',    // chat 模式時題幹收合
  viewTransitionMs: 700,          // 焦點模式切換動畫時間（配合 CSS .view-transition）
  toastDuration: 4000,

  // 階段轉場延遲
  reasoningAdvanceDelay: 600,   // 推理答對 → 下一題
  reasoningSkipDelay: 500,      // 無推理線索 → 跳至 answer
  answerAdvanceDelay: 800,      // 答對/推理完 → 下一階段
  gameOverDelay: 1800,          // game over → solution 延遲

  // 閒置提示
  idleDelay: 8000,              // 無操作多久後觸發閒置提示
  scaffoldPulseTimeout: 30000,  // 鷹架跳動最長持續時間

  // 掃描器（放大鏡模式）
  scanSweepDuration: 3600,      // 掃光動畫時間（1.8s × 2）
  scanInitialUses: 1,
  scanNudgeDelay: 15000,        // 掃描中無操作提示延遲
  scanAutoExitDelay: 30000,     // 掃描中無操作自動退出

  // 動畫時間
  notebookCloseDuration: 260,   // 筆記本關閉動畫
  pointingFlashDuration: 900,   // 指認階段題幹閃爍
  clueFlightDuration: 560,      // 線索飛向筆記本動畫
  lifeLossFeedbackDuration: 1000, // 扣血 "-1" 動畫

  // 憐憫機制
  pityScanThreshold: 3,         // 連續失誤幾次觸發提示
};

/** 偵探台詞 — base（classic 主題） */
const DIALOGUE_BASE = {
  // UI 標籤
  tabLabel: '機密',
  notebookTabLabel: '偵探筆記本',
  toggleExpandChat: '▼ 展開聊天室',
  toggleExpandStem: '▲ 展開卷宗',
  stemPhotoHint: '照片僅供參考，線索藏在文字裡喔！',
  notebookIcon: '📓',
  stemHeader: '案件証詞',
  figureLabel: '証物細節',
  suspectListHeader: '嫌疑犯名單',

  // 線索階段
  intro: '案件送達！一份証詞送到了偵探社。',
  introWithFigure: '案件送達！一份証詞送到了偵探社，另附有照片證物。📓 照片已收進右上方的偵探筆記本，記得翻開來看。',
  introHint: '👆 點選上方證詞中你覺得可疑的字詞',
  caseQuestionPrompt: '仔細閱讀上方證詞，點擊你認為證詞中和案件相關的關鍵字詞！',
  clueMissReactions: [
    '這裡似乎只是背景細節，試著找找能決定「時間」或「位置」的關鍵詞？',
    '冷靜點，偵探。觀察一下，這個片段對案件的進展有幫助嗎？',
    '沒什麼特別的。再仔細讀讀看，哪些資訊是解開謎題必不可少的？',
    '直覺告訴我，這不是我們要找的關鍵。往更具體的名詞看。',
  ],

  // 分層回饋
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
  clueNotebookCTA: '📓 詳細分析已記入偵探筆記本。',
  auxiliaryClueReactions: [
    '好眼力！這條線索另有玄機——',
    '有意思，這個細節能說明更多——',
    '值得深入追查——',
  ],
  auxiliaryNotebookCTA: '📓 已收進偵探筆記本，去看看嫌疑犯的情況有沒有變化。',
  reasoningWrongNotebookHint: '再去筆記本確認一下線索的分析，也許能找到方向。',
  clueLocked: '調查機會用完了。帶著目前的線索繼續推理吧。',
  idlePrompt: '👆 點擊上方証詞中可疑的字詞！',
  auxScanBonus: '🔍 +1 掃描機會（輔助線索獎勵）',
  identifyTooEarly: '請先完成推理分析，再指認嫌疑犯！',

  // 憐憫機制
  pityCategoryHint: (tag: string) => `提示：這道題的關鍵與「${tag}」有關，試著往那個方向找。`,

  // 掃描器
  scanActivate: '🔍 掃描模式啟動，注意高亮的區域。',
  scanMissProtected: '掃描中，先別亂動——仔細看清楚再出手。',
  scanUsedUp: '掃描次數已用完（找到輔助線索可補充）',
  scanNudge: '💡 發光的地方藏著線索，試著點點看！',
  clueReady: '🔎 線索到手，開始推理',
  clueForceAdvance: '帶著現有線索繼續 →',

  // 推理
  reasoningIntro: '好，根據你找到的線索，我有幾個問題要確認。',
  reasoningWrongPrefix: '不太對。',
  reasoningCorrect: '✓',
  reasoningCorrectMsg: '方向正確！',
  reasoningAskEvidence: '請指出題目中支持這個結論的證據',
  reasoningPointingBanner: '請在題目中指認支持你推理的證據',
  wrongEvidence: [
    '嗯⋯這條線索好像跟結論沒有直接關係。',
    '不太對，這個無法佐證你的推理。',
    '再想想，哪個線索才是關鍵證據？',
  ],
  evidenceSuccess: '✓ 指證成功！',
  reasoningDone: '推理完成！',
  reasoningDoneAction: '真相只有一個——指認你的答案吧。',

  // 作答
  answerPrompt: '真相只有一個——指認你的答案吧。',
  answerWrongPrefix: '不對。',
  answerWrongSuffix: '不是正確答案。再看看線索，想想你剛才的推理。',
  answerCorrect: '🎉 破案了！',
  answerCorrectSuffix: '完全正確。',

  // 偵探接管
  gameOverTakeover: '調查機會耗盡。這次就由我來替你整理案情吧。',
  solutionGameOver: '⚠️ 偵探代為結案',

  // 結案報告
  solutionConceptLabel: '這題考的是：',
  solutionExtendLabel: '💡 延伸思考：',
  solutionStepsLabel: '📋 完整推理：',
  solutionMistakesLabel: '⚠️ 常見錯誤：',
  solutionMissedLabel: '🔍 你漏掉的線索：',
  solutionAuxiliaryMissed: '現場其實還留有一條線索未採集…下次試試能否找到全部線索。',
  solutionAuxiliaryFound: '你連隱藏的背景線索也沒放過——真正的完美結案。',

  // 筆記本
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
};

export type Dialogue = typeof DIALOGUE_BASE;

/** 根據主題取得台詞（overlay merge 到 base） */
export function getDialogue(theme: string, overlay?: Partial<Dialogue> | null): Dialogue {
  if (overlay) return { ...DIALOGUE_BASE, ...overlay } as Dialogue;
  return DIALOGUE_BASE;
}

/** 向後相容：預設 classic */
export const DIALOGUE = DIALOGUE_BASE;

/** 成就判定（依序檢查，第一個符合的生效）
 *  參數：clues=找到線索數, total=全部線索數（含輔助）, misses=失誤次數, wrongs=答錯次數,
 *        auxFound=找到輔助線索數, auxTotal=輔助線索總數
 */
export const ACHIEVEMENTS = [
  { check: (clues: number, total: number, misses: number, wrongs: number, auxFound: number, auxTotal: number, gameOver: boolean) => !gameOver && clues === total && misses === 0 && wrongs === 0 && auxFound === auxTotal, label: '完美偵探 🏆', color: 'text-dt-clue' },
  { check: (clues: number, total: number, misses: number, wrongs: number, auxFound: number, auxTotal: number, gameOver: boolean) => !gameOver && clues === total && misses === 0 && wrongs === 0 && auxTotal > 0 && auxFound < auxTotal, label: '優秀偵探 🔍', color: 'text-dt-scan' },
  { check: (clues: number, total: number, misses: number, wrongs: number, auxFound: number, auxTotal: number, gameOver: boolean) => !gameOver && clues >= total * 0.75, label: '觀察敏銳', color: 'text-dt-success' },
  { check: (_c: number, _t: number, _m: number, _w: number, _a: number, _at: number, gameOver: boolean) => gameOver, label: '偵探接管結案', color: 'text-dt-error' },
  { check: () => true, label: '下次再仔細看看', color: 'text-dt-text-muted' },
];

/** 隨機選一個 */
export function pick(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }
