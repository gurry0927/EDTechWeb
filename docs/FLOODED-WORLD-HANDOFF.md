# Handoff: 淹沒的世界 (The Flooded World) 開發指南

## 任務背景
我們正在開發一個跨學科（地理、地科、歷史）的互動沙盒。展示區域從原本的台北盆地，擴大到了包含「全台灣本島」以及「台灣海峽」的橫向大視野。

## 你的任務目標
你需要接手修改 `web/src/components/layered-map-experiment/LayeredMapOrchestrator.tsx` 檔案，尋找所有標註 `// TODO: AI FILL HERE` 的地方，並將假資料生成邏輯以及 D3 SVG 渲染邏輯實作完成。這是一個「展示等級 (WOW factor)」的教育專案，請寫出兼具效能與美學的 React 程式碼。

## 必須實作的五個核心功能

### 1. 全域視野控制 (Bounding Box)
我們需要讓 D3.js 在 `fitSize` 的時候，將「整個台灣海峽與左右兩岸」都包進畫面。
- **目標圖層**：`mock:taiwan_strait_bounds`
- **實作要求**：請回傳一個巨大的 Polygon，包含左下角 `[117.5, 21.0]` 到 右上角 `[122.5, 26.5]`。

### 2. 冰河期陸橋 (Land Bridge Mask)
展示一萬年前台灣海峽乾涸的狀態。
- **目標圖層**：`mock:land_bridge_mask`
- **資料實作**：生成一個介於大陸邊緣與台灣西海岸的 Polygon。
- **渲染實作**：
  - 當 `controlValues['seaLevel'] <= -50` 時，渲染這塊陸橋，並且給予一個有土地 / 植被感的漸層與透明度（例如使用 SVG 濾鏡 `feTurbulence` 來做地紋）。
  - 當 `seaLevel > 0` (全球暖化) 時，我們也可以讓這個遮罩微微發藍，當作海平面上升淹沒本島邊緣的特效。

### 3. 特有種遷徙路徑 (Animal Migration)
- **目標圖層**：`mock:animal_migration`
- **資料實作**：生成兩條折線 (LineString)，一條代表「台灣黑熊祖先」，一條代表「櫻花鉤吻鮭」。起點在福建岸邊，終點在台灣深山。
- **渲染實作**：
  - **條件**：只有在 `seaLevel <= -50` 時才看得到。
  - **美學**：使用 `strokeDasharray` 來製造足跡感或動態感，並在終點印出名字。

### 4. 安平沖積平原變遷 (Anping Siltation)
模擬台南台江內海在過去四百年間被泥沙填滿的過程。
- **目標圖層**：`mock:anping_siltation`
- **資料實作**：在座標 `[120.15, 23.00]` 附近生成一個代表「水域」的 Polygon (可以使用 `d3.geoCircle().radius(0.08)`)，以及一個代表「安平古堡」的 Point。
- **渲染實作**：
  - **安平水域**：請讀取 `controlValues['historyYear']`（預設範圍 1624 ~ 2024）。當年分越靠近 2024 時，請利用 CSS 的 `transform: scale()` 或動態計算半徑，將這塊水域「縮小，直到消失」，用來模擬泥沙把它填成了陸地。
  - **安平古堡**：給予它一個強烈對比色的正方形圖示，即使水域幹涸，它依然在那邊。

### 5. SVG 濾鏡美學 (Aesthetics)
請在 `<defs>` 裡面自行發揮，補充 `feTurbulence` (海浪)、 `linearGradient` 等能增加質感的濾鏡定義。

---

## 防呆警告 (Important Limits)
1. **不要動到既有的 Layer 控制器邏輯**：你只需要專心補完 `LayeredMapOrchestrator` 中的 `// TODO:` 即可，不用去改 `MapUI.tsx` 或 `page.tsx`。
2. **遵守 React Hook 規範**：所有依賴 state (如 `controlValues`) 的變化判斷，都應該發生在 Render Phase 的迴圈中。
3. **沒有後端 API**：我們的一切資料都是動態生成的。不用去 `fetch` 或 `axios` 找外部網站，請全部用 `FeatureCollection` 寫死。
