# 🤖 LAYERED-MAP AI 交接指南 (Handoff Document)

> **給執行層 AI 助手：**
> 這份專案是一個「跨學科時空層疊系統 (Spatial Intelligence Layer System)」的實驗沙盒。
> 您的任務是讀取並完成被架構師寫死的「空殼與 API 契約」，將具體的 `D3.js` 運算與 GeoJSON 綁定邏輯實作出來。
>
> ⚠️ **警告：您必須嚴格遵守以下邊界限制。** ⚠️

---

## 🛑 第一戒律：任務邊界限制

**您唯一被允許修改的地方是具有 `// TODO: AI FILL HERE` 標籤的區塊。**

1. 🚫 **禁止修改 `/types.ts`**：API 契約已定死，你只能根據它來解構與判斷屬性。
2. 🚫 **禁止修改 `MapUI.tsx` 右側的圖層控制台排版**：你的唯一任務是在`<main>`標籤內的 `children` 處生成並渲染 SVG 地圖。
3. 🚫 **禁止執行 `npm install`**：你必須使用專案現有套件：`react`, `next`, `d3-geo`, `d3-array`。嚴禁引入 `leaflet`, `mapbox`, `three.js` 等外部圖書館。

---

## 🗺️ 第二戒律：解析並實作您的任務

我們已經建立了一個示範頁面 (`src/app/layered-map-demo/page.tsx`)，傳入了 `DEMO_LAYERS` 給 `LayeredMapOrchestrator`。
請打開 **`src/components/layered-map-experiment/LayeredMapOrchestrator.tsx`** 來實作您的 3 大任務：

### 任務 1：資料獲取與快取 (Data Fetching Cache)
在 `useEffect` 中，遍歷傳入的 `activeLayers`：
- 若 `dataSourceUri` 為 `'local:taiwan'`，請用 `import()` 動態載入 `@/data/taiwan.geo.json`。
- 若 `dataSourceUri` 為 `'mock:heatmap'` 或 `'mock:lines'`，由於這是我們提供的測試假資料，請您**自己生成符合 `d3` 的 Feature/MultiLineString** 作為測資，存入 `geoDataCache` 內。

### 任務 2：投影預算與封裝 (D3 Projection & Generator)
根據 `geoDataCache` 裡的本島資料 (通常是 `base_taiwan`)，使用 `d3.geoMercator()` 計算 `center` 與 `scale`，然後建立一個通用的 `d3.geoPath().projection(projection)`。

### 任務 3：圖層分派與 SVG 渲染 (Render Dispatch)
在 Orchestrator 結尾的 `<MapUI>` 的 children 中，回傳 `<svg viewBox="...">`，並按照圖層的陣列順序依序疊加 `<g key={layer.id}>`。
請根據每個層的 `layer.renderType` 判斷：
1. `polygon`: 一般行政區塊繪製 (`<path fill="..." stroke="..." d={pathGenerator(feature)} />`)
2. `lines`: `<path fill="none" stroke="red" strokeWidth={...} />`，用於模擬活斷層。
3. `heatmap`: 這裡可以利用 SVG 的 `filter`、`radialGradient` 或是透明度的 `<circle>` 來模擬人口密度，不一定要真的載入複雜的 heatmap 套件，用基礎 SVG 畫出熱度感即可。

---

## 🎨 第三戒律：樣式約定

所有的排版、顏色都必須使用 TailwindCSS 類別。
- ✅ 可以使用：`fill-sky-800`, `stroke-slate-500`, `hover:fill-sky-500` 等類別，或是直接寫行內的 `#hex` 顏色（如果你是在根據假資料映射色尺）。
- 🚫 禁止使用：`<style>` 標籤，或是 `<div style={{ backgroundColor: 'red' }}>` 這種 Inline Object style（除非是 `strokeWidth` 或 SVG 動態坐標系必須用的屬性）。

---

## 📝 開發完成自我檢查表 (Definition of Done)

在你完成代碼編寫前，請確認：
- [ ] 執行 `npm run build` 或 `npm run dev` 沒有因為 TypeScript 型別不符而報錯。
- [ ] 右側面板勾選「主要活動斷層帶」時，畫面上會浮現出紅線。
- [ ] 左下角沒有破版。
- [ ] 你沒有修改我千叮嚀萬囑咐的 `types.ts`。

準備好後，就直接產出你的 `LayeredMapOrchestrator.tsx` 程式碼給人類開發者吧！
