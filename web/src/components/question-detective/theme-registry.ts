/**
 * 主題註冊表 — 新增主題的唯一入口（邏輯層）
 *
 * 新增主題步驟：
 * 1. 在此檔案加一筆 entry（id, label, desc, avatar, dialogue）
 * 2. 在 globals.css 加 [data-dt-theme="xxx"] { --dt-* } 變數區塊
 * 3. 完成（theme-utils, page.tsx, getDialogue 自動吃到）
 */

import type { Dialogue } from './detective-config';

export interface ThemeAvatar {
  detective: string;   // emoji 或未來的圖片 URL
  student: string;     // 預設學生頭像（未來被帳號系統覆蓋）
}

/** 切入演出風格 — 未來替換動畫/特效只改這裡 */
export interface CutsceneStyle {
  /** CSS class 加在最外層容器，用於主題特化動畫（如 'cutscene-glitch', 'cutscene-ink'） */
  className?: string;
  /** 閃光背景覆蓋（不填則用預設 --dt-accent gradient） */
  flashBg?: string;
  /** caseSolved 額外 CSS class（全屏演出專用） */
  solvedClass?: string;
  /** cluesReady 額外 CSS class（橫幅演出專用） */
  readyClass?: string;
}

export interface ThemeEntry {
  id: string;
  label: string;
  desc: string;
  avatar: ThemeAvatar;
  photoClip: 'paperclip' | 'hidden' | string;  // 'paperclip'=SVG迴紋針, 'hidden'=不顯示, 其他=emoji
  dialogue: Partial<Dialogue> | null;
  /** 切入演出風格 — null 則用預設動畫 */
  cutscene: CutsceneStyle | null;
  /** 首頁角色台詞 */
  homepageQuote: string;
}

// ── Cyber 台詞 ──

const DIALOGUE_CYBER: Partial<Dialogue> = {
  tabLabel: '機密',
  notebookTabLabel: '資料終端',
  notebookIcon: '💾',
  toggleExpandChat: '▼ 展開通訊頻道',
  toggleExpandStem: '▲ 展開數據面板',
  stemPhotoHint: '影像僅供參考，分析數據流中的文字。',
  stemHeader: '攔截數據',
  figureLabel: '附件掃描',
  suspectListHeader: '目標清單',

  intro: '資料封包已截獲。開始解析。',
  introWithFigure: '資料封包已截獲，附帶影像附件。📓 影像已載入右上方的資料終端，記得查閱。',
  introHint: '👆 掃描上方數據流中的異常節點',
  caseQuestionPrompt: '分析數據流，標記你認為與任務相關的關鍵字段！',
  clueMissReactions: [
    '這段數據沒有異常特徵，換個區段掃描。',
    '訊號正常。重新定位——哪些字段的數值偏離了基準？',
    '無效標記。再仔細比對，找出真正的異常點。',
    '這組數據沒有情報價值。聚焦到更具體的關鍵字。',
  ],
  contextHitReactions: [
    '偵測到次級訊號，但還不是核心數據。',
    '已記錄。繼續掃描主線索。',
    '背景參數已擷取，但還需要關鍵證據。',
  ],
  noiseHitReactions: [
    '這段是干擾訊號。',
    '運算資源消耗了，精準定位目標。',
    '錯誤標記，非目標數據。',
  ],
  clueReactions: ['數據吻合。', '訊號確認。', '精準擷取。', '關鍵數據鎖定。'],
  clueNotebookCTA: '📓 分析報告已寫入資料終端。',
  auxiliaryClueReactions: ['偵測到隱藏訊號——', '次級數據中有異常模式——', '值得深入解碼——'],
  auxiliaryNotebookCTA: '📓 已載入資料終端，檢查目標狀態是否更新。',
  reasoningWrongNotebookHint: '回資料終端交叉比對數據，重新推算。',
  clueLocked: '掃描配額耗盡。用現有數據推進分析。',
  idlePrompt: '👆 標記上方數據流中的異常節點！',
  auxScanBonus: '🔍 +1 掃描配額（次級數據獎勵）',
  identifyTooEarly: '請先完成邏輯驗證，再鎖定目標！',
  pityCategoryHint: (tag: string) => `系統提示：任務核心與「${tag}」高度相關，重新定位掃描範圍。`,
  scanActivate: '🔍 全頻掃描啟動，鎖定訊號源。',
  scanMissProtected: '掃描進行中——確認目標後再行動。',
  scanUsedUp: '掃描配額已用完（擷取次級數據可補充）',
  scanNudge: '💡 高亮區域偵測到異常訊號，嘗試標記。',
  clueReady: '🔎 數據就緒，啟動推理引擎',
  clueForceAdvance: '以現有數據推進 →',
  reasoningIntro: '數據擷取完成。啟動邏輯驗證程序。',
  reasoningAskEvidence: '指出數據流中支持此結論的證據節點',
  reasoningPointingBanner: '在數據流中指認支持推理的證據節點',
  wrongEvidence: ['此數據與結論無直接關聯。', '驗證失敗，重新比對證據鏈。', '定位錯誤——哪個節點才是關鍵？'],
  reasoningDone: '邏輯驗證完成！',
  reasoningDoneAction: '啟動最終鎖定——指認目標。',
  answerPrompt: '啟動最終鎖定——指認目標。',
  answerWrongSuffix: '目標不符。重新比對數據鏈。',
  answerCorrect: '🎯 目標鎖定！',
  answerCorrectSuffix: '驗證通過。',
  cutsceneCaseSolved: 'TARGET LOCKED',
  cutsceneCaseSolvedSub: '驗證通過。任務完成。',
  cutsceneCluesReady: '數據就緒',
  cutsceneCluesReadySub: '啟動推理引擎。',
  gameOverTakeover: '能量耗盡。系統接管，自動完成分析。',
  solutionGameOver: '⚠️ 系統自動結案',
  solutionMissedLabel: '🔍 未擷取的數據節點：',
  solutionAuxiliaryMissed: '資料庫中仍有一筆未擷取的隱藏數據…下次提升掃描效率。',
  solutionAuxiliaryFound: '所有隱藏節點均已擷取——完美的數據分析。',
  notebookTitle: '資料終端',
  notebookSubtitle: '此終端記錄所有已擷取的數據節點。收集完整數據鏈後，即可鎖定目標。',
  evidencePhotoReactions: ['影像僅供參考。關閉終端，回到主介面分析數據。', '附件已歸檔。返回數據流比對異常點。', '影像掃描完成。請回到主畫面繼續標記。'],
  insufficientEvidenceReactions: ['數據不足！返回主介面繼續擷取。', '證據鏈不完整。回數據流中補齊節點。', '尚未達到鎖定閾值。繼續掃描。'],
  notebookCluesSection: '已擷取數據',
  notebookHintsSection: '系統提示',
  notebookEmpty: '尚未擷取任何數據節點',
};

