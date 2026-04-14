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

// Phase 1: trial = 審訊（關押/釋放）
// Phase 2: reveal = 開獎
// Phase 3: evidence = 對被關押的嫌犯圈選錯誤
// Phase 4: quiz = 蘇格拉底測驗
// Phase 5: result = 結案報告
type Phase = 'briefing' | 'trial' | 'reveal' | 'evidence' | 'quiz' | 'result';

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

  const totalSpies = errors.length;
  const totalSuspects = question.options.length;

  // ── Phase 1: Trial ──
  const [phase, setPhase] = useState<Phase>('briefing');
  const [decisions, setDecisions] = useState<Map<number, 'detain' | 'release'>>(new Map());
  const [trialIdx, setTrialIdx] = useState(0); // 目前審到第幾個

  // ── Phase 2: Reveal ──
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const allFlipped = flippedCards.size === totalSuspects;

  // ── Phase 3: Evidence ──
  const [lives, setLives] = useState(SPY.maxLives);
  const [evidenceQueue, setEvidenceQueue] = useState<number[]>([]); // 被關押的嫌犯 idx
  const [evidenceStep, setEvidenceStep] = useState(0);
  const [circleWrongs, setCircleWrongs] = useState(0);
  const [evidenceFound, setEvidenceFound] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Phase 4: Quiz ──
  const quizzes = useMemo(() => errors.filter(e => e.quiz).map(e => e.quiz!), [errors]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);

  const gameOver = lives <= 0;

  // 計算評價
  const score = useMemo(() => {
    let correct = 0;
    let missedSpies = 0;
    let wrongDetains = 0;
    decisions.forEach((decision, idx) => {
      const isSpy = errorByOption.has(idx);
      if (decision === 'detain' && isSpy) correct++;
      if (decision === 'release' && isSpy) missedSpies++;
      if (decision === 'detain' && !isSpy) wrongDetains++;
    });
    return { correct, missedSpies, wrongDetains };
  }, [decisions, errorByOption]);

  // Briefing → Trial
  useEffect(() => {
    if (phase === 'briefing') {
      const t = setTimeout(() => setPhase('trial'), SPY.briefingDelay);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Reveal → 翻牌完畢後由學生手動繼續
  const onFlipCard = useCallback((i: number) => {
    setFlippedCards(prev => new Set(prev).add(i));
  }, []);

  const onRevealContinue = useCallback(() => {
    const detained = Array.from(decisions.entries())
      .filter(([, d]) => d === 'detain')
      .map(([idx]) => idx);
    if (detained.length > 0) {
      setEvidenceQueue(detained);
      setPhase('evidence');
    } else if (quizzes.length > 0) {
      setPhase('quiz');
    } else {
      setPhase('result');
    }
  }, [decisions, quizzes.length]);

  // Game over
  useEffect(() => {
    if (gameOver && phase === 'evidence') {
      const t = setTimeout(() => {
        if (quizzes.length > 0) setPhase('quiz');
        else setPhase('result');
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [gameOver, phase, quizzes.length]);

  const showFeedback = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ msg, type });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2800);
  }, []);

  // Phase 1: 關押或釋放
  const onDecide = useCallback((decision: 'detain' | 'release') => {
    setDecisions(prev => new Map(prev).set(trialIdx, decision));
    if (trialIdx + 1 < totalSuspects) {
      setTrialIdx(t => t + 1);
    } else {
      // 全部審完 → 開獎
      setFlippedCards(new Set());
      setTimeout(() => setPhase('reveal'), 600);
    }
  }, [trialIdx, totalSuspects]);

  // Phase 3: 圈選
  const currentEvidenceIdx = evidenceQueue[evidenceStep];
  const currentError = currentEvidenceIdx !== undefined ? errorByOption.get(currentEvidenceIdx) : undefined;

  const advanceEvidence = useCallback(() => {
    if (evidenceStep + 1 < evidenceQueue.length) {
      setEvidenceStep(s => s + 1);
      setCircleWrongs(0);
      setTransitioning(false);
    } else {
      if (quizzes.length > 0) setPhase('quiz');
      else setPhase('result');
    }
  }, [evidenceStep, evidenceQueue.length, quizzes.length]);

  const onCircle = useCallback((isErrorSeg: boolean) => {
    if (transitioning || gameOver) return;
    if (isErrorSeg) {
      setEvidenceFound(prev => new Set(prev).add(currentEvidenceIdx));
      showFeedback(currentError?.why ?? '指證成功！', 'success');
      setTransitioning(true);
      setTimeout(advanceEvidence, 1800);
    } else {
      setLives(l => Math.max(0, l - 1));
      const newWrongs = circleWrongs + 1;
      setCircleWrongs(newWrongs);
      if (newWrongs >= 2) {
        showFeedback(`提示：留意「${currentError?.text.slice(0, 2)}…」附近`, 'info');
      } else {
        showFeedback('不是這裡，再看看供詞。', 'error');
      }
    }
  }, [transitioning, gameOver, currentEvidenceIdx, currentError, circleWrongs, showFeedback, advanceEvidence]);

  const skipEvidence = useCallback(() => {
    if (transitioning || !currentError) return;
    setEvidenceFound(prev => new Set(prev).add(currentEvidenceIdx));
    showFeedback(`答案是「${currentError.text}」— ${currentError.why}`, 'info');
    setTransitioning(true);
    setTimeout(advanceEvidence, 2800);
  }, [transitioning, currentEvidenceIdx, currentError, showFeedback, advanceEvidence]);

  // 如果關押的是好人 → 在 evidence phase 標記為冤枉，直接跳過圈選
  const isCurrentDetaineeInnocent = currentEvidenceIdx !== undefined && !errorByOption.has(currentEvidenceIdx);
  const skippedInnocent = useRef(false);
  useEffect(() => {
    if (phase === 'evidence' && isCurrentDetaineeInnocent && !skippedInnocent.current) {
      skippedInnocent.current = true;
      setFeedback({ msg: '這個人其實是清白的…冤枉了。', type: 'error' });
      const t = setTimeout(() => {
        skippedInnocent.current = false;
        setFeedback(null);
        advanceEvidence();
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [phase, isCurrentDetaineeInnocent, advanceEvidence]);

  // Quiz
  const onQuizAnswer = useCallback((choiceIdx: number) => {
    if (quizAnswered) return;
    setQuizCorrect(choiceIdx === quizzes[quizStep].answerIndex);
    setQuizAnswered(true);
    if (choiceIdx !== quizzes[quizStep].answerIndex) setLives(l => Math.max(0, l - 1));
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

  // 最終評價
  const rating = useMemo(() => {
    if (gameOver) return { label: '審訊失敗', emoji: '💀' };
    if (score.missedSpies === 0 && score.wrongDetains === 0 && lives === SPY.maxLives)
      return { label: '完美審判', emoji: '🏆' };
    if (score.missedSpies === 0 && score.wrongDetains === 0)
      return { label: '明察秋毫', emoji: '⭐' };
    if (score.missedSpies === 0)
      return { label: '臥底全數落網', emoji: '🎯' };
    return { label: '有漏網之魚', emoji: '😰' };
  }, [gameOver, score, lives]);

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
      <style>{`
        @keyframes cardFlipH {
          0%   { transform: rotateX(180deg);  filter: blur(0px); }
          45%  { transform: rotateX(90deg);   filter: blur(4px); }
          55%  { transform: rotateX(90deg);   filter: blur(4px); }
          100% { transform: rotateX(0deg);    filter: blur(0px); }
        }
      `}</style>
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

      {/* 進度 */}
      <div className="px-4 pb-2">
        <div className="flex gap-1">
          {question.options.map((_, i) => {
            const decided = decisions.has(i);
            const isCurrent = phase === 'trial' && i === trialIdx;
            const isFlipped = phase === 'reveal' && flippedCards.has(i);
            const isSpy = errorByOption.has(i);
            const isCorrect = (decisions.get(i) === 'detain' && isSpy) || (decisions.get(i) === 'release' && !isSpy);
            // 開獎後才顯示綠/紅，審訊中全部用 accent/border
            const bg = isFlipped
              ? (isCorrect ? 'var(--dt-success)' : 'var(--dt-error)')
              : decided
                ? 'var(--dt-accent)'
                : isCurrent ? 'var(--dt-accent)' : 'var(--dt-border)';
            return (
              <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${isCurrent ? 'scale-y-150' : ''}`}
                style={{ background: bg }}
              />
            );
          })}
        </div>
        <div className="text-[10px] text-dt-text-muted mt-1 text-right">
          {phase === 'trial' && `審訊 ${trialIdx + 1}/${totalSuspects}`}
          {phase === 'reveal' && `已翻 ${flippedCards.size}/${totalSuspects}`}
          {phase === 'evidence' && `指證 ${evidenceStep + 1}/${evidenceQueue.length}`}
          {phase === 'quiz' && `測驗 ${quizStep + 1}/${quizzes.length}`}
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

        {/* Phase 1: Trial */}
        {phase === 'trial' && (
          <div className="space-y-4">
            {/* 題幹 + 偵探開場白（常駐） */}
            <div className="case-file rounded-xl p-4">
              <DetectiveBubble>
                <span className="text-dt-accent font-medium">案情：</span>{question.mainStem}
              </DetectiveBubble>
              <DetectiveBubble>
                {totalSpies === 1
                  ? '據報有 1 名臥底混入。逐一審問，做出你的判斷。'
                  : `據報有 ${totalSpies} 名臥底混入。逐一審問，做出你的判斷。`
                }
              </DetectiveBubble>
            </div>

            <div className="case-file rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{SUSPECT_EMOJI[trialIdx]}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--dt-accent)' }}>
                    嫌犯 {LETTERS[trialIdx]} 的供詞
                  </div>
                  <div className="text-[10px] text-dt-text-muted">第 {trialIdx + 1}/{totalSuspects} 位</div>
                </div>
              </div>

              <div className="rounded-lg p-3 mb-3" style={{
                background: 'color-mix(in srgb, var(--dt-bg) 80%, transparent)',
                border: '1px solid var(--dt-border)',
              }}>
                <p className="text-base leading-loose">「{question.options[trialIdx]}」</p>
              </div>

              <DetectiveBubble>
                你覺得這個人的供詞可信嗎？
              </DetectiveBubble>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onDecide('release')}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'color-mix(in srgb, var(--dt-success) 12%, var(--dt-card))',
                  border: '2px solid var(--dt-success)',
                  color: 'var(--dt-success)',
                }}
              >
                ✓ 釋放
              </button>
              <button
                onClick={() => onDecide('detain')}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'color-mix(in srgb, var(--dt-error) 12%, var(--dt-card))',
                  border: '2px solid var(--dt-error)',
                  color: 'var(--dt-error)',
                }}
              >
                ✕ 關押
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Reveal — 手動翻牌 */}
        {phase === 'reveal' && (
          <div className="space-y-3">
            <DetectiveBubble>
              {allFlipped ? '審判結束。' : '點擊每位嫌犯的卡片，揭曉你的判斷是否正確。'}
            </DetectiveBubble>

            {question.options.map((opt, i) => {
              const flipped = flippedCards.has(i);
              const decision = decisions.get(i);
              const isSpy = errorByOption.has(i);
              const isCorrectDecision = (decision === 'detain' && isSpy) || (decision === 'release' && !isSpy);
              return (
                <div key={i} style={{ perspective: '900px' }}>
                  <div
                    style={{
                      position: 'relative',
                      height: '80px',
                      transformStyle: 'preserve-3d',
                      transform: flipped ? 'rotateX(0deg)' : 'rotateX(180deg)',
                      animation: flipped ? 'cardFlipH 0.45s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
                    }}
                  >
                    {/* Front face — 結果 */}
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
                      <div className="h-full case-file rounded-xl p-3 flex items-center gap-3"
                        style={{ border: `2px solid ${isCorrectDecision ? 'var(--dt-success)' : 'var(--dt-error)'}` }}
                      >
                        <span className="text-2xl">{SUSPECT_EMOJI[i]}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold">嫌犯 {LETTERS[i]}</div>
                          <p className="text-xs text-dt-text-muted truncate">{opt}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] text-dt-text-muted">
                            你：{decision === 'detain' ? '關押' : '釋放'}
                          </div>
                          <div className={`text-sm font-bold ${isCorrectDecision ? 'text-dt-success' : 'text-dt-error'}`}>
                            {isSpy ? '🎭 臥底' : '✓ 清白'}
                            {!isCorrectDecision && (decision === 'release' && isSpy ? ' 漏網！' : ' 冤枉！')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Back face — 未翻開 */}
                    <div
                      onClick={() => onFlipCard(i)}
                      style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateX(-180deg)', cursor: 'pointer' }}
                    >
                      <div className="h-full case-file rounded-xl p-3 flex items-center gap-3 hover:opacity-80 active:scale-[0.98] transition-all"
                        style={{ border: '2px solid var(--dt-border)' }}
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-2xl"
                          style={{ background: 'color-mix(in srgb, var(--dt-accent) 10%, var(--dt-card))' }}>
                          ？
                        </div>
                        <div className="flex-1">
                          <div className="text-xs font-bold">嫌犯 {LETTERS[i]}</div>
                          <div className="text-[10px] text-dt-text-muted mt-0.5">點擊翻開</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {allFlipped && (
              <button
                onClick={onRevealContinue}
                className="w-full py-3 rounded-xl text-sm font-bold dt-btn-primary mt-2 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                繼續審訊 →
              </button>
            )}
          </div>
        )}

        {/* Phase 3: Evidence */}
        {phase === 'evidence' && currentEvidenceIdx !== undefined && !isCurrentDetaineeInnocent && (
          <div className="space-y-4" key={evidenceStep}>
            {/* 題幹常駐 */}
            <div className="case-file rounded-xl p-4">
              <DetectiveBubble>
                <span className="text-dt-accent font-medium">案情：</span>{question.mainStem}
              </DetectiveBubble>
            </div>

            <DetectiveBubble>
              你關押了嫌犯 {LETTERS[currentEvidenceIdx]}。現在，<span className="text-dt-accent font-medium">指出他的供詞哪裡有問題。</span>
            </DetectiveBubble>

            <div className="case-file rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{SUSPECT_EMOJI[currentEvidenceIdx]}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--dt-accent)' }}>
                    嫌犯 {LETTERS[currentEvidenceIdx]}
                  </div>
                  <div className="text-[10px] text-dt-text-muted">指出供詞的破綻</div>
                </div>
              </div>

              <div className="rounded-lg p-3 mb-3" style={{
                background: 'color-mix(in srgb, var(--dt-bg) 80%, transparent)',
                border: '1px solid var(--dt-border)',
              }}>
                <p className="text-base leading-loose">
                  {buildOptionSegs(question.options[currentEvidenceIdx], errorByOption.get(currentEvidenceIdx)).map((seg, si) => (
                    <span
                      key={si}
                      onClick={() => !transitioning && onCircle(seg.isError)}
                      className={`cursor-pointer rounded px-0.5 transition-colors ${
                        transitioning ? 'pointer-events-none' :
                        seg.isError ? 'hover:bg-dt-error/30 underline decoration-dotted decoration-dt-error/50' : 'hover:bg-dt-clue/15'
                      }`}
                    >
                      {seg.text}
                    </span>
                  ))}
                </p>
              </div>

              {circleWrongs >= 2 && (
                <>
                  <DetectiveBubble>
                    看來你需要幫忙。要我直接告訴你嗎？
                  </DetectiveBubble>
                  <button onClick={skipEvidence}
                    className="ml-10 text-xs px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                    style={{
                      background: 'color-mix(in srgb, var(--dt-scan) 15%, var(--dt-card))',
                      border: '1px solid var(--dt-scan)',
                      color: 'var(--dt-scan)',
                    }}>
                    💡 偵探代為揭曉
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Phase 4: Quiz */}
        {phase === 'quiz' && quizzes[quizStep] && (
          <div className="space-y-4">
            <div className="case-file rounded-xl p-4">
              <DetectiveBubble>
                <span className="text-dt-accent font-medium">結案確認</span> ({quizStep + 1}/{quizzes.length})
              </DetectiveBubble>
              <p className="text-sm mb-3 leading-relaxed pl-10">{quizzes[quizStep].prompt}</p>
              <div className="space-y-2 pl-10">
                {quizzes[quizStep].choices.map((choice, ci) => {
                  const isAnswer = ci === quizzes[quizStep].answerIndex;
                  return (
                    <button key={ci} onClick={() => onQuizAnswer(ci)} disabled={quizAnswered}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                        quizAnswered && isAnswer ? 'ring-2' : ''} dt-choice ${quizAnswered ? '' : 'cursor-pointer'}`}
                      style={quizAnswered && isAnswer ? { '--tw-ring-color': 'var(--dt-success)' } as React.CSSProperties : {}}>
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

        {/* Phase 5: Result */}
        {phase === 'result' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-4xl mb-2">{rating.emoji}</div>
              <h2 className="text-lg font-bold" style={{ color: gameOver ? 'var(--dt-error)' : 'var(--dt-success)' }}>
                {rating.label}
              </h2>
              <p className="text-sm text-dt-text-muted mt-1">
                正確答案：({question.answer}) {question.options[correctIdx]}
              </p>
              <div className="flex justify-center gap-4 mt-2 text-xs text-dt-text-muted">
                <span>關押正確 {score.correct}/{totalSpies}</span>
                {score.missedSpies > 0 && <span className="text-dt-error">漏放 {score.missedSpies}</span>}
                {score.wrongDetains > 0 && <span className="text-dt-error">冤枉 {score.wrongDetains}</span>}
              </div>
            </div>

            <div className="case-file rounded-xl p-4">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--dt-accent)' }}>審訊紀錄</h3>
              <div className="space-y-3">
                {question.options.map((opt, i) => {
                  const isSpy = errorByOption.has(i);
                  const error = errorByOption.get(i);
                  const decision = decisions.get(i);
                  return (
                    <div key={i} className="text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{SUSPECT_EMOJI[i]}</span>
                        <span className="text-xs font-bold">嫌犯 {LETTERS[i]}</span>
                        <span className={`text-[10px] ${isSpy ? 'text-dt-error' : 'text-dt-success'}`}>
                          {isSpy ? '🎭 臥底' : '✓ 清白'}
                        </span>
                        <span className={`text-[10px] ml-auto ${
                          (decision === 'detain' && isSpy) || (decision === 'release' && !isSpy) ? 'text-dt-success' : 'text-dt-error'
                        }`}>
                          你：{decision === 'detain' ? '關押' : '釋放'}
                        </span>
                      </div>
                      {error && (
                        <p className="text-dt-text-muted mt-0.5 pl-8 text-xs">
                          破綻：「{error.text}」— {error.why}
                        </p>
                      )}
                    </div>
                  );
                })}
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
            }}>
            {feedback.msg}
          </div>
        </div>
      )}
    </div>
  );
}
