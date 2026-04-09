# 問題偵探 — 主題系統維護手冊

## 架構總覽

```
theme-registry.ts     ← 主題定義（邏輯 + 台詞）   唯一入口
globals.css           ← 主題視覺（CSS 變數 + 元件覆寫） 唯一入口
theme-utils.ts        ← 初始化邏輯（自動讀 registry）
detective-config.ts   ← 基礎台詞 + getDialogue()
DetectivePlayer.tsx   ← 遊戲引擎（消費端，不直接管主題）
```

## 新增主題步驟

只需改 **2 個檔案**：

### Step 1：theme-registry.ts

```ts
// src/components/question-detective/theme-registry.ts

const DIALOGUE_RETRO: Partial<Dialogue> = {
  tabLabel: '存檔',
  notebookTabLabel: '記錄檔',
  notebookIcon: '💿',
  stemHeader: '關卡任務',
  intro: 'LOADING... 任務資料讀取完成。',
  // ... 只列要覆蓋的 key，其餘自動 fallback 到 classic
};

export const THEME_REGISTRY: Record<string, ThemeEntry> = {
  classic: { ... },
  cyber: { ... },
  retro: {                          // ← 加在這裡
    id: 'retro',
    label: '🕹️ 復古',
    desc: '像素風 8-bit',
    dialogue: DIALOGUE_RETRO,
  },
};
```

### Step 2：globals.css

```css
/* 加在 Cyberpunk Theme 區塊後面 */

[data-dt-theme="retro"] {
  --dt-bg: #2b2b3d;
  --dt-card: #3a3a52;
  --dt-wood: #1e1e2e;
  --dt-text: #e0e060;
  --dt-scan: #40ff40;
  --dt-clue: #ff6060;
  /* ... 完整變數列表見下方「CSS 變數清單」 */
}

/* 元件覆寫（選用） */
[data-dt-theme="retro"] .case-file { ... }
[data-dt-theme="retro"] .case-photo { ... }
```

### 完成

不需要改的檔案：
- `theme-utils.ts` — 自動從 `VALID_THEME_IDS` 讀取
- `page.tsx` — 自動從 `THEME_LIST` 渲染切換按鈕
- `DetectivePlayer.tsx` — 自動從 registry 取台詞
- `DetectiveGamePage.tsx` — 不需改動

## 檔案職責

| 檔案 | 職責 | 新增主題要改？ |
|------|------|-------------|
| `theme-registry.ts` | 主題 ID、名稱、描述、台詞覆寫 | ✅ 必改 |
| `globals.css` | CSS 變數 + 元件視覺覆寫 | ✅ 必改 |
| `detective-config.ts` | 基礎台詞（classic）、`getDialogue()` | ❌ |
| `theme-utils.ts` | `getInitialTheme()`、`VALID_THEME_IDS` | ❌ |
| `DetectivePlayer.tsx` | 遊戲引擎，讀 DIALOGUE + dt-* class | ❌ |
| `DetectiveGamePage.tsx` | 外殼，傳 theme prop | ❌ |
| `page.tsx`（列表頁） | 主題切換 UI、`THEME_LIST` | ❌ |
| `[id]/page.tsx` | 遊戲頁入口、theme 初始化 | ❌ |

## CSS 變數清單

每套主題需要定義以下變數（在 `[data-dt-theme="xxx"]` 區塊內）：

### 背景
| 變數 | 用途 | Classic 參考值 |
|------|------|---------------|
| `--dt-bg` | 紙張/面板底色 | `#f4efe4` |
| `--dt-card` | 浮卡背景 | `#f8f4eb` |
| `--dt-wood` | 頁面背景（聊天區） | `#c8b49a` |

### 文字
| 變數 | 用途 | Classic 參考值 |
|------|------|---------------|
| `--dt-text` | 主文字 | `#3d3426` |
| `--dt-text-secondary` | 次要文字 | `#78716c` |
| `--dt-text-muted` | 淡化文字 | `#94a3b8` |

### 強調色
| 變數 | 用途 | Classic 參考值 |
|------|------|---------------|
| `--dt-accent` | 主強調（案件卡邊框） | `#c2553a` |
| `--dt-accent-tab` | 機密 tab 文字 | `#8b1a1a` |
| `--dt-scan` | 掃描/推理色（cyan 系） | `#06b6d4` |
| `--dt-clue` | 線索命中色（amber 系） | `#f59e0b` |
| `--dt-success` | 成功色（emerald 系） | `#10b981` |
| `--dt-error` | 錯誤/扣血色（red 系） | `#ef4444` |

