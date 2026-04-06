'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { DetectiveQuestion } from './types';
import { GAME, DIALOGUE, ACHIEVEMENTS, pick } from './detective-config';

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

// 迴紋針：掛在案件照片角上
const PaperclipIcon = () => (
  <svg width="18" height="42" viewBox="0 0 18 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-sm">
    <path d="M9 2C5.5 2 3 4.5 3 8V30C3 35.5 7.5 40 13 40" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
    <path d="M9 2C11.8 2 14 4.2 14 7V30C14 33.3 11.3 36 8 36C4.7 36 2 33.3 2 30V10" stroke="#D1D5DB" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
  </svg>
);

// 輔助線索命中：灰藍細邊、字稍小、斜體感 — 比正式線索輕但仍可讀
const ContextBubble = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2 items-start max-w-[85%] bubble-in">
    <DetectiveAvatar />
    <div className="rounded-2xl rounded-tl-sm px-3.5 py-2 bg-sky-50/70 dark:bg-sky-900/10 border border-sky-200/60 dark:border-sky-700/25 text-sm text-slate-500 dark:text-white/55 leading-relaxed italic">
      {children}
    </div>
  </div>
);

// 保底提示：琥珀底色 + 🔍 icon — 視覺上明顯但不搶過線索泡泡
const PityBubble = ({ children }: { children: React.ReactNode }) => (
  <div className="flex gap-2.5 items-start max-w-[85%] bubble-in">
    <DetectiveAvatar />
    <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 bg-amber-50 dark:bg-amber-900/15 border border-amber-300/50 dark:border-amber-600/25 text-sm text-amber-900 dark:text-amber-200/80 leading-relaxed">
      <span className="mr-1.5">🔍</span>{children}
    </div>
  </div>
);

function TypedDetective({ children, delay = 'medium' }: { children: React.ReactNode; delay?: 'short' | 'medium' | 'long' }) {
  const [typing, setTyping] = useState(true);
  const ms = GAME.typingDelay[delay];
  useEffect(() => { const t = setTimeout(() => setTyping(false), ms); return () => clearTimeout(t); }, [ms]);
  if (typing) return <TypingBubble />;
  return <DetectiveBubble>{children}</DetectiveBubble>;
}

const LivesDisplay = ({ lives }: { lives: number }) => (
  <div className="flex items-center gap-1">
    {Array.from({ length: GAME.maxLives }).map((_, i) => (
      <span key={i} className="text-sm">{i < lives ? '❤️' : '🖤'}</span>
    ))}
  </div>
);

// 簡單的 Markdown 粗體解析器 (**粗體文字**)
const RichText = ({ text }: { text: string | undefined }) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <span key={i} className="font-bold text-amber-900 dark:text-amber-200">{part.slice(2, -2)}</span>;
        }
        return part;
      })}
    </>
  );
};

// ── Segment building ──

// [MODIFY] Seg 型別擴充：加入 scaffoldIndex 欄位
// 三種互斥的 segment 類型（不可同時非 null）：
//   clueIndex != null    → 線索片段，點擊 = 命中線索
//   scaffoldIndex != null → 鷹架片段，點擊 = context/noise 回應（看 ScaffoldingRegion.type）
//   兩者皆 null          → 空白片段，點擊 = 失誤扣血
interface Seg {
  text: string;
  clueIndex: number | null;
  scaffoldIndex: number | null;
  absStart: number;    // 片段在原始字串中的起始位置
  tokenIndex?: number; // 空白詞段的全局序號，用於學生點擊統計；標記區（clue/scaffold）不設此值
}

// 把非標記文字切成 2-4 字的詞段（雜訊混淆）
// 規則：標點後斷、虛詞後斷、否則每 3 字斷一次
// 目的：讓 span 邊界資訊無法用於鎖定線索位置，同時不影響視覺呈現
function tokenizeBlank(text: string, baseOffset: number): Seg[] {
  const BREAK_AFTER = new Set('。！？，、；：\n');
  const FUNC_WORDS = new Set('的了在與且而也都是有被從於至到');
  const result: Seg[] = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const chunkLen = i - start + 1;
    const shouldBreak =
      BREAK_AFTER.has(ch) ||
      FUNC_WORDS.has(ch) ||
      chunkLen >= 3;
    if (shouldBreak || i === text.length - 1) {
      result.push({ text: text.slice(start, i + 1), clueIndex: null, scaffoldIndex: null, absStart: baseOffset + start });
      start = i + 1;
    }
  }
  return result;
}

// 後處理：對所有空白詞段（clueIndex === null && scaffoldIndex === null）
// 依序賦予 tokenIndex，從指定的起始值開始計數。
// 回傳：[更新後的 segs, 下一個可用的 tokenIndex]
function assignTokenIndices(segs: Seg[], startIdx = 0): [Seg[], number] {
  let idx = startIdx;
  const result = segs.map(s =>
    s.clueIndex === null && s.scaffoldIndex === null
      ? { ...s, tokenIndex: idx++ }
      : s
  );
  return [result, idx];
}

// buildSegs：同時處理 clues + scaffolding，空白區域可由 stemTokens 覆寫
//
// 雙模式：
//   stemTokens 存在 → 把整份 mainStem 視為已切分的詞段陣列，直接對每個詞段
//                      查表決定其所屬類型（clue / scaffold / blank）。
//                      前提：所有詞段串接後必須等於 src。
//   stemTokens 缺省 → 退回機械切碎（tokenizeBlank，2-4 字規則）。
//
// tokenIndex 賦值由呼叫端（stemSegs / figureSegs）統一做後處理，這裡不處理。
function buildSegs(
  src: string,
  clues: { startIndex: number; length: number; idx: number }[],
  scaffolding: { startIndex: number; length: number; idx: number }[],
  stemTokens?: string[],
): Seg[] {
  interface Mark { start: number; end: number; clueIdx: number | null; scaffoldIdx: number | null }
  const marks: Mark[] = [
    ...clues.filter(c => c.startIndex >= 0).map(c => ({ start: c.startIndex, end: c.startIndex + c.length, clueIdx: c.idx, scaffoldIdx: null })),
    ...scaffolding.filter(s => s.startIndex >= 0).map(s => ({ start: s.startIndex, end: s.startIndex + s.length, clueIdx: null, scaffoldIdx: s.idx })),
  ].sort((a, b) => a.start - b.start);

  // ── 模式一：JSON 詞段覆蓋 ──
  if (stemTokens?.length) {
    const segs: Seg[] = [];
    let charPos = 0;
    for (const token of stemTokens) {
      const tokenEnd = charPos + token.length;
      // 找到完全包含這個詞段的標記區（要求詞段邊界與標記對齊）
      const mark = marks.find(m => m.start <= charPos && m.end >= tokenEnd);
      segs.push({
        text: token,
        clueIndex: mark?.clueIdx ?? null,
        scaffoldIndex: mark?.scaffoldIdx ?? null,
        absStart: charPos,
      });
      charPos = tokenEnd;
    }
    return segs;
  }

  // ── 模式二：機械切碎（預設）──
  if (!marks.length) return tokenizeBlank(src, 0);

  const segs: Seg[] = [];
  let cur = 0;
  marks.forEach(m => {
    if (m.start > cur) {
      segs.push(...tokenizeBlank(src.slice(cur, m.start), cur));
    }
    if (m.start >= cur) {
      segs.push({ text: src.slice(m.start, m.end), clueIndex: m.clueIdx, scaffoldIndex: m.scaffoldIdx, absStart: m.start });
      cur = m.end;
    }
  });
  if (cur < src.length) {
    segs.push(...tokenizeBlank(src.slice(cur), cur));
  }
  return segs;
}

// ── Types ──
type Phase = 'clue' | 'reasoning' | 'answer' | 'solution';
type ReasoningMode = 'choosing' | 'pointing';
type ChatEvent =
  | { type: 'clue';    idx: number; reaction: string }
  | { type: 'context'; hint: string; text: string }
  | { type: 'pity';    hint: string }
interface Props { question: DetectiveQuestion; onBack: () => void; }

