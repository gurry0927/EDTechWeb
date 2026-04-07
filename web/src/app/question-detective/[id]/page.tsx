'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
      <div className="min-h-[100dvh] bg-stone-100 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-slate-400 dark:text-white/40 text-sm">載入案件中…</div>
      </div>
    );
  }

  if (error || !question) {
    return (
      <div className="min-h-[100dvh] bg-stone-100 dark:bg-zinc-900 flex flex-col items-center justify-center gap-3">
        <div className="text-slate-500 dark:text-white/50 text-sm">找不到這份案件</div>
        <button onClick={() => router.push('/question-detective')} className="text-blue-500 text-sm hover:underline">返回檔案室</button>
      </div>
    );
  }

  return <DetectiveGamePage question={question} />;
}
