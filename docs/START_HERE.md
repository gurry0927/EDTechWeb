# EDTechWeb 專案導覽

## 專案定位

國中社會科互動學習平台，遊戲化學習為核心。

**產品線：**
1. **問題偵探**（主力遊戲模式）— 從題幹找線索、推理、作答
2. **互動地圖**（成熟模組）— 台灣行政區 / 原住民分布 / 公民制度
3. **更多遊戲模式**（規劃中）— 臥底、拆彈、解密、連連看

## 目錄結構

```
EDTechWeb/
├── web/                              Next.js 主站（Vercel 部署）
│   ├── src/
│   │   ├── app/                      ─── 路由 ───
│   │   │   ├── page.tsx              首頁（遊戲入口，手遊風格）
│   │   │   ├── [subject]/            科目詳情頁
│   │   │   ├── question-detective/   偵探模式列表 + 遊戲
│   │   │   ├── taiwan-map/           台灣互動地圖
│   │   │   ├── civics-local-gov/     公民地方政府
│   │   │   └── layout.tsx            根佈局（凍結）
│   │   │
│   │   ├── config/                   ─── 全站設定 ───
│   │   │   ├── themes.ts            主題系統（classic/cyber/guofeng）
│   │   │   ├── gameModes.ts          遊戲模式註冊表
│   │   │   ├── subjects.ts           科目與課程定義
│   │   │   └── types.ts              型別定義（凍結）
│   │   │
│   │   ├── components/               ─── 元件 ───
│   │   │   ├── home/                 首頁元件（ThemeHero, BottomNav...）
│   │   │   ├── question-detective/   偵探遊戲引擎
│   │   │   ├── game-modes/           其他遊戲模式（規劃中）
│   │   │   │   ├── spy/             臥底模式
│   │   │   │   ├── bomb/            拆彈模式
│   │   │   │   └── decrypt/         解密模式
│   │   │   ├── collection/           收集冊（規劃中）
│   │   │   ├── account/              帳號系統（規劃中）
│   │   │   ├── stats/                統計排行（規劃中）
│   │   │   ├── shared/               跨模組共用元件
│   │   │   ├── taiwan-map/           地圖核心（凍結）
│   │   │   └── civics-map/           公民地圖
│   │   │
│   │   ├── hooks/                    共用 React hooks（規劃中）
│   │   ├── data/                     題庫 JSON + Supabase API
│   │   ├── lessons/                  地圖課程設定檔
│   │   └── lib/supabase.ts           Supabase client
│   │
│   └── public/
│       ├── sw.js                     Service Worker (PWA)
│       └── manifest.json             PWA manifest
│
├── tools/
│   └── question-admin/               題目編輯器（Vite + React）
│
└── docs/
    ├── START_HERE.md                 ← 你在這裡
    ├── HOME_PAGE.md                  首頁維護手冊
    └── question-detective/
        ├── THEME_SYSTEM.md           主題系統維護手冊
        └── GAME_DESIGN_NOTES.md      遊戲設計決策紀錄
```

## 技術棧

| 層級 | 技術 |
|------|------|
| 前端 | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| 地圖 | D3.js (d3-geo) + SVG |
| 資料庫 | Supabase (PostgreSQL + JSONB) |
| AI | Gemini API（題目切分 / 標記，僅 admin 工具使用） |
| 部署 | Vercel |

## 設定檔導向

**加東西改 config，不改元件：**

| 要做什麼 | 改哪個 config |
|---------|--------------|
| 新增主題 | `config/themes.ts` + `globals.css` |
| 新增遊戲模式 | `config/gameModes.ts` + 對應元件資料夾 |
| 新增科目/課程 | `config/subjects.ts` |
| 新增地圖課程 | `src/lessons/*.ts` |
| 新增偵探題目 | `tools/question-admin/` → Supabase |

## 首頁（遊戲入口）

手遊風格，角色驅動：
- 角色立繪 + 台詞（點擊切換主題）
- 「繼續調查」主按鈕
- 遊戲模式選擇列
- 底部 Tab（首頁/圖鑑/我的）

詳見 [HOME_PAGE.md](HOME_PAGE.md)

## 問題偵探（主力遊戲）

### 資料流
```
題目 JSON → tools/question-admin/ → Supabase DB
  → 列表頁 get_public_questions()（僅題幹，反爬蟲）
  → 遊戲頁 get_question_detail(id)（完整資料）
  → DetectivePlayer.tsx 遊戲引擎
```

### 遊戲流程
```
clue phase     找線索（掃描器輔助）
  ↓
reasoning      推理問答 + 舉證
  ↓
answer         指認答案
  ↓
solution       結案報告 + 成就 + 切入演出
```

### 主題系統
三套皮膚（classic/cyber/guofeng），CSS 變數 + 台詞覆寫。
詳見 [question-detective/THEME_SYSTEM.md](question-detective/THEME_SYSTEM.md)

### admin 工具
```bash
cd tools/question-admin && npm install && npm run dev
# localhost:5173
```

## 互動地圖（成熟模組）

擴充方式：`src/lessons/` 加 LessonConfig，不改地圖核心。

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

## 規劃中功能

| 功能 | 依賴 | 佔位資料夾 |
|------|------|-----------|
| iOS 陀螺儀無感授權橫幅 | 無 | `components/home/` |
| 臥底模式 | 無 | `components/game-modes/spy/` |
| 拆彈模式 | 無 | `components/game-modes/bomb/` |
| 解密模式 | 無 | `components/game-modes/decrypt/` |
| 收集冊 | 帳號系統（先用 localStorage） | `components/collection/` |
| 帳號系統 | Supabase Auth | `components/account/` |
| 統計排行 | 帳號系統 | `components/stats/` |
| 學習地圖（多鄰國路線圖） | 帳號系統 + 足夠題量 | 待建 |

## 封存區

### 擱置的實驗（D3 渲染 bug）
- 程式碼：`web/src/app/_experiments/`（Next.js `_` 前綴不產生路由）
- 元件：`web/src/components/_experiments-layered-map/`
- 文件：`docs/_archive/CLAUDE_HANDOVER_FLOODED_WORLD.md`

### 早期規劃文件
- `docs/_archive/planning/` — 市場調查、架構設計、成本分析等（部分已被現有文件取代）
