'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DetectivePlayer } from '@/components/question-detective/DetectivePlayer';
import type { DetectiveQuestion } from '@/components/question-detective/types';

import q1 from '@/data/detective-questions/114-history-20.json';
import q2 from '@/data/detective-questions/114-history-31.json';

const ALL_QUESTIONS: DetectiveQuestion[] = [q1, q2] as DetectiveQuestion[];

// Extract year from source string like "114年會考-社會-第20題"
function getYear(q: DetectiveQuestion): string {
  const m = q.source.match(/^(\d+)年/);
  return m ? `${m[1]}年` : '其他';
}

type GroupBy = 'subject' | 'year';

export default function QuestionDetectivePage() {
  const router = useRouter();
  const [activeQuestion, setActiveQuestion] = useState<DetectiveQuestion | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('subject');

  const grouped = useMemo(() => {
    const map = new Map<string, DetectiveQuestion[]>();
    ALL_QUESTIONS.forEach(q => {
      const key = groupBy === 'subject' ? q.subject : getYear(q);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    });
    return Array.from(map.entries());
  }, [groupBy]);

  if (activeQuestion) {
    return <DetectivePlayer question={activeQuestion} onBack={() => setActiveQuestion(null)} />;
  }

  return (
    <div className="min-h-[100dvh] detective-paper text-slate-800 dark:text-white flex flex-col">
      {/* Header */}
      <header className="shrink-0 case-file px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <button onClick={() => router.push('/')}
            className="text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 text-sm flex items-center gap-1 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            首頁
          </button>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: '"Noto Serif TC", Georgia, serif' }}>
            未解檔案室
          </h1>
          <p className="text-sm text-slate-500 dark:text-white/40 mt-1.5 leading-relaxed">
            每份檔案都藏著未解的謎團。選一份，開始調查。
          </p>
        </div>
      </header>

      {/* Group toggle tabs */}
      <div className="max-w-2xl mx-auto w-full px-5">
        <div className="flex gap-0">
          <button onClick={() => setGroupBy('subject')}
            className={`folder-tab ${groupBy === 'subject' ? 'folder-tab-1' : 'folder-tab-3'}`}>
            <span className={`text-xs font-medium ${groupBy === 'subject' ? 'text-slate-700 dark:text-white/70' : 'text-slate-400 dark:text-white/30'}`}>按科目</span>
          </button>
          <button onClick={() => setGroupBy('year')}
            className={`folder-tab ${groupBy === 'year' ? 'folder-tab-1' : 'folder-tab-3'}`}>
            <span className={`text-xs font-medium ${groupBy === 'year' ? 'text-slate-700 dark:text-white/70' : 'text-slate-400 dark:text-white/30'}`}>按年份</span>
          </button>
        </div>
      </div>

      {/* Case files */}
      <main className="flex-1 px-5 pb-8 pt-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          {grouped.map(([group, questions]) => (
            <div key={group}>
              {/* Group header — folder label */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-bold text-amber-800/50 dark:text-amber-400/40 tracking-wider" style={{ fontFamily: '"Noto Serif TC", Georgia, serif' }}>
                  {group}
                </span>
                <div className="flex-1 h-px bg-amber-800/10 dark:bg-amber-400/10" />
                <span className="text-xs text-slate-400 dark:text-white/25">{questions.length} 件</span>
              </div>

              {/* Question cards */}
              <div className="space-y-2">
                {questions.map(q => (
                  <button key={q.id} onClick={() => setActiveQuestion(q)}
                    className="w-full text-left rounded-lg p-4 case-file hover:shadow-md transition-all group">
                    <div className="flex items-start gap-3">
                      {/* Case number badge */}
                      <div className="w-10 h-10 rounded bg-red-900/10 dark:bg-red-400/10 flex items-center justify-center shrink-0 border border-red-900/10 dark:border-red-400/10">
                        <span className="text-red-900/40 dark:text-red-400/30 text-xs font-bold">
                          {q.source.match(/第(\d+)題/)?.[1] || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-400 dark:text-white/35">{q.source}</span>
                          <span className="inline-flex gap-0.5">
                            {[1, 2, 3].map(d => (
                              <span key={d} className={`w-1.5 h-1.5 rounded-full ${d <= q.difficulty ? 'bg-amber-400' : 'bg-slate-200 dark:bg-white/15'}`} />
                            ))}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-white/70 leading-relaxed line-clamp-2 group-hover:text-slate-900 dark:group-hover:text-white/85 transition-colors">
                          {q.mainStem}
                        </p>
                        <div className="flex gap-1.5 mt-2">
                          {q.subSubject && <span className="px-2 py-0.5 text-[10px] rounded-full text-amber-800/40 dark:text-amber-400/30 border border-amber-800/10 dark:border-amber-400/10">{q.subSubject}</span>}
                          {q.gradeLevel && <span className="px-2 py-0.5 text-[10px] rounded-full text-amber-800/40 dark:text-amber-400/30 border border-amber-800/10 dark:border-amber-400/10">{q.gradeLevel}</span>}
                        </div>
                      </div>
                      {/* TODO: 有帳號系統後加上「未解/已破案」狀態標籤 */}
                      <svg className="w-5 h-5 text-slate-300 dark:text-white/20 group-hover:text-slate-400 dark:group-hover:text-white/40 transition-colors shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
