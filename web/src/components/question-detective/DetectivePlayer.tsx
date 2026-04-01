'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { DetectiveQuestion, Clue } from './types';

// ── Constants ──
const MAX_MISSES = 3;
const HIT_MSGS = ['好眼力！', '關鍵線索！', '就是這個！', '偵探直覺很準！'];
const MISS_MSGS = ['這個不太關鍵，再看看別的。', '不是這個，再想想。', '這裡沒什麼線索。'];
function pick(arr: string[]) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Types ──
type Phase = 'clue' | 'question' | 'concept' | 'solution';
type Bubble = { from: 'detective' | 'student' | 'system'; text: string; key: string; };

interface Props { question: DetectiveQuestion; onBack: () => void; }

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

// ── Component ──
export function DetectivePlayer({ question, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('clue');
  const [foundClues, setFoundClues] = useState<Set<number>>(new Set());
  const [missCount, setMissCount] = useState(0);
  const [expandedClue, setExpandedClue] = useState<number | null>(null);
  const [revealedQuestions, setRevealedQuestions] = useState(0);
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [showingOptions, setShowingOptions] = useState(false); // show options during question phase
  const [wrongAttempts, setWrongAttempts] = useState<string[]>([]); // wrong answers tried
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [stemOpen, setStemOpen] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const clueLocked = missCount >= MAX_MISSES;
  const totalClues = question.clues.length;

  // Build segments
  const cluesWithIdx = useMemo(() => question.clues.map((c, i) => ({ ...c, idx: i })), [question.clues]);
  const stemSegs = useMemo(() => buildSegs(question.stem, cluesWithIdx.filter(c => c.startIndex >= 0)), [question.stem, cluesWithIdx]);
  const figureClues = useMemo(() => cluesWithIdx.filter(c => c.startIndex === -1), [cluesWithIdx]);
  const figureSegs = useMemo(() => {
    if (!question.figure || !figureClues.length) return null;
    const matches = figureClues.map(fc => ({ start: question.figure!.indexOf(fc.text), end: question.figure!.indexOf(fc.text) + fc.text.length, clueIdx: fc.idx })).filter(m => m.start >= 0).sort((a, b) => a.start - b.start);
    if (!matches.length) return null;
    const segs: Seg[] = [];
    let cur = 0;
    matches.forEach(m => {
      if (m.start > cur) segs.push({ text: question.figure!.slice(cur, m.start), clueIndex: null });
      segs.push({ text: question.figure!.slice(m.start, m.end), clueIndex: m.clueIdx });
      cur = m.end;
    });
    if (cur < question.figure!.length) segs.push({ text: question.figure!.slice(cur), clueIndex: null });
    return segs;
  }, [question.figure, figureClues]);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [phase, foundClues.size, revealedQuestions, revealedHints.size, showingOptions, wrongAttempts.length, answeredCorrectly]);

  // ── Handlers ──
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 1200); return () => clearTimeout(t); }, [toast]);

  const onClueHit = useCallback((idx: number) => {
    if (clueLocked || foundClues.has(idx)) return;
    setFoundClues(prev => new Set(prev).add(idx));
    setExpandedClue(idx);
    setToast(pick(HIT_MSGS));
  }, [clueLocked, foundClues]);

  const onClueMiss = useCallback(() => {
    if (clueLocked) return;
    setMissCount(prev => prev + 1);
    setToast(pick(MISS_MSGS));
  }, [clueLocked]);

  const onSegTap = useCallback((seg: Seg) => {
    if (seg.clueIndex !== null) onClueHit(seg.clueIndex);
    else onClueMiss();
  }, [onClueHit, onClueMiss]);

  const advanceToQuestions = useCallback(() => {
    setPhase('question');
    setRevealedQuestions(1);
  }, []);

  const tryAnswer = useCallback(() => {
    setShowingOptions(true);
  }, []);

  const onSelectOption = useCallback((letter: string) => {
    if (letter === question.answer) {
      setAnsweredCorrectly(true);
      setShowingOptions(false);
      // Short delay then advance to concept
      setTimeout(() => setPhase('concept'), 600);
    } else {
      setWrongAttempts(prev => [...prev, letter]);
      setShowingOptions(false);
      // Advance to next question if available
      if (revealedQuestions < question.questions.length) {
        setRevealedQuestions(prev => prev + 1);
      } else {
        // All questions exhausted, force to concept
        setTimeout(() => setPhase('concept'), 600);
      }
    }
  }, [question.answer, question.questions.length, revealedQuestions]);

  const advanceToSolution = useCallback(() => {
    setPhase('solution');
  }, []);

  // ── Render helpers ──
  const Detective = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-2.5 items-start max-w-[85%]">
      <span className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/40 flex items-center justify-center text-sm shrink-0 border border-cyan-200 dark:border-cyan-800/40">🕵️</span>
      <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-sm text-slate-700 dark:text-white/80 leading-relaxed">
        {children}
      </div>
    </div>
  );

  const Student = ({ children }: { children: React.ReactNode }) => (
    <div className="flex gap-2.5 items-start max-w-[85%] ml-auto flex-row-reverse">
      <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-sm shrink-0 border border-amber-200 dark:border-amber-800/30">🧑‍🎓</span>
      <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/30 text-sm text-slate-700 dark:text-white/80 leading-relaxed">
        {children}
      </div>
    </div>
  );

  const ActionBtn = ({ onClick, children, variant = 'primary' }: { onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'secondary' }) => (
    <div className="flex justify-center my-2">
      <button onClick={onClick} className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
        variant === 'primary'
          ? 'bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm'
          : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-300 dark:hover:bg-white/15'
      }`}>
        {children}
      </button>
    </div>
  );

  const clsFound = 'bg-amber-100 dark:bg-amber-500/20 border-b border-amber-400 dark:border-amber-400/40';
  const clsFoundPassive = 'bg-amber-50 dark:bg-amber-500/10 border-b border-amber-300 dark:border-amber-400/30';

  const renderInteractiveSegs = (segs: Seg[], isFigure: boolean) => segs.map((seg, i) => {
    const isFound = seg.clueIndex !== null && foundClues.has(seg.clueIndex);
    return (
      <span key={i}
        onClick={() => seg.clueIndex !== null ? (isFigure ? onClueHit(seg.clueIndex) : onSegTap(seg)) : onSegTap(seg)}
        className={`cursor-pointer transition-all duration-200 ${isFound ? clsFound : 'active:bg-slate-200 dark:active:bg-white/10'}`}
      >{seg.text}</span>
    );
  });

  const renderPassiveSegs = (segs: Seg[]) => segs.map((seg, i) => {
    const isFound = seg.clueIndex !== null && foundClues.has(seg.clueIndex);
    return <span key={i} className={isFound ? clsFoundPassive : ''}>{seg.text}</span>;
  });

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#050510] text-slate-800 dark:text-white flex flex-col transition-colors duration-300">
      {/* ── Header ── */}
      <header className="shrink-0 border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 transition-colors text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          返回
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs text-slate-400 dark:text-white/40">{question.source}</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map(d => <span key={d} className={`w-2 h-2 rounded-full ${d <= question.difficulty ? 'bg-amber-400' : 'bg-slate-200 dark:bg-white/15'}`} />)}
        </div>
      </header>

      {/* ── Sticky stem card — centered, compact ── */}
      <div className="shrink-0 sticky top-0 z-10 border-b border-slate-200 dark:border-white/10 bg-white/95 dark:bg-[#050510]/95 backdrop-blur-sm">
        <div className="max-w-xl mx-auto">
          <button onClick={() => setStemOpen(!stemOpen)} className="w-full px-4 py-2 flex items-center gap-2 text-left">
            <span className="text-xs font-medium text-slate-400 dark:text-white/40">📄 題目</span>
            {phase === 'clue' && (
              <span className="text-[10px] text-slate-400 dark:text-white/30 ml-2">線索 {foundClues.size}/{totalClues}</span>
            )}
            <span className="flex gap-0.5 ml-auto">
              {phase === 'clue' && Array.from({ length: MAX_MISSES }).map((_, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${i < missCount ? 'bg-red-400' : 'bg-slate-200 dark:bg-white/15'}`} />
              ))}
            </span>
            <svg className={`w-3.5 h-3.5 text-slate-400 dark:text-white/30 transition-transform ${stemOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {stemOpen && (
            <div className="px-4 pb-3 space-y-2">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-white/85 whitespace-pre-line">
                {phase === 'clue' && !clueLocked ? renderInteractiveSegs(stemSegs, false) : renderPassiveSegs(stemSegs)}
              </p>
              {(question.figureImage || question.figure) && (
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-white/[0.08] text-xs">
                  {question.figureImage && <img src={question.figureImage} alt="附圖" className="w-full" />}
                  {question.figure && (
                    <div className="px-3 py-2 bg-slate-50 dark:bg-white/[0.02] flex items-start gap-2">
                      <span className="text-slate-300 dark:text-white/20 shrink-0">🖼</span>
                      <p className="text-slate-500 dark:text-white/45 leading-relaxed">
                        {phase === 'clue' && !clueLocked && figureSegs ? renderInteractiveSegs(figureSegs, true) : (figureSegs ? renderPassiveSegs(figureSegs) : question.figure)}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-full text-sm font-medium shadow-lg bg-amber-100 dark:bg-amber-500/90 text-amber-800 dark:text-black border border-amber-300 dark:border-transparent animate-bounce">
            {toast}
          </div>
        </div>
      )}

      {/* ── Chat area ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-xl mx-auto w-full">
        {/* ── Phase: Clue ── */}
        <Detective>看看這道題，有些關鍵字藏在題幹和附圖裡。<br/>點選你覺得可疑的地方，只有 {MAX_MISSES} 次失誤機會。</Detective>

        {/* Found clues appear as conversation */}
        {question.clues.map((clue, i) => {
          if (!foundClues.has(i)) return null;
          return (
            <div key={`clue-${i}`} className="space-y-3">
              <Student>我覺得「{clue.text}」很可疑。</Student>
              <Detective>
                <span className="font-medium text-amber-700 dark:text-amber-300">「{clue.text}」</span>
                <span className="mx-1">—</span>
                {clue.why}
              </Detective>
            </div>
          );
        })}

        {/* Locked message */}
        {phase === 'clue' && clueLocked && foundClues.size < totalClues && (
          <Detective>調查次數用完了。沒關係，帶著目前的線索繼續推理吧。</Detective>
        )}

        {/* Advance to questions */}
        {phase === 'clue' && (foundClues.size > 0 || clueLocked) && (
          <ActionBtn onClick={advanceToQuestions}>
            {foundClues.size >= totalClues ? '線索收集完畢，開始推理 →' : '帶著現有線索繼續 →'}
          </ActionBtn>
        )}

        {/* ── Phase: Questions ── */}
        {phase === 'question' && (
          <>
            <Detective>好，根據你找到的線索，我有幾個問題想問你。</Detective>
            {question.questions.slice(0, revealedQuestions).map((q, i) => {
              // Was this question followed by a wrong answer attempt?
              const wrongAfterThis = wrongAttempts[i];
              const isLatest = i === revealedQuestions - 1;

              return (
                <div key={`q-${i}`} className="space-y-3">
                  <Detective>{q.prompt}</Detective>

                  {/* Show hint if revealed */}
                  {revealedHints.has(i) && (
                    <>
                      <Student>我不太確定...</Student>
                      <Detective>{q.hint}</Detective>
                    </>
                  )}

                  {/* Action buttons — only for the latest question, before answering */}
                  {isLatest && !showingOptions && !wrongAfterThis && (
                    <div className="flex justify-center gap-3 my-2">
                      {!revealedHints.has(i) && (
                        <button onClick={() => setRevealedHints(prev => new Set(prev).add(i))}
                          className="px-4 py-2 rounded-full text-xs bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/50 hover:bg-slate-300 dark:hover:bg-white/15 transition-all">
                          卡住了，給我提示
                        </button>
                      )}
                      <button onClick={tryAnswer}
                        className="px-5 py-2 rounded-full text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-500 shadow-sm transition-all flex items-center gap-1.5">
                        🔎 我知道了，真相只有一個
                      </button>
                    </div>
                  )}

                  {/* ABCD letter buttons */}
                  {isLatest && showingOptions && (
                    <div className="flex justify-center gap-3 my-3">
                      {question.options?.map((_, oi) => {
                        const letter = String.fromCharCode(65 + oi);
                        const wasWrong = wrongAttempts.includes(letter);
                        return (
                          <button key={oi} onClick={() => !wasWrong && onSelectOption(letter)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                              wasWrong
                                ? 'bg-red-100 dark:bg-red-500/15 text-red-300 dark:text-red-500/40 border border-red-200 dark:border-red-500/20 cursor-not-allowed line-through'
                                : 'bg-white dark:bg-white/10 text-slate-700 dark:text-white/80 border-2 border-slate-300 dark:border-white/20 hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:text-cyan-700 dark:hover:text-cyan-300 shadow-sm'
                            }`}
                            disabled={wasWrong}
                          >
                            {letter}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Wrong answer feedback */}
                  {wrongAfterThis && (
                    <>
                      <Student>我選 ({wrongAfterThis})！</Student>
                      <Detective>
                        不對喔，({wrongAfterThis}) 不是正確答案。
                        {i < question.questions.length - 1
                          ? '別急，再想想看。我再問你一個問題。'
                          : '線索都在了，讓我們來看看正確的推理。'}
                      </Detective>
                    </>
                  )}
                </div>
              );
            })}

            {/* Correct answer celebration */}
            {answeredCorrectly && (
              <>
                <Student>我選 ({question.answer})！</Student>
                <Detective>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">正確！🎉</span> 你的推理很到位。讓我們看看完整的概念。
                </Detective>
              </>
            )}
          </>
        )}

        {/* ── Phase: Concept ── */}
        {phase === 'concept' && (
          <>
            <Detective>
              推理得不錯。這題考的是：
              <span className="inline-block mt-2 px-2.5 py-0.5 text-xs rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-medium">
                {question.concept.unit}
              </span>
            </Detective>
            <Detective>{question.concept.brief}</Detective>
            {question.concept.fieldNote && (
              <Detective>
                <span className="text-slate-400 dark:text-white/35 text-xs">📍 田野筆記：</span><br/>
                <span className="text-xs text-slate-500 dark:text-white/45">{question.concept.fieldNote}</span>
              </Detective>
            )}
            <ActionBtn onClick={advanceToSolution}>看答案和完整解析 →</ActionBtn>
          </>
        )}

        {/* ── Phase: Solution ── */}
        {phase === 'solution' && (
          <>
            <Detective>
              答案是 <span className="font-bold text-emerald-700 dark:text-emerald-300">({question.answer})</span>。來看完整推理：
            </Detective>

            {/* Steps */}
            <Detective>
              <ol className="space-y-1.5 mt-1">
                {question.solution.steps.map((step, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-violet-600 dark:text-violet-400 font-bold text-xs mt-0.5">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </Detective>

            {/* Common mistakes */}
            {question.solution.commonMistakes?.length ? (
              <Detective>
                <span className="text-red-600 dark:text-red-400 font-medium text-xs">⚠️ 常見錯誤：</span>
                <ul className="mt-1 space-y-1">
                  {question.solution.commonMistakes.map((m, i) => (
                    <li key={i} className="text-xs text-slate-500 dark:text-white/40 leading-relaxed">• {m}</li>
                  ))}
                </ul>
              </Detective>
            ) : null}

            {/* Missed clues */}
            {foundClues.size < totalClues && (
              <Detective>
                <span className="text-amber-600 dark:text-amber-400 font-medium text-xs">你漏掉的線索：</span>
                <ul className="mt-1 space-y-1">
                  {question.clues.map((c, i) => {
                    if (foundClues.has(i)) return null;
                    return <li key={i} className="text-xs text-slate-500 dark:text-white/40">•「{c.text}」— {c.why}</li>;
                  })}
                </ul>
              </Detective>
            )}

            {/* Summary */}
            <div className="rounded-xl p-4 flex items-center gap-4 text-xs bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/20 my-2">
              <div className="text-center">
                <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{foundClues.size}<span className="text-slate-400 dark:text-white/30 text-xs font-normal">/{totalClues}</span></div>
                <div className="text-slate-400 dark:text-white/30">線索</div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
              <div className="text-center">
                <div className="text-lg font-bold text-red-500 dark:text-red-400">{missCount}</div>
                <div className="text-slate-400 dark:text-white/30">失誤</div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{revealedHints.size}</div>
                <div className="text-slate-400 dark:text-white/30">提示</div>
              </div>
              <div className="flex-1 text-right">
                {foundClues.size === totalClues && missCount === 0
                  ? <span className="text-amber-600 dark:text-amber-300 font-medium">完美偵探 🏆</span>
                  : foundClues.size >= totalClues * 0.75
                    ? <span className="text-emerald-600 dark:text-emerald-300 font-medium">觀察敏銳</span>
                    : <span className="text-slate-400 dark:text-white/40">下次再仔細看看</span>
                }
              </div>
            </div>
          </>
        )}

        <div ref={chatEndRef} />
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 border-t border-slate-200 dark:border-white/10 px-4 py-3 bg-white dark:bg-transparent flex items-center justify-between" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <span className="text-[10px] text-slate-300 dark:text-white/20">
          {question.tags.slice(0, 3).map(t => `#${t}`).join(' ')}
        </span>
        {phase === 'solution' && (
          <button onClick={onBack} className="text-xs text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/70 transition-colors">
            回到題庫
          </button>
        )}
      </footer>
    </div>
  );
}
