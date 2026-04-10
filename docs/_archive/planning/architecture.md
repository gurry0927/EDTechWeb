# Technical Architecture: EdTech Web Scalability & Data

為了支援「多人同時使用」並追蹤「用戶行為與 AI 對話」，我們需要從純前端轉換為 **Full-stack (SaaS) 架構**。

## 1. 建議技術棧 (Recommended Stack)

針對一人開發的副業，重點在於 **Low Maintenance (低維護)** 與 **Serverless (無伺服器)**。

- **Frontend/Backend**: [Next.js](https://nextjs.org/) (目前已在使用)
- **Database + Auth**: [Supabase](https://supabase.com/) (PostgreSQL + Built-in Auth)
    - *理由*：一人公司不需要管理 DB 伺服器，且它內建完整的用戶登入系統。
- **AI Streaming**: OpenAI API / Anthropic API (透過 Next.js Edge Functions 實現流式輸出，節省伺服器成本並提升體驗)。
- **Hosting**: [Vercel](https://vercel.com/) (Next.js 的原生支撐，自動擴縮容)。

## 2. 資料庫 Schema 初步設計 (Database Design)

### Table: `users`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key (由 Supabase Auth 自動產生) |
| `email` | String | 用戶信箱 |
| `role` | Enum | `student`, `teacher`, `parent` |
| `created_at`| Timestamp | 註冊時間 |

### Table: `map_stories` (每週時事故事)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `title` | String | 標題 |
| `date` | Date | 發布日期 |
| `content_json`| JSONB | 地圖標註數據、AI 引導 Prompt |

### Table: `conversations` (AI 對話歷史)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | FK -> `users.id` |
| `story_id` | UUID | FK -> `map_stories.id` |
| `chat_history`| JSONB | 完整對話列表 (Array of messages) |
| `depth_score` | Integer | AI 自動評定的對話深度 (用於獲利指標) |

### Table: `engagement_metrics` (行為追蹤)
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | UUID | Primary Key |
| `user_id` | UUID | FK -> `users.id` |
| `session_id` | UUID | 每個 Session 的識別碼 |
| `time_spent` | Integer | 停留秒數 |
| `clicks` | JSONB | 追蹤在地圖上點擊了哪些標籤 |

## 3. 多人同時使用的處理策略

1.  **Serverless Scaling**: Vercel 會為每個請求自動分配計算資源，因此即使有 1000 人同時點開，前端也不會崩潰。
2.  **Database Connection Pooling**: Supabase (Postgres) 自動處理連線池，解決多人同時讀寫資料庫的競爭問題。
3.  **Client-side Caching**: 使用 `react-query` 或 `SWR` 快取地圖數據，減少對資料庫的頻繁請求。

## 4. 第一階段 MVP 實踐路輯 (一人開發版)

1.  **無須 DB (Week 1-2)**：將 `map_stories` 存在靜態 JSON 檔案中，先推廣出去獲取反饋。
2.  **加入 Auth + DB (Week 3-4)**：使用 Supabase 儲存對話紀錄，開始收集行為數據。
3.  **自動化轉型 (Week 5+)**：加入 AI 自動抓新聞並寫入資料庫的功能。
