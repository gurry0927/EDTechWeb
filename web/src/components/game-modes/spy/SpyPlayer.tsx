'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { DetectiveQuestion, OptionError } from '@/components/question-detective/types';
import { THEME_REGISTRY } from '@/config/themes';
import { DETECTIVE_DIALOGUES } from '@/components/question-detective/theme-registry';
import { getDialogue } from '@/components/question-detective/detective-config';

const SPY = {
  maxLives: 5,
  briefingDelay: 1500,
};

type Phase = 'briefing' | 'interrogate' | 'quiz' | 'result';

interface Props {
  question: DetectiveQuestion;
  onBack: () => void;
  onRetry: () => void;
  theme?: string;
}

const LETTERS = ['A', 'B', 'C', 'D'];
const SUSPECT_EMOJI = ['🤵', '👩‍💼', '🧑‍🔬', '👨‍💻'];

function buildOptionSegs(optionText: string, error?: OptionError) {
  if (!error) return [{ text: optionText, isError: false }];
  const segs: { text: string; isError: boolean }[] = [];
  const { startIndex, length } = error;
  if (startIndex > 0) segs.push({ text: optionText.slice(0, startIndex), isError: false });
  segs.push({ text: optionText.slice(startIndex, startIndex + length), isError: true });
  if (startIndex + length < optionText.length) segs.push({ text: optionText.slice(startIndex + length), isError: false });
  return segs;
}

