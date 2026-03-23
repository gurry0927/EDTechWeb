# 台灣互動地圖模組 — 開發維護指南

> **給 AI 的硬性規則：**
> 新增課程時，只在 `src/lessons/` 建立新的 LessonConfig 檔案，
> 並在 `src/lessons/index.ts` 匯出、`src/app/taiwan-map/page.tsx` 的 LESSONS 陣列加入。
> **禁止修改 `src/components/taiwan-map/` 內任何檔案**，除非使用者明確要求修改核心模組。

---

## 1. 架構總覽

```
src/
├── components/taiwan-map/   ← 核心模組（不要動）
│   ├── types.ts             # 所有 TypeScript 介面定義
│   ├── themes.ts            # 主題預設：dark-tech / textbook / warm-earth
│   ├── defaults.ts          # 常量：SVG 尺寸、hover 效果、離島設定
│   ├── geometry.ts          # 純函式：多邊形分割、質心計算
│   ├── context.tsx          # React Context：hover 狀態、事件處理
│   ├── InteractiveMap.tsx   # 協調器：LessonConfig → 投影 → 渲染
│   ├── MapSvg.tsx           # SVG 容器：組合所有子元件
│   ├── MapDefs.tsx          # SVG filters / patterns
│   ├── MapBackground.tsx    # 背景網格、標題、裝飾角
│   ├── MapRegion.tsx        # 原子元件：單一互動區域
│   ├── MapMainland.tsx      # 本島渲染 + hover 置頂
│   ├── InsetBox.tsx         # 單一離島嵌入框
│   ├── MapInsets.tsx         # 所有離島嵌入框容器
│   ├── MapLabels.tsx        # 本島 hover 標籤
│   ├── MapLegend.tsx        # 圖例
│   └── index.ts             # 公開 API
│
├── lessons/                 ← 課程設定檔（在這裡開發）
│   ├── administrative.ts    # 行政區認識
│   ├── indigenous.ts        # 原住民族分布
│   └── index.ts             # 匯出所有 lesson
│
├── data/
│   └── taiwan.geo.json      # 簡化版 GeoJSON（22 縣市，123KB）
│
└── app/taiwan-map/
    └── page.tsx             # 頁面：含 lesson 切換按鈕
```

**資料流向：**
```
LessonConfig
  → InteractiveMap（處理 GeoJSON、建投影、拆子區域）
    → TaiwanMapProvider（Context：hover 狀態、主題）
      → MapSvg
        ├── MapDefs（SVG 濾鏡）
        ├── MapBackground（網格、標題）
        ├── MapMainland → MapRegion ×N
        ├── MapInsets → InsetBox ×N
        ├── MapLabels
        └── MapLegend
```

---

## 2. 新增一堂課程的步驟

### 步驟 1：建立 lesson 檔案

在 `src/lessons/` 新增檔案，例如 `geology.ts`：

```typescript
import type { LessonConfig } from '@/components/taiwan-map';
import { DEFAULT_INSETS, DEFAULT_LIENCHIANG_SPLIT } from '@/components/taiwan-map';

export const geologyLesson: LessonConfig = {
  id: 'geology',
  title: {
    primary: '台灣火成岩分布',
    secondary: 'VOLCANIC ROCK DISTRIBUTION',
  },
  theme: 'warm-earth',
  defaultInteraction: 'static',
  regions: {
    '澎湖縣': { interaction: 'interactive', fill: '#8B0000', hoverFill: '#B02020', group: '玄武岩' },
    // ...更多區域
  },
  subRegionSplits: [DEFAULT_LIENCHIANG_SPLIT],
  insets: DEFAULT_INSETS,
  legend: {
    title: '岩石類型',
    items: [
      { color: '#8B0000', label: '玄武岩' },
    ],
    position: 'bottom-right',
  },
};
```

### 步驟 2：匯出

在 `src/lessons/index.ts` 加一行：

