'use client';

import { useRouter } from 'next/navigation';
import { DetectivePlayer } from './DetectivePlayer';
import type { DetectiveQuestion } from './types';

export function DetectiveGamePage({ question }: { question: DetectiveQuestion }) {
  const router = useRouter();
  return (
    <DetectivePlayer
      question={question}
      onBack={() => router.push('/question-detective')}
      onRetry={() => router.refresh()}
    />
  );
}