### 邊框 & 陰影
| 變數 | 用途 | Classic 參考值 |
|------|------|---------------|
| `--dt-border` | 通用邊框色 | `rgba(140,120,80,0.15)` |
| `--dt-shadow` | 通用陰影色 | `rgba(80,60,30,0.08)` |
| `--dt-tab-shadow` | Tab 陰影色 | `rgba(60,35,10,0.2)` |
| `--dt-line` | 橫線紋色 | `rgba(140,120,80,0.07)` |

### 掃描效果
| 變數 | 用途 | Classic 參考值 |
|------|------|---------------|
| `--dt-scan-sweep` | 掃光漸層峰值色 | `rgba(34,211,238,0.3)` |
| `--dt-scan-glow` | 掃描光暈 | `rgba(6,182,212,0.25)` |

### 元件色
| 變數 | 用途 | Classic 參考值 |
|------|------|---------------|
| `--dt-btn-bg` | 主按鈕背景 | `#0891b2` |
| `--dt-btn-hover` | 主按鈕 hover | `#06b6d4` |
| `--dt-btn-text` | 主按鈕文字 | `white` |
| `--dt-surface` | 元件表面色 | `white` |
| `--dt-surface-dim` | 元件暗淡表面 | `#f1f5f9` |
| `--dt-notebook-badge` | 筆記本紅點色 | `#ef4444` |

### 照片濾鏡（CSS class 變數）
| 變數 | 用途 | Classic 參考值 |
|------|------|---------------|
| `--dt-photo-filter` | 照片 CSS filter | `sepia(0.65) saturate(0.72) contrast(1.1)` |
| `--dt-photo-overlay` | 照片疊加效果 | `radial-gradient(...)` |
| `--dt-photo-blend` | 疊加混合模式 | `multiply` |

## 台詞覆寫清單

`DIALOGUE_BASE` 中所有可覆寫的 key（共 ~50 個）：

### UI 標籤
| Key | Classic | 說明 |
|-----|---------|------|
| `tabLabel` | 機密 | 第一個 tab 文字 |
| `notebookTabLabel` | 偵探筆記本 | 第二個 tab 文字 |
| `notebookIcon` | 📓 | 筆記本標題 emoji |
| `stemHeader` | 案件証詞 | 案件卡標題 |
| `figureLabel` | 証物細節 | 證物區標題 |
| `suspectListHeader` | 嫌疑犯名單 | 筆記本嫌犯區標題 |

### 遊戲流程台詞
| Key | 說明 |
|-----|------|
| `intro` / `introWithFigure` | 開場白 |
| `introHint` | 開場操作提示 |
| `caseQuestionPrompt` | 案件問題引導 |
| `clueMissReactions[]` | 點錯時的隨機回應 |
| `contextHitReactions[]` | 點到脈絡鷹架 |
| `noiseHitReactions[]` | 點到雜訊鷹架 |
| `clueReactions[]` | 找到線索時 |
| `clueNotebookCTA` | 引導去筆記本 |
| `scanActivate` | 掃描啟動 |
| `scanNudge` | 掃描中無操作提示 |
| `reasoningIntro` | 進入推理階段 |
| `answerPrompt` | 進入指認階段 |
| `answerCorrect` | 答對 |
| `gameOverTakeover` | 血量歸零 |
| `notebookTitle` | 筆記本面板標題 |
| `notebookSubtitle` | 筆記本面板副標題 |

完整列表見 `detective-config.ts` 的 `DIALOGUE_BASE` 定義。

## 主題優先順序

```
URL ?theme=xxx  >  localStorage dt-theme  >  'classic'
```

## 未來擴充方向

### 帳號解鎖
```ts
// theme-registry.ts 加欄位
interface ThemeEntry {
  ...
  unlockCondition?: 'free' | 'achievement' | 'premium';
}

// 列表頁根據帳號過濾
THEME_LIST.filter(t => user.unlockedThemes.includes(t.id))
```

### 科目綁定
```ts
interface ThemeEntry {
  ...
  subjects?: string[] | null;  // null = 全科目
}
```

### 季節限定
```ts
interface ThemeEntry {
  ...
  available?: { from: string; to: string };
}
```

這些擴充只需改 `theme-registry.ts` + 列表頁 filter 邏輯。
