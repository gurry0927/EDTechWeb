import type { DetectiveQuestion } from './types';

// 找出 needle 在 haystack 中所有出現位置
function findAllOccurrences(haystack: string, needle: string): number[] {
  const positions: number[] = [];
  let from = 0;
  while (from <= haystack.length - needle.length) {
    const pos = haystack.indexOf(needle, from);
    if (pos < 0) break;
    positions.push(pos);
    from = pos + 1;
  }
  return positions;
}

// 通用：蒐集指定 location 的標記區間
function collectMarks(
  question: DetectiveQuestion,
  location: 'stem' | 'figure',
) {
  const src = location === 'stem' ? question.mainStem : question.figure;
  if (!src) return [];

  const marks: { text: string; start: number; label: string }[] = [];
  // 收集主標記的起始位置，用來排除 alias 重複
  const primaryStarts = new Set<number>();

  for (const clue of question.clues) {
    if (clue.location === location) {
      marks.push({ text: clue.text, start: clue.startIndex, label: '線索' });
      primaryStarts.add(clue.startIndex);
    }
  }
  for (const s of question.scaffolding ?? []) {
    if (s.location === location) {
      const label = s.type === 'context' ? '鷹架-脈絡' : '鷹架-雜訊';
      marks.push({ text: s.text, start: s.startIndex, label });
      primaryStarts.add(s.startIndex);
    }
  }

  // alias 查找：找出所有出現位置，排除已被主標記佔用的位置
  for (const clue of question.clues) {
    for (const alias of clue.aliases ?? []) {
      for (const pos of findAllOccurrences(src, alias)) {
        if (!primaryStarts.has(pos)) {
          marks.push({ text: alias, start: pos, label: '線索別名' });
        }
      }
    }
  }
  for (const s of question.scaffolding ?? []) {
    for (const alias of s.aliases ?? []) {
      const label = s.type === 'context' ? '鷹架別名-脈絡' : '鷹架別名-雜訊';
      for (const pos of findAllOccurrences(src, alias)) {
        if (!primaryStarts.has(pos)) {
          marks.push({ text: alias, start: pos, label });
        }
      }
    }
  }

  marks.sort((a, b) => a.start - b.start);
  return marks;
}

function buildPrompt(sourceText: string, sourceLabel: string, marks: { text: string; start: number; label: string }[]) {
  const marksBlock = marks.length
    ? marks.map(m => `- "${m.text}"（${m.label}，位置 ${m.start}）`).join('\n')
    : '（無標記區間，整段均可自由切分）';

  return `你是一個繁體中文文本切分助手，協助教育遊戲進行防作弊詞段混淆。

任務：
將以下${sourceLabel}切成語意詞段陣列。文本中有些區間已被標記為「線索」或「鷹架」，
這些區間必須以原文字串保留為單一元素，不可拆分。
其餘空白區間請做語意切分。

切分規則（嚴格遵守）：
1. 所有元素串接後必須完全等於原始${sourceLabel}，不得增刪任何字元
2. 括號內容（如「(八)」「（九）」）連同緊鄰的漢字保持為單一元素
3. 空白區間每個元素 2–5 字，不得出現單字孤兒
4. 在助詞（的、了、在、與）、介詞、連接詞前後優先斷開
5. 切分應「自然但不規律」，避免等長切分讓學生發現規律
6. 標記區間（線索、鷹架）原文原樣放入陣列，不可修改內容
7. 特殊符號（如❶❷）連同緊鄰的文字保持為單一元素
8. 句末標點（。，！？、；）必須獨立為一個元素，不可與前後文字合併

${sourceLabel}：
${sourceText}

標記區間（這些字串必須原樣出現在輸出陣列中）：
${marksBlock}

只回傳 JSON 陣列，不要任何解釋文字。`;
}

// 組裝 mainStem 的 prompt
export function buildTokenizePrompt(question: DetectiveQuestion): string {
  const marks = collectMarks(question, 'stem');
  return buildPrompt(question.mainStem, '題幹', marks);
}

