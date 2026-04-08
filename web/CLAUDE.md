@AGENTS.md

## 開發前必讀

**請先閱讀 `docs/START_HERE.md`，了解專案架構與開發規則。**

## 專案概要

兩條產品線：
1. **問題偵探**（主力）— 遊戲引擎在 `src/components/question-detective/`，參數集中在 `detective-config.ts`
2. **互動地圖**（成熟）— 核心在 `src/components/taiwan-map/`（凍結），擴充靠 `src/lessons/`

資料庫：Supabase（`src/lib/supabase.ts`），題目存 JSONB，兩階段載入（反爬蟲）。

## 網站架構規則

> **給 AI 的硬性規則：**
> 不得在未與使用者討論的情況下大幅修改網站框架結構。
> 新增內容請透過設定檔擴充，不要改動框架本身。

**凍結區域（禁止修改）：**
- `src/components/taiwan-map/` — 台灣互動地圖核心模組
- `src/config/types.ts` — 科目/課程型別定義
- `src/app/layout.tsx` — 根佈局

**擴充方式：**
- 新增科目或課程 → 修改 `src/config/subjects.ts`
- 新增地圖課程 → 在 `src/lessons/` 建立 LessonConfig 檔案
- 新增課程頁面 → 在 `src/app/` 建立對應路由
- 新增偵探題目 → 用 `tools/question-admin/` 編輯後存入 Supabase
