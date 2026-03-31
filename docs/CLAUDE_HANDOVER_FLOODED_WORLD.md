# 淹沒的世界 (The Flooded World) - D3 Map 開發交接文檔

這是一份給 AI (Claude) 的除錯與接手規劃書，主要目的是修復目前「時空智能層疊模型 - 淹沒的世界」半成品在 D3 地理圖層渲染上的最後一哩路。

## 1. 專案目標與預期效果
本模組旨在透過 D3.js 搭配 React 的狀態管理，實作一個動態的「地理變動」互動面板，模擬台灣在特定歷史或地質時期的水文變化：
- **主要場景一：冰河時期的台灣陸橋**。當海平面下降至 -120m 時，台灣海峽露出淺綠色的「陸橋」，並顯示特有種（如黑熊、櫻花鉤吻鮭）從大陸播遷來台的路徑。
- **主要場景二：安平古堡與台江內海的淤積**。透過時光機滑桿調整年份（1624 ~ 2024），視覺化展示原本為內海的台江如何逐漸淤積成今日的台南陸地。
- **視覺體驗**：深色科技感主題 (`slate-900`)，保留互動光影與圖層過濾（Land Filter / Glow Filters）。

## 2. 目前已完成的架構 (半成品現況)
- **UI 與狀態管理**：`MapUI.tsx` 已成功綁定時光機 (`historyYear`) 與海平面 (`seaLevel`) 滑桿，並且能即時回傳給父層組件。
- **數據加載引擎**：`LayeredMapOrchestrator.tsx` 已經克服了 `useEffect` 重新渲染造成的無限迴圈問題。現在能一次性預加載所有的 `taiwan.geo.json` 與 mock data 進入 `geoDataCache` 緩存。
- **SVG 圖層渲染**：支援四種 GeoJSON 型態 (`polygon`, `lines`, `point`, `heatmap`) 的分層繪製，並已加入自定義的 SVG Gradients (如 `lakeGradient`)。
- **動態樣式邏輯**：如安平淤積的 `transform: scale(siltScale)` 和海平面的動態顯隱都已實作出邏輯框。

## 3. 面臨的核心 Bug (目前卡住難以完美呈現的問題)
目前 D3.js 在將 GeoJSON (經緯度) 轉換為 SVG Path (`d3.geoPath`) 時，**投影縮放 (`fitSize` 與 `scale`) 發生了嚴重的邊界計算錯誤。**

### 問題分析與症狀：
1. **「地球破洞」悖論**：最初我們發現地圖縮成了一個「肉眼看不見的小圓點」。原因是因為我們自行模擬的 GeoJSON 多邊形（如台灣海峽邊界），其座標使用了「順時針 (Clockwise)」寫法。D3 和 GeoJSON rfc7946 規範將順時針視為「破洞 (Hole)」或「描述地球其餘部分」。導致 `proj.fitSize()` 試圖把整個地球塞進 800x600 的畫面裡，讓台灣縮成幾像素。
2. **反轉的悲劇**：我們手動將所有 mock data 調整為「逆時針 (Counter-Clockwise)」，此時自行寫的福建沿岸成功畫出來了！但讀取真實的 `taiwan.geo.json` 時，台灣本島卻「不見了」或是被透明化。推測 `taiwan.geo.json` 本身的座標方向與我們的投影相衝，或者是 D3 在沒有啟動 `clipExtent` 或 `.fitExtent` 下算錯了邊界。
3. **棄用 `fitSize` 的妥協**：目前我們寫死了 `.scale(6500).center([120.0, 23.8])`，雖然避開了動態算錯規模的問題，但真實的台灣陸地依舊沒有完整與海洋/福建大陸拼合出極具震撼力的視覺畫面。

## 4. Claude 明天接手的解決方案方向建議
請 Claude 朝以下具體方向著手：
1. **統一 D3 投影解析度 (`d3.geoIdentity` 或 `d3.geoMercator.clipExtent`)**：檢查是否所有的 FeatureCollection 送進 `d3.geoPath().projection(proj)` 前都需要做 `turf.rewind` 或統一強制套用 `.reflectY(false)`。
2. **審視 `LayeredMapOrchestrator.tsx` 第 440~460 行** 的基礎圖層渲染邏輯，確保 `taiwan.geo.json` 不受奇怪的 CSS 透明度 (`fill-transparent`) 或 `d` path 破裂的影響而消失。
3. **提升視覺震撼度**：目前半成品只有簡單的 SVG path，請 Claude 調整 `LakeGradient` 以及 Tailwind 色票，讓海洋與陸地的交界不僅是上色，而是有立體邊緣、發光或真實的地形圖手感，這才是 User 在「時空智能環境」下期望的 wow-factor！

## 5. 檔案位置
- **主渲染核心**: `web/src/components/layered-map-experiment/LayeredMapOrchestrator.tsx`
- **UI 元件**: `web/src/components/layered-map-experiment/MapUI.tsx`
- **入口頁面**: `web/src/app/flooded-world-demo/page.tsx`
- **資料源**: `web/src/data/taiwan.geo.json`

(本狀態已推上 git `feature/layered-map-experiment` 分支)
