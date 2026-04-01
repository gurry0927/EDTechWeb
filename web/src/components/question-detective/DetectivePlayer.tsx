'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { DetectiveQuestion, Clue } from './types';

type Stage = 0 | 1 | 2 | 3 | 4;

interface Props {
  question: DetectiveQuestion;
  onBack: () => void;
}

const STAGE_INTROS = [
  '先把題目讀完，不急著選答案。注意題目在問什麼、給了什麼條件。',
  '現在你是偵探。掃描題目和圖片，把你覺得「有問題」的地方點出來。小心，只有 3 次失誤機會。',
  '手上有線索了。現在一步一步推 — 每個問題都不需要你知道答案，只需要你想一想。',
  '推理完畢。看看這題到底在考哪個概念，跟課本哪個單元有關。',
  '結案。回顧整個推理過程，看看你遺漏了什麼。',
];
const HIT_MESSAGES = ['好眼力！', '關鍵線索！', '就是這個！', '偵探直覺很準！', '重要發現！'];
const MISS_MESSAGES = ['不是這個，再看看', '這個不太關鍵', '再想想別的'];
const MAX_MISSES = 3;

function pickRandom(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface Segment { text: string; clueIndex: number | null; }

function buildSegments(stem: string, clues: Clue[]): Segment[] {
  const valid = clues.map((c, i) => ({ ...c, idx: i })).filter(c => c.startIndex >= 0).sort((a, b) => a.startIndex - b.startIndex);
  if (valid.length === 0) return stem.split(/(?<=[。，；：、？！）」])/).filter(Boolean).map(text => ({ text, clueIndex: null }));
  const segs: Segment[] = [];
  let cursor = 0;
  valid.forEach(c => {
    if (c.startIndex > cursor) stem.slice(cursor, c.startIndex).split(/(?<=[。，；：、？！）」])/).filter(Boolean).forEach(text => segs.push({ text, clueIndex: null }));
    segs.push({ text: stem.slice(c.startIndex, c.startIndex + c.length), clueIndex: c.idx });
    cursor = c.startIndex + c.length;
  });
  if (cursor < stem.length) stem.slice(cursor).split(/(?<=[。，；：、？！）」])/).filter(Boolean).forEach(text => segs.push({ text, clueIndex: null }));
  return segs;
}

export function DetectivePlayer({ question, onBack }: Props) {
  const [stage, setStage] = useState<Stage>(0);
  const [foundClues, setFoundClues] = useState<Set<number>>(new Set());
  const [expandedClue, setExpandedClue] = useState<number | null>(null);
  const [missCount, setMissCount] = useState(0);
  const [toast, setToast] = useState<{ text: string; type: 'hit' | 'miss' } | null>(null);
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const clueLocked = missCount >= MAX_MISSES;

  const figureClues = useMemo(() => question.clues.map((c, i) => ({ ...c, idx: i })).filter(c => c.startIndex === -1), [question.clues]);
  const stemSegments = useMemo(() => buildSegments(question.stem, question.clues), [question.stem, question.clues]);
  const figureSegments = useMemo(() => {
    if (!question.figure || figureClues.length === 0) return null;
    const fig = question.figure;
    const matches: { start: number; end: number; clueIdx: number }[] = [];
    figureClues.forEach(fc => { const pos = fig.indexOf(fc.text); if (pos >= 0) matches.push({ start: pos, end: pos + fc.text.length, clueIdx: fc.idx }); });
    matches.sort((a, b) => a.start - b.start);
    if (matches.length === 0) return null;
    const segs: Segment[] = [];
    let cursor = 0;
    matches.forEach(m => {
      if (m.start > cursor) fig.slice(cursor, m.start).split(/(?<=[。，；：、？！）」])/).filter(Boolean).forEach(text => segs.push({ text, clueIndex: null }));
      segs.push({ text: fig.slice(m.start, m.end), clueIndex: m.clueIdx });
      cursor = m.end;
    });
    if (cursor < fig.length) fig.slice(cursor).split(/(?<=[。，；：、？！）」])/).filter(Boolean).forEach(text => segs.push({ text, clueIndex: null }));
    return segs;
  }, [question.figure, figureClues]);
  const totalClues = question.clues.length;

  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 1200); return () => clearTimeout(t); }, [toast]);

  const showToast = useCallback((text: string, type: 'hit' | 'miss') => setToast({ text, type }), []);

  const handleSegmentTap = useCallback((seg: Segment) => {
    if (clueLocked) return;
    if (seg.clueIndex !== null) {
      if (foundClues.has(seg.clueIndex)) return;
      setFoundClues(prev => new Set(prev).add(seg.clueIndex!));
      setExpandedClue(seg.clueIndex);
      showToast(pickRandom(HIT_MESSAGES), 'hit');
    } else {
      setMissCount(prev => prev + 1);
      showToast(pickRandom(MISS_MESSAGES), 'miss');
    }
  }, [clueLocked, foundClues, showToast]);

  const handleFigureClueTap = useCallback((clueIdx: number) => {
    if (clueLocked || foundClues.has(clueIdx)) return;
    setFoundClues(prev => new Set(prev).add(clueIdx));
    setExpandedClue(clueIdx);
    showToast(pickRandom(HIT_MESSAGES), 'hit');
  }, [clueLocked, foundClues, showToast]);

  const toggleHint = useCallback((i: number) => {
    setRevealedHints(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });
  }, []);

  const stageLabels = ['閱讀', '線索', '推理', '概念', '解析'];
  const stageIcons = ['📖', '🔍', '💭', '🎯', '✅'];

  const clsFound = 'bg-amber-100 dark:bg-amber-500/20 border-b border-amber-400 dark:border-amber-400/40';
  const clsFoundPassive = 'bg-amber-50 dark:bg-amber-500/15 border-b border-amber-300 dark:border-amber-400/30 rounded-sm px-px';

  // Render interactive text segments (for both stem and figure)
  const renderInteractiveText = (segments: Segment[], isFigure: boolean) => (
    segments.map((seg, i) => {
      const isFound = seg.clueIndex !== null && foundClues.has(seg.clueIndex);
      return (
        <span
          key={i}
          onClick={() => seg.clueIndex !== null
            ? (isFigure ? handleFigureClueTap(seg.clueIndex) : handleSegmentTap(seg))
            : handleSegmentTap(seg)
          }
          className={`cursor-pointer transition-all duration-300 rounded-sm px-px ${isFound ? clsFound : 'active:bg-slate-200 dark:active:bg-white/10'}`}
        >
          {seg.text}
        </span>
      );
    })
  );

  const renderPassiveText = (segments: Segment[]) => (
    segments.map((seg, i) => {
      const isFound = seg.clueIndex !== null && foundClues.has(seg.clueIndex);
      return <span key={i} className={isFound ? clsFoundPassive : ''}>{seg.text}</span>;
    })
  );

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-[#050510] text-slate-800 dark:text-white flex flex-col transition-colors duration-300">
      {/* ── Header ── */}
      <header className="shrink-0 border-b border-slate-200 dark:border-white/10 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 transition-colors text-sm flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs text-slate-400 dark:text-white/40">{question.source}</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map(d => (
            <span key={d} className={`w-2 h-2 rounded-full ${d <= question.difficulty ? 'bg-amber-400' : 'bg-slate-200 dark:bg-white/15'}`} />
          ))}
        </div>
      </header>

      {/* ── Stage progress ── */}
      <div className="shrink-0 px-4 py-2.5 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-0 max-w-md mx-auto">
          {stageLabels.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <button onClick={() => setStage(i as Stage)} className={`flex flex-col items-center gap-1 w-full transition-all ${i === stage ? 'scale-105' : ''}`}>
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                  i < stage ? 'bg-cyan-100 dark:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40'
                  : i === stage ? 'bg-cyan-600 text-white border-2 border-cyan-500 dark:border-cyan-400 shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/25 border border-slate-200 dark:border-white/10'
                }`}>
                  {i < stage ? '✓' : stageIcons[i]}
                </span>
                <span className={`text-[10px] ${i <= stage ? 'text-slate-600 dark:text-white/60' : 'text-slate-300 dark:text-white/20'}`}>{label}</span>
              </button>
              {i < stageLabels.length - 1 && (
                <div className={`h-px flex-1 mx-1 mt-[-14px] ${i < stage ? 'bg-cyan-400 dark:bg-cyan-500/40' : 'bg-slate-200 dark:bg-white/8'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Narrative ── */}
      <div className="px-5 pt-4 pb-2 max-w-2xl mx-auto w-full">
        <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/10 border border-cyan-200 dark:border-cyan-800/30">
          <span className="text-sm shrink-0 mt-0.5">🕵️</span>
          <p className="text-sm text-cyan-800 dark:text-cyan-200/70 leading-relaxed">{STAGE_INTROS[stage]}</p>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className={`px-4 py-2 rounded-full text-sm font-medium shadow-lg ${
            toast.type === 'hit' ? 'bg-amber-500/90 text-black' : 'bg-slate-200 dark:bg-white/15 text-slate-600 dark:text-white/70'
          }`}>{toast.text}</div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-5 max-w-2xl mx-auto w-full">
        {/* 題目 */}
        <section className="space-y-4">
          <div className="space-y-3 p-4 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08]">
            {stage === 1 && !clueLocked ? (
              <p className="text-base leading-relaxed text-slate-800 dark:text-white/90">
                {renderInteractiveText(stemSegments, false)}
              </p>
            ) : (
              <p className="text-base leading-relaxed text-slate-800 dark:text-white/90">
                {stage > 1 ? renderPassiveText(stemSegments) : question.stem}
              </p>
            )}

            {(question.figureImage || question.figure) && (
              <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 dark:border-white/[0.08]">
                {question.figureImage && <img src={question.figureImage} alt="題目附圖" className="w-full" />}
                {question.figure && (
                  <div className="px-4 py-3 flex items-start gap-3 bg-slate-50 dark:bg-white/[0.02]">
                    <span className="text-slate-300 dark:text-white/25 text-lg shrink-0 mt-0.5">🖼</span>
                    {stage === 1 && !clueLocked && figureSegments ? (
                      <p className="text-sm leading-relaxed text-slate-500 dark:text-white/45">
                        {renderInteractiveText(figureSegments, true)}
                      </p>
                    ) : (
                      <p className="text-sm leading-relaxed text-slate-500 dark:text-white/45">
                        {stage > 1 && figureSegments ? renderPassiveText(figureSegments) : question.figure}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Options — only stage 0 and 4 */}
          {question.options && (stage === 0 || stage === 4) && (
            <div className="space-y-2">
              {question.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = selectedOption === letter;
                const isCorrect = showAnswer && letter === question.answer;
                const isWrong = showAnswer && isSelected && letter !== question.answer;
                return (
                  <button key={i} onClick={() => !showAnswer && setSelectedOption(letter)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${
                      isCorrect ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : isWrong ? 'border-red-400 bg-red-50 dark:bg-red-500/15 text-red-700 dark:text-red-300'
                      : isSelected ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
                      : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-white/70 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCorrect ? 'bg-emerald-200 dark:bg-emerald-500/30' : isWrong ? 'bg-red-200 dark:bg-red-500/30' : isSelected ? 'bg-cyan-200 dark:bg-cyan-500/20' : 'bg-slate-100 dark:bg-white/8'
                    }`}>{letter}</span>
                    <span className="text-sm">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Stage 1: 線索 ── */}
        {stage >= 1 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">🔍 調查筆記</h3>
              <div className="flex items-center gap-3">
                {stage === 1 && (
                  <span className="flex items-center gap-1">
                    {Array.from({ length: MAX_MISSES }).map((_, i) => (
                      <span key={i} className={`inline-block w-2.5 h-2.5 rounded-full transition-all ${i < missCount ? 'bg-red-400' : 'bg-slate-200 dark:bg-white/15'}`} />
                    ))}
                  </span>
                )}
                <span className="text-xs text-slate-400 dark:text-white/40">{foundClues.size}/{totalClues}</span>
              </div>
            </div>

            {stage === 1 && clueLocked && foundClues.size < totalClues && (
              <div className="rounded-lg px-4 py-3 text-sm text-red-700 dark:text-white/50 bg-red-50 dark:bg-red-500/[0.08] border border-red-200 dark:border-red-500/15">
                調查次數用完了。帶著目前找到的線索繼續推理吧。
              </div>
            )}

            {foundClues.size > 0 && (
              <div className="space-y-2">
                {question.clues.map((clue, i) => {
                  if (!foundClues.has(i)) return null;
                  const isExpanded = expandedClue === i;
                  return (
                    <div key={i} className="rounded-lg border border-amber-300 dark:border-amber-500/20 overflow-hidden bg-amber-50 dark:bg-amber-500/[0.04]">
                      <button onClick={() => setExpandedClue(isExpanded ? null : i)}
                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-amber-100/50 dark:hover:bg-white/3 transition-colors">
                        <span className="w-6 h-6 rounded-full bg-amber-200 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                        <span className="text-sm text-amber-800 dark:text-amber-200 font-medium">「{clue.text}」</span>
                        <svg className={`w-4 h-4 text-slate-400 dark:text-white/30 ml-auto transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="px-4 pb-3 text-sm text-slate-600 dark:text-white/55 leading-relaxed border-t border-amber-200 dark:border-amber-500/10 pt-2 ml-9">{clue.why}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {stage === 1 && foundClues.size === 0 && !clueLocked && (
              <p className="text-xs text-slate-400 dark:text-white/30 px-1">點選題目中你覺得可疑的部分，小心 — 只有 {MAX_MISSES} 次失誤機會。</p>
            )}

            {stage >= 4 && foundClues.size < totalClues && (
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/5">
                <p className="text-xs text-slate-400 dark:text-white/30">你漏掉的線索：</p>
                {question.clues.map((clue, i) => {
                  if (foundClues.has(i)) return null;
                  return (
                    <div key={i} className="rounded-lg border border-slate-200 dark:border-white/8 px-4 py-3 bg-slate-50 dark:bg-white/[0.02]">
                      <p className="text-sm text-slate-500 dark:text-white/45">「{clue.text}」</p>
                      <p className="text-xs text-slate-400 dark:text-white/30 mt-1 leading-relaxed">{clue.why}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Stage 2: 推理 ── */}
        {stage >= 2 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-cyan-700 dark:text-cyan-400 flex items-center gap-2">💭 推理提問</h3>
            <div className="space-y-3">
              {question.questions.map((q, i) => (
                <div key={i} className="rounded-lg p-4 space-y-2 bg-cyan-50 dark:bg-cyan-900/[0.08] border border-cyan-200 dark:border-cyan-800/20">
                  <p className="text-sm text-cyan-800 dark:text-cyan-200 font-medium">{q.prompt}</p>
                  <button onClick={() => toggleHint(i)} className="text-xs text-cyan-600 dark:text-cyan-500/60 hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors flex items-center gap-1">
                    {revealedHints.has(i) ? '收合' : '卡住了？看提示'}
                    <svg className={`w-3 h-3 transition-transform ${revealedHints.has(i) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {revealedHints.has(i) && (
                    <p className="text-sm text-slate-600 dark:text-white/50 leading-relaxed pl-3 border-l-2 border-cyan-300 dark:border-cyan-500/25">{q.hint}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Stage 3: 概念 ── */}
        {stage >= 3 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">🎯 概念定位</h3>
            <div className="rounded-lg p-4 space-y-3 bg-emerald-50 dark:bg-emerald-900/[0.08] border border-emerald-200 dark:border-emerald-800/20">
              <span className="inline-block px-2.5 py-0.5 text-xs rounded-full bg-emerald-200 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-medium">
                {question.concept.unit}
              </span>
              <p className="text-sm text-slate-700 dark:text-white/65 leading-relaxed">{question.concept.brief}</p>
              {question.concept.keyFormula && (
                <div className="px-3 py-2 rounded bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white/80 text-sm font-mono">{question.concept.keyFormula}</div>
              )}
              {question.concept.fieldNote && (
                <div className="mt-2 px-3 py-2 rounded-lg text-xs text-slate-500 dark:text-white/40 leading-relaxed bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05]">
                  <span className="text-slate-400 dark:text-white/25 font-medium">田野筆記：</span>{question.concept.fieldNote}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Stage 4: 解析 ── */}
        {stage >= 4 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400 flex items-center gap-2">✅ 破案</h3>

            {/* Summary */}
            <div className="rounded-lg px-4 py-3 flex items-center gap-4 text-xs bg-violet-50 dark:bg-violet-900/[0.1] border border-violet-200 dark:border-violet-800/20">
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
                  ? <span className="text-amber-600 dark:text-amber-300">完美偵探 🏆</span>
                  : foundClues.size >= totalClues * 0.75
                    ? <span className="text-emerald-600 dark:text-emerald-300">觀察敏銳</span>
                    : <span className="text-slate-400 dark:text-white/40">下次再仔細看看</span>
                }
              </div>
            </div>

            <div className="rounded-lg p-4 space-y-4 bg-violet-50 dark:bg-violet-900/[0.06] border border-violet-200 dark:border-violet-800/15">
              <ol className="space-y-2">
                {question.solution.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-violet-200 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-slate-700 dark:text-white/65 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
              {question.solution.commonMistakes && question.solution.commonMistakes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 space-y-2">
                  <p className="text-xs font-semibold text-red-500 dark:text-red-400/60">常見錯誤</p>
                  {question.solution.commonMistakes.map((m, i) => (
                    <p key={i} className="text-xs text-slate-500 dark:text-white/35 leading-relaxed pl-3 border-l-2 border-red-200 dark:border-red-500/15">{m}</p>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="shrink-0 border-t border-slate-200 dark:border-white/10 px-4 py-3 flex items-center gap-3 bg-white dark:bg-transparent" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {stage < 4 ? (
          <>
            {stage === 0 && selectedOption && !showAnswer && (
              <button onClick={() => setShowAnswer(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/70 hover:bg-slate-300 dark:hover:bg-white/15 transition-all">
                確認答案
              </button>
            )}
            <button onClick={() => setStage((stage + 1) as Stage)}
              className="ml-auto px-5 py-2 rounded-lg text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-500 transition-all flex items-center gap-2">
              {stageIcons[stage + 1]} {stageLabels[stage + 1]}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <button onClick={() => { setStage(0); setShowAnswer(true); }}
              className="px-4 py-2 rounded-lg text-sm text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/70 transition-all">
              回到題目
            </button>
            <span className="text-xs text-slate-300 dark:text-white/25">
              {question.tags.slice(0, 3).map(t => `#${t}`).join(' ')}
            </span>
          </div>
        )}
      </footer>
    </div>
  );
}
