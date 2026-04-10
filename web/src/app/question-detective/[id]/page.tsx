'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DetectiveGamePage } from '@/components/question-detective/DetectiveGamePage';
import { getInitialTheme } from '@/components/question-detective/theme-utils';
import { DEFAULT_THEME } from '@/config/themes';
import { fetchQuestionDetail } from '@/data/detective-questions/api';
import type { DetectiveQuestion } from '@/components/question-detective/types';
import tutorialData from '@/data/detective-questions/tutorial.json';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState<DetectiveQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  useEffect(() => { setTheme(getInitialTheme()); }, []);

  useEffect(() => {
    // 教學關卡用本地 JSON，不走 Supabase
    if (id === 'tutorial') {
      setQuestion(tutorialData as DetectiveQuestion);
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchQuestionDetail(id).then(q => {
      if (cancelled) return;
      if (q) setQuestion(q);
      else setError(true);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] detective-paper text-dt-text flex items-center justify-center" data-dt-theme={theme} suppressHydrationWarning>
        <div className="text-dt-text-muted text-sm">載入案件中…</div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-[100dvh] detective-paper text-dt-text flex flex-col items-center justify-center gap-3" data-dt-theme={theme} suppressHydrationWarning>
        <div className="text-dt-text-secondary text-sm">找不到這份案件</div>
        <Link href={`/question-detective?theme=${theme}`} className="text-dt-scan text-sm hover:underline">返回檔案室</Link>
      </div>
    );
  }

  return <DetectiveGamePage question={question} />;
}
