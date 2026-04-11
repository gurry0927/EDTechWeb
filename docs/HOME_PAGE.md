# 首頁維護手冊

## 架構總覽

首頁是手遊風格的單頁應用，使用底部 Tab 切換面板，不換 URL。

```
page.tsx (組裝層 + 導航序列)
├── ThemeHero         Hero 區統一入口（自動讀 themeHeroes.ts）
│   ├── ImmersiveHero   沉浸式主題（video 背景 + 角色 + 視差）
│   └── SimpleHero      一般主題（emoji / 圖示）
├── ContinueButton    「繼續調查」/「開始第一案」
├── ModeSelector      遊戲模式選擇（讀 config/gameModes.ts）
├── AlbumPanel        圖鑑 tab
├── MePanel           我的 tab：主題切換 + 深色模式
└── BottomNav         底部固定 Tab 列
```

## 檔案清單

| 檔案 | 職責 | 改動頻率 |
|------|------|---------|
| `src/app/page.tsx` | 組裝 + theme state + 導航序列（衝擊波 → 轉頭 → 黑幕 → 跳轉） | 低 |
| `src/config/themeHeroes.ts` | 每個主題的 Hero 視覺設定 **唯一入口** | 中 |
| `src/config/themes.ts` | 主題基本資料（id/label/avatar/quote） | 低 |
| `src/components/home/ThemeHero.tsx` | Hero 框架：衝擊波圓環 + 分派 Immersive/Simple | 低 |
| `src/components/home/heroes/ImmersiveHero.tsx` | 沉浸式 Hero：video/視差/轉頭 crossfade | 低 |
| `src/components/home/heroes/SimpleHero.tsx` | 一般 Hero：emoji/PNG 圖示 | 低 |
| `src/components/home/ContinueButton.tsx` | 主按鈕，onNavigate prop | 低 |
| `src/components/home/ModeSelector.tsx` | 遊戲模式列，onNavigate prop | 低 |
| `src/components/home/MePanel.tsx` | 設定面板 | 中 |
| `src/components/home/useLastPlayed.ts` | localStorage hook | 低 |

---

## Hero 系統

### 新增/修改主題的 Hero 外觀

只改 **`src/config/themeHeroes.ts`**，框架自動套用。

#### Simple 主題（emoji 或 PNG 圖示）

```ts
myTheme: {
  variant: 'simple',
  // avatar 圖示從 themes.ts 的 avatar.detective 讀取
}
```

#### Immersive 主題（沉浸式 video 背景 + 全身角色）

```ts
guofeng: {
  variant: 'immersive',
  bgVideo: '/avatars/darksmoke.mp4',   // mixBlendMode: screen，黑底白煙最佳
  idleImage: '/avatars/Jianghu01.png', // 去背 PNG，待機姿勢
  lookImage: '/avatars/Jianghu02.png', // 去背 PNG，轉頭看鏡頭版（可選）

  // 版面
  charWidthVw: 100,     // 角色寬度（vw）。100 = 剛好填滿手機
  charMaxWidthPx: 448,  // 最大寬度（px），對齊 max-w-md，防平板爆版
  charTopDvh: 10,       // 角色頂端距螢幕頂部（dvh）。負數 = 頭部超出螢幕上方
  charOffsetX: 2,       // 水平偏移（vw），正右負左

  // 背景煙霧
  smokeOpacity: 0.55,   // 0~1，煙霧濃淡
  fadeSecs: 1.5,        // video loop 接縫淡出淡入秒數

  // 漸層遮罩（讓角色下半身消融入按鈕區）
  gradientHeightDvh: 20,  // 遮罩高度（dvh），越大越早開始消融
  gradientSolidAt: 60,    // 幾 % 位置變成完全不透明（0~100）
},
```

### 視差 / 2.5D 效果

- 桌面：滑鼠移動驅動
- 手機：陀螺儀（iOS 需一次點擊授權，Android 自動啟用）
- 效果：角色 `translateX/Y` + `rotateY/X`（最大 ±4deg），背景反向移動 30% 製造景深

---

## 衝擊波 + 頁面轉場

