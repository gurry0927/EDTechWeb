'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { DetectiveQuestion } from './types';

// ── Constants ──
const MAX_LIVES = 3;
const WRONG_EVIDENCE_MSGS = [
  '嗯⋯這條線索好像跟結論沒有直接關係。',
  '不太對，這個無法佐證你的推理。',
  '再想想，哪個線索才是關鍵證據？',
];
function pick(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Shared components (outside to avoid remount) ──
const DetectiveAvatar = () => (
  <span className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center text-base shrink-0 border border-cyan-200 dark:border-cyan-800/40">🕵️</span>
);

const TypingBubble = () => (
  <div className="flex gap-2.5 items-start max-w-[85%] bubble-in">
    <DetectiveAvatar />
    <div className="rounded-2xl rounded-tl-sm px-5 py-3 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10">
      <div className="typing-dots text-slate-400 dark:text-white/30 flex gap-1"><span /><span /><span /></div>
    </div>
  </div>
);

const DetectiveBubble = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2.5 items-start max-w-[85%] bubble-in">
    <DetectiveAvatar />
    <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-base text-slate-700 dark:text-white/80 leading-relaxed">
      {children}
    </div>
  </div>
);

const StudentBubble = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2.5 items-start max-w-[85%] ml-auto flex-row-reverse bubble-in">
    <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-base shrink-0 border border-amber-200 dark:border-amber-800/30">🧑‍🎓</span>
    <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/30 text-base text-slate-700 dark:text-white/80 leading-relaxed">
      {children}
    </div>
  </div>
);

function TypedDetective({ children, delay = 'medium' }: { children: React.ReactNode; delay?: 'short' | 'medium' | 'long' }) {
  const [typing, setTyping] = useState(true);
  const ms = delay === 'short' ? 500 : delay === 'long' ? 1200 : 800;
  useEffect(() => { const t = setTimeout(() => setTyping(false), ms); return () => clearTimeout(t); }, [ms]);
  if (typing) return <TypingBubble />;
  return <DetectiveBubble>{children}</DetectiveBubble>;
}

const ActionBtn = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => (
  <div className="flex justify-center my-2">
    <button onClick={onClick} className="px-5 py-2 rounded-full text-base font-medium bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm transition-all flex items-center gap-2">
      {children}
    </button>
  </div>
);

const LivesDisplay = ({ lives }: { lives: number }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: MAX_LIVES }).map((_, i) => (
      <span key={i} className="text-sm">{i < lives ? '❤️' : '🖤'}</span>
    ))}
  </div>
);

// ── Segment building ──
interface Seg { text: string; clueIndex: number | null; }

function buildSegs(src: string, clues: { startIndex: number; length: number; idx: number }[]): Seg[] {
  const valid = clues.filter(c => c.startIndex >= 0).sort((a, b) => a.startIndex - b.startIndex);
  if (!valid.length) return [{ text: src, clueIndex: null }];
  const segs: Seg[] = [];
  let cur = 0;
  valid.forEach(c => {
    if (c.startIndex > cur) segs.push({ text: src.slice(cur, c.startIndex), clueIndex: null });
    segs.push({ text: src.slice(c.startIndex, c.startIndex + c.length), clueIndex: c.idx });
    cur = c.startIndex + c.length;
  });
  if (cur < src.length) segs.push({ text: src.slice(cur), clueIndex: null });
  return segs;
}

// ── Types ──
type Phase = 'clue' | 'reasoning' | 'answer' | 'solution';
type ReasoningMode = 'choosing' | 'pointing';
interface Props { question: DetectiveQuestion; onBack: () => void; }

