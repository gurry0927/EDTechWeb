/**
 * 全站主題系統 — 主題定義的唯一入口
 *
 * 主題是全站共用資源，不屬於任何單一遊戲模組。
 * 遊戲專屬台詞（dialogue）仍定義在各模組的 theme-registry 中，
 * 這裡只管主題的通用屬性。
 *
 * 新增主題步驟：
 * 1. 在此檔案加一筆 ThemeEntry
 * 2. 在 globals.css 加 [data-dt-theme="xxx"] { --dt-* } 變數區塊
 * 3. 完成（theme-utils, 首頁, 各模組自動吃到）
 */

export const DEFAULT_THEME = 'classic';

export interface ThemeAvatar {
  detective: string;   // emoji 或圖片路徑
  student: string;
}

/** 切入演出風格 — 未來替換動畫/特效只改這裡 */
export interface CutsceneStyle {
  className?: string;
  flashBg?: string;
  solvedClass?: string;
  readyClass?: string;
}

export interface ThemeEntry {
  id: string;
  label: string;
  desc: string;
  avatar: ThemeAvatar;
  photoClip: 'paperclip' | 'hidden' | string;
  cutscene: CutsceneStyle | null;
  quotes: string[];
}

export const THEME_REGISTRY: Record<string, ThemeEntry> = {
  classic: {
    id: 'classic',
    label: '📜 偵探社',
    desc: '經典牛皮紙風格',
    avatar: { detective: '/avatars/magnifier_mushimegane_blank.png', student: '🧑‍🎓' },
    photoClip: 'paperclip',
    cutscene: null,
    quotes: [
      '每道題都是一樁懸案，準備好了嗎？',
      '線索就在眼前，你發現了嗎？',
      '推理是一門藝術，也是一種直覺。',
      '好偵探從不放過任何細節。',
    ],
  },
  cyber: {
    id: 'cyber',
    label: '🔮 賽博',
    desc: '科技霓虹風格',
    avatar: { detective: '/avatars/computer_screen_programming.png', student: '👤' },
    photoClip: 'hidden',
    cutscene: null,
    quotes: [
      '數據流異常偵測中…等待指令。',
      '系統掃描完畢，目標已鎖定。',
      '邏輯是唯一的武器。',
      '在這個世界，代碼即是真相。',
    ],
  },
  guofeng: {
    id: 'guofeng',
    label: '🏮 江湖',
    desc: '國風古韻・袁天罡',
    avatar: { detective: '/avatars/war_etsuou_kousenken.png', student: '🧑‍🦱' },
    photoClip: 'hidden',
    cutscene: null,
    quotes: [
      '天道有序。此局，你可敢入？',
      '萬象皆有因果，細察方知真相。',
      '靜觀其變，勝在洞察。',
      '江湖路遠，智者先行。',
    ],
  },
};

export const VALID_THEME_IDS = Object.keys(THEME_REGISTRY);
export const THEME_LIST = Object.values(THEME_REGISTRY);
