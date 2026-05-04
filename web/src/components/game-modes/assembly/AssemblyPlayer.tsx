'use client';

import { useState, useMemo } from 'react';
import type { DetectiveQuestion, KnowledgeFragment } from '@/components/game-modes/detective/types';
import { ASSEMBLY_THEMES, type AssemblyThemeId } from '@/config/assemblyThemes';

type Phase = 'mission' | 'assembly' | 'result-correct' | 'result-wrong';

interface Props {
  question: DetectiveQuestion;
  themeId?: AssemblyThemeId;
  onBack: () => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function AssemblyPlayer({ question, themeId = 'hacker', onBack }: Props) {
  const config = question.assemblyMode!;
  const theme = ASSEMBLY_THEMES[themeId];
  const briefing = theme.briefings[config.assemblyType];
  const slotCount = config.slotCount ?? config.knowledgePool.filter(f => f.relevant).length;

  const shuffledPool = useMemo(
    () => [...config.knowledgePool].sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [question.id]
  );

  const [phase, setPhase] = useState<Phase>('mission');
  const [slots, setSlots] = useState<(KnowledgeFragment | null)[]>(Array(slotCount).fill(null));
  const [selected, setSelected] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const placedIds = new Set(slots.filter(Boolean).map(f => f!.id));
  const availablePool = shuffledPool.filter(f => !placedIds.has(f.id));
  const allFilled = slots.every(Boolean);

  function handleFragmentClick(fragment: KnowledgeFragment) {
    if (selected === fragment.id) { setSelected(null); return; }
    setSelected(fragment.id);
  }

  function handleSlotClick(slotIdx: number) {
    const current = slots[slotIdx];
    if (current) {
      // remove from slot
      setSlots(prev => prev.map((f, i) => i === slotIdx ? null : f));
      setSelected(null);
      return;
    }
    if (!selected) return;
    const fragment = shuffledPool.find(f => f.id === selected)!;
    setSlots(prev => prev.map((f, i) => i === slotIdx ? fragment : f));
    setSelected(null);
  }

  function handleConfirm() {
    if (!allFilled) return;
    const correct = slots.every((f, i) => f?.slot === i + 1);
    setAttempts(a => a + 1);
    setPhase(correct ? 'result-correct' : 'result-wrong');
  }

  function handleRetry() {
    setSlots(Array(slotCount).fill(null));
    setSelected(null);
    setPhase('assembly');
  }

  const correctChain = config.knowledgePool
    .filter(f => f.relevant && f.slot != null)
    .sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));

  // ── Mission phase ──
  if (phase === 'mission') {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-black text-green-400 font-mono">
        <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col gap-6">

          {/* header */}
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-green-600 hover:text-green-400 text-sm">
              ← 返回
            </button>
            <span className="text-xs text-green-700 uppercase tracking-widest">
              {theme.label} // ASSEMBLY
            </span>
          </div>

          {/* briefing */}
          <div className="border border-green-800 rounded-lg p-4 bg-green-950/30">
            <div className="text-xs text-green-600 mb-2 tracking-widest">// MISSION BRIEF</div>
            <p className="text-sm leading-relaxed text-green-300">{briefing}</p>
          </div>

          {/* target */}
          <div className="border border-green-700 rounded-lg p-4 space-y-3">
            <div className="text-xs text-green-600 tracking-widest">// TARGET</div>
            <p className="text-sm text-green-200 leading-relaxed">{question.mainStem}</p>
            {question.figure && (
              <p className="text-xs text-green-400 bg-green-950/50 rounded p-2 leading-relaxed">
                {question.figure}
              </p>
            )}
            <div className="space-y-1 pt-1">
              {question.options.map((opt, i) => (
                <div key={i} className="text-xs text-green-600 flex gap-2">
                  <span className="text-green-700">({LETTERS[i]})</span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase('assembly')}
            className="w-full py-3 rounded-lg border border-green-500 text-green-400 text-sm font-bold tracking-widest hover:bg-green-900/30 transition-colors"
          >
            ▶ 開始推演
          </button>
        </div>
      </div>
    );
  }

  // ── Assembly phase ──
  if (phase === 'assembly') {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-black text-green-400 font-mono">
        <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col gap-5">

          {/* header */}
          <div className="flex items-center justify-between">
            <button onClick={() => setPhase('mission')} className="text-green-600 hover:text-green-400 text-sm">
              ← 任務說明
            </button>
            <span className="text-xs text-green-700 uppercase tracking-widest">
              {theme.label} // ASSEMBLY
            </span>
          </div>

          {/* target compact */}
          <div className="border border-green-900 rounded p-3">
            <div className="text-xs text-green-700 mb-1 tracking-widest">// TARGET</div>
            <p className="text-xs text-green-500 leading-relaxed line-clamp-3">{question.mainStem}</p>
          </div>

          {/* slots */}
          <div>
            <div className="text-xs text-green-600 mb-2 tracking-widest">// 推演鏈 — 依序組裝</div>
            <div className="space-y-2">
              {slots.map((fragment, i) => (
                <button
                  key={i}
                  onClick={() => handleSlotClick(i)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-all min-h-[52px] flex items-center gap-3 ${
                    fragment
                      ? 'border-green-500 bg-green-900/20 text-green-200'
                      : selected
                      ? 'border-green-600 border-dashed bg-green-950/40 text-green-700 hover:bg-green-900/30'
                      : 'border-green-900 bg-transparent text-green-800'
                  }`}
                >
                  <span className="text-xs text-green-700 shrink-0 w-4">{i + 1}.</span>
                  {fragment
                    ? <span>{fragment.text}</span>
                    : <span className="text-xs italic">{selected ? '點擊放置' : '空'}</span>
                  }
                  {fragment && (
                    <span className="ml-auto text-xs text-green-700">✕</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* knowledge pool */}
          <div>
            <div className="text-xs text-green-600 mb-2 tracking-widest">// 知識庫</div>
            <div className="space-y-2">
              {availablePool.map(fragment => (
                <button
                  key={fragment.id}
                  onClick={() => handleFragmentClick(fragment)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                    selected === fragment.id
                      ? 'border-green-400 bg-green-800/40 text-green-100'
                      : 'border-green-800 bg-green-950/20 text-green-300 hover:border-green-600'
                  }`}
                >
                  {fragment.text}
                </button>
              ))}
              {availablePool.length === 0 && (
                <div className="text-xs text-green-800 text-center py-2">所有碎片已放置</div>
              )}
            </div>
          </div>

          {/* hint */}
          {config.hint && (
            <div>
              {showHint ? (
                <div className="border border-yellow-800 rounded p-3 bg-yellow-950/20 text-xs text-yellow-400">
                  {config.hint}
                </div>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-xs text-green-700 hover:text-green-500"
                >
                  ? 顯示提示
                </button>
              )}
            </div>
          )}

          {/* confirm */}
          <button
            onClick={handleConfirm}
            disabled={!allFilled}
            className="w-full py-3 rounded-lg border text-sm font-bold tracking-widest transition-colors disabled:border-green-900 disabled:text-green-900 border-green-400 text-green-400 hover:bg-green-900/30"
          >
            ▶ 確認推演
          </button>
        </div>
      </div>
    );
  }

  // ── Result phases ──
  const isCorrect = phase === 'result-correct';

  return (
    <div className="min-h-[100dvh] flex flex-col bg-black text-green-400 font-mono">
      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col gap-5">

        {/* header */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-green-600 hover:text-green-400 text-sm">
            ← 返回
          </button>
          <span className="text-xs text-green-700 uppercase tracking-widest">
            {theme.label} // RESULT
          </span>
        </div>

        {/* verdict */}
        <div className={`border rounded-lg p-4 ${
          isCorrect
            ? 'border-green-500 bg-green-900/20'
            : 'border-red-700 bg-red-950/20'
        }`}>
          <div className={`text-lg font-bold mb-1 ${isCorrect ? 'text-green-300' : 'text-red-400'}`}>
            {isCorrect ? '▶ 推演成功 — 任務完成' : '✕ 推演錯誤 — 重新分析'}
          </div>
          <div className="text-xs text-green-700">
            {attempts} 次嘗試
          </div>
        </div>

        {/* player's answer */}
        <div>
          <div className="text-xs text-green-600 mb-2 tracking-widest">// 你的推演</div>
          <div className="space-y-2">
            {slots.map((fragment, i) => {
              const correct = fragment?.slot === i + 1;
              return (
                <div
                  key={i}
                  className={`rounded-lg border p-3 text-sm flex gap-3 items-start ${
                    isCorrect
                      ? 'border-green-600 bg-green-900/20 text-green-200'
                      : correct
                      ? 'border-green-600 bg-green-900/20 text-green-200'
                      : 'border-red-700 bg-red-950/20 text-red-300'
                  }`}
                >
                  <span className="text-xs shrink-0 w-4 mt-0.5">{i + 1}.</span>
                  <span>{fragment?.text}</span>
                  <span className="ml-auto shrink-0">{isCorrect || correct ? '✓' : '✕'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* correct chain (shown on wrong) */}
        {!isCorrect && (
          <div>
            <div className="text-xs text-green-600 mb-2 tracking-widest">// 正確推演鏈</div>
            <div className="space-y-2">
              {correctChain.map((fragment, i) => (
                <div key={fragment.id} className="rounded-lg border border-green-700 p-3 text-sm text-green-200 flex gap-3">
                  <span className="text-xs text-green-700 shrink-0 w-4 mt-0.5">{i + 1}.</span>
                  <span>{fragment.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* answer */}
        {isCorrect && (
          <div className="border border-green-800 rounded-lg p-3">
            <div className="text-xs text-green-700 mb-1 tracking-widest">// 正確答案</div>
            <div className="text-sm text-green-300">
              ({question.answer}) {question.options[question.answer.charCodeAt(0) - 65]}
            </div>
          </div>
        )}

        {/* actions */}
        <div className="flex gap-3">
          {!isCorrect && (
            <button
              onClick={handleRetry}
              className="flex-1 py-3 rounded-lg border border-yellow-700 text-yellow-500 text-sm font-bold tracking-widest hover:bg-yellow-950/30 transition-colors"
            >
              ↩ 重新推演
            </button>
          )}
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-lg border border-green-700 text-green-500 text-sm font-bold tracking-widest hover:bg-green-900/30 transition-colors"
          >
            ← 返回
          </button>
        </div>
      </div>
    </div>
  );
}
