import type { DetectiveQuestion } from './types';

// 通用：蒐集指定 location 的標記區間
function collectMarks(
  question: DetectiveQuestion,
  location: 'stem' | 'figure',
) {
  const src = location === 'stem' ? question.mainStem : question.figure;
  if (!src) return [];

  const marks: { text: string; start: number; label: string }[] = [];

  for (const clue of question.clues) {
    if (clue.location === location) {
      marks.push({ text: clue.text, start: clue.startIndex, label: '線索' });
    }
    for (const alias of clue.aliases ?? []) {
      const pos = src.indexOf(alias);
      if (pos >= 0 && pos !== clue.startIndex) {
        marks.push({ text: alias, start: pos, label: '線索別名' });
      }
    }
  }

  for (const s of question.scaffolding ?? []) {
    if (s.location === location) {
      const label = s.type === 'context' ? '鷹架-脈絡' : '鷹架-雜訊';
      marks.push({ text: s.text, start: s.startIndex, label });
    }
    for (const alias of s.aliases ?? []) {
      const pos = src.indexOf(alias);
      if (pos >= 0 && pos !== s.startIndex) {
        marks.push({ text: alias, start: pos, label: s.type === 'context' ? '鷹架別名-脈絡' : '鷹架別名-雜訊' });
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

  const joined = (tokens as string[]).join('');
  if (joined !== originalText) {
    // 找出第一個不一樣的位置，顯示字元碼方便診斷（常見：全/半形括號、不同空白）
    let diffIdx = 0;
    while (diffIdx < Math.min(joined.length, originalText.length) && joined[diffIdx] === originalText[diffIdx]) diffIdx++;
    const ctx = (s: string) => s.slice(Math.max(0, diffIdx - 3), diffIdx + 8);
    const charInfo = (s: string, i: number) => i < s.length ? `'${s[i]}' U+${s.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')}` : '(end)';
    const hint = `第 ${diffIdx} 字不同 — 期望 ${charInfo(originalText, diffIdx)}，實際 ${charInfo(joined, diffIdx)}。前後文：「${ctx(originalText)}」vs「${ctx(joined)}」`;
    console.warn('[validate] diff at', diffIdx, { expected: originalText.charCodeAt(diffIdx), actual: joined.charCodeAt(diffIdx) });
    return { ok: false, reason: hint };
  }

  return { ok: true, tokens: tokens as string[] };
}