// 組裝 figure 的 prompt
export function buildFigureTokenizePrompt(question: DetectiveQuestion): string | null {
  if (!question.figure) return null;
  const marks = collectMarks(question, 'figure');
  return buildPrompt(question.figure, '證物細節', marks);
}

// 嘗試修復 AI 吞掉的少量字元（如空格、標點）
// 只在差異很小時才修復，差太多直接放棄回傳 null
function repairTokens(tokens: string[], original: string): string[] | null {
  const joined = tokens.join('');
  const diff = original.length - joined.length;

  // 只處理「AI 少回傳幾個字元」的情況，且差異不超過原文 5% 或 3 字
  if (diff <= 0 || diff > Math.max(3, original.length * 0.05)) return null;

  const repaired = tokens.map(t => t);
  let oi = 0; // original index
  let ti = 0; // token index

  while (ti < repaired.length && oi < original.length) {
    const tok = repaired[ti];
    let tokPos = 0;

    while (tokPos < tok.length && oi < original.length) {
      if (tok[tokPos] === original[oi]) {
        tokPos++;
        oi++;
      } else {
        // 原文有但 token 沒有 → 插入（只允許插入空白/標點）
        const ch = original[oi];
        if (/[\s。，！？、；：（）()「」]/.test(ch)) {
          repaired[ti] = repaired[ti].slice(0, tokPos) + ch + repaired[ti].slice(tokPos);
          oi++;
          tokPos++;
        } else {
          // 非空白/標點差異 → 放棄修復
          return null;
        }
      }
    }

    // token 之間的間隙
    while (oi < original.length && ti + 1 < repaired.length && original[oi] !== repaired[ti + 1][0]) {
      const ch = original[oi];
      if (/[\s。，！？、；：（）()「」]/.test(ch)) {
        repaired[ti] += ch;
        oi++;
      } else {
        return null;
      }
    }

    ti++;
  }

  if (oi < original.length && repaired.length > 0) {
    repaired[repaired.length - 1] += original.slice(oi);
  }

  return repaired;
}

// 驗證回傳的 tokens 是否合法（通用：stem / figure 皆可）
export type ValidationResult =
  | { ok: true; tokens: string[] }
  | { ok: false; reason: string };

export function validateTokens(raw: string, originalText: string): ValidationResult {
  let tokens: unknown;
  try {
    tokens = JSON.parse(raw);
  } catch {
    // 有時 AI 會包在 ```json ... ``` 裡
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try { tokens = JSON.parse(match[1]); } catch { /* fall through */ }
    }
  }

  if (!Array.isArray(tokens)) return { ok: false, reason: '回傳值不是陣列' };
  if (!tokens.every(t => typeof t === 'string')) return { ok: false, reason: '陣列中有非字串元素' };

  let strTokens = tokens as string[];

  // 先嘗試修復 AI 常見的字元吞吐問題（空格、標點）
  if (strTokens.join('') !== originalText) {
    strTokens = repairTokens(strTokens, originalText) ?? strTokens;
  }

  const joined = strTokens.join('');
  if (joined !== originalText) {
    // 修復失敗，報告差異
    let diffIdx = 0;
    while (diffIdx < Math.min(joined.length, originalText.length) && joined[diffIdx] === originalText[diffIdx]) diffIdx++;
    const ctx = (s: string) => s.slice(Math.max(0, diffIdx - 3), diffIdx + 8);
    const charInfo = (s: string, i: number) => i < s.length ? `'${s[i]}' U+${s.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')}` : '(end)';
    const hint = `第 ${diffIdx} 字不同 — 期望 ${charInfo(originalText, diffIdx)}，實際 ${charInfo(joined, diffIdx)}。前後文：「${ctx(originalText)}」vs「${ctx(joined)}」`;
    console.warn('[validate] diff at', diffIdx, { expected: originalText.charCodeAt(diffIdx), actual: joined.charCodeAt(diffIdx) });
    return { ok: false, reason: hint };
  }

  return { ok: true, tokens: strTokens };
}