```typescript
export { geologyLesson } from './geology';
```

### 步驟 3：加入頁面

在 `src/app/taiwan-map/page.tsx` 的 `LESSONS` 陣列加入：

```typescript
import { administrativeLesson, indigenousLesson, geologyLesson } from '@/lessons';

const LESSONS: LessonConfig[] = [administrativeLesson, indigenousLesson, geologyLesson];
```

完成。不需要改任何元件程式碼。

---

## 3. LessonConfig 完整欄位說明

```typescript
interface LessonConfig {
  id: string;                    // 唯一識別碼
  title: {
    primary: string;             // 主標題（例：台灣行政區域圖）
    secondary?: string;          // 副標題（例：TAIWAN ADMINISTRATIVE MAP）
    position?: { x, y };         // 標題位置，預設 (600, 55)
  };

  // ── 主題 ──
  theme: 'dark-tech' | 'textbook' | 'warm-earth' | MapTheme;
  //   dark-tech:  黑底藍光科技感（預設）
  //   textbook:   米白暖色教科書風格
  //   warm-earth: 深棕大地色系
  //   也可傳入自訂 MapTheme 物件

  // ── 區域行為 ──
  regions: Record<string, Partial<RegionConfig>>;
  //   key = GeoJSON 中的縣市名稱（例：'台北市'）或拆分後的子區域名稱
  //   只需列出「要覆寫預設行為」的區域，沒列的用 defaultInteraction

  defaultInteraction?: 'interactive' | 'static' | 'hidden';
  //   未在 regions 中列出的區域預設行為
  //   interactive = 可 hover + click
  //   static      = 看得到但不互動（灰顯）
  //   hidden      = 完全不渲染
  //   省略時預設 'interactive'

  // ── 子區域拆分 ──
  subRegionSplits?: SubRegionSplit[];
  //   將一個縣市的 MultiPolygon 按條件拆成多個獨立區域
  //   例：蘭嶼從台東拆出、東引從連江拆出
  //   連江拆分幾乎每堂課都需要，請 import DEFAULT_LIENCHIANG_SPLIT

  // ── 離島嵌入框 ──
  insets?: InsetConfig[];
  //   控制離島的位置、大小、投影範圍
  //   省略時使用 DEFAULT_INSETS（金門、澎湖、連江標準佈局）

  // ── 懸浮效果 ──
  hoverEffect?: {
    scale?: number;              // 懸浮放大倍率，預設 1.06
    transition?: string;         // CSS transition，預設彈性曲線
    leaveDelay?: number;         // 離開延遲 ms，預設 80（防抖動）
  };

  // ── 圖例 ──
  legend?: {
    title: string;
    items: Array<{ color: string; label: string }>;
    position?: 'top-right' | 'bottom-right' | 'bottom-left';
  };

  // ── 顯示名稱覆寫 ──
  displayNames?: Record<string, string>;
  //   GeoJSON 原始名稱 → 顯示名稱
  //   例：{ '桃園縣': '桃園市' }

  // ── 疊加圖層（介面已定義，渲染尚未實作）──
  overlays?: OverlayLayer[];

  // ── 回呼 ──
  callbacks?: {
    onRegionHover?: (regionId: string | null, data?) => void;
    onRegionClick?: (regionId: string, data?) => void;
  };
}
```

---

## 4. RegionConfig 每區域可控屬性

```typescript
// 在 LessonConfig.regions 中使用，所有欄位皆可選
{
  interaction: 'interactive' | 'static' | 'hidden',
  label: '顯示名稱',
  fill: '#色碼',           // 非 hover 填色
  hoverFill: '#色碼',      // hover 填色
  stroke: '#色碼',         // 非 hover 邊框
  hoverStroke: '#色碼',    // hover 邊框
  opacity: 0.5,            // 透明度 0~1
  group: '分組名稱',       // 對應圖例分組
  data: { 任意鍵值對 },    // hover/click 回傳給 callbacks 的資料
}
```

