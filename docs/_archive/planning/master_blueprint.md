# 🌟 Master Blueprint: 跨學科時空層疊系統 (The Multiverse of Learning)

這是一份完整的專案藍圖，統整了我們對「教育痛點、商業模式、技術架構、核心功能與未來擴充性」的所有規劃。此文件將作為後續開發的最高指導原則。

---

## 一、專案願景與目標 (Vision & Goals)

### 1. 核心痛點解決
- **去碎片化**：解決傳統教育中（歷史、地理、地科、公民、數學）被生硬切割的痛點。
- **抗拒 AI 盲從**：提供「蘇格拉底式」的 AI 引導，迫使學生觀察、思考與回答，而不是直接獲取答案。
- **降低備課壓力**：為教師提供「自動生成時事、符合課綱、高互動性」的視覺化教材。

### 2. 核心偉大設計：空間智能層疊系統 (Spatial Intelligence Layer System)
將地圖作為「跨學科洞察」的動態載體。底層為台灣高程地形圖，上方可無限疊加各科知識圖層。當圖層交疊時，產生跨學科的素養學習。

---

## 二、目標受眾與商業模式 (Audience & Business Model)

- **目標受眾**：
    - **國高中教師** (B2B/B2T)：作為課堂沉浸式展示教材（免安裝，打開網頁即用）。
    - **自學家庭與家長** (B2C)：作為培養孩子「真實世界問題解決能力」的優質數位內容。
    - **學生**：作為整合性複習與探索工具。
- **獲利模式策略**：
    - **Freemium**：基礎圖層與本週時事地圖免費開放（累積流量與口碑）。
    - **Premium (訂閱制 / 買斷課程)**：進階跨科圖層解鎖、AI 對話深度分析報告（給家長）、專屬實體/線上配套素養卷。

---

## 三、技術架構與選型 (Technical Stack)

為符合「一人公司」低維護、高擴展的原則，採用 Serverless 全端架構。

### 1. 核心技術棧
- **Frontend/Backend**: Next.js (React) - 提供 SSR 加快載入速度與 SEO。
- **地圖渲染引擎**: D3.js + React SVG (目前已使用的輕量級方案，適合抽象的教育地圖，未來若有 3D 需求可升級 Deck.gl)。
- **Database & Auth**: Supabase (PostgreSQL) - 免費額度高，內建強大且安全的會員系統（Row Level Security）。
- **AI 整合**: OpenAI API (GPT-4o-mini 用於多數自動化，GPT-4o 用於深度對話與生成) + Vercel AI SDK (處理流式輸出 Streaming)。
- **部署環境**: Vercel (無伺服器自動擴展，處理多人併發連線)。

### 2. 資料庫核心 Schema (Supabase)
- `users`: 用戶資料與角色 (Teacher/Student/Parent)。
- `map_layers`: 存放圖層的 Metadata（不存龐大地理數據，存屬性）。
- `conversations`: 紀錄學生與 AI 導師的完整對話與「深度評分」。
- `engagements`: 追蹤用戶停留時間、點擊熱區，用於分析「專注力」。

---

## 四、核心功能模組 (Core Modules)

### 1. 萬能圖層切換器 (Layer Manager)
- 用戶介面上提供「圖層清單」，分為「地理、地科、歷史、公民、數學實境」等目錄。
- 支援勾選顯示多個圖層，並且可以調整各圖層的「透明度 (Opacity)」。
- **無縫效能**：未勾選的圖層不載入數據，確保網頁極致順暢。

### 2. 全球共時時間軸 (Timeline Synchronicity Slider)
- 在歷史相關圖層開啟時，地圖下方出現「年代滑桿」。
- 拖動滑桿，地圖上的標記會動態浮現/消失，展示歷史的演進與全球事件的併發。

### 3. AI 蘇格拉底導師 (Socratic AI Tutor)
- 懸浮在畫面邊緣的對話框。
- **Context-Aware (具備情境意識)**：AI 知道你現在開了哪些圖層、點了哪個區域。
    - *觸發條件*：當用戶同時打開「地層斷層（理化/地科）」與「人口密度（公民/地理）」，系統自動將這兩份 Context 餵給 AI。
    - *AI 輸出*：「你打開了斷層圖與人口圖，你有發現台中盆地的都會區跟車籠埔斷層的相對位置關係嗎？你覺得為什麼會這樣發展？」

### 4. 自動化時事流水線 (Automated News Pipeline)
- 透過 Python/Node.js 腳本，結合低成本 LLM 進行 **三階過濾（關鍵字 -> AI 課綱評分 -> JSON 格式化草稿）**。
- 一人開發者每週只需花 10 分鐘，在後台點擊審核，即可產生最新的「時事地圖圖層」。

---

## 五、如何實現無限擴充？(The Plugin Architecture)

為了讓地圖具備「無限疊加」的能力，我們必須將「UI 渲染組件」與「地理數據」徹底**解耦 (Decouple)**。

### 圖層即插件 (Layers as Plugins)
任何一個新圖層，本質上就是一個遵循特定格式的 `JSON / GeoJSON` 檔案。

#### 圖層描述檔 (Layer Manifest Definition)
```json
{
  "layer_id": "history_shiqian_culture",
  "name": "史前文化遺址分布",
  "category": "history",
  "zIndex": 10,
  "renderable_data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [121.46, 25.16] },
        "properties": {
          "id": "shisanhang",
          "title": "十三行文化",
          "color": "#FF5733",
          "icon": "ancient_pottery"
        }
      }
    ]
  },
  "ai_knowledge_context": "十三行文化位於新北市八里區，距今約1800-500年，是台灣目前唯一確定擁有煉鐵技術的史前文化。",
  "ai_trigger_questions": [
    "如果你是十三行文化的居民，考量到航海與貿易，你會選擇在哪裡建立聚落？"
  ]
}
```

#### 運作邏輯：
1. **擴充圖層**：明天你想教「日治時期糖廠」，你根本不需要去改 React 的程式碼（例如 `TaiwanMap.tsx`）。你只需要生出一份 `糖廠分布.json`。
2. **社群貢獻**：未來甚至可以開放後台，讓其他熱血老師上傳他們的 `.json` 檔案，系統自動加上審核機制，這就成了一個 **UGC (User Generated Content) 的開放式教育平台**。

---

## 六、開發里程碑 (Development Roadmap)

這不是一蹴可幾的，我們需要分階段疊代：

### Phase 1: 基礎圖層展示與解耦 (Month 1)
- **目標**：完成 JSON 數據驅動地圖的重構。
- 實作 Layer Manager UI（打勾顯示圖層）。
- 實作 1-2 個靜態實驗圖層（例如：行政區圖層、某個歷史事件圖層）。

### Phase 2: AI 蘇格拉底整合 (Month 2)
- **目標**：導入 OpenAI/Claude API。
- 讓 AI 能讀取當前啟用的 `ai_knowledge_context`，並提供啟發式對話框。

### Phase 3: 時事自動化流水線 (Month 3)
- **目標**：建立每週自動抓取新聞、AI 評分、產出新圖層 JSON 的後台機制。

### Phase 4: Full-Stack 升級與商業化 (Month 4+)
- **目標**：導入 Supabase Auth 建立會員系統。
- 開始儲存學習對話紀錄，製作「學習歷程與深度分析報告」功能，準備商業變現。

---
*文件更新日期：2026-03-27*
