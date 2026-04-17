'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { DetectiveQuestion, OptionError } from '@/components/question-detective/types';
import { THEME_REGISTRY } from '@/config/themes';

const SPY = {
  maxLives: 5,
  briefingDelay: 1500,
};

// Phase 1: trial    = 逐一審訊（含 inline 標記）
// Phase 2: reveal   = 翻牌宣判
// Phase 3: quiz     = 蘇格拉底確認（針對被關押者）
// Phase 4: result   = 結案報告（含漏放臥底破綻說明）
// Phase 5: redemption = 補救圈選（漏放臥底）
type Phase = 'briefing' | 'trial' | 'reveal' | 'quiz' | 'result' | 'redemption';

interface Props {
  question: DetectiveQuestion;
  onBack: () => void;
  onRetry: () => void;
  theme?: string;
}

const LETTERS = ['A', 'B', 'C', 'D'];
const SUSPECT_AVATARS = [
  '/avatars/figure_fashion_color_blue.png',
  '/avatars/figure_fashion_color_green.png',
  '/avatars/figure_fashion_color_purple.png',
  '/avatars/figure_fashion_color_red.png',
];

const SuspectIcon = ({ idx, size = 'md' }: { idx: number; size?: 'sm' | 'md' | 'lg' }) => {
  const cls = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-6 h-6' : 'w-10 h-10';
  return <img src={SUSPECT_AVATARS[idx]} alt={`嫌犯 ${LETTERS[idx]}`} className={`${cls} object-contain`} />;
};

type Mood = 'angry' | 'plead' | 'cold' | 'smug' | 'grateful';
interface ReactionLine { text: string; mood: Mood }

const DETAIN_LINES: ReactionLine[] = [
  // angry — 震動 + 粗體 + 紅色尖刺邊框
  { text: '冤枉啊！我什麼都沒做！', mood: 'angry' },
  { text: '這不公平！憑什麼！', mood: 'angry' },
  { text: '放手！我要見律師！', mood: 'angry' },
  { text: '憑什麼？你有證據嗎！', mood: 'angry' },
  { text: '哼，走著瞧。', mood: 'angry' },
  { text: '你這樣會害了自己的！', mood: 'angry' },
  // plead — 輕顫 + 正常字
  { text: '你一定搞錯了，我是清白的！', mood: 'plead' },
  { text: '長官，再想想！別衝動！', mood: 'plead' },
  { text: '我有不在場證明的！', mood: 'plead' },
  { text: '我可以解釋！給我一個機會！', mood: 'plead' },
  { text: '等一下，先聽我說完！', mood: 'plead' },
  { text: '我只是說錯話了，不代表我有問題！', mood: 'plead' },
  { text: '我、我真的沒有……', mood: 'plead' },
  { text: '這個誤會，遲早會還我清白的。', mood: 'plead' },
  // cold — 無動畫，斜體，詭異
  { text: '別相信你看到的，事情沒那麼簡單。', mood: 'cold' },
  { text: '你不會找到任何東西的。', mood: 'cold' },
  { text: '……好吧，隨你。', mood: 'cold' },
  { text: '長官英明……（苦笑）', mood: 'cold' },
  { text: '我認識你們長官的長官……', mood: 'cold' },
  { text: '你真的確定嗎？再想想。', mood: 'cold' },
];

const RELEASE_LINES: ReactionLine[] = [
  // grateful — 無震動，綠邊
  { text: '謝謝！我就知道你有眼光！', mood: 'grateful' },
  { text: '感謝長官明察！', mood: 'grateful' },
  { text: '終於！嚇死我了。', mood: 'grateful' },
  { text: '呼……差點出事。', mood: 'grateful' },
  { text: '我就說嘛，清清白白的！', mood: 'grateful' },
  { text: '太好了！家人還在等我！', mood: 'grateful' },
  { text: '謝謝，我……我真的很感激。', mood: 'grateful' },
  { text: '我早說我沒問題的！', mood: 'grateful' },
  { text: '長官英明！', mood: 'grateful' },
  // smug — 斜體 + 金邊 + 微彈
  { text: '你真是個聰明的人。', mood: 'smug' },
  { text: '哈，我就知道你看得出來。', mood: 'smug' },
  { text: '嘿嘿……謝謝你。', mood: 'smug' },
  { text: '運氣真好呢，是不是？', mood: 'smug' },
  { text: '你做了正確的選擇。', mood: 'smug' },
  { text: '呵呵，多謝招待。', mood: 'smug' },
  { text: '好的好的，我這就走。', mood: 'smug' },
  { text: '希望我們不會再見面。', mood: 'smug' },
  { text: '你放心，我不會讓你失望的。', mood: 'smug' },
  { text: '咦，就這樣？那我走了？', mood: 'smug' },
  { text: '哼，總算有人識貨。', mood: 'smug' },
];

