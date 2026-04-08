'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DetectivePlayer } from './DetectivePlayer';
import type { DetectiveQuestion } from './types';

export function DetectiveGamePage({ question }: { question: DetectiveQuestion }) {
  const router = useRouter();
  const [gameKey, setGameKey] = useState(0);
  return (
    <DetectivePlayer
      key={gameKey}
      question={question}
      onBack={() => router.push('/question-detective')}
      onRetry={() => setGameKey(k => k + 1)}
    />
  );
}
