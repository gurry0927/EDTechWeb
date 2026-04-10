# 帳號系統

## 設計
- Supabase Auth（Email / Google OAuth / Magic Link）
- 延後到核心遊戲模式穩定後再加
- 不設註冊牆，先讓遊戲好玩

## 功能範圍
- 登入/註冊
- 雲端同步（收集冊、學習進度、主題偏好）
- 答題統計（答題率、線索選錯率）
- 教室系統（老師看全班數據）

## 遷移計畫
上線時需遷移的 localStorage 資料：
- `dt-theme` → user preferences
- `dt-last-played` → user progress
- `dt-tutorial-done` → user state
- 收集冊資料 → user collection

## TODO
- [ ] Supabase Auth 設定
- [ ] 登入/註冊 UI
- [ ] localStorage → 雲端遷移邏輯
- [ ] 教室系統 schema