// ── 國風（袁天罡 · 不良帥）台詞 ──

const DIALOGUE_GUOFENG: Partial<Dialogue> = {
  tabLabel: '密令',
  notebookTabLabel: '天機卷',
  notebookIcon: '📜',
  toggleExpandChat: '▼ 聽取匯報',
  toggleExpandStem: '▲ 翻閱卷宗',
  stemPhotoHint: '圖錄僅為佐證，關竅在文字之中。',
  stemHeader: '案卷密令',
  figureLabel: '物證圖錄',
  suspectListHeader: '嫌犯名冊',

  intro: '天道有序，線索已現。這局棋，你可有膽量下完？',
  introWithFigure: '案卷送達，另附物證圖錄一份。📜 圖錄已收入右上方的天機卷中，記得翻閱。',
  introHint: '👆 點選上方案卷中你認為蹊蹺之處',
  caseQuestionPrompt: '細觀此卷，找出其中與案情相關的關竅所在！',
  clueMissReactions: [
    '此等低劣障眼法也能亂你心智？朽木不可雕。',
    '看錯了。天機自有脈絡，豈是你隨意亂點能窺破的？',
    '無用之功。再看——哪處文字暗藏玄機？',
    '這般愚鈍，連門檻都摸不著。再仔細看。',
  ],
  contextHitReactions: [
    '有幾分眼力……但這不過是皮毛。',
    '記下了，但離真相尚遠。',
    '此線索有用，卻非破局之鑰。',
  ],
  noiseHitReactions: [
    '廢物。此處與案情何干？',
    '白費氣力。本帥勸你省著點機會。',
    '連真假都分不清？可笑。',
  ],
  clueReactions: ['意料之外……你竟能抓到這絲天機。', '嗯。', '倒有幾分機敏。', '不錯，此處確是關竅。'],
  clueNotebookCTA: '📜 此線索已錄入天機卷，去看看吧。',
  auxiliaryClueReactions: ['哦？你連這都注意到了——', '有趣……此處暗流涌動——', '此線索另有深意——'],
  auxiliaryNotebookCTA: '📜 已錄入天機卷，看看嫌犯名冊是否有了變化。',
  reasoningWrongNotebookHint: '回天機卷再看看，或許能找到蛛絲馬跡。',
  clueLocked: '機會已盡。帶著手中的線索，繼續推演吧。',
  idlePrompt: '👆 案卷就在眼前，還不動手？',
  auxScanBonus: '🔍 +1 天眼（隱線索之賞）',
  identifyTooEarly: '急什麼？推演未畢，便想定罪？',
  pityCategoryHint: (tag: string) => `本帥提點你一句：此案的關竅，與「${tag}」脫不了干係。`,
  scanActivate: '🔍 且讓本帥替你開一回天眼。眾生皆苦，唯我獨醒。',
  scanMissProtected: '天眼已開——看清楚了再出手。',
  scanUsedUp: '天眼次數已盡（尋得隱線索可補回）',
  scanNudge: '💡 發光之處自有天機，還不快點？',
  clueReady: '🔍 線索已齊，開始推演',
  clueForceAdvance: '以現有線索推演 →',
  reasoningIntro: '好。既已蒐集線索，本帥有幾問，你且答來。',
  reasoningWrongPrefix: '錯了。',
  reasoningCorrectMsg: '算你答對。',
  reasoningAskEvidence: '指出案卷中支持此論斷的證據',
  reasoningPointingBanner: '在案卷中指認支持你推論的證據',
  wrongEvidence: ['此物與結論毫無干係。', '牛頭不對馬嘴。再想。', '指鹿為馬——哪條線索才是真憑實據？'],
  evidenceSuccess: '✓ 指證無誤。',
  reasoningDone: '推演完畢。',
  reasoningDoneAction: '真相只有一個——指認你的答案吧。',
  answerPrompt: '萬象歸一。指出你的答案。',
  answerWrongPrefix: '荒謬。',
  answerWrongSuffix: '此非正解。回頭看看你方才的推演。',
  answerCorrect: '🏮 真相大白。',
  answerCorrectSuffix: '能入本帥眼簾，你，勉強算個人才。',
  cutsceneCaseSolved: '真相大白',
  cutsceneCaseSolvedSub: '天網恢恢，疏而不漏。',
  cutsceneCluesReady: '天機已現',
  cutsceneCluesReadySub: '且看你如何推演。',
  gameOverTakeover: '庸才。既無轉乾坤之力，這殘局，便由本帥親自終結。',
  solutionGameOver: '⚠️ 天罡代為結案',
  solutionConceptLabel: '此題考的是：',
  solutionStepsLabel: '📋 推演脈絡：',
  solutionMistakesLabel: '⚠️ 世人常犯之誤：',
  solutionMissedLabel: '🔍 你遺漏的線索：',
  solutionAuxiliaryMissed: '案卷之中仍有一絲天機未被拾取……下次莫要如此粗心。',
  solutionAuxiliaryFound: '竟連隱伏的暗線都不曾放過——倒是個可造之材。',
  notebookTitle: '天機卷',
  notebookSubtitle: '此卷記錄你所蒐得的一切線索。集齊天機，方能鎖定真兇。',
  evidencePhotoReactions: ['圖錄只是佐證。合上天機卷，回案卷中細查。', '物證已歸檔。回去看案卷吧。', '看夠了？回到案卷繼續查案。'],
  insufficientEvidenceReactions: ['線索不足，便想結案？回去再查。', '急躁。回案卷中補齊線索再來。', '證據不夠，定不了罪。繼續查。'],
  notebookCluesSection: '已蒐線索',
  notebookHintsSection: '天罡提點',
  notebookEmpty: '尚未蒐得任何線索',
};

