'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { DetectiveQuestion } from '@/components/question-detective/types';
import { fetchPublicQuestions, type PublicQuestion } from '@/data/detective-questions/api';
import { ALL_QUESTIONS } from '@/data/detective-questions';

const THEMES = [
  { id: 'classic', label: '📜 偵探社', desc: '經典牛皮紙風格' },
  { id: 'cyber', label: '🔮 賽博', desc: '科技霓虹風格' },
] as const;
type ThemeId = typeof THEMES[number]['id'];

// Extract year from source string like "114年會考-社會-第20題"
function getYear(q: Pick<DetectiveQuestion, 'source'>): string {
  const m = q.source.match(/^(\d+)年/);
  return m ? `${m[1]}年` : '其他';
}

type GroupBy = 'subject' | 'year';

export default function QuestionDetectivePage() {
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<GroupBy>('subject');
  const [dbQuestions, setDbQuestions] = useState<PublicQuestion[] | null>(null);
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return 'classic';
    const fromUrl = new URLSearchParams(window.location.search).get('theme') as ThemeId | null;
    if (fromUrl && THEMES.some(t => t.id === fromUrl)) { localStorage.setItem('dt-theme', fromUrl); return fromUrl; }
    const saved = localStorage.getItem('dt-theme') as ThemeId | null;
    return (saved && THEMES.some(t => t.id === saved)) ? saved : 'classic';
  });

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    localStorage.setItem('dt-theme', id);
  }, []);

  useEffect(() => {
    fetchPublicQuestions().then(qs => {
      if (qs.length > 0) setDbQuestions(qs);
    });
  }, []);

  // DB 有資料用 DB，否則 fallback 靜態檔案
  const questions = dbQuestions ?? ALL_QUESTIONS;

  const grouped = useMemo(() => {
    const map = new Map<string, typeof questions>();
    questions.forEach(q => {
      const key = groupBy === 'subject' ? q.subject : getYear(q);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    });
    return Array.from(map.entries());
  }, [questions, groupBy]);

  return (
    <div className="min-h-[100dvh] detective-paper text-dt-text flex flex-col" data-dt-theme={theme}>
      {/* Header */}
      <header className="shrink-0 case-file px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => router.push('/')}
              className="text-dt-text-secondary hover:text-dt-text text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              首頁
            </button>
            {/* Theme switcher */}
            <div className="flex gap-1">
              {THEMES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.desc}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${
                    theme === t.id
                      ? 'border-dt-accent bg-dt-accent/10 text-dt-accent'
                      : 'border-dt-border text-dt-text-muted hover:text-dt-text-secondary'
                  }`}
                >{t.label}</button>
              ))}
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: '"Noto Serif TC", Georgia, serif' }}>
            未解檔案室
          </h1>
          <p className="text-sm text-dt-text-muted mt-1.5 leading-relaxed">
            每份檔案都藏著未解的謎團。選一份，開始調查。
          </p>
          {process.env.NODE_ENV === 'development' && (
            <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${dbQuestions ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {dbQuestions ? `DB (${dbQuestions.length})` : `Static (${ALL_QUESTIONS.length})`}
            </span>
          )}
        </div>
      </header>

      {/* Group toggle tabs */}
      <div className="max-w-2xl mx-auto w-full px-5">
        <div className="flex gap-0">
          <button onClick={() => setGroupBy('subject')}
            className={`folder-tab ${groupBy === 'subject' ? 'folder-tab-1' : 'folder-tab-3'}`}>
            <span className={`text-xs font-medium ${groupBy === 'subject' ? 'text-dt-text' : 'text-dt-text-muted'}`}>按科目</span>
          </button>
          <button onClick={() => setGroupBy('year')}
            className={`folder-tab ${groupBy === 'year' ? 'folder-tab-1' : 'folder-tab-3'}`}>
            <span className={`text-xs font-medium ${groupBy === 'year' ? 'text-dt-text' : 'text-dt-text-muted'}`}>按年份</span>
          </button>
        </div>
      </div>

      {/* Case files */}
      <main className="flex-1 px-5 pb-8 pt-6 max-w-2xl mx-auto w-full">
        <div className="space-y-6">
          {grouped.map(([group, groupQuestions]) => (
            <div key={group}>
              {/* Group header — folder label */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-extrabold text-dt-accent tracking-wider px-2 py-0.5 rounded bg-dt-bg/70" style={{ fontFamily: '"Noto Serif TC", Georgia, serif' }}>
                  {group}
                </span>
                <div className="flex-1 h-px bg-dt-accent/25" />
                <span className="text-xs font-medium text-dt-text bg-dt-bg/70 px-1.5 py-0.5 rounded">{groupQuestions.length} 件</span>
              </div>

              {/* Question cards */}
              <div className="space-y-2">
                {groupQuestions.map(q => (
                  <button key={q.id} onClick={() => router.push(`/question-detective/${q.id}`)}
                    className="w-full text-left rounded-lg p-4 case-file hover:shadow-md transition-all group">
                    <div className="flex items-start gap-3">
                      {/* Case number badge */}
                      <div className="w-10 h-10 rounded bg-dt-accent/10 flex items-center justify-center shrink-0 border border-dt-accent/10">
                        <span className="text-dt-accent/40 text-xs font-bold">
                          {q.source.match(/第(\d+)題/)?.[1] || '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-dt-text-muted">{q.source}</span>
                          <span className="inline-flex gap-0.5">
                            {[1, 2, 3].map(d => (
                              <span key={d} className={`w-1.5 h-1.5 rounded-full ${d <= q.difficulty ? 'bg-dt-clue' : 'bg-dt-border'}`} />
                            ))}
                          </span>
                        </div>
                        <p className="text-sm text-dt-text leading-relaxed line-clamp-2 group-hover:opacity-80 transition-colors">
                          {q.mainStem}
                        </p>
                        <div className="flex gap-1.5 mt-2">
                          {q.subSubject && <span className="px-2 py-0.5 text-[10px] rounded-full text-dt-clue/40 border border-dt-clue/10">{q.subSubject}</span>}
                          {q.gradeLevel && <span className="px-2 py-0.5 text-[10px] rounded-full text-dt-clue/40 border border-dt-clue/10">{q.gradeLevel}</span>}
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-dt-text-muted group-hover:text-dt-text-secondary transition-colors shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
