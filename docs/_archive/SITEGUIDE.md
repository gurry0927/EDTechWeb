# EDTech 網站開發指南

> **給 AI 的硬性規則：**
> 1. 不得在未與使用者討論的情況下修改網站框架結構（路由、佈局、設定系統）。
> 2. 新增科目或課程只需改設定檔，不需要動框架。
> 3. 新增全新功能（如登入、留言、測驗）前必須先與使用者確認方向。

---

## 1. 架構總覽

```
src/
├── config/                  ← 科目與課程設定（在這裡擴充）
│   ├── types.ts             # SubjectConfig / CourseConfig 型別
│   ├── subjects.ts          # 所有科目與課程的設定陣列
│   └── index.ts             # 匯出
│
├── app/                     ← 頁面路由
│   ├── layout.tsx           # 根佈局（語言、字體、metadata）
│   ├── page.tsx             # 首頁：科目卡片網格
│   ├── [subject]/
│   │   └── page.tsx         # 科目頁：該科的課程列表
│   └── taiwan-map/
│       └── page.tsx         # 課程頁：台灣互動地圖（全螢幕）
│
├── components/taiwan-map/   ← 台灣地圖核心模組（凍結，勿動）
│   └── DEVGUIDE.md          # 地圖模組開發指南
│
├── lessons/                 ← 地圖課程設定檔
│   ├── administrative.ts
│   ├── indigenous.ts
│   └── index.ts
│
└── data/                    ← 靜態資料（GeoJSON 等）
```

**頁面導覽流程：**
```
首頁 (/)
  → 科目頁 (/geography)
    → 課程頁 (/taiwan-map)  ← 全螢幕沉浸式教材
```

---

## 2. 新增科目

在 `src/config/subjects.ts` 的 `subjects` 陣列加入新物件即可：

```typescript
{
  id: 'math',
  name: '數學',
  description: '從基礎到進階的數學概念',
  icon: '📐',
  color: '#EC4899',
  courses: [],  // 先空著，之後再加課程
}
```

首頁和科目頁會自動顯示。沒有課程的科目會顯示「即將推出」。

---

## 3. 新增課程（到現有科目）

### 步驟 1：在 subjects.ts 加入課程設定

```typescript
{
  id: 'geography',
  name: '地理',
  // ...
  courses: [
    // 既有課程...
    {
      id: 'geology',
      title: '台灣地質構造',
      description: '認識台灣的板塊運動與岩石分布',
      path: '/geology',        // 課程頁面路由
      tags: ['互動', '地質'],
    },
  ],
}
```

### 步驟 2：建立課程頁面

在 `src/app/` 建立對應的路由資料夾和 `page.tsx`：

```
src/app/geology/page.tsx
```

如果是地圖類型的課程，頁面可以直接引用 InteractiveMap：

```typescript
'use client';
import { InteractiveMap } from '@/components/taiwan-map';
import { geologyLesson } from '@/lessons';

export default function GeologyPage() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-[#050510] flex items-center justify-center">
      <div className="w-full h-full max-w-[900px]">
        <InteractiveMap config={geologyLesson} />
      </div>
    </main>
  );
}
```

如果是其他類型的課程（影片、文字、測驗），自由建立元件即可。

---

## 4. 新增地圖課程（LessonConfig）

這部分請參閱 `src/components/taiwan-map/DEVGUIDE.md`，完整步驟：

1. 在 `src/lessons/` 建立新的設定檔
2. 在 `src/lessons/index.ts` 匯出
3. 在課程頁面中引用

---

## 5. SubjectConfig 完整欄位說明

```typescript
interface SubjectConfig {
  id: string;          // URL 路徑用，例如 'geography' → /geography
  name: string;        // 顯示名稱，例如 '地理'
  description: string; // 科目簡介
  icon: string;        // Emoji 圖示
  color: string;       // 強調色（卡片 hover 光暈、標籤顏色）
  courses: CourseConfig[];
}
```

## 6. CourseConfig 完整欄位說明

```typescript
interface CourseConfig {
  id: string;          // 課程識別碼
  title: string;       // 課程標題
  description: string; // 課程簡介
  path: string;        // 頁面路由，例如 '/taiwan-map'
  tags?: string[];     // 標籤（顯示在課程卡片上）
  immersive?: boolean; // 是否為全螢幕模式（預設 true）
}
```

---

## 7. 常見開發情境對照

| 我想要… | 怎麼做 |
|---------|--------|
| 新增一個科目 | 在 `subjects.ts` 的陣列加入新物件 |
| 幫科目加一堂課 | 在該科目的 `courses` 陣列加入，並建立頁面 |
| 新增地圖互動課程 | 建立 LessonConfig + 課程頁面（參閱 DEVGUIDE.md） |
| 新增非地圖課程 | 建立課程頁面，自由設計元件 |
| 改首頁標題或副標 | 修改 `src/app/page.tsx` 的 Hero 區 |
| 改科目顯示順序 | 調整 `subjects.ts` 陣列順序 |
| 加全站導覽列 | 在 `src/app/layout.tsx` 加入（需與使用者討論） |
| 加登入/帳號系統 | 需與使用者討論架構方向 |
| 改整體風格/主題 | 需與使用者討論設計方向 |

---

## 8. 凍結區域

以下目錄和檔案為穩定框架，**禁止在未與使用者討論的情況下修改**：

| 路徑 | 說明 |
|------|------|
| `src/components/taiwan-map/` | 台灣地圖核心模組 |
| `src/config/types.ts` | 型別定義 |
| `src/app/layout.tsx` | 根佈局 |

**可以自由修改的：**
- `src/config/subjects.ts` — 新增科目/課程
- `src/lessons/` — 新增地圖課程設定
- `src/app/*/page.tsx` — 新增或調整課程頁面

---

## 9. 設計風格備忘

- 背景：深色 `#0a0a0f`
- 卡片：半透明白邊框 `border-white/[0.06]`
- 強調色：每個科目有自己的 `color`，用於光暈和標籤
- hover 效果：微放大 `scale-[1.02]` + 邊框變亮
- 課程頁面：全螢幕沉浸式，右下角可切換投影模式
- 字體：Geist Sans（系統預設）