### 觸發時機

| 動作 | 效果 |
|------|------|
| 點「開始第一案」 | 衝擊波 + 轉頭 + 黑幕 → 跳轉 |
| 點遊戲模式按鈕 | 同上 |
| 點角色本身 | 轉頭（無衝擊波，無跳轉）|

### 導航序列時序

```
點擊 → 衝擊波圓環展開 + 角色轉頭（0ms）
      ↓ 600ms（讓轉頭 crossfade 完成）
      黑幕從左掃到右（350ms）
      ↓ 跳轉頁面
```

### 衝擊波參數（`globals.css`）

效果靈感來自霸王色（One Piece），柔邊金色光環往外擴散。

```css
/* 圓環主體用 radial-gradient 做柔邊環狀（非 border，不會有硬邊） */
background: radial-gradient(
  circle,
  transparent 35%,       /* 中心鏤空 */
  rgba(255,230,140,0.55) 48%,  /* 亮環峰值 — 金黃色 */
  rgba(255,180,60,0.35)  58%,  /* 外側暈散 */
  rgba(200,100,20,0.15)  70%,  /* 更外側 */
  transparent 85%        /* 完全消散 */
);

/* 兩層圓環（ring1 快、ring2 慢且更擴散） */
/* ring1：0.7s，scale 0.05 → 3.2，opacity 1 → 0 */
/* ring2：0.9s，delay 0.08s，scale 0.05 → 2.6 */

/* 閃光：radial-gradient 金黃光從中心爆開，0.45s 淡出 */
```

調整視覺強度：
- 更強烈 → 提高 `rgba` 第四個數值（透明度）
- 擴散更快 → 縮短 animation 秒數
- 顏色 → 調整 `rgba(255, 230, 140, ...)` 的 RGB 值（目前為金黃）

### 黑幕轉場參數

```css
/* 進場：scaleX 0 → 1，transformOrigin: left，0.35s */
/* 出場（如需）：scaleX 1 → 0，transformOrigin: right，0.3s */
background: #0a0806;  /* 深墨色，比純黑更符合江湖主題 */
```

---

## 導航設計

`ContinueButton` 和 `ModeSelector` 都接受 `onNavigate(href: string)` prop，不直接用 `<Link>`。
所有導航都集中在 `page.tsx` 的 `handleNavigate()`，方便統一加效果。

```ts
// page.tsx
const handleNavigate = (href: string) => {
  heroRef.current?.triggerImpact();   // 衝擊波 + 轉頭
  setTimeout(() => { /* 黑幕 wipe */ }, 600);
  setTimeout(() => { router.push(href); }, 950);
};
```

---

## 主題切換

首頁整頁包在 `data-dt-theme={theme}` 下，所有 `var(--dt-*)` 自動生效。

### 切換流程
1. 點角色 → `cycleTheme()` 輪換
2. 「我的」tab 選主題 → `handleThemeChange(id)`
3. 兩者都寫入 `localStorage('dt-theme')`

---

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

---

## 頂部快捷列（預留）

`ThemeHero` 頂部有左右兩個 flex 容器，預留給：
- 左側：公告、每日任務
- 右側：設定、通知、排行榜

iOS 陀螺儀引導卡片也可以放這裡，讓使用者點叉叉時自然觸發 `requestPermission()`。

---

## 響應式策略

`max-w-md mx-auto` + `h-[100dvh] overflow-hidden` — 任何裝置都是精確全螢幕，不滾動。
桌面版也用手機版 layout 置中，角色透過 `charMaxWidthPx` 限制最大尺寸。

---

## localStorage Key 一覽

| Key | 用途 | 寫入位置 |
|-----|------|---------|
| `dt-theme` | 遊戲主題（classic/cyber/guofeng） | page.tsx, MePanel |
| `dt-last-played` | 上次遊玩紀錄 | DetectiveGamePage |
| `theme` | 深色/淺色模式 | MePanel, ThemeToggle |
| `dt-tutorial-done` | 新手引導已完成 | question-detective/page.tsx |
| `gyro-permission` | iOS 陀螺儀已授權 | ImmersiveHero |
