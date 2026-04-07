import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('[supabase] VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY 未設定');
}

export const supabase = createClient(url ?? '', key ?? '');
