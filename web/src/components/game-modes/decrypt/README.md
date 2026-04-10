# 解密模式（克漏字拖曳）

## 設計
- 痛點：知道大意但細節模糊
- 玩法：關鍵字被挖空，從選項池拖曳填回原位
- 題源：現有偵探題的 clue 位置即挖空位置，低改造成本

## TODO
- [ ] Player 元件（拖曳 + 放置區）
- [ ] 題目轉換器（DetectiveQuestion → DecryptQuestion）
- [ ] 路由 `/question-decrypt/[id]`
- [ ] 註冊到 gameModes.ts（解鎖）
