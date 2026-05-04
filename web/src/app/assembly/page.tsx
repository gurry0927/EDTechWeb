'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getInitialTheme, type ThemeId } from '@/components/game-modes/detective/theme-utils';
import { THEME_LIST } from '@/config/themes';
import { fetchPublicQuestions, type PublicQuestion } from '@/data/questions/api';

export default function AssemblyListPage() {
  const [allQuestions, setAllQuestions] = useState<PublicQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeId>('classic');

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    fetchPublicQuestions().then(qs => {
      setAllQuestions(qs);
      setLoading(false);
    });
  }, []);

  const questions = useMemo(
    () => allQuestions.filter(q => q.hasAssembly),
    [allQuestions]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof questions>();
    questions.forEach(q => {
      const key = q.subject;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(q);
    });
    return Array.from(map.entries());
  }, [questions]);

  return (
    <div className="min-h-[100dvh] detective-paper text-dt-text flex flex-col" data-dt-theme={theme}>
      <header className="shrink-0 case-file px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="text-dt-text-secondary hover:text-dt-text text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              首頁
            </Link>
            <div className="flex gap-1 items-center">
              {THEME_LIST.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id); localStorage.setItem('dt-theme', t.id); }}
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
            🧩 知識組裝
          </h1>
          <p className="text-sm text-dt-text-muted mt-1.5 leading-relaxed">
            從碎片中找出正確組合，重建完整知識。
          </p>
        </div>
      </header>

      <main className="flex-1 px-5 pb-8 pt-6 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="text-center py-12 text-dt-text-muted text-sm">載入題庫中…</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">🔒</div>
            <p className="text-dt-text-muted text-sm">尚無組裝模式題目</p>
            <p className="text-dt-text-muted text-xs mt-1">題目正在準備中，敬請期待</p>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([subject, groupQuestions]) => (
              <div key={subject}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-extrabold text-dt-accent tracking-wider px-2 py-0.5 rounded bg-dt-bg/70"
                    style={{ fontFamily: '"Noto Serif TC", Georgia, serif' }}>
                    {subject}
                  </span>
                  <div className="flex-1 h-px bg-dt-accent/25" />
                  <span className="text-xs font-medium text-dt-text bg-dt-bg/70 px-1.5 py-0.5 rounded">
                    {groupQuestions.length} 題
                  </span>
                </div>

                <div className="space-y-2">
                  {groupQuestions.map(q => (
                    <Link
                      key={q.id}
                      href={`/assembly/${q.id}?theme=${theme}`}
                      prefetch
                      className="block w-full text-left rounded-lg p-4 case-file hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded bg-dt-accent/10 flex items-center justify-center shrink-0 border border-dt-accent/10">
                          <span className="text-lg">🧩</span>
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
                          <p className="text-sm text-dt-text leading-relaxed line-clamp-2 group-hover:opacity-80">
                            {q.mainStem}
                          </p>
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
