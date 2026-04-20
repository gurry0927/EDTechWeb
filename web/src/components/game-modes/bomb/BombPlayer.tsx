'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { DetectiveQuestion } from '@/components/question-detective/types';

const BOMB = {
  maxLives: 5,
  charsPerSec: 5,        // 閱讀速度：每秒 5 字
  thinkingBuffer: 10,    // 思考緩衝秒數
  minTime: 15,           // 最短秒數
  maxTime: 60,           // 最長秒數
};

type Phase = 'countdown' | 'defuse' | 'result-correct' | 'result-wrong' | 'result-timeout' | 'gameover' | 'clear';

interface Props {
  questions: DetectiveQuestion[];
  mode: 'fixed' | 'endless';
  onBack: () => void;
  theme?: string;
}

const LETTERS = ['A', 'B', 'C', 'D'];

function calcTimeLimit(q: DetectiveQuestion): number {
  const totalChars = q.mainStem.length + (q.figure?.length ?? 0) + q.options.reduce((s, o) => s + o.length, 0);
  const readTime = Math.ceil(totalChars / BOMB.charsPerSec);
  const figureBonus = q.figureImage ? 5 : 0; // 有圖多 5 秒看圖
  return Math.min(BOMB.maxTime, Math.max(BOMB.minTime, readTime + BOMB.thinkingBuffer + figureBonus));
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function BombPlayer({ questions, mode, onBack, theme = 'classic' }: Props) {
  const [qIdx, setQIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('countdown');
  const [lives, setLives] = useState(BOMB.maxLives);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, timeout: 0, totalTime: 0 });
  const [wrongLog, setWrongLog] = useState<{ question: DetectiveQuestion; picked: string; correct: string; type: 'wrong' | 'timeout' }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const startTimeRef = useRef(0);

  const q = questions[qIdx];
  const correctIdx = q ? q.answer.charCodeAt(0) - 65 : -1;
  const timeLimit = q ? calcTimeLimit(q) : 30;

  // 選項隨機化
  const [optionOrder, setOptionOrder] = useState<number[]>([]);
  const shuffledOptions = useMemo(() => optionOrder.map(i => q?.options[i] ?? ''), [optionOrder, q]);
  const shuffledCorrectIdx = optionOrder.indexOf(correctIdx);

  const gameOver = lives <= 0;
  const isLastQuestion = qIdx >= questions.length - 1 && mode === 'fixed';

  // 初始化每題
  useEffect(() => {
    if (!q) return;
    setPhase('countdown');
    setSelected(null);
    setOptionOrder(shuffleArray(q.options.map((_, i) => i)));
    const t = setTimeout(() => {
      setPhase('defuse');
      setTimeLeft(timeLimit);
      startTimeRef.current = Date.now();
    }, 1200);
    return () => clearTimeout(t);
  }, [qIdx, q, timeLimit]);

  // 倒計時
  useEffect(() => {
    if (phase !== 'defuse') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setLives(l => Math.max(0, l - 1));
          setStats(s => ({ ...s, timeout: s.timeout + 1 }));
          setPhase('result-timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // 超時記錄錯題
  useEffect(() => {
    if (phase === 'result-timeout' && q) {
      setWrongLog(prev => {
        if (prev.length > 0 && prev[prev.length - 1].question.id === q.id && prev[prev.length - 1].type === 'timeout') return prev;
        return [...prev, { question: q, picked: '—', correct: q.options[correctIdx], type: 'timeout' }];
      });
    }
  }, [phase, q, correctIdx]);

  // Game over check
  useEffect(() => {
    if (lives <= 0 && (phase === 'result-wrong' || phase === 'result-timeout')) {
      const t = setTimeout(() => setPhase('gameover'), 1500);
      return () => clearTimeout(t);
    }
  }, [lives, phase]);

  const onAnswer = useCallback((shuffledIdx: number) => {
    if (phase !== 'defuse' || selected !== null) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setSelected(shuffledIdx);

    const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);

    if (shuffledIdx === shuffledCorrectIdx) {
      setStats(s => ({ ...s, correct: s.correct + 1, totalTime: s.totalTime + elapsed }));
      setPhase('result-correct');
    } else {
      setLives(l => Math.max(0, l - 1));
      setStats(s => ({ ...s, wrong: s.wrong + 1, totalTime: s.totalTime + elapsed }));
      setWrongLog(prev => [...prev, {
        question: q!,
        picked: shuffledOptions[shuffledIdx],
        correct: shuffledOptions[shuffledCorrectIdx],
        type: 'wrong',
      }]);
      setPhase('result-wrong');
    }
  }, [phase, selected, shuffledCorrectIdx, shuffledOptions, q]);

  const nextQuestion = useCallback(() => {
    if (isLastQuestion || (mode === 'endless' && qIdx >= questions.length - 1)) {
      setPhase('clear');
      return;
    }
    setQIdx(i => i + 1);
  }, [isLastQuestion, mode, qIdx, questions.length]);

  // 時間條顏色
  const timerPct = timeLimit > 0 ? (timeLeft / timeLimit) * 100 : 0;
  const timerColor = timerPct > 50 ? 'var(--dt-success)' : timerPct > 25 ? '#e6a817' : 'var(--dt-error)';

  // 評等
  const rating = useMemo(() => {
    const total = stats.correct + stats.wrong + stats.timeout;
    if (total === 0) return { label: '尚未作答', emoji: '💣' };
    const pct = stats.correct / total;
    if (gameOver) return { label: '任務失敗', emoji: '💀' };
    if (pct === 1) return { label: '完美拆彈', emoji: '🏆' };
    if (pct >= 0.8) return { label: '拆彈專家', emoji: '⭐' };
    if (pct >= 0.6) return { label: '勉強過關', emoji: '😅' };
    return { label: '險象環生', emoji: '😰' };
  }, [stats, gameOver]);

  if (!q && phase !== 'gameover' && phase !== 'clear') return null;

  return (
    <div className="h-[100dvh] detective-paper text-dt-text flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 px-4 py-2 flex items-center gap-3">
        <button onClick={onBack} className="text-dt-text-secondary hover:text-dt-text text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          離開
        </button>
        <span className="flex-1 text-center text-xs text-dt-text-muted">
          {mode === 'endless' ? `第 ${qIdx + 1} 題` : `${qIdx + 1} / ${questions.length}`}
        </span>
        <div className="flex gap-0.5">
          {Array.from({ length: BOMB.maxLives }, (_, i) => (
            <span key={i} className={`text-sm transition-all ${i < lives ? '' : 'opacity-30 scale-75'}`}>
              {i < lives ? '❤️' : '🖤'}
            </span>
          ))}
        </div>
      </header>

      {/* Timer bar */}
      {phase === 'defuse' && (
        <div className="px-4 pb-1">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--dt-border)' }}>
            <div className="h-full rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${timerPct}%`, background: timerColor }} />
          </div>
          <div className="text-right text-xs font-bold mt-0.5" style={{ color: timerColor }}>
            {timeLeft}s
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col">

        {/* Countdown */}
        {phase === 'countdown' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-pulse">💣</div>
            <p className="text-sm text-dt-text-muted">炸彈啟動中…</p>
          </div>
        )}

        {/* Defuse — 作答中 */}
        {phase === 'defuse' && q && (
          <div className="flex-1 flex flex-col gap-4">
            {/* 題幹 */}
            <div className="case-file rounded-xl p-4">
              <div className="text-xs text-dt-text-muted mb-1">{q.source}</div>
              <p className="text-sm leading-relaxed">{q.mainStem}</p>
              {q.figure && <p className="text-sm leading-relaxed mt-2 text-dt-text-secondary">{q.figure}</p>}
              {q.figureImage && (
                <img src={q.figureImage} alt="附圖" className="mt-2 rounded-lg max-h-40 w-auto mx-auto" />
              )}
            </div>
            {/* 選項 */}
            <div className="space-y-2">
              {shuffledOptions.map((opt, si) => (
                <button key={si} onClick={() => onAnswer(si)}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 active:scale-[0.98]"
                  style={{
                    background: 'var(--dt-card)',
                    border: '2px solid var(--dt-border)',
                  }}>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: 'var(--dt-accent)', color: 'white' }}>
                    {LETTERS[si]}
                  </span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result — 答對 */}
        {phase === 'result-correct' && q && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">✅</div>
            <p className="text-lg font-bold" style={{ color: 'var(--dt-success)' }}>拆除成功！</p>
            <p className="text-xs text-dt-text-muted">
              用時 {Math.round((Date.now() - startTimeRef.current) / 1000)}s / {timeLimit}s
            </p>
            <button onClick={nextQuestion}
              className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold dt-btn-primary transition-all active:scale-[0.98]">
              {isLastQuestion ? '查看結果' : '下一題 →'}
            </button>
          </div>
        )}

        {/* Result — 答錯 */}
        {phase === 'result-wrong' && q && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">💥</div>
            <p className="text-lg font-bold" style={{ color: 'var(--dt-error)' }}>剪錯線了！</p>
            <p className="text-sm text-dt-text-muted">
              正確答案：({LETTERS[shuffledCorrectIdx]}) {shuffledOptions[shuffledCorrectIdx]}
            </p>
            {!gameOver && (
              <button onClick={nextQuestion}
                className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold dt-btn-primary transition-all active:scale-[0.98]">
                {isLastQuestion ? '查看結果' : '下一題 →'}
              </button>
            )}
          </div>
        )}

        {/* Result — 超時 */}
        {phase === 'result-timeout' && q && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-5xl">💥</div>
            <p className="text-lg font-bold" style={{ color: 'var(--dt-error)' }}>來不及了！</p>
            <p className="text-sm text-dt-text-muted">
              正確答案：({LETTERS[shuffledCorrectIdx]}) {shuffledOptions[shuffledCorrectIdx]}
            </p>
            {!gameOver && (
              <button onClick={nextQuestion}
                className="mt-4 px-6 py-2.5 rounded-xl text-sm font-bold dt-btn-primary transition-all active:scale-[0.98]">
                {isLastQuestion ? '查看結果' : '下一題 →'}
              </button>
            )}
          </div>
        )}

        {/* Game Over / Clear — 結算 */}
        {(phase === 'gameover' || phase === 'clear') && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="text-center py-6">
              <div className="text-4xl mb-2">{rating.emoji}</div>
              <h2 className="text-lg font-bold"
                style={{ color: gameOver ? 'var(--dt-error)' : 'var(--dt-success)' }}>
                {rating.label}
              </h2>
            </div>

            <div className="case-file rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--dt-accent)' }}>任務報告</h3>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-lg p-3" style={{ background: 'color-mix(in srgb, var(--dt-success) 10%, var(--dt-card))' }}>
                  <div className="text-xl font-bold" style={{ color: 'var(--dt-success)' }}>{stats.correct}</div>
                  <div className="text-[10px] text-dt-text-muted">拆除成功</div>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'color-mix(in srgb, var(--dt-error) 10%, var(--dt-card))' }}>
                  <div className="text-xl font-bold" style={{ color: 'var(--dt-error)' }}>{stats.wrong + stats.timeout}</div>
                  <div className="text-[10px] text-dt-text-muted">引爆 ({stats.wrong} 錯 + {stats.timeout} 超時)</div>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--dt-card)' }}>
                  <div className="text-xl font-bold">{stats.correct + stats.wrong + stats.timeout}</div>
                  <div className="text-[10px] text-dt-text-muted">總題數</div>
                </div>
                <div className="rounded-lg p-3" style={{ background: 'var(--dt-card)' }}>
                  <div className="text-xl font-bold">
                    {stats.correct > 0 ? Math.round(stats.totalTime / stats.correct) : '-'}s
                  </div>
                  <div className="text-[10px] text-dt-text-muted">平均用時</div>
                </div>
              </div>
            </div>

            {/* 錯題檢視 */}
            {wrongLog.length > 0 && (
              <div className="case-file rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-bold" style={{ color: 'var(--dt-error)' }}>
                  錯題檢視 ({wrongLog.length} 題)
                </h3>
                {wrongLog.map((entry, i) => (
                  <div key={i} className="text-sm border-t pt-2" style={{ borderColor: 'var(--dt-border)' }}>
                    <div className="text-xs text-dt-text-muted mb-1">{entry.question.source}</div>
                    <p className="text-xs leading-relaxed mb-1.5">{entry.question.mainStem}</p>
                    {entry.type === 'timeout' ? (
                      <div className="text-xs" style={{ color: 'var(--dt-error)' }}>
                        ⏱ 超時未作答
                      </div>
                    ) : (
                      <div className="text-xs" style={{ color: 'var(--dt-error)' }}>
                        ✕ 你選：{entry.picked}
                      </div>
                    )}
                    <div className="text-xs mt-0.5" style={{ color: 'var(--dt-success)' }}>
                      ✓ 正確：{entry.correct}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setQIdx(0); setLives(BOMB.maxLives); setStats({ correct: 0, wrong: 0, timeout: 0, totalTime: 0 }); setWrongLog([]); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium dt-btn-primary">
                再來一次
              </button>
              <button onClick={onBack}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: 'var(--dt-border)', color: 'var(--dt-text-secondary)' }}>
                返回大廳
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
