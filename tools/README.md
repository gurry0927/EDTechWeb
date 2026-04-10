# EDTech Tools

此資料夾存放各種獨立的內部工具，與主站（`web/`）分開維護。
每個工具各自有獨立的 `package.json`，互不依賴。

---

## 現有工具

| 資料夾 | 用途 |
|---|---|
| `question-admin/` | 題目偵探編輯器：AI 詞段切分 + 線索標記 + Supabase 同步 |

---

## 新增工具規範

1. 在 `tools/` 下建立新資料夾，名稱用 kebab-case（如 `quiz-importer/`）
2. 資料夾內必須有 `GUIDE.md`，說明用途、技術棧、啟動方式
3. 更新本 README 的工具列表
4. 技術棧優先沿用 Vite + React + TypeScript + Tailwind CSS v4，有特殊需求才偏離

---

## 啟動任一工具

```bash
cd tools/<tool-name>
npm install
npm run dev
```

## 環境設定

`question-admin` 需要 Supabase 連線，在 `.env` 設定：
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
```
