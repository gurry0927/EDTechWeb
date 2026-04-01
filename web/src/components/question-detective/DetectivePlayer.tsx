'use client';

import { useState, useCallback } from 'react';
import type { DetectiveQuestion } from './types';

type Stage = 0 | 1 | 2 | 3 | 4; // 0=題目, 1=線索, 2=提問, 3=概念, 4=解析

interface Props {
  question: DetectiveQuestion;
  onBack: () => void;
}

export function DetectivePlayer({ question, onBack }: Props) {
  const [stage, setStage] = useState<Stage>(0);
  const [revealedClues, setRevealedClues] = useState<Set<number>>(new Set());
  const [revealedHints, setRevealedHints] = useState<Set<number>>(new Set());
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const toggleClue = useCallback((i: number) => {
    setRevealedClues(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  const toggleHint = useCallback((i: number) => {
    setRevealedHints(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  const stageLabels = ['閱讀題目', '線索收集', '推理提問', '概念定位', '完整解析'];
  const stageIcons = ['📖', '🔍', '💭', '🎯', '✅'];

  // Highlight clues in stem text
  const renderStem = () => {
    if (stage < 1 || question.clues.every(c => c.startIndex === -1)) {
      return <p className="text-base leading-relaxed text-white/90">{question.stem}</p>;
    }

    // Sort clues by startIndex, filter those with valid positions
    const validClues = question.clues
      .map((c, i) => ({ ...c, idx: i }))
      .filter(c => c.startIndex >= 0)
      .sort((a, b) => a.startIndex - b.startIndex);

    if (validClues.length === 0) {
      return <p className="text-base leading-relaxed text-white/90">{question.stem}</p>;
    }

    const parts: React.ReactNode[] = [];
    let cursor = 0;

    validClues.forEach(clue => {
      if (clue.startIndex > cursor) {
        parts.push(<span key={`t-${cursor}`}>{question.stem.slice(cursor, clue.startIndex)}</span>);
      }
      parts.push(
        <mark
          key={`c-${clue.idx}`}
          className="bg-amber-500/30 text-amber-200 px-0.5 rounded cursor-help border-b border-amber-400/50"
          title={revealedClues.has(clue.idx) ? clue.why : '點擊線索查看為什麼重要'}
        >
          {question.stem.slice(clue.startIndex, clue.startIndex + clue.length)}
        </mark>
      );
      cursor = clue.startIndex + clue.length;
    });

    if (cursor < question.stem.length) {
      parts.push(<span key="tail">{question.stem.slice(cursor)}</span>);
    }

    return <p className="text-base leading-relaxed text-white/90">{parts}</p>;
  };

  return (
    <div className="min-h-[100dvh] bg-[#050510] text-white flex flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 px-4 py-3 flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white/80 transition-colors text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <div className="flex-1 text-center">
          <span className="text-xs text-white/40">{question.source}</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map(d => (
            <span key={d} className={`w-2 h-2 rounded-full ${d <= question.difficulty ? 'bg-amber-400' : 'bg-white/15'}`} />
          ))}
        </div>
      </header>

      {/* Stage progress bar */}
      <div className="shrink-0 px-4 py-2 flex items-center gap-1 border-b border-white/5 overflow-x-auto">
        {stageLabels.map((label, i) => (
          <button
            key={i}
            onClick={() => setStage(i as Stage)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all ${
              i === stage
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : i < stage
                  ? 'bg-white/5 text-white/50 border border-white/10'
                  : 'text-white/25 border border-transparent'
            }`}
          >
            <span>{stageIcons[i]}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-5 max-w-2xl mx-auto w-full">
        {/* ── Stage 0: 題目 ── */}
        <section className="space-y-4">
          <div className="space-y-3 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {renderStem()}
            {question.figure && (
              <p className="text-sm text-white/40 italic border-l-2 border-white/10 pl-3 mt-3">
                {question.figure}
              </p>
            )}
          </div>

          {/* Options */}
          {question.options && (
            <div className="space-y-2">
              {question.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i); // A, B, C, D
                const isSelected = selectedOption === letter;
                const isCorrect = showAnswer && letter === question.answer;
                const isWrong = showAnswer && isSelected && letter !== question.answer;
                return (
                  <button
                    key={i}
                    onClick={() => !showAnswer && setSelectedOption(letter)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center gap-3 ${
                      isCorrect
                        ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                        : isWrong
                          ? 'border-red-500/60 bg-red-500/15 text-red-300'
                          : isSelected
                            ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300'
                            : 'border-white/10 bg-white/3 text-white/70 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCorrect ? 'bg-emerald-500/30' : isWrong ? 'bg-red-500/30' : isSelected ? 'bg-cyan-500/20' : 'bg-white/8'
                    }`}>
                      {letter}
                    </span>
                    <span className="text-sm">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Stage 1: 線索收集 ── */}
        {stage >= 1 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <span>🔍</span> 線索收集 — 題幹裡藏了什麼關鍵資訊？
            </h3>
            <div className="space-y-2">
              {question.clues.map((clue, i) => (
                <div key={i} className="rounded-lg border border-white/10 overflow-hidden">
                  <button
                    onClick={() => toggleClue(i)}
                    className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-amber-200 font-medium">「{clue.text}」</span>
                    <svg className={`w-4 h-4 text-white/30 ml-auto transition-transform shrink-0 ${revealedClues.has(i) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {revealedClues.has(i) && (
                    <div className="px-4 pb-3 text-sm text-white/60 leading-relaxed border-t border-white/5 pt-2 ml-9">
                      {clue.why}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Stage 2: 蘇格拉底提問 ── */}
        {stage >= 2 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
              <span>💭</span> 推理提問 — 順著線索想想看
            </h3>
            <div className="space-y-3">
              {question.questions.map((q, i) => (
                <div key={i} className="rounded-lg p-4 space-y-2" style={{ background: 'rgba(34,211,238,0.05)', border: '1px solid rgba(34,211,238,0.15)' }}>
                  <p className="text-sm text-cyan-200 font-medium">{q.prompt}</p>
                  <button
                    onClick={() => toggleHint(i)}
                    className="text-xs text-cyan-500/70 hover:text-cyan-400 transition-colors flex items-center gap-1"
                  >
                    {revealedHints.has(i) ? '收合提示' : '想不到？看提示'}
                    <svg className={`w-3 h-3 transition-transform ${revealedHints.has(i) ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {revealedHints.has(i) && (
                    <p className="text-sm text-white/55 leading-relaxed pl-3 border-l-2 border-cyan-500/30">
                      {q.hint}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Stage 3: 概念定位 ── */}
        {stage >= 3 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <span>🎯</span> 概念定位 — 這題考的是什麼？
            </h3>
            <div className="rounded-lg p-4 space-y-3" style={{ background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)' }}>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  {question.concept.unit}
                </span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{question.concept.brief}</p>
              {question.concept.keyFormula && (
                <div className="px-3 py-2 rounded bg-white/5 text-white/80 text-sm font-mono">
                  {question.concept.keyFormula}
                </div>
              )}
              {question.concept.fieldNote && (
                <div className="mt-2 px-3 py-2 rounded-lg text-xs text-white/45 leading-relaxed" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-white/30 font-medium">田野筆記：</span>{question.concept.fieldNote}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Stage 4: 完整解析 ── */}
        {stage >= 4 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-violet-400 flex items-center gap-2">
              <span>✅</span> 完整解析 — 破案！
            </h3>
            <div className="rounded-lg p-4 space-y-4" style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
              <ol className="space-y-2">
                {question.solution.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-white/70 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>

              {question.solution.commonMistakes && question.solution.commonMistakes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                  <p className="text-xs font-semibold text-red-400/70">常見錯誤</p>
                  {question.solution.commonMistakes.map((m, i) => (
                    <p key={i} className="text-xs text-white/40 leading-relaxed pl-3 border-l-2 border-red-500/20">
                      {m}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Footer: next stage button */}
      <footer className="shrink-0 border-t border-white/10 px-4 py-3 flex items-center gap-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {stage < 4 ? (
          <>
            {stage === 0 && selectedOption && !showAnswer && (
              <button
                onClick={() => setShowAnswer(true)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-white/10 text-white/70 hover:bg-white/15 transition-all"
              >
                確認答案
              </button>
            )}
            <button
              onClick={() => setStage((stage + 1) as Stage)}
              className="ml-auto px-5 py-2 rounded-lg text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-500 transition-all flex items-center gap-2"
            >
              {stageIcons[stage + 1]} {stageLabels[stage + 1]}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <button
              onClick={() => { setStage(0); setShowAnswer(true); }}
              className="px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white/70 transition-all"
            >
              回到題目
            </button>
            <span className="text-xs text-white/30">
              {question.tags.map(t => `#${t}`).join(' ')}
            </span>
          </div>
        )}
      </footer>
    </div>
  );
}
