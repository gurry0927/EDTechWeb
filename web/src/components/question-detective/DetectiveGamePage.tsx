'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DetectivePlayer } from './DetectivePlayer';
import type { DetectiveQuestion } from './types';
import { getInitialTheme } from './theme-utils';
import { DEFAULT_THEME } from '@/config/themes';

/** 記錄上次遊玩（首頁「繼續調查」按鈕用）
 *  TODO: 帳號系統上線後遷移至雲端 */
function recordLastPlayed(question: DetectiveQuestion, theme: string) {
  try {
    localStorage.setItem('dt-last-played', JSON.stringify({
      questionId: question.id,
      questionTitle: question.source,
      theme,
      timestamp: Date.now(),
    }));
  } catch { /* ignore */ }
}

export function DetectiveGamePage({ question }: { question: DetectiveQuestion }) {
  const router = useRouter();
  const [gameKey, setGameKey] = useState(0);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  useEffect(() => { setTheme(getInitialTheme()); }, []);

  // 記錄上次遊玩
  useEffect(() => {
    if (question.id !== 'tutorial') {
      recordLastPlayed(question, theme);
    }
  }, [question, theme]);

  return (
    <div data-dt-theme={theme}>
      <DetectivePlayer
        key={gameKey}
        question={question}
        onBack={() => router.push(`/question-detective?theme=${theme}`)}
        onRetry={() => setGameKey(k => k + 1)}
        theme={theme}
      />
    </div>
  );
}
