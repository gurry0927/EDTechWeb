# 遊戲模式

每個遊戲模式一個資料夾，和 question-detective 同層級。

## 模式清單

| 模式 | 資料夾 | 狀態 |
|------|--------|------|
| 偵探 | `../question-detective/` | ✅ 上線 |
| 臥底 | `spy/` | 📋 規劃中 |
| 拆彈 | `bomb/` | 📋 規劃中 |
| 解密 | `decrypt/` | 📋 規劃中 |
| 連連看 | `matching/` | 📋 規劃中（小遊戲） |
| 排序 | `sorting/` | 📋 規劃中（小遊戲） |

## 架構原則
- 每個模式自己的 config、Player 元件、types
- 共用主題系統（`src/config/themes.ts`）
- 共用題目來源（Supabase，一題多模式）
- 模式設定在 `src/config/gameModes.ts` 註冊
