@AGENTS.md

## 台灣互動地圖模組規則

**核心模組 `src/components/taiwan-map/` 為凍結區域，禁止修改其中任何檔案。**

新增課程的正確做法：
1. 在 `src/lessons/` 建立新的 `LessonConfig` 檔案
2. 在 `src/lessons/index.ts` 匯出
3. 在 `src/app/taiwan-map/page.tsx` 的 `LESSONS` 陣列加入

詳細開發指南請參閱 `src/components/taiwan-map/DEVGUIDE.md`。
