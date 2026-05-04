'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchQuestionDetail } from '@/data/questions/api';
import type { DetectiveQuestion } from '@/components/game-modes/detective/types';
import { AssemblyPlayer } from '@/components/game-modes/assembly/AssemblyPlayer';

export default function AssemblyGamePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [question, setQuestion] = useState<DetectiveQuestion | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchQuestionDetail(id).then(q => {
      if (!q || !q.assemblyMode) { setError(true); return; }
      setQuestion(q);
    });
  }, [id]);

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center font-mono text-green-600">
        <div className="text-center space-y-3">
          <div className="text-xl">✕ 題目不存在或尚未支援組裝模式</div>
          <button onClick={() => router.back()} className="text-sm underline hover:text-green-400">
            返回
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-[100dvh] bg-black flex items-center justify-center font-mono text-green-800 text-sm">
        載入中…
      </div>
    );
  }

  return (
    <AssemblyPlayer
      question={question}
      themeId="hacker"
      onBack={() => router.back()}
    />
  );
}
