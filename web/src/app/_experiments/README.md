# 實驗區（_experiments）

Next.js 的 `_` 前綴資料夾不會產生路由，這裡的頁面不對外開放。

## 內容

| 資料夾 | 說明 | 狀態 |
|--------|------|------|
| `flooded-world-demo/` | 海平面變化互動地圖 | 擱置（D3 渲染 bug） |
| `layered-map-demo/` | 多圖層地圖基礎測試 | 擱置 |
| `taipei-lake-demo/` | 古台北湖海平面滑桿 | 擱置 |

## 相關元件
`src/components/_experiments-layered-map/` — LayeredMapOrchestrator（未完成，含 TODO）

## 相關文件
- `docs/CLAUDE_HANDOVER_FLOODED_WORLD.md`
- `docs/FLOODED-WORLD-HANDOFF.md`

## 如何恢復
如果要重啟這些實驗，把資料夾從 `_experiments/` 搬回 `app/` 根目錄即可恢復路由。
