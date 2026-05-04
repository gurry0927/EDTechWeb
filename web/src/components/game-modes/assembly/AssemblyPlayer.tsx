'use client';

import { useState, useMemo } from 'react';
import type { DetectiveQuestion, KnowledgeFragment } from '@/components/game-modes/detective/types';
import { ASSEMBLY_BRIEFINGS, ASSEMBLY_THEME_LABELS } from '@/config/assemblyThemes';

type Phase = 'mission' | 'assembly' | 'result-correct' | 'result-wrong';

interface Props {
  question: DetectiveQuestion;
  themeId?: string;
  onBack: () => void;
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];

export function AssemblyPlayer({ question, themeId = 'classic', onBack }: Props) {
  const config = question.assemblyMode!;
  const briefingSet = ASSEMBLY_BRIEFINGS[themeId] ?? ASSEMBLY_BRIEFINGS.classic;
  const briefing = briefingSet.briefings[config.assemblyType];
  const themeLabel = ASSEMBLY_THEME_LABELS[themeId] ?? '推理';
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
      <div className="min-h-[100dvh] detective-paper text-dt-text flex flex-col">
        <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-dt-text-muted hover:text-dt-text text-sm">← 返回</button>
            <span className="text-xs text-dt-text-muted uppercase tracking-widest">
              {themeLabel} · 組裝
            </span>
          </div>

          {/* briefing */}
          <div className="case-file rounded-lg p-4">
            <div className="text-xs text-dt-text-muted mb-2 tracking-widest">任務簡報</div>
            <p className="text-sm leading-relaxed">{briefing}</p>
          </div>

          {/* target */}
          <div className="case-file rounded-lg p-4 space-y-3">
            <div className="text-xs text-dt-text-muted tracking-widest">案情</div>
            <p className="text-sm leading-relaxed">{question.mainStem}</p>
            {question.figure && (
              <p className="text-xs text-dt-text-secondary rounded p-2 leading-relaxed"
                style={{ background: 'color-mix(in srgb, var(--dt-accent) 5%, var(--dt-card))' }}>
                {question.figure}
              </p>
            )}
            <div className="space-y-1 pt-1">
              {question.options.map((opt, i) => (
                <div key={i} className="text-xs text-dt-text-secondary flex gap-2">
                  <span className="text-dt-text-muted">({LETTERS[i]})</span>
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase('assembly')}
            className="w-full py-3 rounded-lg text-sm font-bold tracking-widest dt-btn-primary transition-all hover:scale-[1.01] active:scale-[0.98]"
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
      <div className="min-h-[100dvh] detective-paper text-dt-text flex flex-col">
        <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <button onClick={() => setPhase('mission')} className="text-dt-text-muted hover:text-dt-text text-sm">
              ← 任務說明
            </button>
            <span className="text-xs text-dt-text-muted uppercase tracking-widest">
              {themeLabel} · 組裝
            </span>
          </div>

          {/* target compact */}
          <div className="rounded p-3" style={{ border: '1px solid var(--dt-border)' }}>
            <div className="text-xs text-dt-text-muted mb-1 tracking-widest">案情</div>
            <p className="text-xs text-dt-text-secondary leading-relaxed line-clamp-3">{question.mainStem}</p>
          </div>

          {/* slots */}
          <div>
            <div className="text-xs text-dt-text-muted mb-2 tracking-widest">推演鏈 — 依序組裝</div>
            <div className="space-y-2">
              {slots.map((fragment, i) => (
                <button
                  key={i}
                  onClick={() => handleSlotClick(i)}
                  className="w-full rounded-lg p-3 text-left text-sm transition-all min-h-[52px] flex items-center gap-3"
                  style={{
                    border: fragment
                      ? '2px solid var(--dt-accent)'
                      : selected
                        ? '2px dashed var(--dt-accent)'
                        : '1px solid var(--dt-border)',
                    background: fragment
                      ? 'color-mix(in srgb, var(--dt-accent) 10%, var(--dt-card))'
                      : selected
                        ? 'color-mix(in srgb, var(--dt-accent) 5%, var(--dt-card))'
                        : 'var(--dt-card)',
                    color: fragment ? 'var(--dt-text)' : 'var(--dt-text-muted)',
                  }}
                >
                  <span className="text-xs shrink-0 w-4" style={{ color: 'var(--dt-text-muted)' }}>{i + 1}.</span>
                  {fragment
                    ? <span>{fragment.text}</span>
                    : <span className="text-xs italic">{selected ? '點擊放置' : '空'}</span>
                  }
                  {fragment && <span className="ml-auto text-xs" style={{ color: 'var(--dt-text-muted)' }}>✕</span>}
                </button>
              ))}
            </div>
          </div>

          {/* knowledge pool */}
          <div>
            <div className="text-xs text-dt-text-muted mb-2 tracking-widest">知識庫</div>
            <div className="space-y-2">
              {availablePool.map(fragment => (
                <button
                  key={fragment.id}
                  onClick={() => handleFragmentClick(fragment)}
                  className="w-full rounded-lg p-3 text-left text-sm transition-all"
                  style={{
                    border: selected === fragment.id ? '2px solid var(--dt-accent)' : '1px solid var(--dt-border)',
                    background: selected === fragment.id
                      ? 'color-mix(in srgb, var(--dt-accent) 15%, var(--dt-card))'
                      : 'var(--dt-card)',
                    color: 'var(--dt-text)',
                  }}
                >
                  {fragment.text}
                </button>
              ))}
              {availablePool.length === 0 && (
                <div className="text-xs text-dt-text-muted text-center py-2">所有碎片已放置</div>
              )}
            </div>
          </div>

          {/* hint */}
          {config.hint && (
            <div>
              {showHint ? (
                <div className="rounded p-3 text-xs"
                  style={{
                    background: 'color-mix(in srgb, var(--dt-scan) 10%, var(--dt-card))',
                    border: '1px solid var(--dt-scan)',
                    color: 'var(--dt-scan)',
                  }}>
                  💡 {config.hint}
                </div>
              ) : (
                <button
                  onClick={() => setShowHint(true)}
                  className="text-xs text-dt-text-muted hover:text-dt-text-secondary"
                >
                  ? 顯示提示
                </button>
              )}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={!allFilled}
            className="w-full py-3 rounded-lg text-sm font-bold tracking-widest dt-btn-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.98]"
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
    <div className="min-h-[100dvh] detective-paper text-dt-text flex flex-col">
      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-dt-text-muted hover:text-dt-text text-sm">← 返回</button>
          <span className="text-xs text-dt-text-muted uppercase tracking-widest">
            {themeLabel} · 結果
          </span>
        </div>

        {/* verdict */}
        <div className="case-file rounded-lg p-4"
          style={{ border: `2px solid ${isCorrect ? 'var(--dt-success)' : 'var(--dt-error)'}` }}>
          <div className="text-lg font-bold mb-1"
            style={{ color: isCorrect ? 'var(--dt-success)' : 'var(--dt-error)' }}>
            {isCorrect ? '✓ 推演成功' : '✕ 推演錯誤'}
          </div>
          <div className="text-xs text-dt-text-muted">{attempts} 次嘗試</div>
        </div>

        {/* player's answer */}
        <div>
          <div className="text-xs text-dt-text-muted mb-2 tracking-widest">你的推演</div>
          <div className="space-y-2">
            {slots.map((fragment, i) => {
              const correct = fragment?.slot === i + 1;
              const ok = isCorrect || correct;
              return (
                <div key={i} className="rounded-lg p-3 text-sm flex gap-3 items-start"
                  style={{
                    border: `1px solid ${ok ? 'var(--dt-success)' : 'var(--dt-error)'}`,
                    background: ok
                      ? 'color-mix(in srgb, var(--dt-success) 10%, var(--dt-card))'
                      : 'color-mix(in srgb, var(--dt-error) 10%, var(--dt-card))',
                    color: 'var(--dt-text)',
                  }}>
                  <span className="text-xs shrink-0 w-4 mt-0.5" style={{ color: 'var(--dt-text-muted)' }}>{i + 1}.</span>
                  <span>{fragment?.text}</span>
                  <span className="ml-auto shrink-0" style={{ color: ok ? 'var(--dt-success)' : 'var(--dt-error)' }}>
                    {ok ? '✓' : '✕'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* correct chain (shown on wrong) */}
        {!isCorrect && (
          <div>
            <div className="text-xs text-dt-text-muted mb-2 tracking-widest">正確推演鏈</div>
            <div className="space-y-2">
              {correctChain.map((fragment, i) => (
                <div key={fragment.id} className="rounded-lg p-3 text-sm flex gap-3"
                  style={{
                    border: '1px solid var(--dt-success)',
                    background: 'color-mix(in srgb, var(--dt-success) 8%, var(--dt-card))',
                  }}>
                  <span className="text-xs shrink-0 w-4 mt-0.5" style={{ color: 'var(--dt-text-muted)' }}>{i + 1}.</span>
                  <span>{fragment.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* answer */}
        {isCorrect && (
          <div className="case-file rounded-lg p-3">
            <div className="text-xs text-dt-text-muted mb-1 tracking-widest">正確答案</div>
            <div className="text-sm">
              ({question.answer}) {question.options[question.answer.charCodeAt(0) - 65]}
            </div>
          </div>
        )}

        {/* actions */}
        <div className="flex gap-3">
          {!isCorrect && (
            <button onClick={handleRetry}
              className="flex-1 py-3 rounded-lg text-sm font-bold tracking-widest transition-colors"
              style={{
                border: '1px solid var(--dt-scan)',
                color: 'var(--dt-scan)',
                background: 'color-mix(in srgb, var(--dt-scan) 8%, var(--dt-card))',
              }}>
              ↩ 重新推演
            </button>
          )}
          <button onClick={onBack}
            className="flex-1 py-3 rounded-lg text-sm font-medium border"
            style={{ borderColor: 'var(--dt-border)', color: 'var(--dt-text-secondary)' }}>
            ← 返回列表
          </button>
        </div>
      </div>
    </div>
  );
}
