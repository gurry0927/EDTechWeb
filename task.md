# 專案任務清單：EduTechWeb (公民與 AI 互動教具)

## 階段一：基礎設施與帳號準備 (Infrastructure & Accounts)
- [x] 註冊 / 登入 [GitHub](https://github.com/) 帳號 (代碼版控)
- [x] 註冊 / 登入 [Vercel](https://vercel.com/) 帳號 (前端與全端部屬，使用 GitHub 登入最方便)
- [x] 註冊 / 登入 [Supabase](https://supabase.com/) 帳號 (資料庫與後端，可先註冊備用)

## 階段二：初始化 Next.js 專案 (Project Initialization)
- [x] 在本機 `d:\CodeProjects\EDTechWeb` 初始化 Next.js (App Router + TypeScript + TailwindCSS)
- [ ] 清理預設模板，建立基本頁面骨架
- [x] 將專案 Push 到 GitHub Repository

## 階段三：第一個「Hello World」上線 (First Deployment)
- [ ] 在 Vercel 綁定 GitHub Repository 網址
- [ ] 完成第一次自動部屬，取得 `.vercel.app` 網址！🎉

## 階段四：開發 MVP - 台灣行政區互動小地圖 (Civics Map Tool)
- [ ] 尋找 / 下載台灣縣市 GeoJSON 資料
- [ ] 撰寫地圖渲染元件 (React + SVG)
- [ ] 製作 Hover 動效與資訊卡片 (Tooltip)
- [ ] (選配) 增添測驗或小遊戲互動邏輯

## 階段五：資料庫整合 (Database Integration - Supabase)
- [ ] 在 Supabase 建立第一個專案與資料表 (Schema 設計)
- [ ] 在 Next.js 中設定環境變數 (Environment Variables) 串接資料表
- [ ] 實作讀寫功能 (例如：記錄學生的測驗分數，或儲存老師自訂的題庫)
