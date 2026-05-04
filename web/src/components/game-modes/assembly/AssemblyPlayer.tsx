'use client';

import { useState, useMemo } from 'react';
import type { DetectiveQuestion, KnowledgeFragment } from '@/components/game-modes/detective/types';
import { ASSEMBLY_BRIEFINGS, ASSEMBLY_THEME_LABELS } from '@/config/assemblyThemes';

type Phase = 'mission' | 'collection' | 'assembly' | 'result-correct' | 'result-wrong';

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

  // 給 collection phase 用的標籤雲樣式（隨機尺寸/旋轉，依 fragment.id 穩定）
  const cloudStyles = useMemo(() => {
    const map: Record<string, { fontSize: string; rotate: string }> = {};
    config.knowledgePool.forEach((f, i) => {
      // 用 id+index 做偽隨機，每次 render 一致
      const seed = (i * 73 + f.id.length * 17) % 100;
      const sizeRem = 0.85 + (seed % 7) * 0.1; // 0.85 ~ 1.45 rem
      const rot = ((seed % 13) - 6) * 0.6;     // -3.6° ~ +3.6°
      map[f.id] = { fontSize: `${sizeRem.toFixed(2)}rem`, rotate: `${rot.toFixed(1)}deg` };
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const [phase, setPhase] = useState<Phase>('mission');
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [slots, setSlots] = useState<(KnowledgeFragment | null)[]>(Array(slotCount).fill(null));
  const [selected, setSelected] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const placedIds = new Set(slots.filter(Boolean).map(f => f!.id));
  // 組裝階段只看篩選後留下來的碎片
  const collectedPool = shuffledPool.filter(f => collected.has(f.id));
  const availablePool = collectedPool.filter(f => !placedIds.has(f.id));
  const allFilled = slots.every(Boolean);

  function toggleCollect(id: string) {
    setCollected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

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
    setCollected(new Set());
    setPhase('collection');
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
            onClick={() => setPhase('collection')}
            className="w-full py-3 rounded-lg text-sm font-bold tracking-widest dt-btn-primary transition-all hover:scale-[1.01] active:scale-[0.98]"
          >
            ▶ 開始收集
          </button>
        </div>
      </div>
    );
  }

  // ── Collection phase（標籤雲篩選）──
  if (phase === 'collection') {
    const collectionPrompt: Record<string, string> = {
      classic: '從散落的線索中，挑出與本案相關的部分',
      cyber:   '掃描資料流，標記出有用的訊號（過濾雜訊）',
      guofeng: '天機散落字裡行間，揀出與此局相應的徵兆',
    };
    const prompt = collectionPrompt[themeId] ?? collectionPrompt.classic;

    return (
      <div className="min-h-[100dvh] detective-paper text-dt-text flex flex-col">
        <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <button onClick={() => setPhase('mission')} className="text-dt-text-muted hover:text-dt-text text-sm">
              ← 任務說明
            </button>
            <span className="text-xs text-dt-text-muted uppercase tracking-widest">
              {themeLabel} · 收集
            </span>
          </div>

          {/* 提示 */}
          <div className="case-file rounded-lg p-3">
            <p className="text-sm leading-relaxed">{prompt}</p>
            <p className="text-xs text-dt-text-muted mt-1">點擊有用的知識碎片，多選不影響。</p>
          </div>

          {/* 題幹（精簡） */}
          <div className="rounded p-3" style={{ border: '1px solid var(--dt-border)' }}>
            <div className="text-xs text-dt-text-muted mb-1 tracking-widest">案情</div>
            <p className="text-xs text-dt-text-secondary leading-relaxed line-clamp-4">{question.mainStem}</p>
          </div>

          {/* 標籤雲 */}
          <div className="rounded-lg p-4 flex-1"
            style={{
              background: 'color-mix(in srgb, var(--dt-card) 60%, transparent)',
              border: '1px dashed var(--dt-border)',
            }}>
            <div className="flex flex-wrap gap-2 items-center justify-center">
              {shuffledPool.map(fragment => {
                const isOn = collected.has(fragment.id);
                const style = cloudStyles[fragment.id];
                return (
                  <button
                    key={fragment.id}
                    onClick={() => toggleCollect(fragment.id)}
                    className="px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{
                      fontSize: style?.fontSize,
                      transform: `rotate(${style?.rotate ?? '0deg'})`,
                      border: isOn ? '2px solid var(--dt-accent)' : '1px solid var(--dt-border)',
                      background: isOn
                        ? 'color-mix(in srgb, var(--dt-accent) 15%, var(--dt-card))'
                        : 'var(--dt-card)',
                      color: isOn ? 'var(--dt-accent)' : 'var(--dt-text-secondary)',
                      fontWeight: isOn ? 700 : 400,
                    }}>
                    {fragment.keyword ?? fragment.text}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 計數 */}
          <div className="text-xs text-dt-text-muted text-center">
            已收集 {collected.size} 個碎片
            {collected.size < slotCount && (
              <span className="ml-2 text-dt-text-muted">（推演鏈需要 {slotCount} 個位置）</span>
            )}
          </div>

          {/* 確認 */}
          <button
            onClick={() => setPhase('assembly')}
            disabled={collected.size === 0}
            className="w-full py-3 rounded-lg text-sm font-bold tracking-widest dt-btn-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.98]"
          >
            ▶ 進入組裝
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
            <button onClick={() => { setSlots(Array(slotCount).fill(null)); setSelected(null); setPhase('collection'); }}
              className="text-dt-text-muted hover:text-dt-text text-sm">
              ← 重新收集
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
            <div className="text-xs text-dt-text-muted mb-2 tracking-widest">推演鏈 — 把碎片放入對應角色</div>
            <div className="space-y-2">
              {slots.map((fragment, i) => {
                const slotLabel = config.slotLabels?.[i];
                return (
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
                    {/* 角色標籤（label）或數字 */}
                    <span className="text-xs shrink-0 px-2 py-0.5 rounded font-bold tracking-wider"
                      style={{
                        background: 'color-mix(in srgb, var(--dt-accent) 12%, var(--dt-card))',
                        color: 'var(--dt-accent)',
                        minWidth: slotLabel ? '4em' : '2em',
                        textAlign: 'center',
                      }}>
                      {slotLabel ?? `${i + 1}.`}
                    </span>
                    {fragment
                      ? <span>{fragment.keyword ?? fragment.text}</span>
                      : <span className="text-xs italic">{selected ? '點擊放置' : '空'}</span>
                    }
                    {fragment && <span className="ml-auto text-xs" style={{ color: 'var(--dt-text-muted)' }}>✕</span>}
                  </button>
                );
              })}
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
                  {fragment.keyword ?? fragment.text}
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
              const slotLabel = config.slotLabels?.[i];
              return (
                <div key={i} className="rounded-lg p-3 text-sm flex gap-3 items-start"
                  style={{
                    border: `1px solid ${ok ? 'var(--dt-success)' : 'var(--dt-error)'}`,
                    background: ok
                      ? 'color-mix(in srgb, var(--dt-success) 10%, var(--dt-card))'
                      : 'color-mix(in srgb, var(--dt-error) 10%, var(--dt-card))',
                    color: 'var(--dt-text)',
                  }}>
                  <span className="text-xs shrink-0 px-2 py-0.5 rounded font-bold tracking-wider mt-0.5"
                    style={{
                      background: 'color-mix(in srgb, var(--dt-accent) 12%, transparent)',
                      color: 'var(--dt-accent)',
                      minWidth: slotLabel ? '4em' : '2em',
                      textAlign: 'center',
                    }}>
                    {slotLabel ?? `${i + 1}.`}
                  </span>
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
              {correctChain.map((fragment, i) => {
                const slotLabel = config.slotLabels?.[i];
                return (
                  <div key={fragment.id} className="rounded-lg p-3 text-sm flex gap-3"
                    style={{
                      border: '1px solid var(--dt-success)',
                      background: 'color-mix(in srgb, var(--dt-success) 8%, var(--dt-card))',
                    }}>
                    <span className="text-xs shrink-0 px-2 py-0.5 rounded font-bold tracking-wider mt-0.5"
                      style={{
                        background: 'color-mix(in srgb, var(--dt-success) 15%, transparent)',
                        color: 'var(--dt-success)',
                        minWidth: slotLabel ? '4em' : '2em',
                        textAlign: 'center',
                      }}>
                      {slotLabel ?? `${i + 1}.`}
                    </span>
                    <span>{fragment.text}</span>
                  </div>
                );
              })}
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
