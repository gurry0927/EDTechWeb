@AGENTS.md

## 開發前必讀

**請先閱讀 `docs/START_HERE.md`，了解專案架構與開發規則。**

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

詳細開發指南請參閱 `docs/` 資料夾。
