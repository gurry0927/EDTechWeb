// Gemini API 呼叫邏輯
// 支援多 key 輪替：若當前 key 回傳 429 或 503，自動嘗試下一把

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export class GeminiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? res.statusText;
    throw new GeminiError(res.status, msg);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new GeminiError(0, '回應內容為空');
  return text;
}

// 輪替呼叫：依序嘗試所有 key，遇到 429/503 換下一把，其他錯誤直接拋出
export async function callGeminiWithRotation(
  keys: string[],
  prompt: string,
  onKeySwitch?: (fromLabel: string, toLabel: string) => void,
  keyLabels?: string[],
): Promise<{ result: string; usedKeyIndex: number }> {
  if (!keys.length) throw new Error('尚未設定 API Key');

  for (let i = 0; i < keys.length; i++) {
    try {
      const result = await callGemini(keys[i], prompt);
      return { result, usedKeyIndex: i };
    } catch (e) {
      if (e instanceof GeminiError && (e.status === 429 || e.status === 503)) {
        if (i < keys.length - 1) {
          onKeySwitch?.(
            keyLabels?.[i] ?? `Key ${i + 1}`,
            keyLabels?.[i + 1] ?? `Key ${i + 2}`,
          );
          continue; // 嘗試下一把
        }
      }
      throw e; // 其他錯誤或已無 key 可換
    }
  }

  throw new Error('所有 API Key 均已耗盡或失敗');
}
