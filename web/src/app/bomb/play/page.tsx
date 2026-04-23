'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BombPlayer } from '@/components/game-modes/bomb/BombPlayer';
import { fetchQuestionDetail } from '@/data/questions/api';
import type { DetectiveQuestion } from '@/components/game-modes/detective/types';

export default function BombPlayPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<DetectiveQuestion[]>([]);
  const [mode, setMode] = useState<'fixed' | 'endless'>('fixed');
  const [theme, setTheme] = useState('classic');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('bomb-queue');
    if (!raw) { setError(true); setLoading(false); return; }

    try {
      const { ids, mode: m, theme: t } = JSON.parse(raw) as { ids: string[]; mode: 'fixed' | 'endless'; theme: string };
      setMode(m);
      setTheme(t);

      // 批量 fetch 所有題目
      Promise.all(ids.map(id => fetchQuestionDetail(id))).then(results => {
        const valid = results.filter((r): r is DetectiveQuestion => r !== null);
        if (valid.length === 0) { setError(true); setLoading(false); return; }
        setQuestions(valid);
        setLoading(false);
      });
    } catch {
      setError(true);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div data-dt-theme={theme} className="h-[100dvh] detective-paper text-dt-text flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">💣</div>
          <p className="text-sm text-dt-text-muted">載入炸彈中…</p>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div data-dt-theme={theme} className="h-[100dvh] detective-paper text-dt-text flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-dt-text-muted mb-4">找不到題目，請回大廳重新選擇</p>
          <button onClick={() => router.push('/bomb')}
            className="px-4 py-2 rounded-lg text-sm dt-btn-primary">
            返回大廳
          </button>
        </div>
      </div>
    );
  }

  return (
    <div data-dt-theme={theme}>
      <BombPlayer
        questions={questions}
        mode={mode}
        theme={theme}
        onBack={() => router.push(`/bomb?theme=${theme}`)}
      />
    </div>
  );
}
