'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DetectivePlayer } from './DetectivePlayer';
import type { DetectiveQuestion } from './types';
import { getInitialTheme } from './theme-utils';

export function DetectiveGamePage({ question }: { question: DetectiveQuestion }) {
  const router = useRouter();
  const [gameKey, setGameKey] = useState(0);
  const [theme] = useState(getInitialTheme);

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
