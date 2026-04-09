'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getInitialTheme, type ThemeId } from '@/components/question-detective/theme-utils';
import { fetchPublicQuestions, type PublicQuestion } from '@/data/detective-questions/api';

const THEMES: { id: ThemeId; label: string; desc: string }[] = [
  { id: 'classic', label: '📜 偵探社', desc: '經典牛皮紙風格' },
  { id: 'cyber', label: '🔮 賽博', desc: '科技霓虹風格' },
];

// Extract year from source string like "114年會考-社會-第20題"
function getYear(q: { source: string }): string {
  const m = q.source.match(/^(\d+)年/);
  return m ? `${m[1]}年` : '其他';
}

type GroupBy = 'subject' | 'year';

export default function QuestionDetectivePage() {
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<GroupBy>('subject');
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeState(id);
    localStorage.setItem('dt-theme', id);
  }, []);

  useEffect(() => {
    fetchPublicQuestions().then(qs => {
      setQuestions(qs);
      setListLoading(false);
    });
  }, []);

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
            <Link href="/"
              className="text-dt-text-secondary hover:text-dt-text text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              首頁
            </Link>
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
            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
              DB ({questions.length})
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
        {listLoading ? (
          <div className="text-center py-12 text-dt-text-muted text-sm">載入題庫中…</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-dt-text-muted text-sm">題庫尚無資料</div>
        ) : (
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
                  <Link key={q.id} href={`/question-detective/${q.id}?theme=${theme}`} prefetch
                    className="block w-full text-left rounded-lg p-4 case-file hover:shadow-md transition-all group">
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
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        )}
      </main>
    </div>
  );
}
