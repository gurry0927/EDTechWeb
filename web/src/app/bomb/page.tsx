'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getInitialTheme, type ThemeId } from '@/components/game-modes/detective/theme-utils';
import { fetchPublicQuestions, type PublicQuestion } from '@/data/questions/api';
import { shuffleArray } from '@/lib/shuffle';

type GameLength = 5 | 10 | 0; // 0 = 無盡

export default function BombLobbyPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<ThemeId>('classic');
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    setTheme(getInitialTheme());
    fetchPublicQuestions().then(qs => {
      setQuestions(qs);
      setLoading(false);
    });
  }, []);

  const subjects = Array.from(new Set(questions.map(q => q.subject)));
  const filtered = selectedSubject === 'all' ? questions : questions.filter(q => q.subject === selectedSubject);

  const startGame = useCallback((length: GameLength) => {
    const pool = shuffleArray(filtered);
    const ids = (length === 0 ? pool : pool.slice(0, length)).map(q => q.id);
    if (ids.length === 0) return;
    // 把題目 ID 列表存到 sessionStorage，遊戲頁讀取
    sessionStorage.setItem('bomb-queue', JSON.stringify({ ids, mode: length === 0 ? 'endless' : 'fixed', theme }));
    router.push(`/bomb/play`);
  }, [filtered, theme, router]);

  return (
    <div data-dt-theme={theme} className="min-h-[100dvh] detective-paper text-dt-text flex flex-col">
      <header className="shrink-0 px-5 py-4">
        <div className="max-w-md mx-auto">
          <button onClick={() => router.push(`/?theme=${theme}`)}
            className="text-dt-text-secondary hover:text-dt-text text-sm flex items-center gap-1 mb-4">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回首頁
          </button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            💣 拆彈模式
          </h1>
          <p className="text-sm text-dt-text-muted mt-1">在時間內拆除炸彈——訓練閱讀速度與判斷力</p>
        </div>
      </header>

      <main className="flex-1 px-5 pb-8 pt-2 max-w-md mx-auto w-full">
        {loading ? (
          <div className="text-center py-12 text-dt-text-muted text-sm">載入題庫中…</div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3">🔒</div>
            <p className="text-dt-text-muted text-sm">題庫尚無資料</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 科目選擇 */}
            <div>
              <div className="text-xs font-medium text-dt-text-muted mb-2">選擇科目</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSubject('all')}
                  className="px-3 py-1.5 rounded-lg text-sm transition-all"
                  style={{
                    background: selectedSubject === 'all' ? 'var(--dt-accent)' : 'var(--dt-card)',
                    color: selectedSubject === 'all' ? 'white' : 'var(--dt-text)',
                    border: '1px solid var(--dt-border)',
                  }}
                >
                  全部 ({questions.length})
                </button>
                {subjects.map(s => {
                  const count = questions.filter(q => q.subject === s).length;
                  return (
                    <button key={s}
                      onClick={() => setSelectedSubject(s)}
                      className="px-3 py-1.5 rounded-lg text-sm transition-all"
                      style={{
                        background: selectedSubject === s ? 'var(--dt-accent)' : 'var(--dt-card)',
                        color: selectedSubject === s ? 'white' : 'var(--dt-text)',
                        border: '1px solid var(--dt-border)',
                      }}
                    >
                      {s} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 模式選擇 */}
            <div className="space-y-3">
              <div className="text-xs font-medium text-dt-text-muted">選擇模式</div>

              <button onClick={() => startGame(5)} disabled={filtered.length < 5}
                className="w-full case-file rounded-xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40"
                style={{ border: '1px solid var(--dt-border)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <div className="text-sm font-bold">快速拆彈</div>
                    <div className="text-xs text-dt-text-muted">5 題，約 2-3 分鐘</div>
                  </div>
                </div>
              </button>

              <button onClick={() => startGame(10)} disabled={filtered.length < 10}
                className="w-full case-file rounded-xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40"
                style={{ border: '1px solid var(--dt-border)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <div className="text-sm font-bold">標準挑戰</div>
                    <div className="text-xs text-dt-text-muted">10 題，約 5-6 分鐘</div>
                  </div>
                </div>
              </button>

              <button onClick={() => startGame(0)} disabled={filtered.length < 1}
                className="w-full case-file rounded-xl p-4 text-left transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-40"
                style={{ border: '1px solid var(--dt-error)' }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💀</span>
                  <div>
                    <div className="text-sm font-bold" style={{ color: 'var(--dt-error)' }}>無盡模式</div>
                    <div className="text-xs text-dt-text-muted">直到命用完為止（{filtered.length} 題可用）</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
