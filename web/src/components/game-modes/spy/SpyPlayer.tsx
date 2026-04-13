'use client';

import { useState, useCallback, useMemo } from 'react';
import type { DetectiveQuestion, OptionError } from '@/components/question-detective/types';
import { THEME_REGISTRY } from '@/config/themes';
import { DETECTIVE_DIALOGUES } from '@/components/question-detective/theme-registry';
import { getDialogue } from '@/components/question-detective/detective-config';

// ── Config ──
const SPY = {
  maxLives: 3,
  feedbackDuration: 2500,
};

type Phase = 'hunt' | 'quiz' | 'result';

interface Props {
  question: DetectiveQuestion;
  onBack: () => void;
  onRetry: () => void;
  theme?: string;
}

/** 將選項文字拆成可點擊的片段（有標記的 / 普通文字） */
function buildOptionSegs(optionText: string, error?: OptionError) {
  if (!error) return [{ text: optionText, isError: false, start: 0 }];

  const segs: { text: string; isError: boolean; start: number }[] = [];
  const { startIndex, length } = error;

  if (startIndex > 0) {
    segs.push({ text: optionText.slice(0, startIndex), isError: false, start: 0 });
  }
  segs.push({ text: optionText.slice(startIndex, startIndex + length), isError: true, start: startIndex });
  if (startIndex + length < optionText.length) {
    segs.push({ text: optionText.slice(startIndex + length), isError: false, start: startIndex + length });
  }
  return segs;
}