---

## 5. 子區域拆分（SubRegionSplit）

用於將一個縣市的多邊形按地理條件拆成獨立互動區域。

```typescript
{
  sourceCounty: '台東縣',                         // 要拆分的來源縣市
  classify: (center: [number, number]) => string, // 多邊形質心 → 區域名稱
  regions: {                                       // 拆分後各子區域的預設屬性
    '蘭嶼': { label: '蘭嶼（達悟族）' },
    '台東縣': { label: '台東縣' },
  },
}
```

**常用拆分判斷方式：**
- 經度判斷：`center[0] > 121.3` → 離島（蘭嶼/綠島在台東以東）
- 緯度判斷：`center[1] > 25.0` → 北部
- 連江縣固定用 `DEFAULT_LIENCHIANG_SPLIT`（經度 120.3 分東引/馬祖）

**注意：** 拆分後的子區域名稱就是新的 RegionId，在 `regions` 中用這個名稱設定屬性。

---

## 6. 主題系統

三套預設主題可透過字串選用：

| 名稱 | 風格 | 適用場景 |
|------|------|----------|
| `'dark-tech'` | 黑底 + 藍色光暈 + 網格 + 掃描線 | 科技感展示 |
| `'textbook'` | 米白 + 咖啡色 + 襯線字體 | 教科書風格 |
| `'warm-earth'` | 深棕 + 金色強調 | 地質/歷史主題 |

也可以傳入完整 `MapTheme` 物件自訂所有顏色。參考 `themes.ts` 中的預設主題結構。

---

## 7. GeoJSON 資料說明

`src/data/taiwan.geo.json` 包含 22 個縣市的 Feature：

```
台北市, 新北市, 基隆市, 桃園縣, 新竹縣, 新竹市, 苗栗縣,
台中市, 彰化縣, 南投縣, 雲林縣, 嘉義縣, 嘉義市, 台南市,
高雄市, 屏東縣, 宜蘭縣, 花蓮縣, 台東縣, 澎湖縣, 金門縣, 連江縣
```

**注意：** GeoJSON 中部分名稱為舊稱（如 `桃園縣`），用 `displayNames` 覆寫顯示名稱。
`regions` 的 key 必須使用 GeoJSON 中的原始名稱或拆分後的子區域名稱。

---

## 8. 常見開發情境對照

| 我想要… | 怎麼做 |
|---------|--------|
| 所有縣市都能互動 | `defaultInteraction: 'interactive'`，`regions: {}` |
| 只有部分縣市能互動 | `defaultInteraction: 'static'`，想互動的寫在 `regions` |
| 某縣市完全不顯示 | `regions: { '台北市': { interaction: 'hidden' } }` |
| 蘭嶼獨立於台東 | 加 `subRegionSplits`，用經度 121.3 分類 |
| 每個區域不同顏色 | 在 `regions` 對每區域設 `fill` 和 `hoverFill` |
| 加圖例 | 設定 `legend: { title, items, position }` |
| hover 時回傳資料 | 在 `regions` 設 `data`，在 `callbacks.onRegionHover` 接收 |
| 換整體風格 | 改 `theme` 為字串或自訂 `MapTheme` |
| 調整 hover 動畫 | 設定 `hoverEffect: { scale: 1.1, leaveDelay: 100 }` |
| 離島位置不同 | 自訂 `insets` 陣列（通常不需要，用 `DEFAULT_INSETS`） |

---

## 9. 尚未實作的功能

| 功能 | 介面位置 | 狀態 |
|------|----------|------|
| `overlays`（疊加圖層） | `LessonConfig.overlays` | 介面已定義，渲染元件未建立 |

需要時在 `src/components/taiwan-map/` 新增 `MapOverlays.tsx`，
在 `MapSvg.tsx` 中引入渲染。這是唯一需要改核心模組的預留擴充點。
