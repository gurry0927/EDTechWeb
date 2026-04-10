/**
 * 遊戲模式設定 — 新增模式只改這裡
 *
 * locked: true 表示尚未上線（首頁顯示鎖頭）
 * href: 上線後填入路由路徑
 */

export interface GameMode {
  id: string;
  label: string;
  icon: string;
  href?: string;
  locked: boolean;
}

export const GAME_MODES: GameMode[] = [
  { id: 'detective', label: '偵探', icon: '🔍', href: '/question-detective', locked: false },
  { id: 'spy',       label: '臥底', icon: '🎭', locked: true },
  { id: 'bomb',      label: '拆彈', icon: '💣', locked: true },
  { id: 'decrypt',   label: '解密', icon: '🧩', locked: true },
];
