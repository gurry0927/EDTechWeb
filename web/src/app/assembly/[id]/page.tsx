'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { fetchQuestionDetail } from '@/data/questions/api';
import type { DetectiveQuestion } from '@/components/game-modes/detective/types';
import { AssemblyPlayer } from '@/components/game-modes/assembly/AssemblyPlayer';
import { getInitialTheme } from '@/components/game-modes/detective/theme-utils';
import { DEFAULT_THEME } from '@/config/themes';

export default function AssemblyGamePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [question, setQuestion] = useState<DetectiveQuestion | null>(null);
  const [error, setError] = useState(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);

  useEffect(() => { setTheme(getInitialTheme()); }, []);

  useEffect(() => {
    fetchQuestionDetail(id).then(q => {
      if (!q || !q.assemblyMode) { setError(true); return; }
      setQuestion(q);
    });
  }, [id]);

  if (error) {
    return (
      <div data-dt-theme={theme} className="min-h-[100dvh] detective-paper text-dt-text flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-xl">✕ 題目不存在或尚未支援組裝模式</div>
          <button onClick={() => router.back()} className="text-sm underline text-dt-text-secondary hover:text-dt-text">
            返回
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div data-dt-theme={theme} className="min-h-[100dvh] detective-paper text-dt-text-muted flex items-center justify-center text-sm">
        載入中…
      </div>
    );
  }

  return (
    <div data-dt-theme={theme}>
      <AssemblyPlayer
        question={question}
        themeId={theme}
        onBack={() => router.push(`/assembly?theme=${theme}`)}
      />
    </div>
  );
}
