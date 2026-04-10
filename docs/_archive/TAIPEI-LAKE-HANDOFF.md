# 🤖 TAIPEI-LAKE AI 交接指南 (Handoff Document)

> **給執行層 AI 助手：**
> 這是我們「時空智能層疊模型」的第二個重頭戲：**動態海平面交互 (台北湖模擬)**。
> 你剛剛已經成功做出了靜態疊加，現在我們要挑戰的是讓地圖能根據使用者的「滑桿(Slider)」改變渲染樣式！

---

## 🛑 任務邊界限制 (必須遵守)

1. 🚫 **禁止修改 `/types.ts` 及 `/MapUI.tsx`**。滑桿的 UI 我已經幫你寫好了。
2. 你唯一要修改的目標檔案是 **`src/components/layered-map-experiment/LayeredMapOrchestrator.tsx`** 的 `[TODO: AI FILL HERE]` 區塊。

---

## 🗺️ 你的任務說明

這次傳入 `LayeredMapOrchestrator` 的圖層中，包含了一個名為 `lake_mask` 的圖層，它帶有非常關鍵的 **`seaLevel` (海平面高度, 預設 6m)** 控制變數。

### 任務 1：生成假資料 (Mock Data Fetching)
在 `useEffect` (Data Fetching) 中：
- `mock:taipei_base`：請從 `@/data/taiwan.geo.json` 載入後，過濾 (`filter`) 只有 `properties.name` 為「台北市」與「新北市」的 Feature。
- `mock:taipei_lake`：請用 `d3.geoCircle` 或手刻一個 GeoJSON Polygon，放在台北盆地的中央 (約 `121.5, 25.05` 附近)，形狀不用太精準，能覆蓋大圓即可。
- `mock:archaeology`：請建立三個點的 GeoJSON Feature：
    - 圓山遺址 `[121.52, 25.07]`
    - 芝山岩遺址 `[121.53, 25.10]`
    - 大龍峒遺址 `[121.51, 25.07]`

### 任務 2：投影縮放 (D3 FitSize)
因為這次只有大台北地區，在建立投影時 (`useMemo`)，請務必找到 `base_taipei` 的圖層，並使用 `proj.fitSize([width, height], baseData)` 來**放大聚焦**在北台灣，不要顯示全台灣。

### 任務 3：實作動態遮罩 (Dynamic SVG Render)
在渲染 `lake_mask` 圖層區塊 (`<path>`) 時：
1. 請讀取當前滑桿丟給你的變數：`const currentSeaLevel = controlValues['seaLevel'];`
2. **視覺衝擊邏輯**：
   - 當 `seaLevel` === 0 時，湖水應該完全透明（`opacity: 0`）。
   - 當 `seaLevel` > 0 時，利用 `currentSeaLevel` 的數值來倍增或改變 SVG `<path>` 的 `opacity` (例: `currentSeaLevel / 10`)，也可以稍微改變它的 `transform="scale(...)"` 來讓人感覺水漫進來了。
   - 湖水 `<path>` 請加上 `className="fill-[url(#lakeGradient)] transition-all duration-300"` 以享受滑順的海水填充感。

---

## 📝 開發完成自我檢查表

- [ ] 執行 `npm run dev` 進入 `/taipei-lake-demo` 無錯誤。
- [ ] 畫面已經不再是全台灣，而是放大的雙北地區。
- [ ] 右側面板的「海平面上升模擬」滑桿被拉動時，畫面上的藍色湖水顏色會即時變深/變大。
- [ ] 圓山、芝山岩等 3 個史前遺址的紅色小圓點，被清楚地渲染在圖上。

請產出修改後的 `LayeredMapOrchestrator.tsx` 程式碼！
