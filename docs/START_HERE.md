# EDTechWeb 專案導覽

## 專案定位

國中社會科互動學習平台，兩條產品線：

1. **問題偵探**（主力）— 遊戲化考題分析，學生從題幹中找線索、推理、作答
2. **互動地圖**（成熟模組）— 台灣行政區 / 原住民分布 / 公民制度視覺化

## 目錄結構

```
EDTechWeb/
├── web/                          Next.js 主站（Vercel 部署）
│   ├── src/app/                  路由
│   │   ├── /                     首頁（科目入口）
│   │   ├── /[subject]/           科目詳情
│   │   ├── /question-detective/  問題偵探列表 + 遊戲
│   │   ├── /taiwan-map/          台灣互動地圖
│   │   └── /civics-local-gov/    公民地方政府
│   ├── src/components/
│   │   ├── question-detective/   遊戲引擎（DetectivePlayer + config）
│   │   ├── taiwan-map/           地圖核心模組（凍結）
│   │   └── civics-map/           公民地圖
│   ├── src/config/               科目/課程定義
│   ├── src/data/
│   │   └── detective-questions/  題庫 JSON + Supabase API
│   ├── src/lessons/              地圖課程設定檔
│   └── src/lib/supabase.ts       Supabase client
├── tools/
│   └── question-admin/           題目編輯器（Vite + React）
└── docs/                         規劃文件
```

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| 地圖 | D3.js (d3-geo) + SVG |
| 資料庫 | Supabase (PostgreSQL + JSONB) |
| AI | Gemini API（題目切分 / 標記，僅 admin 工具使用） |
| 部署 | Vercel |

## 產品線 1：問題偵探

### 架構

```
題目 JSON
  → tools/question-admin/    編輯、AI 標記、切分
  → Supabase DB              儲存
  → web/ 列表頁              get_public_questions()（僅題幹，反爬蟲）
  → web/ 遊戲頁              get_question_detail(id)（完整資料）
  → DetectivePlayer.tsx       遊戲引擎
  → detective-config.ts       所有參數 / 台詞 / 成就
```

### 關鍵檔案

| 檔案 | 職責 |
|------|------|
| `detective-config.ts` | 遊戲參數（GAME）、台詞（DIALOGUE）、成就（ACHIEVEMENTS） |
| `DetectivePlayer.tsx` | 遊戲狀態機：clue → reasoning → answer → solution |
| `types.ts` | DetectiveQuestion, Clue, ScaffoldingRegion 型別 |
| `api.ts` | Supabase RPC 封裝（公開 / 完整資料） |

### 遊戲流程

```
clue phase     使用者點擊題幹找線索（掃描器輔助）
  ↓
reasoning      依序回答推理題（每條線索一題）
  ↓
answer         選擇最終答案
  ↓
solution       結案報告 + 成就
```

### admin 工具

```bash
cd tools/question-admin && npm install && npm run dev
# localhost:5173
```

功能：載入 JSON → 標記線索/鷹架 → AI 切分詞段 → 儲存到 Supabase

## 產品線 2：互動地圖

### 架構

```
src/lessons/*.ts         課程設定（區域顏色、互動行為、圖例）
  → src/components/taiwan-map/   地圖渲染引擎（凍結）
  → src/app/taiwan-map/          頁面路由
```

### 擴充方式

1. 新增地圖課程 → 在 `src/lessons/` 加 LessonConfig
2. 新增科目 → 修改 `src/config/subjects.ts`
3. 新增路由 → 在 `src/app/` 建資料夾

## 凍結區域（禁止修改）

- `src/components/taiwan-map/` — 地圖核心
- `src/config/types.ts` — 型別定義
- `src/app/layout.tsx` — 根佈局

## 環境設定

### 主站 (web/)
```
.env.local:
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxx
```

### Admin 工具 (tools/question-admin/)
```
.env:
  VITE_SUPABASE_URL=https://xxx.supabase.co
  VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
```

## Supabase 資料庫

### Table: `detective_questions`
```sql
id text PRIMARY KEY        -- "114-social-history-20"
source text                -- "114年會考-社會-第20題"
subject text               -- "社會"
data jsonb                 -- 完整 DetectiveQuestion JSON
created_at, updated_at     -- 自動維護
```

### RPC Functions
- `get_public_questions()` — 列表用，不含答案/線索
- `get_question_detail(id)` — 遊戲用，完整資料

## 擱置中的實驗

以下功能因 D3 渲染 bug 擱置，詳見 `docs/CLAUDE_HANDOVER_FLOODED_WORLD.md`：
- `/flooded-world-demo/`
- `/layered-map-demo/`
- `/taipei-lake-demo/`