export function SpyPlayer({ question, onBack, onRetry, theme = 'classic' }: Props) {
  const DIALOGUE = useMemo(() => getDialogue(DETECTIVE_DIALOGUES[theme]), [theme]);
  const entry = THEME_REGISTRY[theme];
  const avatar = entry?.avatar.detective ?? '🕵️';
  const isImageAvatar = avatar.startsWith('/');

  const errors = question.optionErrors ?? [];
  const correctIdx = question.answer.charCodeAt(0) - 65; // A=0, B=1...

  // 每個選項對應的 error（正確選項沒有 error）
  const errorByOption = useMemo(() => {
    const map = new Map<number, OptionError>();
    errors.forEach(e => map.set(e.optionIndex, e));
    return map;
  }, [errors]);

  // ── State ──
  const [phase, setPhase] = useState<Phase>('hunt');
  const [lives, setLives] = useState(SPY.maxLives);
  const [foundErrors, setFoundErrors] = useState<Set<number>>(new Set()); // optionIndex set
  const [feedback, setFeedback] = useState<string | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<Set<number>>(new Set());
  const [wrongClicks, setWrongClicks] = useState(0);

  // quiz phase
  const quizzes = useMemo(() => errors.filter(e => e.quiz).map(e => e.quiz!), [errors]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);

  const totalErrors = errors.length;
  const allFound = foundErrors.size >= totalErrors;
  const gameOver = lives <= 0;

  // ── Handlers ──
  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), SPY.feedbackDuration);
  }, []);

  const onSegClick = useCallback((optionIdx: number, isErrorSeg: boolean) => {
    if (phase !== 'hunt' || gameOver) return;
    if (eliminatedOptions.has(optionIdx)) return; // 已排除

    if (optionIdx === correctIdx) {
      // 點到正確選項 → 扣血
      setLives(l => Math.max(0, l - 1));
      setWrongClicks(c => c + 1);
      showFeedback('這個選項沒問題喔，看看其他的！');
      return;
    }

    if (isErrorSeg) {
      // 找到錯誤！
      const error = errorByOption.get(optionIdx);
      setFoundErrors(prev => new Set(prev).add(optionIdx));
      setEliminatedOptions(prev => new Set(prev).add(optionIdx));
      showFeedback(error?.why ?? '這裡有問題！');

      // 檢查是否全部找完
      if (foundErrors.size + 1 >= totalErrors) {
        setTimeout(() => {
          if (quizzes.length > 0) {
            setPhase('quiz');
          } else {
            setPhase('result');
          }
        }, SPY.feedbackDuration);
      }
    } else {
      // 點到錯誤選項的非錯誤部分 → 扣血
      setLives(l => Math.max(0, l - 1));
      setWrongClicks(c => c + 1);
      showFeedback('方向對了，但不是這段文字。再仔細看看這個選項。');
    }
  }, [phase, gameOver, correctIdx, eliminatedOptions, errorByOption, foundErrors.size, totalErrors, quizzes.length, showFeedback]);

  const onQuizAnswer = useCallback((choiceIdx: number) => {
    if (quizAnswered) return;
    const quiz = quizzes[quizStep];
    const correct = choiceIdx === quiz.answerIndex;
    setQuizCorrect(correct);
    setQuizAnswered(true);
    if (!correct) setLives(l => Math.max(0, l - 1));
  }, [quizStep, quizzes, quizAnswered]);

  const onQuizNext = useCallback(() => {
    if (quizStep + 1 < quizzes.length) {
      setQuizStep(s => s + 1);
      setQuizAnswered(false);
      setQuizCorrect(false);
    } else {
      setPhase('result');
    }
  }, [quizStep, quizzes.length]);

  // game over → 自動進 result
  if (gameOver && phase === 'hunt') {
    setTimeout(() => setPhase('result'), 1500);
  }

  const letters = ['A', 'B', 'C', 'D'];

  return (
    <div className="h-[100dvh] detective-paper text-dt-text flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 px-4 py-2 flex items-center gap-3">
        <button onClick={onBack} className="text-dt-text-secondary hover:text-dt-text text-base flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          返回
        </button>
        <span className="flex-1 text-center text-sm text-dt-text-muted">{question.source}</span>
        {/* 血量 */}
        <div className="flex gap-0.5">
          {Array.from({ length: SPY.maxLives }, (_, i) => (
            <span key={i} className={`text-sm ${i < lives ? 'text-dt-error' : 'text-dt-border'}`}>
              {i < lives ? '❤️' : '🖤'}
            </span>
          ))}
        </div>
      </header>

      {/* 進度條 */}
      <div className="px-4 pb-2">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--dt-border, rgba(140,120,80,0.15))' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(foundErrors.size / Math.max(totalErrors, 1)) * 100}%`,
              background: 'var(--dt-success, #10b981)',
            }}
          />
        </div>
        <div className="text-[10px] text-dt-text-muted mt-1 text-right">
          已揪出 {foundErrors.size}/{totalErrors} 個臥底
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-4 pb-4">
        {/* 題幹 */}
        <div className="case-file rounded-xl p-4 mb-4">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--dt-text, #3d3426)' }}>
            {question.mainStem}
          </p>
        </div>

        {/* Hunt Phase — 選項 */}
        {phase === 'hunt' && (
          <div className="space-y-2">
            {question.options.map((opt, i) => {
              const eliminated = eliminatedOptions.has(i);
              const isCorrect = i === correctIdx;
              const error = errorByOption.get(i);
              const segs = buildOptionSegs(opt, error);

              return (
                <div
                  key={i}
                  className={`rounded-xl p-3 transition-all duration-300 ${
                    eliminated
                      ? 'opacity-40 line-through'
                      : 'cursor-pointer'
                  }`}
                  style={{
                    background: eliminated
                      ? 'var(--dt-surface-dim, #f1f5f9)'
                      : 'color-mix(in srgb, var(--dt-card, #f8f4eb) 90%, transparent)',
                    border: `1px solid ${eliminated ? 'transparent' : 'var(--dt-border, rgba(140,120,80,0.15))'}`,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <span className={`dt-choice-letter w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      eliminated ? 'opacity-40' : ''
                    }`}>
                      {eliminated ? '✕' : letters[i]}
                    </span>
                    <span className="text-sm leading-relaxed flex-1">
                      {eliminated ? (
                        <span>{opt}</span>
                      ) : (
                        segs.map((seg, si) => (
                          <span
                            key={si}
                            onClick={() => onSegClick(i, seg.isError)}
                            className={`cursor-pointer transition-colors rounded-sm px-0.5 ${
                              seg.isError
                                ? 'hover:bg-dt-error/20'
                                : isCorrect
                                  ? 'hover:bg-dt-success/10'
                                  : 'hover:bg-dt-clue/15'
                            }`}
                          >
                            {seg.text}
                          </span>
                        ))
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quiz Phase — 結案測驗 */}
        {phase === 'quiz' && quizzes[quizStep] && (
          <div className="case-file rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              {isImageAvatar ? (
                <img src={avatar} alt="" className="w-8 h-8 object-contain" />
              ) : (
                <span className="text-2xl">{avatar}</span>
              )}
              <span className="text-sm font-bold" style={{ color: 'var(--dt-accent, #c2553a)' }}>
                確認測驗 ({quizStep + 1}/{quizzes.length})
              </span>
            </div>
            <p className="text-sm mb-3 leading-relaxed">{quizzes[quizStep].prompt}</p>
            <div className="space-y-2">
              {quizzes[quizStep].choices.map((choice, ci) => {
                const isAnswer = ci === quizzes[quizStep].answerIndex;
                const showResult = quizAnswered;
                return (
                  <button
                    key={ci}
                    onClick={() => onQuizAnswer(ci)}
                    disabled={quizAnswered}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                      showResult && isAnswer
                        ? 'dt-choice ring-2 ring-dt-success'
                        : showResult && ci !== quizzes[quizStep].answerIndex && !quizCorrect
                          ? ''
                          : 'dt-choice cursor-pointer'
                    }`}
                  >
                    <span className="dt-choice-letter w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                      {String.fromCharCode(65 + ci)}
                    </span>
                    <span>{choice}</span>
                    {showResult && isAnswer && <span className="ml-auto text-dt-success">✓</span>}
                  </button>
                );
              })}
            </div>
            {quizAnswered && (
              <button
                onClick={onQuizNext}
                className="mt-3 w-full py-2 rounded-lg text-sm font-medium dt-btn-primary"
              >
                {quizStep + 1 < quizzes.length ? '下一題' : '查看結果'}
              </button>
            )}
          </div>
        )}

        {/* Result Phase */}
        {phase === 'result' && (
          <div className="space-y-4">
            {/* 結果標題 */}
            <div className="text-center py-4">
              <div className="text-3xl mb-2">{gameOver ? '💀' : '🎉'}</div>
              <h2 className="text-lg font-bold" style={{ color: gameOver ? 'var(--dt-error)' : 'var(--dt-success)' }}>
                {gameOver ? '調查失敗' : '臥底已全數揪出！'}
              </h2>
              <p className="text-sm text-dt-text-muted mt-1">
                正確答案：({question.answer}) {question.options[correctIdx]}
              </p>
            </div>

            {/* 錯誤回顧 */}
            <div className="case-file rounded-xl p-4">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--dt-accent)' }}>
                錯誤回顧
              </h3>
              <div className="space-y-3">
                {errors.map((e, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold ${foundErrors.has(e.optionIndex) ? 'text-dt-success' : 'text-dt-error'}`}>
                        ({letters[e.optionIndex]})
                      </span>
                      <span className="font-medium text-dt-error">「{e.text}」</span>
                      <span className={`text-[10px] ${foundErrors.has(e.optionIndex) ? 'text-dt-success' : 'text-dt-text-muted'}`}>
                        {foundErrors.has(e.optionIndex) ? '✓ 已揪出' : '✕ 未發現'}
                      </span>
                    </div>
                    <p className="text-dt-text-muted mt-0.5 pl-6">{e.why}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 知識點 */}
            <div className="case-file rounded-xl p-4">
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--dt-scan)' }}>
                {question.concept.unit}
              </h3>
              <p className="text-sm text-dt-text-secondary">{question.concept.brief}</p>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-3">
              <button onClick={onRetry} className="flex-1 py-2.5 rounded-xl text-sm font-medium dt-btn-primary">
                再玩一次
              </button>
              <button onClick={onBack} className="flex-1 py-2.5 rounded-xl text-sm font-medium border"
                style={{ borderColor: 'var(--dt-border)', color: 'var(--dt-text-secondary)' }}>
                返回列表
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Feedback toast */}
      {feedback && (
        <div className="fixed bottom-20 inset-x-0 z-50 flex justify-center px-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="px-4 py-2.5 rounded-xl text-sm max-w-sm text-center shadow-lg"
            style={{
              background: 'var(--dt-card, #f8f4eb)',
              border: '1px solid var(--dt-border)',
              color: 'var(--dt-text)',
            }}
          >
            {feedback}
          </div>
        </div>
      )}
    </div>
  );
}
