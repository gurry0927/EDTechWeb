'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { DetectiveQuestion, OptionError } from '@/components/question-detective/types';
import { THEME_REGISTRY } from '@/config/themes';
import { DETECTIVE_DIALOGUES } from '@/components/question-detective/theme-registry';
import { getDialogue } from '@/components/question-detective/detective-config';

// ── Config ──
const SPY = {
  maxLives: 5,
  briefingDelay: 1200,
};

type Phase = 'briefing' | 'lineup' | 'interrogate' | 'quiz' | 'result';
type Verdict = null | 'innocent' | 'lying';

interface Props {
  question: DetectiveQuestion;
  onBack: () => void;
  onRetry: () => void;
  theme?: string;
}

const LETTERS = ['A', 'B', 'C', 'D'];
const SUSPECT_EMOJI = ['🤵', '👩‍💼', '🧑‍🔬', '👨‍💻'];

/** 將選項文字拆成可點擊的片段 */
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

  // ── State ──
  const [phase, setPhase] = useState<Phase>('briefing');
  const [lives, setLives] = useState(SPY.maxLives);
  const [caughtSpies, setCaughtSpies] = useState<Set<number>>(new Set());
  const [cleared, setCleared] = useState<Set<number>>(new Set()); // 確認無辜
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [circlePhase, setCirclePhase] = useState(false); // 進入圈選階段
  const [circleWrongs, setCircleWrongs] = useState(0);  // 圈選階段連續失誤
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [wrongClicks, setWrongClicks] = useState(0);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // quiz
  const quizzes = useMemo(() => errors.filter(e => e.quiz).map(e => e.quiz!), [errors]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [quizCorrect, setQuizCorrect] = useState(false);

  const totalSpies = errors.length;
  const allCaught = caughtSpies.size >= totalSpies;
  const gameOver = lives <= 0;

  // briefing → lineup 自動轉場
  useEffect(() => {
    if (phase === 'briefing') {
      const t = setTimeout(() => setPhase('lineup'), SPY.briefingDelay);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // game over 自動進 result
  useEffect(() => {
    if (gameOver && (phase === 'lineup' || phase === 'interrogate')) {
      const t = setTimeout(() => setPhase('result'), 1500);
      return () => clearTimeout(t);
    }
  }, [gameOver, phase]);

  const showFeedback = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ msg, type });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2500);
  }, []);

  // 開始審問
  const startInterrogate = useCallback((idx: number) => {
    if (caughtSpies.has(idx) || cleared.has(idx) || gameOver) return;
    setActiveIdx(idx);
    setVerdict(null);
    setCirclePhase(false);
    setCircleWrongs(0);
    setPhase('interrogate');
  }, [caughtSpies, cleared, gameOver]);

  // 跳過此嫌犯（直接揭曉答案，不扣血但也不算揪出）
  const skipSuspect = useCallback(() => {
    if (activeIdx === null) return;
    const error = errorByOption.get(activeIdx);
    if (error) {
      showFeedback(`答案是「${error.text}」— ${error.why}`, 'info');
      // 標記為揪出（偵探代勞）
      setCaughtSpies(prev => {
        const next = new Set(prev).add(activeIdx);
        if (next.size >= totalSpies) {
          setTimeout(() => {
            if (quizzes.length > 0) setPhase('quiz');
            else setPhase('result');
          }, 2500);
        } else {
          setTimeout(() => {
            setActiveIdx(null);
            setVerdict(null);
            setCirclePhase(false);
            setCircleWrongs(0);
            setPhase('lineup');
          }, 2500);
        }
        return next;
      });
    }
  }, [activeIdx, errorByOption, totalSpies, quizzes.length, showFeedback]);

  // 回到陣容
  const backToLineup = useCallback(() => {
    setActiveIdx(null);
    setVerdict(null);
    setCirclePhase(false);
    setPhase('lineup');
  }, []);

  // 判定：無辜 or 說謊
  const onVerdict = useCallback((v: 'innocent' | 'lying') => {
    if (activeIdx === null) return;
    const isActuallyLying = errorByOption.has(activeIdx);

    if (v === 'innocent') {
      if (isActuallyLying) {
        // 放走了罪犯
        setLives(l => Math.max(0, l - 1));
        setWrongClicks(c => c + 1);
        showFeedback('你被騙了！這個人在說謊！', 'error');
        setVerdict(null);
      } else {
        // 正確判定無辜
        setCleared(prev => new Set(prev).add(activeIdx));
        showFeedback('確認清白，釋放。', 'success');
        setTimeout(backToLineup, 1200);
      }
    } else {
      // 選了「說謊」
      if (!isActuallyLying) {
        // 冤枉好人
        setLives(l => Math.max(0, l - 1));
        setWrongClicks(c => c + 1);
        showFeedback('冤枉！這個人是清白的。', 'error');
        setVerdict(null);
      } else {
        // 正確！進入圈選階段
        setVerdict('lying');
        setCirclePhase(true);
        showFeedback('沒錯，指出他的供詞哪裡有問題！', 'info');
      }
    }
  }, [activeIdx, errorByOption, showFeedback, backToLineup]);

  // 圈選錯誤片段
  const onCircle = useCallback((isErrorSeg: boolean) => {
    if (activeIdx === null || !circlePhase) return;

    if (isErrorSeg) {
      const error = errorByOption.get(activeIdx);
      setCaughtSpies(prev => {
        const next = new Set(prev).add(activeIdx);
        // 檢查是否全部揪出
        if (next.size >= totalSpies) {
          setTimeout(() => {
            if (quizzes.length > 0) setPhase('quiz');
            else setPhase('result');
          }, 1800);
        } else {
          setTimeout(backToLineup, 1500);
        }
        return next;
      });
      showFeedback(error?.why ?? '抓到了！', 'success');
    } else {
      setLives(l => Math.max(0, l - 1));
      setWrongClicks(c => c + 1);
      const newCircleWrongs = circleWrongs + 1;
      setCircleWrongs(newCircleWrongs);

      if (newCircleWrongs >= 2) {
        // 2 次後給提示：告訴他錯誤文字的前幾個字
        const error = errorByOption.get(activeIdx);
        const hint = error ? `提示：留意「${error.text.slice(0, 2)}…」附近` : '再仔細看看';
        showFeedback(hint, 'info');
      } else {
        showFeedback('不是這裡，再仔細看看供詞。', 'error');
      }
    }
  }, [activeIdx, circlePhase, circleWrongs, errorByOption, totalSpies, quizzes.length, showFeedback, backToLineup]);

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

  // ── Render helpers ──
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

      {/* 進度條 */}
      <div className="px-4 pb-2">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--dt-border)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${(caughtSpies.size / Math.max(totalSpies, 1)) * 100}%`, background: 'var(--dt-success)' }} />
        </div>
        <div className="text-[10px] text-dt-text-muted mt-1 text-right">
          已揪出 {caughtSpies.size}/{totalSpies}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto px-4 pb-4">

        {/* ── Briefing ── */}
        {phase === 'briefing' && (
          <div className="flex flex-col items-center justify-center h-full gap-4 animate-in fade-in">
            <div className="text-5xl">🎭</div>
            <p className="text-sm text-dt-text-muted text-center">審訊室準備中…</p>
          </div>
        )}

        {/* ── Lineup ── */}
        {phase === 'lineup' && (
          <div className="space-y-4 animate-in fade-in">
            {/* 題幹 */}
            <div className="case-file rounded-xl p-4">
              <DetectiveBubble>
                <span className="text-dt-accent font-medium">案情：</span>{question.mainStem}
              </DetectiveBubble>
              <DetectiveBubble>
                有 {totalSpies} 個嫌犯在說謊，{allCaught ? '全部揪出了！' : '選一個開始審問。'}
              </DetectiveBubble>
            </div>

            {/* 嫌犯卡片 */}
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((opt, i) => {
                const caught = caughtSpies.has(i);
                const safe = cleared.has(i);
                const done = caught || safe;
                return (
                  <button
                    key={i}
                    onClick={() => !done && startInterrogate(i)}
                    disabled={done || gameOver}
                    className={`relative rounded-xl p-4 text-left transition-all duration-300 ${
                      caught ? 'opacity-50 scale-95' :
                      safe ? 'opacity-60' :
                      'hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                    }`}
                    style={{
                      background: caught
                        ? 'color-mix(in srgb, var(--dt-error) 15%, var(--dt-card))'
                        : safe
                          ? 'color-mix(in srgb, var(--dt-success) 10%, var(--dt-card))'
                          : 'color-mix(in srgb, var(--dt-card) 90%, transparent)',
                      border: `1px solid ${
                        caught ? 'var(--dt-error)' :
                        safe ? 'var(--dt-success)' :
                        'var(--dt-border)'
                      }`,
                    }}
                  >
                    {/* 狀態標記 */}
                    {caught && (
                      <div className="absolute top-2 right-2 text-xs font-bold text-dt-error">✕ 說謊</div>
                    )}
                    {safe && (
                      <div className="absolute top-2 right-2 text-xs font-bold text-dt-success">✓ 清白</div>
                    )}

                    <div className="text-2xl mb-2">{SUSPECT_EMOJI[i]}</div>
                    <div className="text-xs font-bold mb-1" style={{ color: 'var(--dt-accent)' }}>
                      嫌犯 {LETTERS[i]}
                    </div>
                    <p className="text-xs text-dt-text-muted line-clamp-2 leading-relaxed">{opt}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Interrogate ── */}
        {phase === 'interrogate' && activeIdx !== null && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
            {/* 嫌犯供詞 */}
            <div className="case-file rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{SUSPECT_EMOJI[activeIdx]}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--dt-accent)' }}>
                    嫌犯 {LETTERS[activeIdx]} 的供詞
                  </div>
                  <div className="text-[10px] text-dt-text-muted">仔細聽他怎麼說</div>
                </div>
              </div>

              <div className="rounded-lg p-3 mb-3" style={{
                background: 'color-mix(in srgb, var(--dt-bg) 80%, transparent)',
                border: '1px solid var(--dt-border)',
              }}>
                {circlePhase ? (
                  // 圈選模式：文字可點擊
                  <p className="text-base leading-loose">
                    {buildOptionSegs(question.options[activeIdx], errorByOption.get(activeIdx)).map((seg, si) => (
                      <span
                        key={si}
                        onClick={() => onCircle(seg.isError)}
                        className={`cursor-pointer rounded px-0.5 transition-colors ${
                          seg.isError
                            ? 'hover:bg-dt-error/30 underline decoration-dotted decoration-dt-error/50'
                            : 'hover:bg-dt-clue/15'
                        }`}
                      >
                        {seg.text}
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="text-base leading-loose">
                    「{question.options[activeIdx]}」
                  </p>
                )}
              </div>

              {/* 偵探引導 */}
              {!verdict && !circlePhase && (
                <DetectiveBubble>
                  你覺得他說的是真話還是假話？
                </DetectiveBubble>
              )}
              {circlePhase && (
                <>
                  <DetectiveBubble>
                    {circleWrongs >= 2
                      ? '看來你需要幫忙。要我直接告訴你嗎？'
                      : <>好，既然你認為他在說謊，<span className="text-dt-accent font-medium">指出供詞中有問題的地方。</span></>
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

            {/* 判定按鈕 */}
            {!verdict && !circlePhase && (
              <div className="flex gap-3">
                <button
                  onClick={() => onVerdict('innocent')}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'color-mix(in srgb, var(--dt-success) 15%, var(--dt-card))',
                    border: '2px solid var(--dt-success)',
                    color: 'var(--dt-success)',
                  }}
                >
                  ✓ 無辜
                </button>
                <button
                  onClick={() => onVerdict('lying')}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'color-mix(in srgb, var(--dt-error) 15%, var(--dt-card))',
                    border: '2px solid var(--dt-error)',
                    color: 'var(--dt-error)',
                  }}
                >
                  ✕ 說謊！
                </button>
              </div>
            )}

            {/* 換一個嫌犯審問 */}
            <button
              onClick={backToLineup}
              className="w-full text-center text-xs py-2 text-dt-text-muted opacity-60 hover:opacity-100 transition-opacity"
            >
              先審其他人 →
            </button>
          </div>
        )}

        {/* ── Quiz ── */}
        {phase === 'quiz' && quizzes[quizStep] && (
          <div className="space-y-4 animate-in fade-in">
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

        {/* ── Result ── */}
        {phase === 'result' && (
          <div className="space-y-4 animate-in fade-in">
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
          <div className={`px-4 py-2.5 rounded-xl text-sm max-w-sm text-center shadow-lg transition-all animate-in fade-in slide-in-from-bottom-4 ${
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
