# EDTech 開發指南 — 從這裡開始

> **給 AI 助手：** 每次接續開發前，請先閱讀本文件，再依據任務類型閱讀對應的詳細指南。
> **給人類開發者：** 這份文件整理了所有你需要知道的入口，5 分鐘就能上手。

---

## 快速啟動

```bash
cd web
npm install
npm run dev          # http://localhost:3000
```

部署：推到 GitHub main 分支，Vercel 會自動部署。

---

## 專案結構

```
web/
├── docs/                        ← 📚 所有開發文件都在這
│   ├── START_HERE.md            # 你正在看的這份（總入口）
│   ├── SITEGUIDE.md             # 網站框架開發指南
│   └── TAIWAN-MAP-DEVGUIDE.md   # 台灣互動地圖模組開發指南
│
├── src/
│   ├── config/                  ← 科目與課程設定（擴充點）
│   │   ├── types.ts             # 型別定義（凍結）
│   │   ├── subjects.ts          # 科目/課程陣列（在這裡加新科目）
│   │   └── index.ts
│   │
│   ├── app/                     ← 頁面路由
│   │   ├── layout.tsx           # 根佈局（凍結）
│   │   ├── page.tsx             # 首頁
│   │   ├── [subject]/page.tsx   # 科目頁（動態路由）
│   │   └── taiwan-map/page.tsx  # 台灣地圖課程頁
│   │
│   ├── components/
│   │   ├── taiwan-map/          # 台灣地圖核心模組（凍結）
│   │   └── ThemeToggle.tsx      # 淺深色切換
│   │
│   ├── lessons/                 ← 地圖課程設定（擴充點）
│   │   ├── administrative.ts
│   │   ├── indigenous.ts
│   │   └── index.ts
│   │
│   └── data/                    ← 靜態資料
│       └── taiwan.geo.json
│
├── CLAUDE.md                    # AI 硬性規則（自動載入）
└── AGENTS.md                    # Next.js agent 規則
```

---

## 凍結區域（不要動）

以下檔案/資料夾已經穩定，**除非使用者明確要求，否則禁止修改**：

| 路徑 | 說明 |
|------|------|
| `src/components/taiwan-map/` | 台灣地圖核心模組（14 個檔案） |
| `src/config/types.ts` | SubjectConfig / CourseConfig 型別 |
| `src/app/layout.tsx` | 根佈局、主題切換、字體設定 |

---

## 依任務類型閱讀對應指南

### 「我要新增一個科目」
→ 閱讀 **`docs/SITEGUIDE.md`** 第 2 節

簡單版：在 `src/config/subjects.ts` 的陣列加一個物件就完成。

### 「我要幫某科目加一堂課」
→ 閱讀 **`docs/SITEGUIDE.md`** 第 3 節

兩步：1) subjects.ts 加課程設定  2) 建立課程頁面

### 「我要新增一堂地圖互動課程」
→ 閱讀 **`docs/TAIWAN-MAP-DEVGUIDE.md`** 第 2 節

三步：1) 在 `src/lessons/` 建立 LessonConfig  2) index.ts 匯出  3) 課程頁面引用

### 「我要改網站風格/加功能」
→ 先與使用者討論方向，再參考 **`docs/SITEGUIDE.md`** 第 7-8 節

### 「我要改地圖模組的行為」
→ **先確認使用者明確要求修改核心模組**
→ 閱讀 **`docs/TAIWAN-MAP-DEVGUIDE.md`** 完整文件

---

## 技術棧

| 技術 | 版本 | 用途 |
|------|------|------|
| Next.js | 16.2.1 | App Router、SSG |
| React | 19 | UI 框架 |
| TypeScript | 5.x | 型別安全 |
| Tailwind CSS | v4 | 樣式 |
| D3-geo | 3.x | 地圖投影（僅台灣地圖模組使用） |
| Vercel | — | 自動部署（push main 觸發） |

---

## Git 工作流程

- 遠端：`https://github.com/gurry0927/EDTechWeb.git`
- GitHub 帳號：`gurry0927`（如果認證失敗，執行 `gh auth switch --user gurry0927`）
- 推到 `main` 分支會自動觸發 Vercel 部署
- commit 訊息用中文，格式：`feat: 描述` / `fix: 描述` / `docs: 描述`
