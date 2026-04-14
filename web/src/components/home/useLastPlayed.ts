'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'dt-last-played';

export interface LastPlayed {
  questionId: string;
  questionTitle: string;
  theme: string;
  mode?: 'detective' | 'spy';
  timestamp: number;
}

/** 追蹤上次遊玩紀錄（localStorage）
 *  TODO: 帳號系統上線後遷移至雲端 */
export function useLastPlayed() {
  const [lastPlayed, setLastPlayed] = useState<LastPlayed | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setLastPlayed(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const recordPlay = useCallback((questionId: string, questionTitle: string, theme: string) => {
    const record: LastPlayed = { questionId, questionTitle, theme, timestamp: Date.now() };
    setLastPlayed(record);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(record)); } catch { /* ignore */ }
  }, []);

  return { lastPlayed, recordPlay };
}
