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
  detective: string;   // emoji 或未來的圖片 URL
  student: string;     // 預設學生頭像（未來被帳號系統覆蓋）
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
  homepageQuote: string;
}

export const THEME_REGISTRY: Record<string, ThemeEntry> = {
  classic: {
    id: 'classic',
    label: '📜 偵探社',
    desc: '經典牛皮紙風格',
    avatar: { detective: '/avatars/magnifier_mushimegane_blank.png', student: '🧑‍🎓' },
    photoClip: 'paperclip',
    cutscene: null,
    homepageQuote: '每道題都是一樁懸案，準備好了嗎？',
  },
  cyber: {
    id: 'cyber',
    label: '🔮 賽博',
    desc: '科技霓虹風格',
    avatar: { detective: '/avatars/computer_screen_programming.png', student: '👤' },
    photoClip: 'hidden',
    cutscene: null,
    homepageQuote: '數據流異常偵測中…等待指令。',
  },
  guofeng: {
    id: 'guofeng',
    label: '🏮 江湖',
    desc: '國風古韻・袁天罡',
    avatar: { detective: '/avatars/kabuto.png', student: '🧑‍🦱' },
    photoClip: 'hidden',
    cutscene: null,
    homepageQuote: '天道有序。此局，你可敢入？',
  },
};

export const VALID_THEME_IDS = Object.keys(THEME_REGISTRY);
export const THEME_LIST = Object.values(THEME_REGISTRY);
