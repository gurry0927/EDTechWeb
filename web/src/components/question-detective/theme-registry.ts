/**
 * 主題註冊表 — 新增主題的唯一入口（邏輯層）
 *
 * 新增主題步驟：
 * 1. 在此檔案加一筆 entry（id, label, desc, dialogue）
 * 2. 在 globals.css 加 [data-dt-theme="xxx"] { --dt-* } 變數區塊
 * 3. 完成（theme-utils, page.tsx, getDialogue 自動吃到）
 */

import type { Dialogue } from './detective-config';

export interface ThemeEntry {
  id: string;
  label: string;        // 切換按鈕顯示（含 emoji）
  desc: string;         // tooltip 描述
  dialogue: Partial<Dialogue> | null;  // null = 使用 base dialogue
}

// ── Dialogue overlays ──

const DIALOGUE_CYBER: Partial<Dialogue> = {
  tabLabel: '機密',
  notebookTabLabel: '資料終端',
  notebookIcon: '💾',
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
  auxiliaryClueReactions: [
    '偵測到隱藏訊號——',
    '次級數據中有異常模式——',
    '值得深入解碼——',
  ],
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
  wrongEvidence: [
    '此數據與結論無直接關聯。',
    '驗證失敗，重新比對證據鏈。',
    '定位錯誤——哪個節點才是關鍵？',
  ],
  reasoningDone: '邏輯驗證完成！',
  reasoningDoneAction: '啟動最終鎖定——指認目標。',

  answerPrompt: '啟動最終鎖定——指認目標。',
  answerWrongSuffix: '目標不符。重新比對數據鏈。',
  answerCorrect: '🎯 目標鎖定！',
  answerCorrectSuffix: '驗證通過。',

  gameOverTakeover: '能量耗盡。系統接管，自動完成分析。',
  solutionGameOver: '⚠️ 系統自動結案',
  solutionMissedLabel: '🔍 未擷取的數據節點：',
  solutionAuxiliaryMissed: '資料庫中仍有一筆未擷取的隱藏數據…下次提升掃描效率。',
  solutionAuxiliaryFound: '所有隱藏節點均已擷取——完美的數據分析。',

  notebookTitle: '資料終端',
  notebookSubtitle: '此終端記錄所有已擷取的數據節點。收集完整數據鏈後，即可鎖定目標。',
  evidencePhotoReactions: [
    '影像僅供參考。關閉終端，回到主介面分析數據。',
    '附件已歸檔。返回數據流比對異常點。',
    '影像掃描完成。請回到主畫面繼續標記。',
  ],
  insufficientEvidenceReactions: [
    '數據不足！返回主介面繼續擷取。',
    '證據鏈不完整。回數據流中補齊節點。',
    '尚未達到鎖定閾值。繼續掃描。',
  ],
  notebookCluesSection: '已擷取數據',
  notebookHintsSection: '系統提示',
  notebookEmpty: '尚未擷取任何數據節點',
};

// ── Registry ──

export const THEME_REGISTRY: Record<string, ThemeEntry> = {
  classic: {
    id: 'classic',
    label: '📜 偵探社',
    desc: '經典牛皮紙風格',
    dialogue: null, // 使用 DIALOGUE_BASE
  },
  cyber: {
    id: 'cyber',
    label: '🔮 賽博',
    desc: '科技霓虹風格',
    dialogue: DIALOGUE_CYBER,
  },
  // 新增主題範例：
  // retro: {
  //   id: 'retro',
  //   label: '🕹️ 復古',
  //   desc: '像素風 8-bit',
  //   dialogue: DIALOGUE_RETRO,
  // },
};

/** 所有合法主題 ID */
export const VALID_THEME_IDS = Object.keys(THEME_REGISTRY);

/** 給切換 UI 用的陣列 */
export const THEME_LIST = Object.values(THEME_REGISTRY);