// ── Registry ──

export const THEME_REGISTRY: Record<string, ThemeEntry> = {
  classic: {
    id: 'classic',
    label: '📜 偵探社',
    desc: '經典牛皮紙風格',
    avatar: { detective: '🕵️', student: '🧑‍🎓' },
    photoClip: 'paperclip',
    dialogue: null,
    cutscene: null,
    homepageQuote: '每道題都是一樁懸案，準備好了嗎？',
  },
  cyber: {
    id: 'cyber',
    label: '🔮 賽博',
    desc: '科技霓虹風格',
    avatar: { detective: '🤖', student: '👤' },
    photoClip: 'hidden',
    dialogue: DIALOGUE_CYBER,
    cutscene: null,
    homepageQuote: '數據流異常偵測中…等待指令。',
  },
  guofeng: {
    id: 'guofeng',
    label: '🏮 江湖',
    desc: '國風古韻・袁天罡',
    avatar: { detective: '🧙‍♂️', student: '🧑‍🦱' },
    photoClip: 'hidden',
    dialogue: DIALOGUE_GUOFENG,
    cutscene: null,
    homepageQuote: '天道有序。此局，你可敢入？',
  },
};

export const VALID_THEME_IDS = Object.keys(THEME_REGISTRY);
export const THEME_LIST = Object.values(THEME_REGISTRY);
