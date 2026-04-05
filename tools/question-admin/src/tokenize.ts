import type { DetectiveQuestion } from './types';

// 組裝給 Gemini 的 prompt
export function buildTokenizePrompt(question: DetectiveQuestion): string {
  // 蒐集所有在 mainStem 中有位置的標記（startIndex >= 0）
  const marks: { text: string; start: number; label: string }[] = [];

  for (const clue of question.clues) {
    if (clue.startIndex >= 0) {
      marks.push({ text: clue.text, start: clue.startIndex, label: '線索' });
    }
    for (const alias of clue.aliases ?? []) {
      const pos = question.mainStem.indexOf(alias);
      if (pos >= 0 && pos !== clue.startIndex) {
        marks.push({ text: alias, start: pos, label: '線索別名' });
      }
    }
  }

  for (const s of question.scaffolding ?? []) {
    if (s.startIndex >= 0) {
      const label = s.type === 'context' ? '鷹架-脈絡' : '鷹架-雜訊';
      marks.push({ text: s.text, start: s.startIndex, label });
    }
  }

  marks.sort((a, b) => a.start - b.start);

  const marksBlock = marks.length
    ? marks.map(m => `- "${m.text}"（${m.label}，位置 ${m.start}）`).join('\n')
    : '（無標記區間，整段均可自由切分）';

  return `你是一個繁體中文文本切分助手，協助教育遊戲進行防作弊詞段混淆。

任務：
將以下題幹切成語意詞段陣列。題幹中有些區間已被標記為「線索」或「鷹架」，
這些區間必須以原文字串保留為單一元素，不可拆分。
其餘空白區間請做語意切分。

切分規則（嚴格遵守）：
1. 所有元素串接後必須完全等於原始題幹，不得增刪任何字元
2. 括號內容（如「(八)」「（九）」）連同緊鄰的漢字保持為單一元素
3. 空白區間每個元素 2–5 字，不得出現單字孤兒
4. 在助詞（的、了、在、與）、介詞、連接詞前後優先斷開
5. 切分應「自然但不規律」，避免等長切分讓學生發現規律
6. 標記區間（線索、鷹架）原文原樣放入陣列，不可修改內容

題幹：
${question.mainStem}

標記區間（這些字串必須原樣出現在輸出陣列中）：
${marksBlock}

只回傳 JSON 陣列，不要任何解釋文字。`;
}

// 驗證 Gemini 回傳的 tokens 是否合法
export type ValidationResult =
  | { ok: true; tokens: string[] }
  | { ok: false; reason: string };

export function validateTokens(raw: string, originalStem: string): ValidationResult {
  let tokens: unknown;
  try {
    tokens = JSON.parse(raw);
  } catch {
    // 有時 Gemini 會包在 ```json ... ``` 裡
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      try { tokens = JSON.parse(match[1]); } catch { /* fall through */ }
    }
  }

  if (!Array.isArray(tokens)) return { ok: false, reason: '回傳值不是陣列' };
  if (!tokens.every(t => typeof t === 'string')) return { ok: false, reason: '陣列中有非字串元素' };

  const joined = (tokens as string[]).join('');
  if (joined !== originalStem) {
    // 找出第一個不一樣的位置，顯示字元碼方便診斷（常見：全/半形括號、不同空白）
    let diffIdx = 0;
    while (diffIdx < Math.min(joined.length, originalStem.length) && joined[diffIdx] === originalStem[diffIdx]) diffIdx++;
    const ctx = (s: string) => s.slice(Math.max(0, diffIdx - 3), diffIdx + 8);
    const charInfo = (s: string, i: number) => i < s.length ? `'${s[i]}' U+${s.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')}` : '(end)';
    const hint = `第 ${diffIdx} 字不同 — 期望 ${charInfo(originalStem, diffIdx)}，實際 ${charInfo(joined, diffIdx)}。前後文：「${ctx(originalStem)}」vs「${ctx(joined)}」`;
    console.warn('[validate] diff at', diffIdx, { expected: originalStem.charCodeAt(diffIdx), actual: joined.charCodeAt(diffIdx) });
    return {
      ok: false,
      reason: hint,
    };
  }

  return { ok: true, tokens: tokens as string[] };
}
