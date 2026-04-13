'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SpyPlayer } from './SpyPlayer';
import type { DetectiveQuestion } from '@/components/question-detective/types';
import { getInitialTheme } from '@/components/question-detective/theme-utils';
import { DEFAULT_THEME } from '@/config/themes';

/** 記錄上次遊玩
 *  TODO: 帳號系統上線後遷移至雲端 */
function recordLastPlayed(question: DetectiveQuestion, theme: string) {
  try {
    localStorage.setItem('dt-last-played', JSON.stringify({
      questionId: question.id,
      questionTitle: question.source,
      theme,
      mode: 'spy',
      timestamp: Date.now(),
    }));
  } catch { /* ignore */ }
}

export function SpyGamePage({ question }: { question: DetectiveQuestion }) {
  const router = useRouter();
  const [gameKey, setGameKey] = useState(0);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  useEffect(() => { setTheme(getInitialTheme()); }, []);

  useEffect(() => {
    recordLastPlayed(question, theme);
  }, [question, theme]);

  return (
    <div data-dt-theme={theme}>
      <SpyPlayer
        key={gameKey}
        question={question}
        onBack={() => router.push(`/question-spy?theme=${theme}`)}
        onRetry={() => setGameKey(k => k + 1)}
        theme={theme}
      />
    </div>
  );
}
