'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DetectivePlayer } from './DetectivePlayer';
import type { DetectiveQuestion } from './types';

export function DetectiveGamePage({ question }: { question: DetectiveQuestion }) {
  const router = useRouter();
  const [gameKey, setGameKey] = useState(0);
  const [theme, setTheme] = useState('classic');

  useEffect(() => {
    const saved = localStorage.getItem('dt-theme');
    if (saved) setTheme(saved);
  }, []);

  return (
    <div data-dt-theme={theme}>
      <DetectivePlayer
        key={gameKey}
        question={question}
        onBack={() => router.push('/question-detective')}
        onRetry={() => setGameKey(k => k + 1)}
        theme={theme}
      />
    </div>
  );
}
