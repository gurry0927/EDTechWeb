# 首頁維護手冊

## 架構總覽

首頁是手遊風格的單頁應用，使用底部 Tab 切換面板，不換 URL。

```
page.tsx (組裝層)
├── CharacterHero     角色立繪 + 台詞 + 主題指示器
├── ContinueButton    「繼續調查」/「開始第一案」
├── ModeSelector      遊戲模式選擇（讀 config/gameModes.ts）
├── AlbumPanel        圖鑑 tab：收集冊(佔位) + 學習工具
├── MePanel           我的 tab：主題切換 + 深色模式
└── BottomNav         底部固定 Tab 列
```

## 檔案清單

| 檔案 | 職責 | 改動頻率 |
|------|------|---------|
| `src/app/page.tsx` | 組裝 + theme state + tab 狀態 | 低 |
| `src/components/home/CharacterHero.tsx` | 角色區（佔 42dvh），點擊切換主題 | 中 |
| `src/components/home/ContinueButton.tsx` | 主按鈕，讀 localStorage `dt-last-played` | 低 |
| `src/components/home/ModeSelector.tsx` | 遊戲模式列，讀 `config/gameModes.ts` | 低 |
| `src/components/home/BottomNav.tsx` | 底部 Tab（首頁/圖鑑/我的） | 低 |
| `src/components/home/AlbumPanel.tsx` | 圖鑑面板，讀 `config/subjects.ts` | 中 |
| `src/components/home/MePanel.tsx` | 設定面板，讀 `config/themes.ts` | 中 |
| `src/components/home/useLastPlayed.ts` | localStorage hook | 低 |

## 新增遊戲模式

只改 `src/config/gameModes.ts`：

```ts
export const GAME_MODES: GameMode[] = [
  { id: 'detective', label: '偵探', icon: '🔍', href: '/question-detective', locked: false },
  { id: 'spy',       label: '臥底', icon: '🎭', locked: true },  // ← 上線時改 locked + 加 href
  // 新增模式加在這裡
];
```

`ModeSelector` 自動渲染，不需改元件。

## 新增底部 Tab

修改 `BottomNav.tsx` 的 `TABS` 陣列 + `page.tsx` 的 `Tab` type 和面板渲染。

## 主題切換

首頁整頁包在 `data-dt-theme={theme}` 下，所有 `var(--dt-*)` 自動生效。

### 切換流程
1. 使用者點角色 → `cycleTheme()` 輪換
2. 使用者在「我的」tab 選主題 → `handleThemeChange(id)`
3. 兩者都寫入 `localStorage('dt-theme')`
4. 角色、台詞、背景、accent 色全部跟著變

## 「繼續調查」按鈕

### 資料來源
- `DetectiveGamePage.tsx` 進入遊戲時寫入 `localStorage('dt-last-played')`
- `useLastPlayed.ts` 讀取並顯示

### 資料格式
```json
{
  "questionId": "114-social-geography-02",
  "questionTitle": "114年會考-社會-第2題",
  "theme": "guofeng",
  "timestamp": 1712736000000
}
```

## 頂部快捷列（預留）

`CharacterHero.tsx` 頂部有左右兩個 flex 容器，預留給：
- 左側：公告、每日任務
- 右側：設定、通知、排行榜

## 響應式策略

`max-w-md mx-auto` — 桌面也用手機版 layout 置中。這是遊戲不是官網。

## localStorage Key 一覽

| Key | 用途 | 寫入位置 |
|-----|------|---------|
| `dt-theme` | 遊戲主題（classic/cyber/guofeng） | page.tsx, MePanel |
| `dt-last-played` | 上次遊玩紀錄 | DetectiveGamePage |
| `theme` | 深色/淺色模式 | MePanel, ThemeToggle |
| `dt-tutorial-done` | 新手引導已完成 | question-detective/page.tsx |