// ── Main Component ──
export function DetectivePlayer({ question, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('clue');
  const [foundClues, setFoundClues] = useState<Set<number>>(new Set());
  const [chatEvents, setChatEvents] = useState<ChatEvent[]>([]);
  const [seenContextRegions, setSeenContextRegions] = useState<Set<number>>(new Set());
  const [lives, setLives] = useState(GAME.maxLives);
  const [reasoningStep, setReasoningStep] = useState(0);
  const [reasoningMode, setReasoningMode] = useState<ReasoningMode>('choosing');
  const [reasoningWrong, setReasoningWrong] = useState(false);
  const [evidenceWrongMsg, setEvidenceWrongMsg] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState<string[]>([]);
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false);
  const [notebookSeenCount, setNotebookSeenCount] = useState(0);
  const [hasOpenedNotebook, setHasOpenedNotebook] = useState(false);

  const [pointingFlash, setPointingFlash] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [toastPersist, setToastPersist] = useState(false);
  const showToast = useCallback((msg: string) => { setToast(msg); setToastKey(k => k + 1); setToastPersist(false); }, []);
  const showPersistToast = useCallback((msg: string) => { setToast(msg); setToastKey(k => k + 1); setToastPersist(true); }, []);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const clueTabRef = useRef<HTMLButtonElement>(null);
  const [headerH, setHeaderH] = useState(0);

  // [NEW] 連續失誤計數器（憐憫機制）
  // 計數規則：noise 失誤 +1、空白失誤 +1；clue 命中或 context 命中 → 重置為 0
  // 當 consecutiveMisses 達到 GAME.pityScanThreshold 時，觸發 pityCategoryHint 並重置
  const [consecutiveMisses, setConsecutiveMisses] = useState(0);
  const [isNotebookOpen, setIsNotebookOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // [NEW] 掃描器狀態
  // activeScanning = true 時，題幹 <p> 套用 "stem-scan" class（已有），並顯示 magnifier overlay
  // 按下掃描鈕後 GAME.scanActiveDuration ms 自動關閉
  // scanOnCooldown = true 時，掃描鈕顯示灰色並禁用，避免連續觸發
  const [activeScanning, setActiveScanning] = useState(false);

  const [stemExpanded, setStemExpanded] = useState(false);
  const [scanHighlight, setScanHighlight] = useState(false); // 掃光結束後才亮，持續到 stemExpanded 關閉
  const [scanUsesLeft, setScanUsesLeft] = useState(GAME.scanInitialUses);
  const prevAuxFoundRef = useRef(0);

  const [idleShimmer, setIdleShimmer] = useState(false);
  // 首次點擊後清掉進場 persist toast；後續閒置提示改用 scaffoldPulse
  const [hasStartedInteracting, setHasStartedInteracting] = useState(false);
  // 閒置 8 秒後讓第一個 context 鷹架跳動，命中後停止
  const [isIdleDisabled, setIsIdleDisabled] = useState(false);
  const [scaffoldPulse, setScaffoldPulse] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stemContainerRef = useRef<HTMLDivElement>(null);
  const detailSectionRef = useRef<HTMLDivElement>(null);

  // 有互動時用：清掉 shimmer，重新倒數 8 秒
  const resetIdleTimer = useCallback((withToast = false) => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setIdleShimmer(false);
    idleTimerRef.current = setTimeout(() => {
      setIdleShimmer(true);
      if (withToast) showPersistToast('👆 點擊上方証詞中可疑的字詞！');
    }, 8000);
  }, [showPersistToast]);

  // 筆記本關閉後用：不清 shimmer（若已啟動則繼續），只重啟計時器
  const startIdleTimer = useCallback((withToast = false) => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIdleShimmer(true);
      if (withToast) showPersistToast('👆 點擊上方証詞中可疑的字詞！');
    }, 8000);
  }, [showPersistToast]);

  // 進場後啟動 idle timer（附 toast）；首次點擊或離開 clue phase 後清除
  useEffect(() => {
    const hasFoundAnything = foundClues.size > 0 || seenContextRegions.size > 0;
    if (phase !== 'clue' || hasFoundAnything || isIdleDisabled) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      setIdleShimmer(false);
      setScaffoldPulse(false);
      return;
    }
    resetIdleTimer(!hasStartedInteracting);
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current); };
  }, [phase, foundClues.size, seenContextRegions.size, hasStartedInteracting, isIdleDisabled, resetIdleTimer]);

  // exitScanMode：不管 timer，交給 idle effect 統一判斷
  // persist toast（如 startHint）一併清除，避免找到線索後浮示殘留
  const exitScanMode = useCallback(() => {
    setActiveScanning(false);
    setScanHighlight(false);
    setIsIdleDisabled(false);
    setStemExpanded(false);
    setToast(null);
    setToastPersist(false);
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeaderH(el.offsetHeight));
    ro.observe(el);
    setHeaderH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { if (!toast || toastPersist) return; const t = setTimeout(() => setToast(null), GAME.toastDuration); return () => clearTimeout(t); }, [toast, toastPersist]);

  // Q1: 預載筆記本圖片，避免打開時才 fetch
  useEffect(() => {
    if (question.figureImage) { const img = new Image(); img.src = question.figureImage; }
  }, [question.figureImage]);

  // #17: 進入指認證物階段時自動關閉筆記本，讓使用者回到題幹操作
  useEffect(() => {
    if (reasoningMode === 'pointing' && isNotebookOpen) closeNotebook();
  }, [reasoningMode]);

  // 進入指認階段時，題幹卡片閃一次吸引視線
  useEffect(() => {
    if (reasoningMode !== 'pointing') return;
    setPointingFlash(true);
    const t = setTimeout(() => setPointingFlash(false), 900);
    return () => clearTimeout(t);
  }, [reasoningMode]);

  useEffect(() => {
    if (!activeScanning) return;
    setStemExpanded(true);
    setScanHighlight(false);
    if (foundClues.size === 0) {
      setTimeout(() => {
        detailSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
    // 掃光結束後才亮起呼吸高光
    const highlightTimer = setTimeout(() => setScanHighlight(true), GAME.scanSweepDuration);
    // 15 秒無操作：提示玩家點擊
    const nudgeTimer = setTimeout(() => {
      showToast(DIALOGUE.scanNudge);
    }, GAME.scanNudgeDelay);
    // 30 秒無操作：自動退出掃描模式
    const autoExitTimer = setTimeout(() => {
      exitScanMode();
    }, GAME.scanAutoExitDelay);
    return () => {
      clearTimeout(highlightTimer);
      clearTimeout(nudgeTimer);
      clearTimeout(autoExitTimer);
    };
  }, [activeScanning, foundClues.size]);

  // Derived
  const gameOver = lives <= 0 && phase !== 'solution';
  const clueLocked = phase === 'clue' && gameOver;
  const totalClues = question.clues.length;
  const criticalClues = useMemo(() => question.clues.map((c, i) => ({ ...c, idx: i })).filter(c => c.isCritical), [question.clues]);
  const auxiliaryClues = useMemo(() => question.clues.map((c, i) => ({ ...c, idx: i })).filter(c => c.isAuxiliary), [question.clues]);
  const allCriticalFound = criticalClues.every(c => foundClues.has(c.idx));
  const auxFoundCount = auxiliaryClues.filter(c => foundClues.has(c.idx)).length;

  // 找到新的輔助線索 → 補回 1 次掃描機會
  useEffect(() => {
    if (auxFoundCount > prevAuxFoundRef.current) {
      setScanUsesLeft(prev => prev + 1);
      showToast('🔍 +1 掃描機會（輔助線索獎勵）');
    }
    prevAuxFoundRef.current = auxFoundCount;
  }, [auxFoundCount]);
  // 推理順序：非輔助線索先，輔助線索排後（不阻擋主線，收集到才加入）
  const reasoningClues = useMemo(() => {
    const withIdx = question.clues.map((c, i) => ({ ...c, idx: i }));
    const main = withIdx.filter(c => foundClues.has(c.idx) && c.reasoning && !c.isAuxiliary);
    const aux = withIdx.filter(c => foundClues.has(c.idx) && c.reasoning && c.isAuxiliary);
    return [...main, ...aux];
  }, [question.clues, foundClues]);
  const reasoningDone = phase === 'reasoning' && reasoningStep >= reasoningClues.length;
  const livesLost = GAME.maxLives - lives;

  // Segments
  const cluesWithIdx = useMemo(() => question.clues.map((c, i) => ({ ...c, idx: i })), [question.clues]);

  // stemSegs：把 scaffolding 傳入 buildSegs
  // scaffoldingWithIdx 過濾 startIndex >= 0（在 mainStem 中的鷹架區域）
  // startIndex === -1 的鷹架區域留給 figureSegs 處理（下方）
  const scaffoldingWithIdx = useMemo(
    () => (question.scaffolding ?? []).map((s, i) => ({ ...s, idx: i })),
    [question.scaffolding]
  );
  const stemScaffolding = useMemo(() => scaffoldingWithIdx.filter(s => s.startIndex >= 0), [scaffoldingWithIdx]);
  // 第一個 context 型鷹架的 idx（用於閒置跳動提示）
  const firstContextScaffoldIdx = useMemo(
    () => {
      const first = stemScaffolding.find(s => question.scaffolding?.[s.idx]?.type === 'context');
      return first?.idx ?? null;
    },
    [stemScaffolding, question.scaffolding]
  );

  // idleShimmer 觸發時：若有 context 鷹架且尚無任何有效互動，改為跳動鷹架（取代全文掃光）
  useEffect(() => {
    if (!idleShimmer) return;
    if (firstContextScaffoldIdx !== null && foundClues.size === 0 && seenContextRegions.size === 0) {
      setIdleShimmer(false);
      setScaffoldPulse(true);
    }
  }, [idleShimmer, firstContextScaffoldIdx, foundClues.size, seenContextRegions.size]);

  // 有效互動後（命中線索或 context 鷹架）→ 停止跳動
  useEffect(() => {
    if (scaffoldPulse && (foundClues.size > 0 || seenContextRegions.size > 0)) {
      setScaffoldPulse(false);
    }
  }, [scaffoldPulse, foundClues.size, seenContextRegions.size]);

  // stemSegs：展開 mainStem 線索的 aliases，讓題幹中出現的同義詞也能被點擊命中
  const stemSegs = useMemo(() => {
    const stemClues: { startIndex: number; length: number; idx: number }[] = [];
    cluesWithIdx.filter(c => c.startIndex >= 0).forEach(c => {
      stemClues.push({ startIndex: c.startIndex, length: c.length, idx: c.idx });
      (c.aliases ?? []).forEach(alias => {
        let pos = question.mainStem.indexOf(alias);
        while (pos >= 0) {
          if (pos !== c.startIndex) stemClues.push({ startIndex: pos, length: alias.length, idx: c.idx });
          pos = question.mainStem.indexOf(alias, pos + alias.length);
        }
      });
    });

    const stemScaffold: { startIndex: number; length: number; idx: number }[] = [];
    scaffoldingWithIdx.filter(s => s.startIndex >= 0).forEach(s => {
      stemScaffold.push({ startIndex: s.startIndex, length: s.length, idx: s.idx });
      (question.scaffolding?.[s.idx]?.aliases ?? []).forEach(alias => {
        let pos = question.mainStem.indexOf(alias);
        while (pos >= 0) {
          if (pos !== s.startIndex) stemScaffold.push({ startIndex: pos, length: alias.length, idx: s.idx });
          pos = question.mainStem.indexOf(alias, pos + alias.length);
        }
      });
    });

    const raw = buildSegs(question.mainStem, stemClues, stemScaffold, question.stemTokens);
    const [indexed] = assignTokenIndices(raw, 0);
    return indexed;
  }, [question.mainStem, question.stemTokens, cluesWithIdx, scaffoldingWithIdx]);

  // stemBlankCount：stem 中空白詞段的數量，供 figureSegs 接續 tokenIndex 編號
  const stemBlankCount = useMemo(
    () => stemSegs.filter(s => s.clueIndex === null && s.scaffoldIndex === null).length,
    [stemSegs]
  );

  const figureClues = useMemo(() => cluesWithIdx.filter(c => c.startIndex === -1), [cluesWithIdx]);
  const figureSegs = useMemo(() => {
    if (!question.figure || !figureClues.length) return null;
    const figureScaffolding = scaffoldingWithIdx.filter(s => s.startIndex === -1);
    const allMatches: { start: number; end: number; clueIdx: number | null; scaffoldIdx: number | null }[] = [];

    figureClues.forEach(fc => {
      const texts = fc.aliases?.length ? fc.aliases : [fc.text];
      texts.forEach(t => {
        const start = question.figure!.indexOf(t);
        if (start >= 0) allMatches.push({ start, end: start + t.length, clueIdx: fc.idx, scaffoldIdx: null });
      });
    });

    figureScaffolding.forEach(fs => {
      const sRef = question.scaffolding?.[fs.idx];
      const texts = sRef?.aliases?.length ? sRef.aliases : [fs.text];
      texts.forEach(t => {
        const start = question.figure!.indexOf(t);
        if (start >= 0) allMatches.push({ start, end: start + t.length, clueIdx: null, scaffoldIdx: fs.idx });
      });
    });

    allMatches.sort((a, b) => a.start - b.start);
    if (!allMatches.length) return null;

    const segs: Seg[] = [];
    let cur = 0;
    allMatches.forEach(m => {
      if (m.start > cur) segs.push(...tokenizeBlank(question.figure!.slice(cur, m.start), cur));
      if (m.start >= cur) {
        segs.push({ text: question.figure!.slice(m.start, m.end), clueIndex: m.clueIdx, scaffoldIndex: m.scaffoldIdx, absStart: m.start });
        cur = m.end;
      }
    });
    if (cur < question.figure!.length) segs.push(...tokenizeBlank(question.figure!.slice(cur), cur));
    // tokenIndex 接續 stem 的編號，讓前後端可以唯一識別每個空白詞段
    const [indexed] = assignTokenIndices(segs, stemBlankCount);
    return indexed;
  }, [question.figure, figureClues, stemBlankCount]);

  // Auto-scroll & auto-advance
  useEffect(() => {
    const t = setTimeout(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, GAME.scrollDelay);
    return () => clearTimeout(t);
  }, [phase, foundClues.size, chatEvents.length, reasoningStep, reasoningMode, reasoningWrong, evidenceWrongMsg, wrongAttempts.length, answeredCorrectly]);
  useEffect(() => { if (reasoningDone) { const t = setTimeout(() => setPhase('answer'), GAME.answerAdvanceDelay); return () => clearTimeout(t); } }, [reasoningDone]);
  useEffect(() => { if (gameOver) { const t = setTimeout(() => setPhase('solution'), 1800); return () => clearTimeout(t); } }, [gameOver]);

  // ── Handlers ──
  const [clueFlyer, setClueFlyer] = useState<{ x: number, y: number, kfId: string } | null>(null);
  const [notebookShakeKey, setNotebookShakeKey] = useState(0);
  const [wrongFeedbackKey, setWrongFeedbackKey] = useState(0);
  const [wrongOptionIdx, setWrongOptionIdx] = useState<number | null>(null);
  const [lifeLossFeedbacks, setLifeLossFeedbacks] = useState<{ id: number; x: number; y: number }[]>([]);

  const triggerWrongFeedback = useCallback((e?: React.MouseEvent) => {
    setWrongFeedbackKey(prev => prev + 1);
    const x = e ? e.clientX : window.innerWidth / 2;
    const y = e ? e.clientY : window.innerHeight / 2;
    const newId = Date.now();
    setLifeLossFeedbacks(prev => [...prev, { id: newId, x, y }]);
    setTimeout(() => setLifeLossFeedbacks(prev => prev.filter(f => f.id !== newId)), 1000);
  }, []);

  // 共用飛行觸發：動態注入 @keyframes（避免 var() 在 keyframes 的相容問題）
  const triggerFlight = useCallback((e: React.MouseEvent) => {
    if (!clueTabRef.current) return;
    const tabRect = clueTabRef.current.getBoundingClientRect();
    const dx = tabRect.left + tabRect.width / 2 - e.clientX;
    const dy = tabRect.top + tabRect.height / 2 - e.clientY;
    const kfId = `cfl-${Date.now()}`;
    const styleEl = document.createElement('style');
    styleEl.id = kfId;
    styleEl.textContent = `
      @keyframes ${kfId}-x {
        0%   { transform: translateX(0); }
        100% { transform: translateX(${dx}px); }
      }
      @keyframes ${kfId}-y {
        0%   { transform: translateY(0) scale(1); opacity: 1; }
        35%  { transform: translateY(${dy * 0.1}px) scaleX(1.6) scaleY(0.55); opacity: 1; }
        70%  { transform: translateY(${dy * 0.72}px) scaleX(1.3) scaleY(0.7); opacity: 1; }
        100% { transform: translateY(${dy}px) scale(0.25); opacity: 0; }
      }
    `;
    document.head.appendChild(styleEl);
    setClueFlyer({ x: e.clientX, y: e.clientY, kfId });
    setTimeout(() => {
      document.getElementById(kfId)?.remove();
      setClueFlyer(null);
      setNotebookShakeKey(prev => prev + 1);
    }, 560);
  }, []);

  const onClueHit = useCallback((idx: number, e?: React.MouseEvent) => {
    if (clueLocked || foundClues.has(idx)) return;
    if (e) triggerFlight(e);
    const clue = question.clues[idx];
    const reaction = pick(clue.isAuxiliary ? DIALOGUE.auxiliaryClueReactions : DIALOGUE.clueReactions);
    setFoundClues(prev => new Set(prev).add(idx));
    setChatEvents(prev => [...prev, { type: 'clue', idx, reaction }]);
    setConsecutiveMisses(0);
    exitScanMode();
  }, [clueLocked, foundClues, triggerFlight, question.clues, exitScanMode]);

  const triggerMissIncrement = useCallback(() => {
    const next = consecutiveMisses + 1;
    if (next >= GAME.pityScanThreshold) {
      const hint = question.pityHint ?? DIALOGUE.pityCategoryHint(question.tags[1] ?? question.tags[0] ?? '本題');
      showToast(hint);
      setChatEvents(prev => [...prev, { type: 'pity', hint }]);
      setConsecutiveMisses(0);
    } else {
      setConsecutiveMisses(next);
    }
  }, [consecutiveMisses, question.pityHint, question.tags]);

  const onClueMiss = useCallback((e?: React.MouseEvent) => {
    if (clueLocked || activeScanning || stemExpanded) return;
    const msg = pick((DIALOGUE as any).clueMissReactions || [DIALOGUE.clueMiss]);
    setLives(prev => prev - 1);
    triggerWrongFeedback(e);
    showToast(msg);
    triggerMissIncrement();
  }, [clueLocked, activeScanning, triggerMissIncrement, triggerWrongFeedback]);

  const onContextHit = useCallback((regionIdx: number, e?: React.MouseEvent) => {
    const region = question.scaffolding?.[regionIdx];
    if (!region) return;
    const msg = region.hint || pick(DIALOGUE.contextHitReactions);
    showToast(msg);
    setConsecutiveMisses(0);
    exitScanMode();
    // 每個 context 區域只加一次泡泡（防止重複點同一處刷屏）
    if (!seenContextRegions.has(regionIdx)) {
      if (e) triggerFlight(e);
      setChatEvents(prev => [...prev, { type: 'context', hint: msg, text: region.text }]);
      setSeenContextRegions(prev => new Set(prev).add(regionIdx));
    }
  }, [question.scaffolding, seenContextRegions, triggerFlight, exitScanMode]);

  const onNoiseMiss = useCallback((regionIdx: number, e?: React.MouseEvent) => {
    if (clueLocked || activeScanning || stemExpanded) return;
    const region = question.scaffolding?.[regionIdx];
    const msg = region?.hint || pick(DIALOGUE.noiseHitReactions);
    setLives(prev => Math.max(0, prev - 1));
    triggerWrongFeedback(e);
    showToast(msg);
    triggerMissIncrement();
  }, [clueLocked, activeScanning, question.scaffolding, triggerMissIncrement, triggerWrongFeedback]);

  // [MODIFY] onSegTap：三層分歧邏輯（原本只有兩層：clue / miss）
  // clueIndex != null  → onClueHit（不變）
  // scaffoldIndex != null → 查 ScaffoldingRegion.type，呼叫 onContextHit 或 onNoiseMiss
  // 兩者皆 null        → onClueMiss（不變）
  const onSegTap = useCallback((seg: Seg, e: React.MouseEvent) => {
    // 首次點擊 → 隱藏首次進入的 persist toast
    if (!hasStartedInteracting) {
      setHasStartedInteracting(true);
      setIdleShimmer(false);
      setToast(null);
      setToastPersist(false);
    }
    // 掃描展開期間：線索和 context 鷹架可正常互動；noise 和空白只給提示不扣血
    const isContextScaffold = seg.scaffoldIndex !== null && question.scaffolding?.[seg.scaffoldIndex]?.type === 'context';
    if ((activeScanning || stemExpanded) && seg.clueIndex === null && !isContextScaffold) {
      showToast(DIALOGUE.scanMissProtected);
      return;
    }
    // 非有效互動點擊（miss）→ 重置閒置計時器（已永久禁用則跳過）
    if (!isIdleDisabled) {
      if (seg.clueIndex === null && seg.scaffoldIndex === null) {
        resetIdleTimer(false);
      } else if (seg.scaffoldIndex !== null && question.scaffolding?.[seg.scaffoldIndex]?.type === 'noise') {
        resetIdleTimer(false);
      }
    }

    if (seg.clueIndex !== null) {
      onClueHit(seg.clueIndex, e);
    } else if (seg.scaffoldIndex !== null) {
      const region = question.scaffolding?.[seg.scaffoldIndex];
      if (region?.type === 'context') onContextHit(seg.scaffoldIndex, e);
      else onNoiseMiss(seg.scaffoldIndex, e);
    } else {
      onClueMiss(e);
    }
  }, [activeScanning, stemExpanded, isIdleDisabled, hasStartedInteracting, onClueHit, onClueMiss, onContextHit, onNoiseMiss, question.scaffolding, resetIdleTimer]);

  const openNotebook = useCallback(() => {
    // 暫停 idle 計時器 + 隱藏 toast（筆記本蓋住題幹，提示會誤導）
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setToast(null);
    setToastPersist(false);
    setIsClosing(false);
    setIsNotebookOpen(true);
    setHasOpenedNotebook(true);
    setNotebookSeenCount(chatEvents.length);
  }, [chatEvents.length]);

  const closeNotebook = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsNotebookOpen(false);
      setIsClosing(false);
      // 重啟計時器但不清 shimmer（若已啟動則繼續顯示）
      // 重啟計時器，若尚未有有效互動則 8 秒後繼續跳動
      if (foundClues.size === 0 && seenContextRegions.size === 0) startIdleTimer(true);
    }, 260);
  }, [foundClues.size, seenContextRegions.size, startIdleTimer]);

  const enterReasoning = useCallback(() => { setPhase('reasoning'); setReasoningStep(0); setReasoningMode('choosing'); }, []);
  // 共用推理按鈕樣式：footer（小）與筆記本（大）同色同形，尺寸透過 padding 區分
  const reasoningBtnBase = 'rounded-full font-bold bg-cyan-600 text-white hover:bg-cyan-500 border border-cyan-400/30 shadow-[0_0_15px_rgba(8,145,178,0.35)] transition-all active:scale-95 whitespace-nowrap flex items-center justify-center';

  // [NEW] 關鍵線索斷句高亮演算法
  const currentHighlightRanges = useMemo(() => {
    if (!activeScanning) return { stem: [] as [number, number][], figure: [] as [number, number][] };
    
    // 找出所有尚未發現的關鍵線索 (isCritical: true)
    const targets = criticalClues.filter(c => !foundClues.has(c.idx));
    const findRange = (src: string, clue: { startIndex: number, length: number }) => {
      if (clue.startIndex < 0) return null;
      // 向前找斷句點
      let start = clue.startIndex;
      while (start > 0 && !'。！？\n'.includes(src[start - 1])) start--;
      // 向後找斷句點
      let end = clue.startIndex + clue.length;
      while (end < src.length && !'。！？\n'.includes(src[end])) end++;
      return [start, end] as [number, number];
    };

    const stemRanges = targets.filter(c => c.startIndex >= 0).map(c => findRange(question.mainStem, c)).filter(Boolean) as [number, number][];
    const figureRanges = targets.filter(c => c.startIndex === -1 || (question.figure && c.text && question.figure.includes(c.text))).map(c => {
      const texts = c.aliases?.length ? c.aliases : [c.text];
      return texts.map(t => {
        const startIdx = question.figure?.indexOf(t) ?? -1;
        if (startIdx === -1) return null;
        return findRange(question.figure!, { startIndex: startIdx, length: t.length });
      }).filter(Boolean);
    }).flat() as [number, number][];

    return { stem: stemRanges, figure: figureRanges };
  }, [scanHighlight, criticalClues, foundClues, question.mainStem, question.figure]);

  const onReasoningChoice = useCallback((choiceIdx: number, e: React.MouseEvent) => {
    const current = reasoningClues[reasoningStep];
    if (!current?.reasoning) return;
    if (choiceIdx === current.reasoning.answerIndex) { 
      setReasoningWrong(false); 
      setReasoningMode('pointing'); 
      setEvidenceWrongMsg(null); 
      setWrongOptionIdx(null); 
    } else { 
      setReasoningWrong(true); 
      setWrongOptionIdx(choiceIdx); 
      setLives(prev => Math.max(0, prev - 1)); 
      triggerWrongFeedback(e); 
    }
  }, [reasoningClues, reasoningStep, triggerWrongFeedback]);

  const onEvidencePoint = useCallback((clueIdx: number, e: React.MouseEvent) => {
    const current = reasoningClues[reasoningStep];
    if (!current) return;
    if (clueIdx === current.idx) {
      setEvidenceWrongMsg(null);
      setReasoningMode('choosing');
      setTimeout(() => setReasoningStep(prev => prev + 1), GAME.reasoningAdvanceDelay);
    } else {
      setLives(prev => Math.max(0, prev - 1));
      triggerWrongFeedback(e);
      setEvidenceWrongMsg(pick(DIALOGUE.wrongEvidence));
    }
  }, [reasoningClues, reasoningStep, triggerWrongFeedback]);

  const onSelectAnswer = useCallback((letter: string, e: React.MouseEvent) => {
    if (letter === question.answer) { 
      setAnsweredCorrectly(true); 
      setTimeout(() => setPhase('solution'), GAME.answerAdvanceDelay); 
    } else { 
      setWrongAttempts(prev => [...prev, letter]); 
      setLives(prev => Math.max(0, prev - 1)); 
      triggerWrongFeedback(e); 
    }
  }, [question.answer, triggerWrongFeedback]);

  // ── Stem rendering ──
  const clsFound = 'bg-amber-100 dark:bg-amber-500/20 border-b-2 border-amber-400 dark:border-amber-400/40';
  const clsPointable = clsFound + ' cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-500/30 ring-1 ring-amber-300 dark:ring-amber-500/30';
  const clsDim = 'opacity-30';
  const isCluePhase = phase === 'clue' && !clueLocked;
  const isPointingPhase = phase === 'reasoning' && reasoningMode === 'pointing';

  const renderSegs = (segs: Seg[], isFigure = false) => segs.map((seg, i) => {
    const isClue = seg.clueIndex !== null;
    const isFound = isClue && foundClues.has(seg.clueIndex!);
    
    if (isPointingPhase) {
      if (isFound) return <span key={i} onClick={(e) => onEvidencePoint(seg.clueIndex!, e)} className={clsPointable}>{seg.text}</span>;
      return <span key={i} className={clsDim}>{seg.text}</span>;
    }
    if (phase === 'reasoning') return <span key={i} className={isFound ? clsFound : clsDim}>{seg.text}</span>;
    if (isCluePhase) {
      const isBouncing = scaffoldPulse && !activeScanning && firstContextScaffoldIdx !== null && seg.scaffoldIndex === firstContextScaffoldIdx;
      
      // [V5.1 核心邏輯] 僅針對關鍵句子範圍呼吸，排除輔助線索與鷹架
      const ranges = isFigure ? currentHighlightRanges.figure : currentHighlightRanges.stem;
      const isInCriticalSentence = scanHighlight && ranges.some(([start, end]) => seg.absStart >= start && seg.absStart < end);
      
      if (isBouncing) {
        return <span key={i} onClick={(e) => onSegTap(seg, e)} className="cursor-pointer scaffold-pulse">{seg.text}</span>;
      }
      
      if (isInCriticalSentence) {
        return (
          <span key={i} onClick={(e) => onSegTap(seg, e)} className="cursor-pointer highlight-scan">
            {seg.text}
          </span>
        );
      }
      
      // 平時狀態：移除對掃描狀態的依賴，但在掃描時禁用 active 變色類別
      const activeCls = activeScanning ? '' : 'active:bg-slate-200 dark:active:bg-white/10';
      return <span key={i} onClick={(e) => onSegTap(seg, e)} className={`cursor-pointer transition-all duration-200 ${activeCls} ${isFound ? clsFound : ''}`}>{seg.text}</span>;
    }
    return <span key={i} className={isFound ? clsFound : ''}>{seg.text}</span>;
  });

  const D = DetectiveBubble;
  const S = StudentBubble;
  const achievement = ACHIEVEMENTS.find(a => a.check(foundClues.size, totalClues, livesLost, wrongAttempts.length, auxFoundCount, auxiliaryClues.length, lives <= 0));

  return (
    <div className="h-[100dvh] detective-paper text-slate-800 dark:text-white flex flex-col overflow-hidden">
      {/* Header + Tabs + Stem card — 全體木紋底色，case-file 浮卡 */}
      <div ref={headerRef} className="shrink-0 sticky top-0 z-10 bg-transparent">
        <header className="px-4 py-2 flex items-center gap-3">
          <button onClick={onBack} className="text-stone-600 dark:text-white/60 hover:text-stone-800 dark:hover:text-white/90 text-base flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            返回
          </button>
          <span className="flex-1 text-center text-sm text-stone-500 dark:text-white/40">{question.source}</span>
        </header>

        {/* Tabs — 資料夾索引，貼在浮卡頂端 */}
        <div className="max-w-2xl mx-auto px-4 pl-6 flex items-end h-9">
          <div className="folder-tab folder-tab-1 tab-active relative z-[3]">
            <span className="font-bold text-xs tracking-wider text-red-700 dark:text-red-400">機密檔案</span>
          </div>
          <button 
            ref={clueTabRef}
            onClick={openNotebook} 
            className={`folder-tab folder-tab-2 relative z-[2] -ml-2 transition-all ${notebookShakeKey > 0 ? 'animate-notebook-shake' : ''}`} key={`notebook-${notebookShakeKey}`}
          >
            <span className="text-xs font-medium text-amber-800/40 dark:text-white/35 flex items-center gap-1">
              偵探筆記本
              {(chatEvents.length > notebookSeenCount || (!!question.figureImage && !hasOpenedNotebook)) && (
                <span className="relative flex w-2 h-2 shrink-0">
                  <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
                  <span className="relative w-2 h-2 rounded-full bg-red-500" />
                </span>
              )}
            </span>
          </button>
          <div className="folder-tab folder-tab-3 relative z-[1] -ml-2 cursor-default">
            <div key={`hearts-${wrongFeedbackKey}`} className={wrongFeedbackKey > 0 ? 'animate-hearts-shake' : ''}>
              <LivesDisplay lives={lives} />
            </div>
          </div>
        </div>

        {/* Case-file 浮卡：左右 padding 露出木紋，底部 pb 露出木紋投影 */}
        <div className="max-w-2xl mx-auto px-4 pb-4">
          <div className={`case-file rounded-sm overflow-hidden transition-all duration-300 ${isPointingPhase ? 'ring-2 ring-amber-400/70 ring-inset' : ''} ${pointingFlash ? 'shadow-[0_0_0_4px_rgba(251,191,36,0.5)]' : ''}`}>
            <div className="px-4 pt-3 pb-4 space-y-2">
              {isPointingPhase
                ? (
                  <div className="flex items-center gap-2">
                    <span className="animate-bounce inline-block">👇</span>
                    <span className="case-file-header-label">{DIALOGUE.reasoningPointingBanner}</span>
                  </div>
                )
                : (
                  <div className="case-file-header flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="case-file-header-label">案件証詞</span>
                      <div className="case-file-header-rule flex-1" />
                    </div>
                    {phase === 'clue' && !clueLocked && (
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs text-slate-400 dark:text-white/30">{foundClues.size}/{totalClues}</span>
                        <button
                          disabled={scanUsesLeft <= 0}
                          onClick={() => {
                            setScanUsesLeft(prev => Math.max(0, prev - 1));
                            setActiveScanning(true);
                            setIsIdleDisabled(true); 
                            setHasStartedInteracting(true);
                            setIdleShimmer(false);
                            setScaffoldPulse(false);
                            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
                            if (foundClues.size === 0 && question.startHint) { showPersistToast(question.startHint); } else { showToast(DIALOGUE.scanActivate); }
                          }}
                        className={`shrink-0 ml-2 text-sm flex items-center justify-center gap-0.5 px-2 h-7 rounded-full border transition-all
                          ${scanUsesLeft <= 0
                            ? 'border-slate-200 dark:border-white/10 text-slate-300 dark:text-white/20 cursor-not-allowed'
                            : 'border-cyan-300 dark:border-cyan-700/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 shadow-sm active:scale-95'
                          }`}
                        title={scanUsesLeft <= 0 ? DIALOGUE.scanUsedUp : '掃描模式'}
                      >
                        🔍<span className="text-xs font-bold">{scanUsesLeft}</span>
                      </button>
                      </div>
                    )}
                  </div>
                )
              }
              <div className="stem-scroll-fade stem-only" ref={stemContainerRef}>
                <div className={`overflow-y-auto pb-6 sm:pb-0 transition-all duration-300 ${stemExpanded ? 'max-h-[55dvh]' : 'max-h-[25dvh] sm:max-h-none'}`}>
                  <p className={`text-base leading-relaxed text-slate-700 dark:text-white/85 whitespace-pre-line ${activeScanning ? 'stem-scan' : ''}`}>
                    {renderSegs(stemSegs)}
                  </p>
                  {question.figure && (
                    <div className="mt-5 border-l-2 border-red-800/25 dark:border-red-400/20 pl-3" ref={detailSectionRef}>
                      <span className="text-xs font-bold tracking-widest text-red-800/50 dark:text-red-400/40 select-none uppercase">証物細節</span>
                      <div className={`mt-1 text-base ${activeScanning ? 'stem-scan' : ''}`}>
                        <p className="text-slate-700 dark:text-white/80 leading-relaxed">
                          {figureSegs ? renderSegs(figureSegs, true) : question.figure}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat — position:relative 讓 FAB 能正確 absolute 定位 */}
      <main className={`flex-1 overflow-y-auto flex flex-col relative transition-opacity duration-300 ${isPointingPhase || activeScanning || stemExpanded ? 'opacity-30 pointer-events-none' : ''}`}>
        <div className="max-w-xl mx-auto px-4 py-4 space-y-4 mt-auto w-full">

        <D>{question.figureImage ? DIALOGUE.introWithFigure : DIALOGUE.intro}<br/><span className="text-cyan-600 dark:text-cyan-400 text-sm">{DIALOGUE.introHint}</span></D>

        {question.caseQuestion && (
          <>
            <TypedDetective delay="medium">
              <span className="font-medium text-amber-700 dark:text-amber-300">📌 本案問題：</span><br/>
              <RichText text={question.caseQuestion} />
            </TypedDetective>
            <TypedDetective delay="long">{DIALOGUE.caseQuestionPrompt}</TypedDetective>
          </>
        )}

        {chatEvents.map((event, i) => {
          if (event.type === 'clue') {
            const clue = question.clues[event.idx];
            const isAux = clue.isAuxiliary;
            const hasTeaser = !!clue.teaser;
            return (
              <div key={`chat-${i}`} className="space-y-3">
                <S>我覺得「{clue.text}」很可疑。</S>
                <TypedDetective delay="medium">
                  {event.reaction}
                  <span className={`font-medium ${isAux ? 'text-cyan-700 dark:text-cyan-300' : 'text-amber-700 dark:text-amber-300'}`}>「{clue.text}」</span>
                  {' — '}{hasTeaser ? <RichText text={clue.teaser} /> : <RichText text={clue.why} />}
                  {hasTeaser && <><br/><span className="text-cyan-600 dark:text-cyan-400 text-sm">{isAux ? DIALOGUE.auxiliaryNotebookCTA : DIALOGUE.clueNotebookCTA}</span></>}
                </TypedDetective>
              </div>
            );
          }
          if (event.type === 'context') {
            return <ContextBubble key={`chat-${i}`}><RichText text={event.hint} /></ContextBubble>;
          }
          if (event.type === 'pity') {
            return <PityBubble key={`chat-${i}`}><RichText text={event.hint} /></PityBubble>;
          }
          return null;
        })}

        {phase === 'clue' && clueLocked && !gameOver && foundClues.size < totalClues && <D>{DIALOGUE.clueLocked}</D>}
        {gameOver && <D>{DIALOGUE.gameOverTakeover}</D>}

        {(phase === 'reasoning' || phase === 'answer' || phase === 'solution') && reasoningClues.length > 0 && (
          <>
            <D>{DIALOGUE.reasoningIntro}</D>
            {reasoningClues.slice(0, phase === 'reasoning' ? reasoningStep + 1 : reasoningClues.length).map((rc, i) => {
              const r = rc.reasoning!;
              const isActive = phase === 'reasoning' && i === reasoningStep;
              const isCompleted = i < reasoningStep || phase !== 'reasoning';
              return (
                <div key={`r-${rc.idx}`} className="space-y-3">
                  <D>{r.prompt}</D>
                  {isActive && reasoningMode === 'choosing' && (
                    <div className="flex flex-col gap-2 my-2 pl-10">
                      {r.choices.map((choice, ci) => {
                        const isWrong = wrongOptionIdx === ci;
                        return (
                          <button 
                            key={`${ci}-${isWrong ? wrongFeedbackKey : 0}`} 
                            onClick={(e) => onReasoningChoice(ci, e)}
                            className={`text-left px-4 py-2 rounded-xl text-base border transition-colors duration-200
                              ${isWrong
                                ? 'border-red-400 dark:border-red-500/60 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 animate-wrong-shake'
                                : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-cyan-400 dark:hover:border-cyan-500/40 hover:bg-cyan-50 dark:hover:bg-cyan-900/10'
                              }`}
                          >{choice}</button>
                        );
                      })}
                    </div>
                  )}
                  {isActive && reasoningMode === 'choosing' && reasoningWrong && (
                    <>
                      <TypedDetective delay="short"><span className="text-red-500 dark:text-red-400">{DIALOGUE.reasoningWrongPrefix}</span><RichText text={r.wrong} /></TypedDetective>
                      {reasoningClues[reasoningStep]?.teaser && (
                        <TypedDetective delay="medium">{DIALOGUE.reasoningWrongNotebookHint}</TypedDetective>
                      )}
                    </>
                  )}
                  {isActive && reasoningMode === 'pointing' && (
                    <>
                      <S>我認為是「{r.choices[r.answerIndex]}」</S>
                      <TypedDetective delay="medium">
                        <span className="text-emerald-600 dark:text-emerald-400">{DIALOGUE.reasoningCorrect}</span> {DIALOGUE.reasoningCorrectMsg}那麼，<span className="font-medium text-amber-700 dark:text-amber-300">{DIALOGUE.reasoningAskEvidence}</span>。
                      </TypedDetective>
                      {evidenceWrongMsg && <TypedDetective delay="short"><span className="text-red-500 dark:text-red-400">✗</span> {evidenceWrongMsg}</TypedDetective>}
                    </>
                  )}
                  {isCompleted && (
                    <>
                      <S>我認為是「{r.choices[r.answerIndex]}」</S>
                      <D><span className="text-emerald-600 dark:text-emerald-400">{DIALOGUE.reasoningCorrect}</span> {DIALOGUE.reasoningCorrectMsg}請指出證據。</D>
                      <S>我指認「<span className="font-medium text-amber-700 dark:text-amber-300">{rc.text}</span>」作為證據。</S>
                      <D><span className="text-emerald-600 dark:text-emerald-400">{DIALOGUE.evidenceSuccess}</span><RichText text={r.correct} /></D>
                    </>
                  )}
                </div>
              );
            })}
            {reasoningDone && (
              <TypedDetective delay="long"><span className="text-emerald-600 dark:text-emerald-400 font-medium">{DIALOGUE.reasoningDone}</span><br/>{DIALOGUE.reasoningDoneAction}</TypedDetective>
            )}
          </>
        )}
        {phase === 'reasoning' && reasoningClues.length === 0 && (
          <>{(() => { setTimeout(() => setPhase('answer'), 500); return null; })()}</>
        )}

        {phase === 'answer' && !answeredCorrectly && (
          <>
            <D>{DIALOGUE.answerPrompt}</D>
            {question.figureImage && (
              <div className="flex gap-2.5 items-start bubble-in">
                <DetectiveAvatar />
                <div className="relative bg-white dark:bg-white/90 p-2 pb-3 shadow-lg rounded-sm case-photo" style={{ maxWidth: 220 }}>
                  <div className="absolute -top-4 right-5 z-10 rotate-[-8deg]"><PaperclipIcon /></div>
                  <img src={question.figureImage} alt="案件附圖" className="w-full rounded-sm mix-blend-darken dark:mix-blend-normal" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-1.5 my-2">
              {question.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const wasWrong = wrongAttempts.includes(letter);
                return (
                  <button key={i} onClick={(e) => !wasWrong && onSelectAnswer(letter, e)} disabled={wasWrong}
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
            <S>我選 ({wa})！</S>
            <TypedDetective delay="short"><span className="text-red-500 dark:text-red-400">{DIALOGUE.answerWrongPrefix}</span>({wa}) {DIALOGUE.answerWrongSuffix}</TypedDetective>
          </div>
        ))}
        {answeredCorrectly && (
          <>
            <S>我選 ({question.answer})！</S>
            <TypedDetective delay="long"><span className="text-emerald-600 dark:text-emerald-400 font-medium">{DIALOGUE.answerCorrect}</span> ({question.answer}) {DIALOGUE.answerCorrectSuffix}</TypedDetective>
          </>
        )}

        {phase === 'solution' && (
          <>
            {lives <= 0 && (
              <div className="text-xs font-bold text-red-500 dark:text-red-400 text-center tracking-wider py-1">{DIALOGUE.solutionGameOver}</div>
            )}
            <D>
              {DIALOGUE.solutionConceptLabel}
              <span className="inline-block mt-2 px-2.5 py-0.5 text-sm rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 font-medium">{question.concept.unit}</span>
            </D>
            <D>{question.concept.brief}</D>
            {question.questions.length > 0 && (
              <D>
                <span className="text-sm text-slate-400 dark:text-white/35">{DIALOGUE.solutionExtendLabel}</span><br/>
                {question.questions.map((q, i) => <span key={i} className="block mt-1">{q.prompt}</span>)}
              </D>
            )}
            <D>
              <span className="font-medium text-sm text-violet-600 dark:text-violet-400">{DIALOGUE.solutionStepsLabel}</span>
              <ol className="space-y-1.5 mt-1">
                {question.solution.steps.map((step, i) => <li key={i} className="flex gap-2"><span className="text-violet-600 dark:text-violet-400 font-bold text-sm mt-0.5">{i + 1}.</span><span>{step}</span></li>)}
              </ol>
            </D>
            {question.solution.commonMistakes?.length ? (
              <D>
                <span className="text-red-600 dark:text-red-400 font-medium text-sm">{DIALOGUE.solutionMistakesLabel}</span>
                <ul className="mt-1 space-y-1">{question.solution.commonMistakes.map((m, i) => <li key={i} className="text-sm text-slate-500 dark:text-white/40">• {m}</li>)}</ul>
              </D>
            ) : null}
            {question.clues.some((c, i) => !foundClues.has(i) && !c.isAuxiliary) && (
              <D>
                <span className="text-amber-600 dark:text-amber-400 font-medium text-sm">{DIALOGUE.solutionMissedLabel}</span>
                <ul className="mt-1 space-y-1">{question.clues.map((c, i) => (!foundClues.has(i) && !c.isAuxiliary) ? <li key={i} className="text-sm text-slate-500 dark:text-white/40">•「{c.text}」— {c.why}</li> : null)}</ul>
              </D>
            )}
            {!gameOver && auxiliaryClues.length > 0 && auxFoundCount < auxiliaryClues.length && foundClues.size >= totalClues - auxiliaryClues.length && (
              <D><span className="text-cyan-600 dark:text-cyan-400 text-sm italic">{DIALOGUE.solutionAuxiliaryMissed}</span></D>
            )}
            {!gameOver && auxiliaryClues.length > 0 && auxFoundCount === auxiliaryClues.length && (
              <D><span className="text-emerald-600 dark:text-emerald-400 text-sm">{DIALOGUE.solutionAuxiliaryFound}</span></D>
            )}
            <div className="rounded-xl p-4 flex items-center gap-4 text-sm bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800/20 my-2">
              <div className="text-center"><div className="text-xl font-bold text-amber-600 dark:text-amber-400">{foundClues.size}<span className="text-slate-400 dark:text-white/30 text-sm font-normal">/{totalClues}</span></div><div className="text-slate-400 dark:text-white/30">線索</div></div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
              <div className="text-center"><div className="text-xl font-bold text-red-500 dark:text-red-400">{livesLost}</div><div className="text-slate-400 dark:text-white/30">失誤</div></div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10" />
              <div className="text-center"><div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{wrongAttempts.length}</div><div className="text-slate-400 dark:text-white/30">錯答</div></div>
              <div className="flex-1 text-right">
                {achievement && <span className={`font-medium ${achievement.color}`}>{achievement.label}</span>}
              </div>
            </div>
          </>
        )}

        <div ref={chatEndRef} />
        </div>

        {/* FAB — 浮動在聊天區右下角，推理按鈕 or 結案返回 */}
        {phase === 'clue' && !gameOver && foundClues.size > 0 && (allCriticalFound || clueLocked) && (
          <div className="sticky bottom-4 flex justify-center px-4 pointer-events-none">
            <button
              onClick={enterReasoning}
              className={`${reasoningBtnBase} pointer-events-auto h-10 text-sm sm:text-base px-6 shadow-xl`}
            >
              {allCriticalFound ? DIALOGUE.clueReady : DIALOGUE.clueForceAdvance}
            </button>
          </div>
        )}
        {phase === 'solution' && (
          <div className="sticky bottom-4 flex justify-end px-4 pointer-events-none">
            <button
              onClick={onBack}
              className="pointer-events-auto h-10 text-sm px-6 rounded-full bg-white/80 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/50 hover:text-slate-700 shadow-xl backdrop-blur-sm transition-all active:scale-95"
            >
              回到題庫
            </button>
          </div>
        )}
      </main>

      {/* Toast — fixed z-[60]，永遠在最頂層，不被 notebook backdrop 壓住 */}
      {toast && (
        <div className="fixed inset-x-0 z-[60] flex justify-center pointer-events-none px-4" style={{ top: headerH + 10 }}>
          <div key={toastKey} className={`${toastPersist ? 'toast-persist' : 'toast-anim'} px-4 py-2 rounded-xl text-sm font-medium shadow-lg bg-amber-100 dark:bg-amber-500/90 text-amber-700 dark:text-black border border-amber-300 dark:border-transparent`}>
            <RichText text={toast ?? undefined} />
          </div>
        </div>
      )}

      {/* Notebook overlay — fixed top-down from below header */}
      {isNotebookOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            style={{ top: 0 }}
            onClick={closeNotebook}
          />
          {/* Outer wrapper — 不設 overflow，讓 paper-tear filter 自由延伸 */}
          <div
            className={`fixed inset-x-0 mx-auto z-50 w-full max-w-2xl flex flex-col ${isClosing ? 'notebook-slide-out' : 'notebook-slide-in'}`}
            style={{ top: '2dvh', height: '80dvh' }}
          >
            {/* 頂部撕裂紙邊 — 在 overflow:clip 容器外，filter 不被裁切 */}
            <div className="paper-tear-top" aria-hidden="true" />

            {/* 筆記本主體 — notebook-paper 自帶 overflow:clip 裁切內容 */}
            <div
              className="notebook-paper flex-1 flex flex-col min-h-0"
              style={{ boxShadow: '6px 10px 36px rgba(80,60,30,0.22), 2px 4px 12px rgba(80,60,30,0.1)' }}
            >
            {/* Header — shrink-0，固定不捲動，背景透明讓父層橫線穿透 */}
            <div className="shrink-0 max-w-xl mx-auto w-full px-6 pt-3 pb-3 border-b border-black/5 dark:border-white/5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-xl text-slate-700 dark:text-white/80 flex items-center gap-2">
                  <span className="text-2xl">📓</span> {DIALOGUE.notebookTitle}
                </h2>
                <button onClick={closeNotebook}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70">
                  ✕
                </button>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed italic text-slate-400 dark:text-white/30">
                {DIALOGUE.notebookSubtitle}
              </p>
            </div>

            {/* 筆記本內容（可捲動），背景透明讓父層橫線穿透 */}
            {/* min-h-0 修正 flex 子元素 min-height:auto 導致 overflow-y:auto 無效的問題 */}
            <div className="overflow-y-auto flex-1 bg-transparent" style={{ minHeight: 0, paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              <div className="max-w-xl mx-auto px-6 pt-5 pb-2">
                <div className="space-y-6">
                  {question.figureImage && (
                    <div className="flex justify-center py-2">
                      <div className="relative">
                        <div className="absolute -top-5 right-6 z-10 rotate-[-8deg]"><PaperclipIcon /></div>
                        <div className="bg-white dark:bg-white/90 p-2 pb-3 shadow-md rotate-[-1.5deg] rounded-sm case-photo">
                          <img
                            src={question.figureImage}
                            alt="案件附圖"
                            onClick={() => showToast(pick(DIALOGUE.evidencePhotoReactions))}
                            className="w-full max-w-[200px] mix-blend-darken dark:mix-blend-normal rounded-sm"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 嫌疑犯清單 — 多層漸進式除霧 */}
                  {(() => {
                    // 每找到一個關鍵線索解除一層，推理完成解除最後一層
                    const totalCritical = criticalClues.length;
                    const criticalFoundCount = criticalClues.filter(c => foundClues.has(c.idx)).length;
                    const reasoningComplete = phase === 'answer' || phase === 'solution';
                    const canIdentify = reasoningComplete;
                    // blurSteps = totalCritical + totalAuxiliary + 1；輔助各貢獻一層，最後一步留給推理完成
                    const totalAuxiliary = auxiliaryClues.length;
                    const blurSteps = totalCritical + totalAuxiliary + 1;
                    const remainingSteps = Math.max(0, blurSteps - criticalFoundCount - auxFoundCount - (reasoningComplete ? 1 : 0));
                    const blurPx = remainingSteps === 0 ? 0 : Math.round((remainingSteps / blurSteps) * 16);
                    return (
                      <div>
                        <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 border-b pb-1 transition-colors duration-500 ${
                          canIdentify
                            ? 'text-emerald-600/60 dark:text-emerald-400/50 border-emerald-200/40 dark:border-emerald-600/20'
                            : 'text-slate-400/60 dark:text-white/20 border-slate-100/60 dark:border-white/5'
                        }`}>
                          嫌疑犯名單
                          {canIdentify && <span className="ml-2 text-emerald-500">✓ 可指認</span>}
                        </h3>
                        <ul className="space-y-1">
                          {question.options.map((opt, i) => {
                            const letter = String.fromCharCode(65 + i);
                            return (
                              <li key={i}
                                onClick={() => {
                                  if (canIdentify) return;
                                  if (criticalFoundCount < totalCritical) showToast(pick(DIALOGUE.insufficientEvidenceReactions));
                                  else showToast('請先完成推理分析，再指認嫌疑犯！');
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all duration-500 ${
                                  canIdentify
                                    ? 'border-emerald-200/50 dark:border-emerald-600/20 bg-emerald-50/40 dark:bg-emerald-900/10 cursor-default'
                                    : 'border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] cursor-pointer'
                                }`}
                                style={{ boxShadow: canIdentify ? '0 0 10px rgba(52,211,153,0.12)' : 'none' }}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors duration-500 ${
                                  canIdentify
                                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/30'
                                }`}>{letter}</span>
                                <span
                                  className="text-slate-600 dark:text-white/60 leading-snug transition-all duration-700 select-none"
                                  style={{ filter: blurPx > 0 ? `blur(${blurPx}px)` : 'none' }}
                                >{opt}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })()}

                  <div>
                    <h3 className="text-xs font-bold text-red-800/40 dark:text-red-400/30 uppercase tracking-widest mb-3 border-b border-red-800/10 dark:border-red-400/10 pb-1">
                      {DIALOGUE.notebookCluesSection} ({foundClues.size}/{totalClues})
                    </h3>
                    {foundClues.size === 0 ? (
                      <div className="space-y-2 py-1">
                        <p className="text-sm text-slate-400 dark:text-white/25 italic">{DIALOGUE.notebookEmpty}</p>
                        {question.startHint && (
                          <div className="flex gap-2 items-start bg-amber-50/60 dark:bg-amber-900/10 rounded-lg px-3 py-2.5 border border-amber-200/40 dark:border-amber-700/20">
                            <span className="text-amber-500 shrink-0 mt-0.5">💡</span>
                            <p className="text-sm text-amber-800 dark:text-amber-300/80">{question.startHint}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {chatEvents.filter(e => e.type === 'clue').map((e, i) => {
                          const clue = question.clues[(e as { type: 'clue'; idx: number }).idx];
                          return (
                            <li key={i} className="flex flex-col gap-0.5">
                              <span className="text-amber-700 dark:text-amber-300 font-bold text-base flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 opacity-50" />
                                {clue.text}
                              </span>
                              <span className="text-slate-500 dark:text-white/50 pl-4 border-l-2 border-slate-100 dark:border-white/5 ml-0.5 py-1">
                                <RichText text={clue.why} />
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {chatEvents.some(e => e.type === 'context' || e.type === 'pity') && (
                    <div>
                      <h3 className="text-xs font-bold text-cyan-600/50 dark:text-cyan-400/40 uppercase tracking-widest mb-3 border-b border-cyan-600/10 dark:border-cyan-400/10 pb-1">
                        {DIALOGUE.notebookHintsSection}
                      </h3>
                      <ul className="space-y-2.5">
                        {chatEvents.filter(e => e.type === 'context' || e.type === 'pity').map((e, i) => (
                          <li key={i} className={`text-sm rounded-xl px-4 py-3 border shadow-sm relative overflow-hidden ${
                            e.type === 'pity'
                              ? 'text-amber-800 dark:text-amber-200/80 bg-amber-50/60 dark:bg-amber-900/15 border-amber-200/50 dark:border-amber-600/20'
                              : 'text-cyan-700 dark:text-cyan-300/80 bg-cyan-50/50 dark:bg-cyan-900/20 border-cyan-100/50 dark:border-cyan-800/20'
                          }`}>
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${e.type === 'pity' ? 'bg-amber-400/40' : 'bg-cyan-400/30'}`} />
                            {e.type === 'pity' && <span className="mr-1.5">🔍</span>}
                            {(e as { type: string; hint: string }).hint}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 底部捷徑：開始推理 */}
            {phase === 'clue' && !gameOver && (allCriticalFound || clueLocked) && (
              <div className="shrink-0 px-6 py-3 flex justify-center">
                <button
                  onClick={() => { closeNotebook(); setTimeout(enterReasoning, 280); }}
                  className={`${reasoningBtnBase} text-sm px-8 py-2.5`}
                >
                  {allCriticalFound ? DIALOGUE.clueReady : DIALOGUE.clueForceAdvance}
                </button>
              </div>
            )}
            </div>

            {/* 底部撕裂紙邊 — 在 overflow:clip 容器外，filter 不被裁切 */}
            <div className="paper-tear-bottom" aria-hidden="true" />
          </div>
        </>
      )}

      {/* SVG filter 定義 */}
      <svg style={{ display: 'none' }} aria-hidden="true">
        <defs>
          {/* 頂部：中等撕裂 */}
          <filter id="det-paper-tear-top" x="-2%" y="-80%" width="104%" height="300%">
            <feTurbulence type="fractalNoise" baseFrequency="0.055 0.09" numOctaves="4" seed="15" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="9" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* 底部：較低 x 頻率（長波）＋更高位移量，看起來更破爛 */}
          <filter id="det-paper-tear-bottom" x="-2%" y="-60%" width="104%" height="300%">
            <feTurbulence type="fractalNoise" baseFrequency="0.038 0.13" numOctaves="5" seed="7" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="16" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      {/* Clue Flyer — dual-container parabolic arc (dynamic keyframes) */}
      {clueFlyer && (
        <div
          className="clue-flyer-x"
          style={{
            left: clueFlyer.x,
            top: clueFlyer.y,
            animation: `${clueFlyer.kfId}-x 0.56s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
          } as React.CSSProperties}
        >
          <div
            className="clue-flyer-y"
            style={{ animation: `${clueFlyer.kfId}-y 0.56s cubic-bezier(0.45,0.05,0.55,0.95) forwards` }}
          />
        </div>
      )}
      {/* 飄浮扣血回饋 */}
      {lifeLossFeedbacks.map(f => (
        <span
          key={f.id}
          className="minus-life-pop text-xl font-black text-red-500 pointer-events-none whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
          style={{ left: `${f.x}px`, top: `${f.y}px` }}
        >
          -1 💔
        </span>
      ))}
    </div>
  );
}