function pickLine(lines: ReactionLine[], seed: number): ReactionLine {
  return lines[seed % lines.length];
}

function chunkText(text: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < text.length) {
    if (/[，。？！、；：「」『』（）【】]/.test(text[i])) {
      tokens.push(text[i]);
      i += 1;
    } else {
      const remaining = text.length - i;
      const chunkSize = remaining >= 3 ? 3 : remaining;
      tokens.push(text.slice(i, i + chunkSize));
      i += chunkSize;
    }
  }
  return tokens;
}

function buildOptionSegs(optionText: string, error?: OptionError) {
  if (!error) {
    return chunkText(optionText).map(t => ({ text: t, isError: false }));
  }

  const { startIndex, length } = error;
  const endIndex = startIndex + length;
  const segs: { text: string; isError: boolean }[] = [];

  // 前段：切碎
  if (startIndex > 0) {
    chunkText(optionText.slice(0, startIndex)).forEach(t => segs.push({ text: t, isError: false }));
  }
  // 錯誤段：整塊保留，一個 span
  segs.push({ text: optionText.slice(startIndex, endIndex), isError: true });
  // 後段：切碎
  if (endIndex < optionText.length) {
    chunkText(optionText.slice(endIndex)).forEach(t => segs.push({ text: t, isError: false }));
  }

  return segs;
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface SuspectMark {
  text: string;
  isCorrect: boolean;
}

interface QuizItem {
  suspectIdx: number;
  quiz: NonNullable<OptionError['quiz']>;
  markedCorrectly: boolean;
  markedText?: string;
}

export function SpyPlayer({ question, onBack, onRetry, theme = 'classic' }: Props) {

  const entry = THEME_REGISTRY[theme];
  const avatar = entry?.avatar.detective ?? '🕵️';
  const isImageAvatar = avatar.startsWith('/');

  const totalSuspects = question.options.length;

  // 嫌犯順序隨機（每局不同，retry 時 gameKey 變 → 重新 mount → 重新洗牌）
  const [suspectOrder] = useState(() =>
    shuffleArray(Array.from({ length: totalSuspects }, (_, i) => i))
  );

  // 用 suspectOrder 重新映射 options / errors / answer
  const options = useMemo(() => suspectOrder.map(i => question.options[i]), [suspectOrder, question.options]);
  const errors = useMemo(() =>
    (question.optionErrors ?? []).map(e => ({
      ...e,
      optionIndex: suspectOrder.indexOf(e.optionIndex),
    })),
    [suspectOrder, question.optionErrors]
  );
  const correctIdx = suspectOrder.indexOf(question.answer.charCodeAt(0) - 65);

  const errorByOption = useMemo(() => {
    const map = new Map<number, OptionError>();
    errors.forEach(e => map.set(e.optionIndex, e));
    return map;
  }, [errors]);

  const totalSpies = errors.length;

  // ── Phases ──
  const [phase, setPhase] = useState<Phase>('briefing');

  // ── Trial ──
  const [trialIdx, setTrialIdx] = useState(0);
  const [decisions, setDecisions] = useState<Map<number, 'detain' | 'release'>>(new Map());
  const [suspectMarks, setSuspectMarks] = useState<Map<number, SuspectMark | null>>(new Map());
  const [suspectReactions, setSuspectReactions] = useState<Map<number, ReactionLine>>(new Map());

  // ── Reveal ──
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const allFlipped = flippedCards.size === totalSuspects;

  // ── Quiz ──
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);
  const [, setQuizCorrect] = useState(false);

  // ── Lives ──
  const [lives, setLives] = useState(SPY.maxLives);
  const gameOver = lives <= 0;

  // ── Redemption ──
  const [redemptionQueue, setRedemptionQueue] = useState<number[]>([]);
  const [redemptionStep, setRedemptionStep] = useState(0);
  const [redemptionResults, setRedemptionResults] = useState<Map<number, boolean>>(new Map());
  const [redemptionTransitioning, setRedemptionTransitioning] = useState(false);
  const [redemptionCircleWrongs, setRedemptionCircleWrongs] = useState(0);

  // ── Feedback toast ──
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showFeedback = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback({ msg, type });
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2800);
  }, []);

  // Briefing → Trial
  useEffect(() => {
    if (phase === 'briefing') {
      const t = setTimeout(() => setPhase('trial'), SPY.briefingDelay);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // ── Trial: derived ──
  const allDecided = useMemo(() => {
    for (let i = 0; i < totalSuspects; i++) {
      if (!decisions.has(i)) return false;
    }
    return true;
  }, [decisions, totalSuspects]);

  const undecidedCount = totalSuspects - decisions.size;

  const navigateToSuspect = useCallback((idx: number) => {
    setTrialIdx(idx);
  }, []);

  // 決定關押或釋放；第一次決定時記錄台詞
  const onDecide = useCallback((decision: 'detain' | 'release') => {
    const isFirstDecision = !decisions.has(trialIdx);
    setDecisions(prev => new Map(prev).set(trialIdx, decision));

    if (isFirstDecision) {
      const seed = Math.floor(Math.random() * 1000);
      const reaction = decision === 'detain'
        ? pickLine(DETAIN_LINES, seed)
        : pickLine(RELEASE_LINES, seed);
      setSuspectReactions(prev => new Map(prev).set(trialIdx, reaction));
    }
  }, [decisions, trialIdx]);

  // 標記可疑片段（點同一段取消，點別段替換）
  const onMark = useCallback((text: string, isCorrect: boolean) => {
    setSuspectMarks(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(trialIdx);
      if (existing && existing.text === text) {
        newMap.set(trialIdx, null); // 取消標記
      } else {
        newMap.set(trialIdx, { text, isCorrect });
      }
      return newMap;
    });
  }, [trialIdx]);

  const onProceedToReveal = useCallback(() => {
    setFlippedCards(new Set());
    setPhase('reveal');
  }, []);

  // ── Reveal ──
  const onFlipCard = useCallback((i: number) => {
    setFlippedCards(prev => new Set(prev).add(i));
  }, []);

  const onRevealContinue = useCallback(() => {
    const items: QuizItem[] = [];

    decisions.forEach((decision, idx) => {
      const isSpy = errorByOption.has(idx);
      const error = errorByOption.get(idx);
      if (decision === 'detain' && isSpy && error?.quiz) {
        const mark = suspectMarks.get(idx);
        const markedCorrectly = mark?.isCorrect ?? false;
        // Shuffle quiz choices so correct answer isn't always at the same position
        const choiceOrder = shuffleArray(error.quiz.choices.map((_, ci) => ci));
        items.push({
          suspectIdx: idx,
          quiz: {
            prompt: error.quiz.prompt,
            choices: choiceOrder.map(ci => error.quiz!.choices[ci]),
            answerIndex: choiceOrder.indexOf(error.quiz.answerIndex),
          },
          markedCorrectly,
          markedText: mark?.text,
        });
      }
    });

    setQuizItems(items);
    setQuizStep(0);
    setQuizAnswered(false);
    setQuizCorrect(false);

    if (items.length > 0) {
      setPhase('quiz');
    } else {
      setPhase('result');
    }
  }, [decisions, errorByOption, suspectMarks]);

  // ── Quiz ──
  const onQuizAnswer = useCallback((choiceIdx: number) => {
    if (quizAnswered) return;
    const correct = choiceIdx === quizItems[quizStep].quiz.answerIndex;
    setQuizCorrect(correct);
    setQuizAnswered(true);
    if (!correct) setLives(l => Math.max(0, l - 1));
  }, [quizAnswered, quizItems, quizStep]);

  const onQuizNext = useCallback(() => {
    if (quizStep + 1 < quizItems.length) {
      setQuizStep(s => s + 1);
      setQuizAnswered(false);
      setQuizCorrect(false);
    } else {
      setPhase('result');
    }
  }, [quizStep, quizItems.length]);

  // ── Redemption ──
  const missedSpyIndices = useMemo(() => (
    Array.from({ length: totalSuspects }, (_, i) => i).filter(i =>
      errorByOption.has(i) && decisions.get(i) === 'release'
    )
  ), [totalSuspects, errorByOption, decisions]);

  const startRedemption = useCallback(() => {
    setRedemptionQueue(missedSpyIndices);
    setRedemptionStep(0);
    setRedemptionCircleWrongs(0);
    setRedemptionTransitioning(false);
    setPhase('redemption');
  }, [missedSpyIndices]);

  const currentRedemptionIdx = redemptionQueue[redemptionStep];
  const currentRedemptionError = currentRedemptionIdx !== undefined
    ? errorByOption.get(currentRedemptionIdx)
    : undefined;

  const advanceRedemption = useCallback(() => {
    if (redemptionStep + 1 < redemptionQueue.length) {
      setRedemptionStep(s => s + 1);
      setRedemptionCircleWrongs(0);
      setRedemptionTransitioning(false);
    } else {
      setPhase('result');
    }
  }, [redemptionStep, redemptionQueue.length]);

  const onRedemptionCircle = useCallback((isErrorSeg: boolean) => {
    if (redemptionTransitioning) return;
    if (isErrorSeg) {
      setRedemptionResults(prev => new Map(prev).set(currentRedemptionIdx, true));
      showFeedback('找到了！', 'success');
      setRedemptionTransitioning(true);
      setTimeout(advanceRedemption, 1500);
    } else {
      const newWrongs = redemptionCircleWrongs + 1;
      setRedemptionCircleWrongs(newWrongs);
      if (newWrongs >= 2) {
        setRedemptionResults(prev => new Map(prev).set(currentRedemptionIdx, false));
        showFeedback('這次沒找到，繼續加油。', 'info');
        setRedemptionTransitioning(true);
        setTimeout(advanceRedemption, 1800);
      } else {
        showFeedback('不是這裡，再看看。', 'error');
      }
    }
  }, [redemptionTransitioning, currentRedemptionIdx, redemptionCircleWrongs, showFeedback, advanceRedemption]);

  // ── Score & Rating ──
  const score = useMemo(() => {
    let correct = 0;
    let missedSpies = 0;
    let wrongDetains = 0;
    let detainedWithEvidence = 0; // 關押且有正確標記
    decisions.forEach((decision, idx) => {
      const isSpy = errorByOption.has(idx);
      if (decision === 'detain' && isSpy) {
        correct++;
        const mark = suspectMarks.get(idx);
        if (mark?.isCorrect) detainedWithEvidence++;
      }
      if (decision === 'release' && isSpy) missedSpies++;
      if (decision === 'detain' && !isSpy) wrongDetains++;
    });
    const redemptionCorrect = Array.from(redemptionResults.values()).filter(Boolean).length;
    return { correct, missedSpies, wrongDetains, detainedWithEvidence, redemptionCorrect };
  }, [decisions, errorByOption, suspectMarks, redemptionResults]);

  const rating = useMemo(() => {
    if (gameOver) return { label: '審訊失敗', emoji: '💀' };
    const allCaught = score.missedSpies === 0;
    const noWrongDetains = score.wrongDetains === 0;
    const allWithEvidence = score.detainedWithEvidence === totalSpies;
    const anyWithEvidence = score.detainedWithEvidence > 0;
    const hasWrongDetains = score.wrongDetains > 0;
    const hasMissed = score.missedSpies > 0;

    if (allCaught && noWrongDetains && allWithEvidence && lives === SPY.maxLives)
      return { label: '完美審判', emoji: '🏆' };
    if (allCaught && noWrongDetains && allWithEvidence)
      return { label: '有理有據', emoji: '⭐' };
    if (allCaught && noWrongDetains && anyWithEvidence)
      return { label: '臥底落網', emoji: '🎯' };
    if (allCaught && noWrongDetains)
      return { label: '全數逮捕', emoji: '🔒' };
    if (allCaught && hasWrongDetains)
      return { label: '矯枉過正', emoji: '⚖️' };
    if (hasMissed && hasWrongDetains)
      return { label: '雙重失誤', emoji: '💔' };
    if (redemptionResults.size > 0 && score.redemptionCorrect === missedSpyIndices.length)
      return { label: '亡羊補牢', emoji: '🔍' };
    return { label: '有漏網之魚', emoji: '😰' };
  }, [gameOver, score, lives, totalSpies, redemptionResults, missedSpyIndices.length]);

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

  // ── Render ──
  return (
    <div className="h-[100dvh] detective-paper text-dt-text flex flex-col overflow-hidden">
      <style>{`
        @keyframes cardFlipH {
          0%   { transform: rotateX(180deg);  filter: blur(0px); }
          45%  { transform: rotateX(90deg);   filter: blur(4px); }
          55%  { transform: rotateX(90deg);   filter: blur(4px); }
          100% { transform: rotateX(0deg);    filter: blur(0px); }
        }
        @keyframes moodShake {
          0%, 100% { transform: translateX(0); }
          10% { transform: translateX(-6px); }
          20% { transform: translateX(6px); }
          30% { transform: translateX(-5px); }
          40% { transform: translateX(5px); }
          50% { transform: translateX(-3px); }
          60% { transform: translateX(3px); }
          70% { transform: translateX(-2px); }
          80% { transform: translateX(2px); }
        }
        @keyframes moodTremble {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          50% { transform: translateX(1px); }
          75% { transform: translateX(-1px); }
        }
        @keyframes moodBounce {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
          60% { transform: translateY(-2px); }
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
        {phase === 'trial' ? (
          <>
            {/* 審訊導覽點 — 全部可點，未決定的 pulse 提示 */}
            <div className="flex gap-3 justify-center mb-1" style={{ minHeight: '48px' }}>
              {options.map((_, i) => {
                const isCurrent = i === trialIdx;
                const decided = decisions.has(i);
                const decisionMade = decisions.get(i);
                return (
                  <button
                    key={i}
                    onClick={() => navigateToSuspect(i)}
                    className="flex flex-col items-center gap-0.5 transition-all cursor-pointer"
                    style={{ minHeight: '48px' }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                        isCurrent ? 'scale-110' : !decided ? 'animate-pulse' : ''
                      }`}
                      style={{
                        background: isCurrent
                          ? 'var(--dt-accent)'
                          : decided
                            ? 'color-mix(in srgb, var(--dt-accent) 25%, var(--dt-card))'
                            : 'var(--dt-border)',
                        color: isCurrent ? 'white' : 'var(--dt-text)',
                        outline: isCurrent ? '2px solid var(--dt-accent)' : undefined,
                        outlineOffset: isCurrent ? '2px' : undefined,
                      }}
                    >
                      {LETTERS[i]}
                    </div>
                    <div className="text-[9px] font-medium" style={{
                      color: decided
                        ? (decisionMade === 'detain' ? 'var(--dt-error)' : 'var(--dt-success)')
                        : 'transparent',
                    }}>
                      {decided ? (decisionMade === 'detain' ? '關押' : '釋放') : '未定'}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-[10px] text-dt-text-muted text-right">
              {allDecided ? '所有人審訊完畢，可以宣判' : `還有 ${undecidedCount} 人未決定`}
            </div>
          </>
        ) : (
          <>
            <div className="flex gap-1">
              {options.map((_, i) => {
                const isSpy = errorByOption.has(i);
                const decision = decisions.get(i);
                const isFlipped = phase === 'reveal' && flippedCards.has(i);
                const isCorrect = (decision === 'detain' && isSpy) || (decision === 'release' && !isSpy);
                const bg = phase === 'reveal' && isFlipped
                  ? (isCorrect ? 'var(--dt-success)' : 'var(--dt-error)')
                  : 'var(--dt-accent)';
                return (
                  <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-500"
                    style={{ background: bg }} />
                );
              })}
            </div>
            <div className="text-[10px] text-dt-text-muted mt-1 text-right">
              {phase === 'reveal' && `已翻 ${flippedCards.size}/${totalSuspects}`}
              {phase === 'quiz' && `測驗 ${quizStep + 1}/${quizItems.length}`}
              {phase === 'redemption' && `補救 ${redemptionStep + 1}/${redemptionQueue.length}`}
            </div>
          </>
        )}
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

        {/* Phase 1: Trial — VN 風格 */}
        {phase === 'trial' && (() => {
          const error = errorByOption.get(trialIdx);
          const mark = suspectMarks.get(trialIdx);
          const segs = buildOptionSegs(options[trialIdx], error);
          const currentDecision = decisions.get(trialIdx);
          const hasPrev = trialIdx > 0;
          const hasNext = trialIdx + 1 < totalSuspects;

          return (
            <div className="relative h-full -mx-4 -mb-4 overflow-hidden">

              {/* 角色立繪 — top:80px 避開題幹，頂部與底部都淡入/淡出 */}
              <div className="absolute left-0 right-0 bottom-0 flex justify-center pointer-events-none"
                style={{ top: '80px' }}>
                <img
                  src={SUSPECT_AVATARS[trialIdx]}
                  alt=""
                  className="h-full object-contain object-top transition-all duration-300"
                  style={{
                    filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.2))',
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 45%, transparent 72%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 45%, transparent 72%)',
                  }}
                />
              </div>

              {/* ① 題幹 — 頂部固定 */}
              <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-2">
                <div className="text-xs text-dt-text-secondary leading-relaxed p-2.5 rounded-lg"
                  style={{
                    background: 'color-mix(in srgb, var(--dt-card) 92%, transparent)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid var(--dt-border)',
                  }}>
                  <span className="text-dt-accent font-bold mr-1">臥底 {totalSpies} 名</span>
                  {question.mainStem}
                </div>
              </div>

              {/* ② 底部面板：反應 → 證詞 → 按鈕 → 導覽（全部綁在一起） */}
              <div className="absolute bottom-0 left-0 right-0 z-20 px-4 pt-3"
                style={{
                  background: 'linear-gradient(to top, var(--dt-bg) 70%, transparent)',
                  paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))',
                }}>

                {/* 反應台詞（固定 h-10，緊貼證詞上方） */}
                <div className="h-10 mb-1 flex items-center">
                  {suspectReactions.has(trialIdx) && (() => {
                    const reaction = suspectReactions.get(trialIdx)!;
                    const m = reaction.mood;
                    const anim = m === 'angry' ? 'moodShake 0.4s ease'
                      : m === 'plead' ? 'moodTremble 0.3s ease 2'
                      : m === 'smug' ? 'moodBounce 0.4s ease'
                      : 'none';
                    const borderColor = m === 'angry' ? 'var(--dt-error)'
                      : m === 'smug' ? '#c8a84e'
                      : m === 'grateful' ? 'var(--dt-success)'
                      : 'var(--dt-border)';
                    const textColor = m === 'angry' ? 'var(--dt-error)'
                      : m === 'cold' ? 'var(--dt-text-muted)'
                      : m === 'smug' ? '#c8a84e'
                      : 'var(--dt-text-secondary)';
                    const fontStyle = (m === 'cold' || m === 'smug') ? 'italic' as const : 'normal' as const;
                    const fontWeight = m === 'angry' ? 700 : 400;
                    const clipPath = m === 'angry'
                      ? 'polygon(0% 4%, 3% 0%, 6% 5%, 10% 1%, 14% 4%, 18% 0%, 22% 3%, 26% 0%, 30% 4%, 34% 1%, 38% 3%, 42% 0%, 46% 4%, 50% 0%, 54% 3%, 58% 1%, 62% 4%, 66% 0%, 70% 3%, 74% 1%, 78% 4%, 82% 0%, 86% 3%, 90% 1%, 94% 4%, 97% 0%, 100% 4%, 100% 96%, 97% 100%, 94% 96%, 90% 99%, 86% 97%, 82% 100%, 78% 96%, 74% 99%, 70% 97%, 66% 100%, 62% 96%, 58% 99%, 54% 97%, 50% 100%, 46% 96%, 42% 100%, 38% 97%, 34% 99%, 30% 96%, 26% 100%, 22% 97%, 18% 100%, 14% 96%, 10% 99%, 6% 95%, 3% 100%, 0% 96%)'
                      : 'none';
                    return (
                      <div className="w-full" style={{ animation: anim }}>
                        <div className="text-xs px-3 py-1.5 rounded-xl"
                          style={{
                            background: 'color-mix(in srgb, var(--dt-card) 92%, transparent)',
                            border: `${m === 'angry' ? '2px' : '1px'} solid ${borderColor}`,
                            color: textColor, fontStyle, fontWeight, clipPath,
                            backdropFilter: 'blur(8px)',
                          }}>
                          「{reaction.text}」
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 證詞 */}
                <div className="rounded-xl p-3 mb-1.5"
                  style={{
                    background: 'color-mix(in srgb, var(--dt-card) 95%, transparent)',
                    border: '2px solid var(--dt-border)',
                    backdropFilter: 'blur(8px)',
                  }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs font-bold" style={{ color: 'var(--dt-accent)' }}>
                      嫌犯 {LETTERS[trialIdx]} 的供詞
                    </div>
                    <div className="text-[10px] text-dt-text-muted">
                      {mark ? `🔍「${mark.text.slice(0, 6)}…」` : '點選可標記'}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed select-none">
                    「{segs.map((seg, si) => {
                      const isMarked = mark?.text === seg.text;
                      return (
                        <span key={si}
                          onClick={() => onMark(seg.text, seg.isError)}
                          className="cursor-pointer transition-colors"
                          style={{
                            borderBottom: isMarked ? '2px solid var(--dt-scan)' : '2px solid transparent',
                            color: isMarked ? 'var(--dt-scan)' : undefined,
                          }}>
                          {seg.text}
                        </span>
                      );
                    })}」
                  </p>
                </div>

                {/* 釋放/關押 */}
                <div className="flex gap-3 mb-1.5">
                  <button onClick={() => onDecide('release')}
                    className="flex-1 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                    style={{
                      background: currentDecision === 'release'
                        ? 'color-mix(in srgb, var(--dt-success) 22%, var(--dt-card))'
                        : 'color-mix(in srgb, var(--dt-success) 10%, var(--dt-card))',
                      border: '2px solid var(--dt-success)', color: 'var(--dt-success)',
                      fontWeight: currentDecision === 'release' ? 900 : undefined,
                    }}>
                    ✓ 釋放{currentDecision === 'release' ? ' ●' : ''}
                  </button>
                  <button onClick={() => onDecide('detain')}
                    className="flex-1 py-2 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                    style={{
                      background: currentDecision === 'detain'
                        ? 'color-mix(in srgb, var(--dt-error) 22%, var(--dt-card))'
                        : 'color-mix(in srgb, var(--dt-error) 10%, var(--dt-card))',
                      border: '2px solid var(--dt-error)', color: 'var(--dt-error)',
                      fontWeight: currentDecision === 'detain' ? 900 : undefined,
                    }}>
                    ✕ 關押{currentDecision === 'detain' ? ' ●' : ''}
                  </button>
                </div>

                {/* 導覽列 — 上一位/下一位永遠顯示 */}
                <div className="flex gap-2 mb-1.5">
                  <button disabled={!hasPrev} onClick={() => hasPrev && navigateToSuspect(trialIdx - 1)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center transition-all disabled:opacity-0"
                    style={{ border: '1px solid var(--dt-border)', color: 'var(--dt-text-secondary)' }}>
                    ← 上一位
                  </button>
                  <button disabled={!hasNext} onClick={() => hasNext && navigateToSuspect(trialIdx + 1)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center transition-all disabled:opacity-30 dt-btn-primary">
                    下一位 →
                  </button>
                </div>

                {/* 宣判按鈕 — 獨立一行，未全決定時 disabled */}
                <button
                  disabled={!allDecided}
                  onClick={onProceedToReveal}
                  className="w-full py-2 rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-40"
                  style={{
                    background: allDecided ? 'var(--dt-accent)' : 'var(--dt-border)',
                    color: allDecided ? 'white' : 'var(--dt-text-muted)',
                  }}>
                  {allDecided ? '進行宣判 →' : `還有 ${undecidedCount} 人未決定`}
                </button>
              </div>
            </div>
          );
        })()}

        {/* Phase 2: Reveal */}
        {phase === 'reveal' && (
          <div className="space-y-3">
            <DetectiveBubble>
              {allFlipped ? '審判結束。' : '點擊每位嫌犯的卡片，揭曉你的判斷是否正確。'}
            </DetectiveBubble>

            {options.map((opt, i) => {
              const flipped = flippedCards.has(i);
              const decision = decisions.get(i);
              const isSpy = errorByOption.has(i);
              const isCorrectDecision = (decision === 'detain' && isSpy) || (decision === 'release' && !isSpy);
              return (
                <div key={i} style={{ perspective: '900px' }}>
                  <div style={{
                    position: 'relative', height: '80px', transformStyle: 'preserve-3d',
                    transform: flipped ? 'rotateX(0deg)' : 'rotateX(180deg)',
                    animation: flipped ? 'cardFlipH 0.45s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
                  }}>
                    {/* Front — 結果 */}
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }}>
                      <div className="h-full case-file rounded-xl p-3 flex items-center gap-3"
                        style={{ border: `2px solid ${isCorrectDecision ? 'var(--dt-success)' : 'var(--dt-error)'}` }}>
                        <SuspectIcon idx={i} size="md" />
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
                    {/* Back — 未翻開 */}
                    <div
                      onClick={() => onFlipCard(i)}
                      style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateX(-180deg)', cursor: 'pointer' }}
                    >
                      <div className="h-full case-file rounded-xl p-3 flex items-center gap-3 hover:opacity-80 active:scale-[0.98] transition-all"
                        style={{ border: '2px solid var(--dt-border)' }}>
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
              <button onClick={onRevealContinue}
                className="w-full py-3 rounded-xl text-sm font-bold dt-btn-primary mt-2 transition-all hover:scale-[1.01] active:scale-[0.98]">
                繼續審訊 →
              </button>
            )}
          </div>
        )}

        {/* Phase 3: Quiz */}
        {phase === 'quiz' && quizItems[quizStep] && (() => {
          const item = quizItems[quizStep];
          return (
            <div className="space-y-4">
              <div className="case-file rounded-xl p-4">
                <DetectiveBubble>
                  <span className="text-dt-accent font-medium">結案確認</span>
                  {' '}({quizStep + 1}/{quizItems.length})
                </DetectiveBubble>

                {item.markedCorrectly && item.markedText ? (
                  <div className="text-[11px] px-2.5 py-1.5 rounded-lg mb-3 ml-10"
                    style={{
                      background: 'color-mix(in srgb, var(--dt-scan) 10%, transparent)',
                      color: 'var(--dt-scan)',
                      border: '1px solid color-mix(in srgb, var(--dt-scan) 40%, transparent)',
                    }}>
                    你標出了「{item.markedText}」，說說看這裡哪裡有問題：
                  </div>
                ) : (
                  <div className="text-[11px] px-2.5 py-1.5 rounded-lg mb-3 ml-10"
                    style={{
                      background: 'color-mix(in srgb, var(--dt-error) 8%, transparent)',
                      color: 'var(--dt-text-muted)',
                      border: '1px solid color-mix(in srgb, var(--dt-error) 25%, transparent)',
                    }}>
                    你關押了嫌犯 {LETTERS[item.suspectIdx]}，但沒有標出理由。說說看供詞哪裡有問題：
                  </div>
                )}

                <p className="text-sm mb-3 leading-relaxed pl-10">{item.quiz.prompt}</p>
                <div className="space-y-2 pl-10">
                  {item.quiz.choices.map((choice, ci) => {
                    const isAnswer = ci === item.quiz.answerIndex;
                    return (
                      <button key={ci} onClick={() => onQuizAnswer(ci)} disabled={quizAnswered}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                          quizAnswered && isAnswer ? 'ring-2' : ''
                        } dt-choice ${quizAnswered ? '' : 'cursor-pointer'}`}
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
                    {quizStep + 1 < quizItems.length ? '下一題' : '查看結果'}
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Phase 4: Result */}
        {phase === 'result' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="text-4xl mb-2">{rating.emoji}</div>
              <h2 className="text-lg font-bold" style={{ color: gameOver ? 'var(--dt-error)' : 'var(--dt-success)' }}>
                {rating.label}
              </h2>
              <p className="text-sm text-dt-text-muted mt-1">
                正確答案：({LETTERS[correctIdx]}) {options[correctIdx]}
              </p>
              <div className="flex justify-center flex-wrap gap-3 mt-2 text-xs text-dt-text-muted">
                <span>關押正確 {score.correct}/{totalSpies}</span>
                {score.correct > 0 && (
                  <span className={score.detainedWithEvidence === score.correct ? 'text-dt-success' : 'text-dt-text-muted'}>
                    有理有據 {score.detainedWithEvidence}/{score.correct}
                  </span>
                )}
                {score.missedSpies > 0 && <span className="text-dt-error">漏放 {score.missedSpies}</span>}
                {score.wrongDetains > 0 && <span className="text-dt-error">冤枉 {score.wrongDetains}</span>}
                {score.redemptionCorrect > 0 && <span className="text-dt-success">補救成功 {score.redemptionCorrect}</span>}
              </div>
            </div>

            {/* 審訊紀錄 */}
            <div className="case-file rounded-xl p-4">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--dt-accent)' }}>審訊紀錄</h3>
              <div className="space-y-3">
                {options.map((_, i) => {
                  const isSpy = errorByOption.has(i);
                  const error = errorByOption.get(i);
                  const decision = decisions.get(i);
                  const isCorrectDecision = (decision === 'detain' && isSpy) || (decision === 'release' && !isSpy);
                  const redemptionResult = redemptionResults.get(i);
                  return (
                    <div key={i} className="text-sm">
                      <div className="flex items-center gap-2">
                        <SuspectIcon idx={i} size="sm" />
                        <span className="text-xs font-bold">嫌犯 {LETTERS[i]}</span>
                        <span className={`text-[10px] ${isSpy ? 'text-dt-error' : 'text-dt-success'}`}>
                          {isSpy ? '🎭 臥底' : '✓ 清白'}
                        </span>
                        <span className={`text-[10px] ml-auto ${isCorrectDecision ? 'text-dt-success' : 'text-dt-error'}`}>
                          你：{decision === 'detain' ? '關押' : '釋放'}
                        </span>
                        {redemptionResult !== undefined && (
                          <span className={`text-[10px] ${redemptionResult ? 'text-dt-success' : 'text-dt-text-muted'}`}>
                            {redemptionResult ? '補救✓' : '補救✗'}
                          </span>
                        )}
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

            {/* 補救按鈕（只在尚未補救且有漏放時顯示） */}
            {missedSpyIndices.length > 0 && redemptionResults.size === 0 && (
              <button
                onClick={startRedemption}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.98]"
                style={{
                  background: 'color-mix(in srgb, var(--dt-scan) 10%, var(--dt-card))',
                  border: '2px solid var(--dt-scan)',
                  color: 'var(--dt-scan)',
                }}
              >
                🔍 你漏放了 {missedSpyIndices.length} 名臥底，要補救嗎？
              </button>
            )}

            {/* 知識點 */}
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

        {/* Phase 5: Redemption */}
        {phase === 'redemption' && currentRedemptionIdx !== undefined && currentRedemptionError && (
          <div className="space-y-4">
            {/* 題幹常駐 */}
            <div className="case-file rounded-xl p-4">
              <DetectiveBubble>
                <span className="text-dt-accent font-medium">案情：</span>{question.mainStem}
              </DetectiveBubble>
            </div>

            <div className="case-file rounded-xl p-4">
              <DetectiveBubble>
                <span className="text-dt-accent font-medium">補救機會</span>
                {' '}({redemptionStep + 1}/{redemptionQueue.length})
              </DetectiveBubble>
              <DetectiveBubble>
                你放走了嫌犯 {LETTERS[currentRedemptionIdx]}。
                你剛才看過結案報告了——<span className="text-dt-accent font-medium">能在供詞裡找到破綻嗎？</span>
              </DetectiveBubble>
            </div>

            <div className="case-file rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <SuspectIcon idx={currentRedemptionIdx} size="lg" />
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--dt-accent)' }}>
                    嫌犯 {LETTERS[currentRedemptionIdx]}
                  </div>
                  <div className="text-[10px] text-dt-text-muted">點選有問題的片段</div>
                </div>
              </div>
              <div className="rounded-lg p-3" style={{
                background: 'color-mix(in srgb, var(--dt-bg) 80%, transparent)',
                border: '1px solid var(--dt-border)',
              }}>
                <p className="text-base leading-loose select-none">
                  {buildOptionSegs(options[currentRedemptionIdx], currentRedemptionError).map((seg, si) => (
                    <span
                      key={si}
                      onClick={() => !redemptionTransitioning && onRedemptionCircle(seg.isError)}
                      className={`cursor-pointer transition-colors ${redemptionTransitioning ? 'pointer-events-none' : ''}`}
                    >
                      {seg.text}
                    </span>
                  ))}
                </p>
              </div>
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
          }`} style={{
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
