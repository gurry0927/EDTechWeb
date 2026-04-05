// 統一的 AI API 呼叫層，支援 Gemini 和 OpenAI
import type { ApiKey } from './types';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ── Gemini ──

async function callGemini(key: ApiKey, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${key.model}:generateContent?key=${key.value}`;
  console.log(`[Gemini] → ${key.model} (${prompt.length} chars)`);
  const t0 = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    }),
  });
  console.log(`[Gemini] ← HTTP ${res.status} (${Date.now() - t0}ms)`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.error?.message ?? res.statusText);
  }
  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  if (!text) throw new ApiError(0, 'Gemini 回應內容為空');
  console.log(`[Gemini] 回傳 ${text.length} chars`);
  return text;
}

// ── OpenAI ──

async function callOpenAI(key: ApiKey, prompt: string): Promise<string> {
  console.log(`[OpenAI] → ${key.model} (${prompt.length} chars)`);
  const t0 = Date.now();
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key.value}`,
    },
    body: JSON.stringify({
      model: key.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });
  console.log(`[OpenAI] ← HTTP ${res.status} (${Date.now() - t0}ms)`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body?.error?.message ?? res.statusText);
  }
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new ApiError(0, 'OpenAI 回應內容為空');
  console.log(`[OpenAI] 回傳 ${text.length} chars`);
  return text;
}

// ── 統一入口 ──

// 用最小的請求確認 key + model 是否可用，回傳 null 表示正常
export async function testKey(key: ApiKey): Promise<null | string> {
  try {
    // OpenAI json_object mode 要求 prompt 含 "json" 字樣；Gemini 無此限制但也不影響
    await callApi(key, 'Reply with a valid json object: {"ok":true}');
    return null;
  } catch (e) {
    return e instanceof ApiError ? `HTTP ${e.status}：${e.message}` : String(e);
  }
}

export async function callApi(key: ApiKey, prompt: string): Promise<string> {
  return key.provider === 'openai' ? callOpenAI(key, prompt) : callGemini(key, prompt);
}

// 輪替呼叫：遇到 429/503 自動換下一把 key
export async function callWithRotation(
  keys: ApiKey[],
  prompt: string,
  onSwitch?: (from: string, to: string) => void,
): Promise<{ result: string; usedKeyIndex: number }> {
  if (!keys.length) throw new Error('尚未設定 API Key');

  for (let i = 0; i < keys.length; i++) {
    try {
      const result = await callApi(keys[i], prompt);
      return { result, usedKeyIndex: i };
    } catch (e) {
      if (e instanceof ApiError && (e.status === 429 || e.status === 503) && i < keys.length - 1) {
        onSwitch?.(keys[i].label, keys[i + 1].label);
        continue;
      }
      throw e;
    }
  }

  throw new Error('所有 API Key 均已耗盡或失敗');
}
