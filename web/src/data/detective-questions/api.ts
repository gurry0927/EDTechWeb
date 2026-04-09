import { supabase } from '@/lib/supabase';
import type { DetectiveQuestion } from '@/components/question-detective/types';

// ── Cache helpers ──
const CACHE_PREFIX = 'dt-cache-';
const CACHE_LIST_KEY = 'dt-cache-list';
const CACHE_TTL = 10 * 60 * 1000; // 10 分鐘

interface CacheEntry<T> { data: T; ts: number }

function getCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
    return entry.data;
  } catch { return null; }
}

function setCache<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch { /* quota exceeded */ }
}

// ── 公開資料（列表頁用，不含答案/線索）──
export type PublicQuestion = Pick<DetectiveQuestion,
  'id' | 'source' | 'subject' | 'difficulty' | 'tags' |
  'subSubject' | 'gradeLevel' | 'mainStem' | 'figure' |
  'figureImage' | 'options' | 'caseQuestion' | 'startHint'
>;

export async function fetchPublicQuestions(): Promise<PublicQuestion[]> {
  // 先查 cache
  const cached = getCache<PublicQuestion[]>(CACHE_LIST_KEY);
  if (cached && cached.length > 0) return cached;

  const { data, error } = await supabase.rpc('get_public_questions');
  if (error) {
    console.error('[supabase] fetchPublicQuestions failed', error);
    return [];
  }
  const result = (data ?? []) as PublicQuestion[];
  if (result.length > 0) setCache(CACHE_LIST_KEY, result);
  return result;
}

// ── 完整資料（遊戲頁用，使用者互動後才載入）──
export async function fetchQuestionDetail(id: string): Promise<DetectiveQuestion | null> {
  const cacheKey = `${CACHE_PREFIX}${id}`;
  const cached = getCache<DetectiveQuestion>(cacheKey);
  if (cached) return cached;

  const { data, error } = await supabase.rpc('get_question_detail', { question_id: id });
  if (error) {
    console.error('[supabase] fetchQuestionDetail failed', error);
    return null;
  }
  const result = (data as DetectiveQuestion) ?? null;
  if (result) setCache(cacheKey, result);
  return result;
}