// ── Main Component ──
export function DetectivePlayer({ question, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('clue');
  const [foundClues, setFoundClues] = useState<Set<number>>(new Set());
  const [clueOrder, setClueOrder] = useState<number[]>([]);
  const [lives, setLives] = useState(MAX_LIVES);
  const [reasoningStep, setReasoningStep] = useState(0);
  const [reasoningMode, setReasoningMode] = useState<ReasoningMode>('choosing');
  const [reasoningWrong, setReasoningWrong] = useState(false);
  const [evidenceWrongMsg, setEvidenceWrongMsg] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState<string[]>([]);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Timers
  useEffect(() => { const t = setTimeout(() => setShowPulse(false), 4000); return () => clearTimeout(t); }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 1400); return () => clearTimeout(t); }, [toast]);

  // Derived
  const clueLocked = phase === 'clue' && lives <= 0;
  const totalClues = question.clues.length;
  const criticalClues = useMemo(() => question.clues.map((c, i) => ({ ...c, idx: i })).filter(c => c.isCritical), [question.clues]);
  const allCriticalFound = criticalClues.every(c => foundClues.has(c.idx));
  const reasoningClues = useMemo(() => question.clues.map((c, i) => ({ ...c, idx: i })).filter(c => foundClues.has(c.idx) && c.reasoning), [question.clues, foundClues]);
  const reasoningDone = phase === 'reasoning' && reasoningStep >= reasoningClues.length;

  // Segments
  const cluesWithIdx = useMemo(() => question.clues.map((c, i) => ({ ...c, idx: i })), [question.clues]);
  const stemSegs = useMemo(() => buildSegs(question.mainStem, cluesWithIdx.filter(c => c.startIndex >= 0)), [question.mainStem, cluesWithIdx]);
  const figureClues = useMemo(() => cluesWithIdx.filter(c => c.startIndex === -1), [cluesWithIdx]);
  const figureSegs = useMemo(() => {
    if (!question.figure || !figureClues.length) return null;
    // Collect all text matches: main text + aliases, all map to same clueIdx
    const allMatches: { start: number; end: number; clueIdx: number }[] = [];
    figureClues.forEach(fc => {
      const texts = fc.aliases?.length ? fc.aliases : [fc.text];
      texts.forEach(t => {
        const start = question.figure!.indexOf(t);
        if (start >= 0) allMatches.push({ start, end: start + t.length, clueIdx: fc.idx });
      });
    });
    allMatches.sort((a, b) => a.start - b.start);
    if (!allMatches.length) return null;
    const segs: Seg[] = [];
    let cur = 0;
    allMatches.forEach(m => {
      if (m.start > cur) segs.push({ text: question.figure!.slice(cur, m.start), clueIndex: null });
      if (m.start >= cur) { segs.push({ text: question.figure!.slice(m.start, m.end), clueIndex: m.clueIdx }); cur = m.end; }
    });
    if (cur < question.figure!.length) segs.push({ text: question.figure!.slice(cur), clueIndex: null });
    return segs;
  }, [question.figure, figureClues]);

  // Auto-scroll & auto-advance
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [phase, foundClues.size, reasoningStep, reasoningMode, reasoningWrong, evidenceWrongMsg, wrongAttempts.length, answeredCorrectly]);
  useEffect(() => { if (reasoningDone) { const t = setTimeout(() => setPhase('answer'), 800); return () => clearTimeout(t); } }, [reasoningDone]);

  // ── Handlers ──
  const onClueHit = useCallback((idx: number) => {
    if (clueLocked || foundClues.has(idx)) return;
    setFoundClues(prev => new Set(prev).add(idx));
    setClueOrder(prev => [...prev, idx]);
  }, [clueLocked, foundClues]);

  const onClueMiss = useCallback(() => {
    if (clueLocked) return;
    setLives(prev => prev - 1);
    setToast('這裡沒什麼線索，再看看別的。');
  }, [clueLocked]);

  const onSegTap = useCallback((seg: Seg) => {
    if (seg.clueIndex !== null) onClueHit(seg.clueIndex); else onClueMiss();
  }, [onClueHit, onClueMiss]);

  const enterReasoning = useCallback(() => { setPhase('reasoning'); setReasoningStep(0); setReasoningMode('choosing'); }, []);

  const onReasoningChoice = useCallback((choiceIdx: number) => {
    const current = reasoningClues[reasoningStep];
    if (!current?.reasoning) return;
    if (choiceIdx === current.reasoning.answerIndex) { setReasoningWrong(false); setReasoningMode('pointing'); setEvidenceWrongMsg(null); }
    else { setReasoningWrong(true); }
  }, [reasoningClues, reasoningStep]);

  const onEvidencePoint = useCallback((clueIdx: number) => {
    const current = reasoningClues[reasoningStep];
    if (!current) return;
    if (clueIdx === current.idx) { setEvidenceWrongMsg(null); setReasoningMode('choosing'); setTimeout(() => setReasoningStep(prev => prev + 1), 600); }
    else { setLives(prev => Math.max(0, prev - 1)); setEvidenceWrongMsg(pick(WRONG_EVIDENCE_MSGS)); }
  }, [reasoningClues, reasoningStep]);

  const onSelectAnswer = useCallback((letter: string) => {
    if (letter === question.answer) { setAnsweredCorrectly(true); setTimeout(() => setPhase('solution'), 800); }
    else { setWrongAttempts(prev => [...prev, letter]); }
  }, [question.answer]);

  // ── Stem rendering ──
  const clsFound = 'bg-amber-100 dark:bg-amber-500/20 border-b-2 border-amber-400 dark:border-amber-400/40';
  const clsPointable = clsFound + ' cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-500/30 ring-1 ring-amber-300 dark:ring-amber-500/30';
  const clsDim = 'opacity-30';
  const isCluePhase = phase === 'clue' && !clueLocked;
  const isPointingPhase = phase === 'reasoning' && reasoningMode === 'pointing';

  const renderSegs = (segs: Seg[], onTap: (seg: Seg) => void) => segs.map((seg, i) => {
    const isClue = seg.clueIndex !== null;
    const isFound = isClue && foundClues.has(seg.clueIndex!);

    if (isPointingPhase) {
      if (isFound) return <span key={i} onClick={() => onEvidencePoint(seg.clueIndex!)} className={clsPointable}>{seg.text}</span>;
      return <span key={i} className={clsDim}>{seg.text}</span>;
    }
    if (phase === 'reasoning') return <span key={i} className={isFound ? clsFound : clsDim}>{seg.text}</span>;
    if (isCluePhase) return <span key={i} onClick={() => onTap(seg)} className={`cursor-pointer transition-all duration-200 ${isFound ? clsFound : 'active:bg-slate-200 dark:active:bg-white/10'}`}>{seg.text}</span>;
    return <span key={i} className={isFound ? clsFound : ''}>{seg.text}</span>;
  });

  const Detective = DetectiveBubble;
  const Student = StudentBubble;
  const livesLost = MAX_LIVES - lives;

  return (
    <div className="min-h-[100dvh] detective-paper text-slate-800 dark:text-white flex flex-col">
      {/* Header + Stem card + folder tabs — all sticky together */}
      <div className="shrink-0 sticky top-0 z-10">
        <header className="px-4 py-2 flex items-center gap-3 case-file border-b border-amber-200/20 dark:border-white/5">
          <button onClick={onBack} className="text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 text-base flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            返回
          </button>
          <span className="flex-1 text-center text-sm text-slate-400 dark:text-white/40">{question.source}</span>
        </header>
        {/* Case file body */}
        <div className={`case-file transition-all duration-300 ${isPointingPhase ? 'ring-2 ring-amber-400/50 ring-inset' : ''}`}>
          <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
            {isPointingPhase && (
              <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">👆 請在題目中指認支持你推理的證據</div>
            )}
            <div className={question.figureImage ? 'flex flex-col sm:flex-row gap-3' : ''}>
              <div className={question.figureImage ? 'sm:flex-1 min-w-0' : ''}>
                <p className={`text-base leading-relaxed text-slate-700 dark:text-white/85 whitespace-pre-line ${showPulse ? 'stem-scan' : ''}`}>
                  {renderSegs(stemSegs, onSegTap)}
                </p>
                {question.figure && (
                  <div className={`mt-2 px-2 py-1.5 rounded text-sm ${showPulse ? 'stem-scan' : ''}`}>
                    <p className="text-slate-500 dark:text-white/45 leading-relaxed">
                      {figureSegs ? renderSegs(figureSegs, (seg) => seg.clueIndex !== null ? onClueHit(seg.clueIndex) : onClueMiss()) : question.figure}
                    </p>
                  </div>
                )}
              </div>
              {question.figureImage && (
                <div className="sm:w-[45%] shrink-0">
                  <img src={question.figureImage} alt="附圖" className="w-full rounded mix-blend-darken dark:invert dark:mix-blend-lighten dark:opacity-90" />
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Folder tabs — stacked layers hanging below */}
        <div className="max-w-2xl mx-auto px-4 relative z-20">
          <div className="flex items-start">
            <div className="folder-tab folder-tab-1">
              <span className="text-red-900/30 dark:text-red-400/20 font-bold text-xs tracking-[0.25em]" style={{ fontFamily: '"Noto Serif TC", Georgia, serif' }}>機 密 檔 案</span>
            </div>
            <div className="folder-tab folder-tab-2">
              <span className="text-amber-800/40 dark:text-white/35 text-xs font-medium">線索 {foundClues.size}/{totalClues}</span>
            </div>
            <div className="folder-tab folder-tab-3">
              <LivesDisplay lives={lives} />
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-full text-base font-medium shadow-lg bg-amber-100 dark:bg-amber-500/90 text-amber-800 dark:text-black border border-amber-300 dark:border-transparent animate-bounce">{toast}</div>
        </div>
      )}

      {/* Chat */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="max-w-xl mx-auto px-4 py-4 space-y-4 mt-auto w-full">

        {/* Phase: Clue */}
        <Detective>
          有一份文件送到了偵探社。裡面藏著破案的關鍵線索。<br/>
          <span className="text-cyan-600 dark:text-cyan-400 text-sm">👆 點選題目中你覺得可疑的地方</span>
        </Detective>

        {clueOrder.map((idx, order) => {
          const clue = question.clues[idx];
          return (
            <div key={`clue-${idx}`} className="space-y-3">
              <Student>我覺得「{clue.text}」很可疑。</Student>
              <TypedDetective delay="medium">
                {order % 2 === 0 ? '有道理。' : '說得沒錯。'}
                <span className="font-medium text-amber-700 dark:text-amber-300">「{clue.text}」</span>
                {' — '}{clue.why}
              </TypedDetective>
            </div>
          );
        })}

        {phase === 'clue' && clueLocked && foundClues.size < totalClues && (
          <Detective>調查機會用完了。帶著目前的線索繼續推理吧。</Detective>
        )}
        {phase === 'clue' && (allCriticalFound || clueLocked) && (
          <ActionBtn onClick={enterReasoning}>
            {allCriticalFound ? '🔎 關鍵線索到手，開始推理' : '帶著現有線索繼續 →'}
          </ActionBtn>
        )}
        {phase === 'clue' && foundClues.size > 0 && !allCriticalFound && !clueLocked && (
          <Detective><span className="text-sm text-slate-400 dark:text-white/35">還有關鍵線索沒找到，繼續調查吧。</span></Detective>
        )}

        {/* Phase: Reasoning */}
        {(phase === 'reasoning' || phase === 'answer' || phase === 'solution') && reasoningClues.length > 0 && (
          <>
            <Detective>好，根據你找到的線索，我有幾個問題要確認。</Detective>
            {reasoningClues.slice(0, phase === 'reasoning' ? reasoningStep + 1 : reasoningClues.length).map((rc, i) => {
              const r = rc.reasoning!;
              const isActive = phase === 'reasoning' && i === reasoningStep;
              const isCompleted = i < reasoningStep || phase !== 'reasoning';
              return (
                <div key={`r-${rc.idx}`} className="space-y-3">
                  <Detective>{r.prompt}</Detective>
                  {isActive && reasoningMode === 'choosing' && (
                    <div className="flex flex-col gap-2 my-2 pl-10">
                      {r.choices.map((choice, ci) => (
                        <button key={ci} onClick={() => onReasoningChoice(ci)} className="text-left px-4 py-2 rounded-xl text-base border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-cyan-400 dark:hover:border-cyan-500/40 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 transition-all">{choice}</button>
                      ))}
                    </div>
                  )}
                  {isActive && reasoningMode === 'choosing' && reasoningWrong && (
                    <TypedDetective delay="short"><span className="text-red-500 dark:text-red-400">不太對。</span>{r.wrong}</TypedDetective>
                  )}
                  {isActive && reasoningMode === 'pointing' && (
                    <>
                      <Student>我認為是「{r.choices[r.answerIndex]}」</Student>
                      <TypedDetective delay="medium">
                        <span className="text-emerald-600 dark:text-emerald-400">✓</span> 方向正確！那麼，<span className="font-medium text-amber-700 dark:text-amber-300">請指出題目中支持這個結論的證據</span>。
                      </TypedDetective>
                      {evidenceWrongMsg && <TypedDetective delay="short"><span className="text-red-500 dark:text-red-400">✗</span> {evidenceWrongMsg}</TypedDetective>}
                    </>
                  )}
                  {isCompleted && (
                    <>
                      <Student>我認為是「{r.choices[r.answerIndex]}」</Student>
                      <Detective><span className="text-emerald-600 dark:text-emerald-400">✓</span> 方向正確！請指出證據。</Detective>
                      <Student>我指認「<span className="font-medium text-amber-700 dark:text-amber-300">{rc.text}</span>」作為證據。</Student>
                      <Detective><span className="text-emerald-600 dark:text-emerald-400">✓ 指證成功！</span>{r.correct}</Detective>
                    </>
                  )}
                </div>
              );
            })}
            {reasoningDone && (
              <TypedDetective delay="long"><span className="text-emerald-600 dark:text-emerald-400 font-medium">推理完成！</span><br/>真相只有一個——指認你的答案吧。</TypedDetective>
            )}
          </>
        )}
        {phase === 'reasoning' && reasoningClues.length === 0 && (
          <>{(() => { setTimeout(() => setPhase('answer'), 500); return null; })()}</>
        )}

        {/* Phase: Answer */}
        {phase === 'answer' && !answeredCorrectly && (
          <>
            <Detective>真相只有一個——指認你的答案吧。</Detective>
            <div className="grid grid-cols-1 gap-1.5 my-2">
              {question.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const wasWrong = wrongAttempts.includes(letter);
                return (
                  <button key={i} onClick={() => !wasWrong && onSelectAnswer(letter)} disabled={wasWrong}
                    className={`text-left px-3 py-2 rounded-lg text-base transition-all flex items-center gap-2 ${wasWrong ? 'bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-300 dark:text-red-500/40 line-through' : 'bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 hover:border-cyan-400 dark:hover:border-cyan-500/40 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 cursor-pointer'}`}>
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${wasWrong ? 'bg-red-200 dark:bg-red-500/20 text-red-400' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/50'}`}>{letter}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
        {phase === 'answer' && wrongAttempts.map((wa, i) => (
          <div key={`wa-${i}`} className="space-y-3">
            <Student>我選 ({wa})！</Student>
            <TypedDetective delay="short"><span className="text-red-500 dark:text-red-400">不對。</span>({wa}) 不是正確答案。再看看線索，想想你剛才的推理。</TypedDetective>
          </div>
        ))}
        {answeredCorrectly && (
          <>
            <Student>我選 ({question.answer})！</Student>
            <TypedDetective delay="long"><span className="text-emerald-600 dark:text-emerald-400 font-medium">🎉 破案了！</span> ({question.answer}) 完全正確。</TypedDetective>
          </>
        )}

        {/* Phase: Solution */}
        {phase === 'solution' && (
          <>
            <Detective>
              這題考的是：
              <span className="inline-block mt-2 px-2.5 py-0.5 text-sm rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-medium">{question.concept.unit}</span>
            </Detective>
            <Detective>{question.concept.brief}</Detective>
            {question.questions.length > 0 && (
              <Detective>
                <span className="text-sm text-slate-400 dark:text-white/35">💡 延伸思考：</span><br/>
                {question.questions.map((q, i) => <span key={i} className="block mt-1">{q.prompt}</span>)}
              </Detective>
            )}
            <Detective>
              <span className="font-medium text-sm text-violet-600 dark:text-violet-400">📋 完整推理：</span>
              <ol className="space-y-1.5 mt-1">
                {question.solution.steps.map((step, i) => <li key={i} className="flex gap-2"><span className="text-violet-600 dark:text-violet-400 font-bold text-sm mt-0.5">{i + 1}.</span><span>{step}</span></li>)}
              </ol>
            </Detective>
            {question.solution.commonMistakes?.length ? (
              <Detective>
                <span className="text-red-600 dark:text-red-400 font-medium text-sm">⚠️ 常見錯誤：</span>
                <ul className="mt-1 space-y-1">{question.solution.commonMistakes.map((m, i) => <li key={i} className="text-sm text-slate-500 dark:text-white/40">• {m}</li>)}</ul>
              </Detective>
            ) : null}
            {foundClues.size < totalClues && (
              <Detective>
                <span className="text-amber-600 dark:text-amber-400 font-medium text-sm">🔍 你漏掉的線索：</span>
                <ul className="mt-1 space-y-1">{question.clues.map((c, i) => foundClues.has(i) ? null : <li key={i} className="text-sm text-slate-500 dark:text-white/40">•「{c.text}」— {c.why}</li>)}</ul>
              </Detective>
            )}
            <div className="rounded-xl p-4 flex items-center gap-4 text-sm bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/20 my-2">
              <div className="text-center"><div className="text-xl font-bold text-amber-600 dark:text-amber-400">{foundClues.size}<span className="text-slate-400 dark:text-white/30 text-sm font-normal">/{totalClues}</span></div><div className="text-slate-400 dark:text-white/30">線索</div></div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
              <div className="text-center"><div className="text-xl font-bold text-red-500 dark:text-red-400">{livesLost}</div><div className="text-slate-400 dark:text-white/30">失誤</div></div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
              <div className="text-center"><div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{wrongAttempts.length}</div><div className="text-slate-400 dark:text-white/30">錯答</div></div>
              <div className="flex-1 text-right">
                {foundClues.size === totalClues && livesLost === 0 && wrongAttempts.length === 0
                  ? <span className="text-amber-600 dark:text-amber-300 font-medium">完美偵探 🏆</span>
                  : foundClues.size >= totalClues * 0.75 ? <span className="text-emerald-600 dark:text-emerald-300 font-medium">觀察敏銳</span>
                  : <span className="text-slate-400 dark:text-white/40">下次再仔細看看</span>}
              </div>
            </div>
          </>
        )}

        <div ref={chatEndRef} />
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-amber-200/30 dark:border-white/10 px-4 py-3 flex items-center justify-between" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <span className="text-xs text-slate-300 dark:text-white/20">{question.tags.slice(0, 3).map(t => `#${t}`).join(' ')}</span>
        {phase === 'solution' && <button onClick={onBack} className="text-sm text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/70">回到題庫</button>}
      </footer>
    </div>
  );
}
