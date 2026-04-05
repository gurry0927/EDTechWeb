# EDTech Tools

此資料夾存放各種獨立的內部工具，與主站（`web/`）分開維護。
每個工具各自有獨立的 `package.json`，互不依賴。

---

## 現有工具

| 資料夾 | 用途 |
|---|---|
| `question-admin/` | 題目偵探 JSON 編輯器，含 AI 詞段切分 |

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