export function SpyPlayer({ question, onBack, onRetry, theme = 'classic' }: Props) {
  const DIALOGUE = useMemo(() => getDialogue(DETECTIVE_DIALOGUES[theme]), [theme]);
  const entry = THEME_REGISTRY[theme];
  const avatar = entry?.avatar.detective ?? '🕵️';
  const isImageAvatar = avatar.startsWith('/');

  const errors = question.optionErrors ?? [];
  const correctIdx = question.answer.charCodeAt(0) - 65;

  const errorByOption = useMemo(() => {
    const map = new Map<number, OptionError>();
    errors.forEach(e => map.set(e.optionIndex, e));
    return map;
  }, [errors]);

  // 隨機排序嫌犯（mount 時決定）
  const suspectOrder = useMemo(() => {
    const order = question.options.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  // ── State ──
  const [phase, setPhase] = useState<Phase>('briefing');
  const [lives, setLives] = useState(SPY.maxLives);
  const [queueIdx, setQueueIdx] = useState(0); // 目前審到第幾個
  const [caughtSpies, setCaughtSpies] = useState<Set<number>>(new Set());
  const [circlePhase, setCirclePhase] = useState(false);
  const [circleWrongs, setCircleWrongs] = useState(0);
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [transitioning, setTransitioning] = useState(false); // 防止連點
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // quiz
  const quizzes = useMemo(() => errors.filter(e => e.quiz).map(e => e.quiz!), [errors]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);

  const totalSpies = errors.length;
  const totalSuspects = question.options.length;
  const activeIdx = suspectOrder[queueIdx] ?? 0; // 當前嫌犯的原始 index
  const isLying = errorByOption.has(activeIdx);
  const gameOver = lives <= 0;

  // briefing → interrogate
  useEffect(() => {
    if (phase === 'briefing') {
      const t = setTimeout(() => setPhase('interrogate'), SPY.briefingDelay);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // game over
  useEffect(() => {
    if (gameOver && phase === 'interrogate') {
      const t = setTimeout(() => setPhase('result'), 1500);
      return () => clearTimeout(t);
    }
  }, [gameOver, phase]);

  const showFeedback = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ msg, type });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2800);
  }, []);

  // 進入下一個嫌犯或結束
  const advanceToNext = useCallback(() => {
    const nextIdx = queueIdx + 1;
    if (nextIdx >= totalSuspects) {
      // 全部審完
      if (quizzes.length > 0) setPhase('quiz');
      else setPhase('result');
    } else {
      setQueueIdx(nextIdx);
      setCirclePhase(false);
      setCircleWrongs(0);
      setTransitioning(false);
    }
  }, [queueIdx, totalSuspects, quizzes.length]);

  // 「此人無罪」按鈕
  const onDeclareInnocent = useCallback(() => {
    if (transitioning || gameOver) return;

    if (isLying) {
      // 放走罪犯 → 扣血 → 直接進圈選
      setLives(l => Math.max(0, l - 1));
      showFeedback('你被騙了！這個人在說謊！指出哪裡有問題。', 'error');
      setCirclePhase(true);
    } else {
      // 正確判定無辜
      showFeedback('確認清白，放行。', 'success');
      setTransitioning(true);
      setTimeout(advanceToNext, 1200);
    }
  }, [transitioning, gameOver, isLying, showFeedback, advanceToNext]);

  // 直接點文字圈錯
  const onCircle = useCallback((isErrorSeg: boolean) => {
    if (transitioning || gameOver) return;

    // 如果還沒進圈選模式（學生直接點文字而非先按按鈕）→ 自動進入
    if (!circlePhase) {
      if (!isLying) {
        // 點了無辜選項的文字 → 扣血
        setLives(l => Math.max(0, l - 1));
        showFeedback('這個人的供詞沒問題！試試「此人無罪」。', 'error');
        return;
      }
      setCirclePhase(true);
    }

    if (isErrorSeg) {
      const error = errorByOption.get(activeIdx);
      setCaughtSpies(prev => new Set(prev).add(activeIdx));
      showFeedback(error?.why ?? '抓到了！', 'success');
      setTransitioning(true);
      setTimeout(advanceToNext, 1800);
    } else {
      setLives(l => Math.max(0, l - 1));
      const newWrongs = circleWrongs + 1;
      setCircleWrongs(newWrongs);

      if (newWrongs >= 2) {
        const error = errorByOption.get(activeIdx);
        showFeedback(`提示：留意「${error?.text.slice(0, 2)}…」附近`, 'info');
      } else {
        showFeedback('不是這裡，再看看供詞。', 'error');
      }
    }
  }, [transitioning, gameOver, circlePhase, isLying, activeIdx, errorByOption, circleWrongs, showFeedback, advanceToNext]);

  // 偵探代為揭曉
  const skipSuspect = useCallback(() => {
    if (transitioning) return;
    const error = errorByOption.get(activeIdx);
    if (error) {
      setCaughtSpies(prev => new Set(prev).add(activeIdx));
      showFeedback(`答案是「${error.text}」— ${error.why}`, 'info');
      setTransitioning(true);
      setTimeout(advanceToNext, 2800);
    }
  }, [transitioning, activeIdx, errorByOption, showFeedback, advanceToNext]);

  // quiz
  const onQuizAnswer = useCallback((choiceIdx: number) => {
    if (quizAnswered) return;
    const correct = choiceIdx === quizzes[quizStep].answerIndex;
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

  // ── Render ──
  const DetectiveAvatar = () => isImageAvatar
    ? <img src={avatar} alt="" className="w-8 h-8 object-contain shrink-0" />
    : <span className="text-2xl shrink-0">{avatar}</span>;

  const DetectiveBubble = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-2 items-start mb-3">
      <div className="dt-avatar-detective w-8 h-8 rounded-full flex items-center justify-center shrink-0">
        <DetectiveAvatar />
      </div>
      <div className="dt-bubble-detective rounded-xl rounded-tl-sm px-3 py-2 text-sm max-w-[85%]">
        {children}
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] detective-paper text-dt-text flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 px-4 py-2 flex items-center gap-3">
        <button onClick={onBack} className="text-dt-text-secondary hover:text-dt-text text-base flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <span className="flex-1 text-center text-sm text-dt-text-muted">{question.source}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: SPY.maxLives }, (_, i) => (
            <span key={i} className={`text-sm transition-all ${i < lives ? '' : 'opacity-30 scale-75'}`}>
              {i < lives ? '❤️' : '🖤'}
            </span>
          ))}
        </div>
      </header>

      {/* 進度：審問進度 + 揪出進度 */}
      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 mb-1">
          {suspectOrder.map((origIdx, qi) => {
            const caught = caughtSpies.has(origIdx);
            const isPast = qi < queueIdx;
            const isCurrent = qi === queueIdx && phase === 'interrogate';
            return (
              <div key={qi} className="flex-1 flex flex-col items-center gap-0.5">
                <div
                  className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                    isCurrent ? 'scale-y-150' : ''
                  }`}
                  style={{
                    background: caught
                      ? 'var(--dt-error)'
                      : isPast
                        ? 'var(--dt-success)'
                        : isCurrent
                          ? 'var(--dt-accent)'
                          : 'var(--dt-border)',
                  }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-dt-text-muted">
          <span>審問 {Math.min(queueIdx + 1, totalSuspects)}/{totalSuspects}</span>
          <span>已揪出 {caughtSpies.size}/{totalSpies}</span>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto px-4 pb-4">

        {/* Briefing */}
        {phase === 'briefing' && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="text-5xl">🎭</div>
            <p className="text-sm text-dt-text-muted text-center">審訊室準備中…</p>
          </div>
        )}

        {/* Interrogate — 一個一個來 */}
        {phase === 'interrogate' && (
          <div className="space-y-4" key={queueIdx}>
            {/* 首個嫌犯時顯示案情 */}
            {queueIdx === 0 && (
              <div className="case-file rounded-xl p-4">
                <DetectiveBubble>
                  <span className="text-dt-accent font-medium">案情：</span>{question.mainStem}
                </DetectiveBubble>
                <DetectiveBubble>
                  有 {totalSpies} 個嫌犯在說謊。逐一審問，找出他們供詞中的破綻。
                </DetectiveBubble>
              </div>
            )}

            {/* 嫌犯卡 */}
            <div className="case-file rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{SUSPECT_EMOJI[activeIdx]}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--dt-accent)' }}>
                    嫌犯 {LETTERS[activeIdx]} 的供詞
                  </div>
                  <div className="text-[10px] text-dt-text-muted">
                    第 {queueIdx + 1}/{totalSuspects} 位
                  </div>
                </div>
              </div>

              {/* 供詞文字 — 永遠可點擊 */}
              <div className="rounded-lg p-3 mb-3" style={{
                background: 'color-mix(in srgb, var(--dt-bg) 80%, transparent)',
                border: '1px solid var(--dt-border)',
              }}>
                <p className="text-base leading-loose">
                  {buildOptionSegs(question.options[activeIdx], errorByOption.get(activeIdx)).map((seg, si) => (
                    <span
                      key={si}
                      onClick={() => !transitioning && onCircle(seg.isError)}
                      className={`cursor-pointer rounded px-0.5 transition-colors ${
                        transitioning ? 'pointer-events-none' :
                        seg.isError && circlePhase
                          ? 'hover:bg-dt-error/30 underline decoration-dotted decoration-dt-error/50'
                          : 'hover:bg-dt-clue/15'
                      }`}
                    >
                      {seg.text}
                    </span>
                  ))}
                </p>
              </div>

              {/* 偵探引導 */}
              {!circlePhase && (
                <DetectiveBubble>
                  仔細看這段供詞。覺得有問題就<span className="text-dt-error font-medium">直接點出來</span>，覺得沒問題就按下方「此人無罪」。
                </DetectiveBubble>
              )}
              {circlePhase && (
                <>
                  <DetectiveBubble>
                    {circleWrongs >= 2
                      ? '看來你需要幫忙。要我直接告訴你嗎？'
                      : <><span className="text-dt-accent font-medium">指出供詞中有問題的地方。</span></>
                    }
                  </DetectiveBubble>
                  {circleWrongs >= 2 && (
                    <button
                      onClick={skipSuspect}
                      className="ml-10 text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                      style={{
                        background: 'color-mix(in srgb, var(--dt-scan) 15%, var(--dt-card))',
                        border: '1px solid var(--dt-scan)',
                        color: 'var(--dt-scan)',
                      }}
                    >
                      💡 偵探代為揭曉
                    </button>
                  )}
                </>
              )}
            </div>

            {/* 此人無罪按鈕 */}
            {!circlePhase && !transitioning && (
              <button
                onClick={onDeclareInnocent}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'color-mix(in srgb, var(--dt-success) 12%, var(--dt-card))',
                  border: '2px solid var(--dt-success)',
                  color: 'var(--dt-success)',
                }}
              >
                ✓ 此人無罪，放行
              </button>
            )}
          </div>
        )}

        {/* Quiz */}
        {phase === 'quiz' && quizzes[quizStep] && (
          <div className="space-y-4">
            <div className="case-file rounded-xl p-4">
              <DetectiveBubble>
                <span className="text-dt-accent font-medium">確認測驗</span> ({quizStep + 1}/{quizzes.length})
              </DetectiveBubble>
              <p className="text-sm mb-3 leading-relaxed pl-10">{quizzes[quizStep].prompt}</p>
              <div className="space-y-2 pl-10">
                {quizzes[quizStep].choices.map((choice, ci) => {
                  const isAnswer = ci === quizzes[quizStep].answerIndex;
                  return (
                    <button
                      key={ci}
                      onClick={() => onQuizAnswer(ci)}
                      disabled={quizAnswered}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                        quizAnswered && isAnswer ? 'ring-2' : ''
                      } dt-choice ${quizAnswered ? '' : 'cursor-pointer'}`}
                      style={quizAnswered && isAnswer ? { '--tw-ring-color': 'var(--dt-success)' } as React.CSSProperties : {}}
                    >
                      <span className="dt-choice-letter w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {String.fromCharCode(65 + ci)}
                      </span>
                      <span>{choice}</span>
                      {quizAnswered && isAnswer && <span className="ml-auto text-dt-success">✓</span>}
                    </button>
                  );
                })}
              </div>
              {quizAnswered && (
                <button onClick={onQuizNext} className="mt-3 w-full py-2 rounded-lg text-sm font-medium dt-btn-primary">
                  {quizStep + 1 < quizzes.length ? '下一題' : '查看結果'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {phase === 'result' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-4xl mb-2">{gameOver ? '💀' : '🎉'}</div>
              <h2 className="text-lg font-bold" style={{ color: gameOver ? 'var(--dt-error)' : 'var(--dt-success)' }}>
                {gameOver ? '審訊失敗' : '全員揪出！案件偵破！'}
              </h2>
              <p className="text-sm text-dt-text-muted mt-1">
                正確答案：({question.answer}) {question.options[correctIdx]}
              </p>
            </div>

            <div className="case-file rounded-xl p-4">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--dt-accent)' }}>審訊紀錄</h3>
              <div className="space-y-3">
                {errors.map((e, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{SUSPECT_EMOJI[e.optionIndex]}</span>
                      <span className="text-xs font-bold">嫌犯 {LETTERS[e.optionIndex]}</span>
                      <span className="font-medium text-dt-error">「{e.text}」</span>
                      <span className={`text-[10px] ml-auto ${caughtSpies.has(e.optionIndex) ? 'text-dt-success' : 'text-dt-text-muted'}`}>
                        {caughtSpies.has(e.optionIndex) ? '✓ 已揪出' : '✕ 漏網'}
                      </span>
                    </div>
                    <p className="text-dt-text-muted mt-0.5 pl-8 text-xs">{e.why}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="case-file rounded-xl p-4">
              <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--dt-scan)' }}>
                {question.concept.unit}
              </h3>
              <p className="text-sm text-dt-text-secondary">{question.concept.brief}</p>
            </div>

            <div className="flex gap-3">
              <button onClick={onRetry} className="flex-1 py-2.5 rounded-xl text-sm font-medium dt-btn-primary">
                再審一次
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
        <div className="fixed bottom-20 inset-x-0 z-50 flex justify-center px-4">
          <div className={`px-4 py-2.5 rounded-xl text-sm max-w-sm text-center shadow-lg ${
            feedback.type === 'success' ? 'ring-1 ring-dt-success' :
            feedback.type === 'error' ? 'ring-1 ring-dt-error' : ''
          }`}
            style={{
              background: 'var(--dt-card)',
              border: '1px solid var(--dt-border)',
              color: feedback.type === 'success' ? 'var(--dt-success)' :
                     feedback.type === 'error' ? 'var(--dt-error)' : 'var(--dt-text)',
            }}
          >
            {feedback.msg}
          </div>
        </div>
      )}
    </div>
  );
}
