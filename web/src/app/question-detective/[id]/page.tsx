'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { DetectiveGamePage } from '@/components/question-detective/DetectiveGamePage';
import { fetchQuestionDetail } from '@/data/detective-questions/api';
import { ALL_QUESTIONS } from '@/data/detective-questions';
import type { DetectiveQuestion } from '@/components/question-detective/types';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [question, setQuestion] = useState<DetectiveQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const searchParams = useSearchParams();
  const [theme, setTheme] = useState('classic');

  useEffect(() => {
    const fromUrl = searchParams.get('theme');
    if (fromUrl) { setTheme(fromUrl); localStorage.setItem('dt-theme', fromUrl); return; }
    const saved = localStorage.getItem('dt-theme');
    if (saved) setTheme(saved);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      // 先嘗試從 Supabase 載入完整資料
      const dbQuestion = await fetchQuestionDetail(id);
      if (!cancelled) {
        if (dbQuestion) {
          setQuestion(dbQuestion);
        } else {
          // Fallback: 靜態檔案
          const staticQuestion = ALL_QUESTIONS.find(q => q.id === id) ?? null;
          if (staticQuestion) {
            setQuestion(staticQuestion);
          } else {
            setError(true);
          }
        }
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] detective-paper text-dt-text flex items-center justify-center" data-dt-theme={theme}>
        <div className="text-dt-text-muted text-sm">載入案件中…</div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-[100dvh] detective-paper text-dt-text flex flex-col items-center justify-center gap-3" data-dt-theme={theme}>
        <div className="text-dt-text-secondary text-sm">找不到這份案件</div>
        <button onClick={() => router.push('/question-detective')} className="text-dt-scan text-sm hover:underline">返回檔案室</button>
      </div>
    );
  }

  return <DetectiveGamePage question={question} />;
}
