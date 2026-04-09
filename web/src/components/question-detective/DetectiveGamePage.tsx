'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DetectivePlayer } from './DetectivePlayer';
import type { DetectiveQuestion } from './types';

function getInitialTheme(): string {
  if (typeof window === 'undefined') return 'classic';
  const fromUrl = new URLSearchParams(window.location.search).get('theme');
  if (fromUrl) { localStorage.setItem('dt-theme', fromUrl); return fromUrl; }
  return localStorage.getItem('dt-theme') || 'classic';
}

export function DetectiveGamePage({ question }: { question: DetectiveQuestion }) {
  const router = useRouter();
  const [gameKey, setGameKey] = useState(0);
  const [theme] = useState(getInitialTheme);

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
