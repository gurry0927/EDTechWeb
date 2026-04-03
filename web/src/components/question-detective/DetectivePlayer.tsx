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

// ── Segment building ──

// [MODIFY] Seg 型別擴充：加入 scaffoldIndex 欄位
// 三種互斥的 segment 類型（不可同時非 null）：
//   clueIndex != null    → 線索片段，點擊 = 命中線索
//   scaffoldIndex != null → 鷹架片段，點擊 = context/noise 回應（看 ScaffoldingRegion.type）
//   兩者皆 null          → 空白片段，點擊 = 失誤扣血
interface Seg {
  text: string;
  clueIndex: number | null;
  scaffoldIndex: number | null; // [NEW] index into question.scaffolding[]；null = 非鷹架區
}

// [MODIFY] buildSegs 函式：同時處理 clues 與 scaffolding regions
//
// 新參數 scaffolding：來自 question.scaffolding（過濾 startIndex >= 0 的，-1 的由 buildFigureSegs 另行處理）
// 若 question.scaffolding 未定義，直接傳 [] 即可，行為與舊版相同。
//
// 演算法：
//   1. 合併 clues + scaffolding 為統一的「標記區間」清單，依 startIndex 排序
//   2. 走訪字串，對每個區間和間隔生成對應 Seg
//   3. 確保區間不重疊（JSON 格式正確時不應有重疊，可不做防護）
//
// 範例：src = "此種工具在十八至十九世紀之間..."
//   clues = [{ startIndex: 37, length: 7, idx: 1 }]           → "十八至十九世紀"
//   scaffolding = [{ startIndex: 3, length: 5, idx: 0 }]      → "工具在十"（假設是 context）
//   輸出 segs: ["此種", {scaffold:0,"工具在十"}, "八", {clue:1,"十八至十九世紀"}, "之間..."]
//   （注意：上例僅示意，實際座標請以真實 JSON 為準）
function buildSegs(
  src: string,
  clues: { startIndex: number; length: number; idx: number }[],
  scaffolding: { startIndex: number; length: number; idx: number }[],
): Seg[] {
  interface Mark { start: number; end: number; clueIdx: number | null; scaffoldIdx: number | null }
  const marks: Mark[] = [
    ...clues.filter(c => c.startIndex >= 0).map(c => ({ start: c.startIndex, end: c.startIndex + c.length, clueIdx: c.idx, scaffoldIdx: null })),
    ...scaffolding.filter(s => s.startIndex >= 0).map(s => ({ start: s.startIndex, end: s.startIndex + s.length, clueIdx: null, scaffoldIdx: s.idx })),
  ].sort((a, b) => a.start - b.start);

  if (!marks.length) return [{ text: src, clueIndex: null, scaffoldIndex: null }];

  const segs: Seg[] = [];
  let cur = 0;
  marks.forEach(m => {
    if (m.start > cur) {
      segs.push({ text: src.slice(cur, m.start), clueIndex: null, scaffoldIndex: null });
    }
    // 防止重疊導致的重複切片（基本防護）
    if (m.start >= cur) {
      segs.push({ text: src.slice(m.start, m.end), clueIndex: m.clueIdx, scaffoldIndex: m.scaffoldIdx });
      cur = m.end;
    }
  });
  if (cur < src.length) {
    segs.push({ text: src.slice(cur), clueIndex: null, scaffoldIndex: null });
  }
  return segs;
}

// ── Types ──
type Phase = 'clue' | 'reasoning' | 'answer' | 'solution';
type ReasoningMode = 'choosing' | 'pointing';
type ChatEvent =
  | { type: 'clue';    idx: number }
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
  const [showPulse, setShowPulse] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
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
  const [scanOnCooldown, setScanOnCooldown] = useState(false);


  useEffect(() => { const t = setTimeout(() => setShowPulse(false), GAME.scanDuration); return () => clearTimeout(t); }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeaderH(el.offsetHeight));
    ro.observe(el);
    setHeaderH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { if (!toast) return; const t = setTimeout(() => setToast(null), 1400); return () => clearTimeout(t); }, [toast]);

  useEffect(() => {
    if (!activeScanning) return;
    const offTimer = setTimeout(() => {
      setActiveScanning(false);
      setScanOnCooldown(true);
    }, GAME.scanActiveDuration);
    return () => clearTimeout(offTimer);
  }, [activeScanning]);

  useEffect(() => {
    if (!scanOnCooldown) return;
    const coolTimer = setTimeout(() => setScanOnCooldown(false), GAME.scanCooldown);
    return () => clearTimeout(coolTimer);
  }, [scanOnCooldown]);

  // Derived
  const clueLocked = phase === 'clue' && lives <= 0;
  const totalClues = question.clues.length;
  const criticalClues = useMemo(() => question.clues.map((c, i) => ({ ...c, idx: i })).filter(c => c.isCritical), [question.clues]);
  const allCriticalFound = criticalClues.every(c => foundClues.has(c.idx));
  const reasoningClues = useMemo(() => question.clues.map((c, i) => ({ ...c, idx: i })).filter(c => foundClues.has(c.idx) && c.reasoning), [question.clues, foundClues]);
  const reasoningDone = phase === 'reasoning' && reasoningStep >= reasoningClues.length;
  const livesLost = GAME.maxLives - lives;

  // Segments
  const cluesWithIdx = useMemo(() => question.clues.map((c, i) => ({ ...c, idx: i })), [question.clues]);

  // [MODIFY] stemSegs：把 scaffolding 傳入 buildSegs
  // scaffoldingWithIdx 過濾 startIndex >= 0（在 mainStem 中的鷹架區域）
  // startIndex === -1 的鷹架區域留給 figureSegs 處理（下方）
  const scaffoldingWithIdx = useMemo(
    () => (question.scaffolding ?? []).map((s, i) => ({ ...s, idx: i })),
    [question.scaffolding]
  );
  const stemScaffolding = useMemo(() => scaffoldingWithIdx.filter(s => s.startIndex >= 0), [scaffoldingWithIdx]);
  // [MODIFY] 傳入第三個參數 stemScaffolding
  const stemSegs = useMemo(() => buildSegs(question.mainStem, cluesWithIdx.filter(c => c.startIndex >= 0), stemScaffolding), [question.mainStem, cluesWithIdx, stemScaffolding]);
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
      const start = question.figure!.indexOf(fs.text);
      if (start >= 0) allMatches.push({ start, end: start + fs.text.length, clueIdx: null, scaffoldIdx: fs.idx });
    });

    allMatches.sort((a, b) => a.start - b.start);
    if (!allMatches.length) return null;

    const segs: Seg[] = [];
    let cur = 0;
    allMatches.forEach(m => {
      if (m.start > cur) segs.push({ text: question.figure!.slice(cur, m.start), clueIndex: null, scaffoldIndex: null });
      if (m.start >= cur) {
        segs.push({ text: question.figure!.slice(m.start, m.end), clueIndex: m.clueIdx, scaffoldIndex: m.scaffoldIdx });
        cur = m.end;
      }
    });
    if (cur < question.figure!.length) segs.push({ text: question.figure!.slice(cur), clueIndex: null, scaffoldIndex: null });
    return segs;
  }, [question.figure, figureClues]);

  // Auto-scroll & auto-advance
  useEffect(() => {
    const t = setTimeout(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, GAME.scrollDelay);
    return () => clearTimeout(t);
  }, [phase, foundClues.size, chatEvents.length, reasoningStep, reasoningMode, reasoningWrong, evidenceWrongMsg, wrongAttempts.length, answeredCorrectly]);
  useEffect(() => { if (reasoningDone) { const t = setTimeout(() => setPhase('answer'), GAME.answerAdvanceDelay); return () => clearTimeout(t); } }, [reasoningDone]);

  // ── Handlers ──
  const onClueHit = useCallback((idx: number) => {
    if (clueLocked || foundClues.has(idx)) return;
    setFoundClues(prev => new Set(prev).add(idx));
    setChatEvents(prev => [...prev, { type: 'clue', idx }]);
    setConsecutiveMisses(0);
  }, [clueLocked, foundClues]);

  const triggerMissIncrement = useCallback(() => {
    const next = consecutiveMisses + 1;
    if (next >= GAME.pityScanThreshold) {
      const hint = question.pityHint ?? DIALOGUE.pityCategoryHint(question.tags[1] ?? question.tags[0] ?? '本題');
      setToast(hint);
      setChatEvents(prev => [...prev, { type: 'pity', hint }]);
      setConsecutiveMisses(0);
    } else {
      setConsecutiveMisses(next);
    }
  }, [consecutiveMisses, question.pityHint, question.tags]);

  const onClueMiss = useCallback(() => {
    if (clueLocked) return;
    const msg = pick((DIALOGUE as any).clueMissReactions || [DIALOGUE.clueMiss]);
    setLives(prev => prev - 1);
    setToast(msg);
    triggerMissIncrement();
  }, [clueLocked, triggerMissIncrement]);

  const onContextHit = useCallback((regionIdx: number) => {
    const region = question.scaffolding?.[regionIdx];
    if (!region) return;
    const msg = region.hint || pick(DIALOGUE.contextHitReactions);
    setToast(msg);
    setConsecutiveMisses(0);
    // 每個 context 區域只加一次泡泡（防止重複點同一處刷屏）
    if (!seenContextRegions.has(regionIdx)) {
      setChatEvents(prev => [...prev, { type: 'context', hint: msg, text: region.text }]);
      setSeenContextRegions(prev => new Set(prev).add(regionIdx));
    }
  }, [question.scaffolding, seenContextRegions]);

  const onNoiseMiss = useCallback((regionIdx: number) => {
    if (clueLocked) return;
    const region = question.scaffolding?.[regionIdx];
    const msg = region?.hint || pick(DIALOGUE.noiseHitReactions);
    setLives(prev => Math.max(0, prev - 1));
    setToast(msg);
    triggerMissIncrement();
  }, [clueLocked, question.scaffolding, triggerMissIncrement]);

  // [MODIFY] onSegTap：三層分歧邏輯（原本只有兩層：clue / miss）
  // clueIndex != null  → onClueHit（不變）
  // scaffoldIndex != null → 查 ScaffoldingRegion.type，呼叫 onContextHit 或 onNoiseMiss
  // 兩者皆 null        → onClueMiss（不變）
  const onSegTap = useCallback((seg: Seg) => {
    if (seg.clueIndex !== null) {
      onClueHit(seg.clueIndex);
    } else if (seg.scaffoldIndex !== null) {
      const region = question.scaffolding?.[seg.scaffoldIndex];
      if (region?.type === 'context') onContextHit(seg.scaffoldIndex);
      else onNoiseMiss(seg.scaffoldIndex);
    } else {
      onClueMiss();
    }
  }, [onClueHit, onClueMiss, onContextHit, onNoiseMiss, question.scaffolding]);

  const openNotebook = useCallback(() => {
    setIsClosing(false);
    setIsNotebookOpen(true);
    setNotebookSeenCount(chatEvents.length);
  }, [chatEvents.length]);

  const closeNotebook = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => { setIsNotebookOpen(false); setIsClosing(false); }, 260);
  }, []);

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
    if (clueIdx === current.idx) { setEvidenceWrongMsg(null); setReasoningMode('choosing'); setTimeout(() => setReasoningStep(prev => prev + 1), GAME.reasoningAdvanceDelay); }
    else { setLives(prev => Math.max(0, prev - 1)); setEvidenceWrongMsg(pick(DIALOGUE.wrongEvidence)); }
  }, [reasoningClues, reasoningStep]);

  const onSelectAnswer = useCallback((letter: string) => {
    if (letter === question.answer) { setAnsweredCorrectly(true); setTimeout(() => setPhase('solution'), GAME.answerAdvanceDelay); }
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

  const D = DetectiveBubble;
  const S = StudentBubble;
  const achievement = ACHIEVEMENTS.find(a => a.check(foundClues.size, totalClues, livesLost, wrongAttempts.length));

  return (
    <div className="h-[100dvh] detective-paper text-slate-800 dark:text-white flex flex-col overflow-hidden">
      {/* Header + Stem + Tabs */}
      <div ref={headerRef} className="shrink-0 sticky top-0 z-10">
        <header className="px-4 py-2 flex items-center gap-3 case-file border-b border-amber-200/20 dark:border-white/5">
          <button onClick={onBack} className="text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 text-base flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            返回
          </button>
          <span className="flex-1 text-center text-sm text-slate-400 dark:text-white/40">{question.source}</span>
          <button onClick={openNotebook} className="relative text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/80 text-base p-1">
            📓
            {chatEvents.length > notebookSeenCount && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500">
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
              </span>
            )}
          </button>
        </header>

        <div className={`case-file transition-all duration-300 ${isPointingPhase ? 'ring-2 ring-amber-400/50 ring-inset' : ''}`}>
          <div className="max-w-2xl mx-auto px-4 py-3 space-y-2">
            {isPointingPhase && <div className="text-sm text-amber-600 dark:text-amber-400 font-medium">{DIALOGUE.reasoningPointingBanner}</div>}
            <div>
              <p className={`text-base leading-relaxed text-slate-700 dark:text-white/85 whitespace-pre-line ${showPulse || activeScanning ? 'stem-scan' : ''} ${activeScanning ? 'magnifier-active' : ''}`}>
                {renderSegs(stemSegs, onSegTap)}
              </p>
              {question.figure && (
                <div className={`mt-2 px-2 py-1.5 rounded text-sm ${showPulse ? 'stem-scan' : ''}`}>
                  <p className="text-slate-500 dark:text-white/45 leading-relaxed">
                    {figureSegs ? renderSegs(figureSegs, onSegTap) : question.figure}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex items-end h-9">
          <div className="folder-tab folder-tab-1 tab-active relative z-[3]">
            <span className="font-bold text-xs tracking-wider text-red-700 dark:text-red-400">機密檔案</span>
          </div>
          <button onClick={openNotebook} className="folder-tab folder-tab-2 relative z-[2] -ml-2">
            <span className="text-xs font-medium text-amber-800/40 dark:text-white/35 flex items-center gap-1">
              線索 {foundClues.size}/{totalClues}
              {question.figureImage && <span className="opacity-50">🖇</span>}
            </span>
            {chatEvents.length > notebookSeenCount && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500">
                <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75" />
              </span>
            )}
          </button>
          <div className="folder-tab folder-tab-3 relative z-[1] -ml-2 cursor-default">
            <LivesDisplay lives={lives} />
          </div>
        </div>
      </div>

      {/* Chat */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {toast && (
          <div className="sticky top-2 z-30 flex justify-center pointer-events-none px-4">
            <div className="px-4 py-2 rounded-xl text-sm font-medium shadow-md bg-amber-100 dark:bg-amber-500/90 text-amber-800 dark:text-black border border-amber-300 dark:border-transparent">
              {toast}
            </div>
          </div>
        )}
        <div className="max-w-xl mx-auto px-4 py-4 space-y-4 mt-auto w-full">

        <D>{DIALOGUE.intro}<br/><span className="text-cyan-600 dark:text-cyan-400 text-sm">{DIALOGUE.introHint}</span></D>

        {chatEvents.map((event, i) => {
          if (event.type === 'clue') {
            const clue = question.clues[event.idx];
            return (
              <div key={`chat-${i}`} className="space-y-3">
                <S>我覺得「{clue.text}」很可疑。</S>
                <TypedDetective delay="medium">
                  {pick(DIALOGUE.clueReactions)}
                  <span className="font-medium text-amber-700 dark:text-amber-300">「{clue.text}」</span>
                  {' — '}{clue.why}
                </TypedDetective>
              </div>
            );
          }
          if (event.type === 'context') {
            return <ContextBubble key={`chat-${i}`}>{event.hint}</ContextBubble>;
          }
          if (event.type === 'pity') {
            return <PityBubble key={`chat-${i}`}>{event.hint}</PityBubble>;
          }
          return null;
        })}

        {phase === 'clue' && clueLocked && foundClues.size < totalClues && <D>{DIALOGUE.clueLocked}</D>}

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
                      {r.choices.map((choice, ci) => (
                        <button key={ci} onClick={() => onReasoningChoice(ci)} className="text-left px-4 py-2 rounded-xl text-base border border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.04] hover:border-cyan-400 dark:hover:border-cyan-500/40 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 transition-all">{choice}</button>
                      ))}
                    </div>
                  )}
                  {isActive && reasoningMode === 'choosing' && reasoningWrong && (
                    <TypedDetective delay="short"><span className="text-red-500 dark:text-red-400">{DIALOGUE.reasoningWrongPrefix}</span>{r.wrong}</TypedDetective>
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
                      <D><span className="text-emerald-600 dark:text-emerald-400">{DIALOGUE.evidenceSuccess}</span>{r.correct}</D>
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
            {foundClues.size < totalClues && (
              <D>
                <span className="text-amber-600 dark:text-amber-400 font-medium text-sm">{DIALOGUE.solutionMissedLabel}</span>
                <ul className="mt-1 space-y-1">{question.clues.map((c, i) => foundClues.has(i) ? null : <li key={i} className="text-sm text-slate-500 dark:text-white/40">•「{c.text}」— {c.why}</li>)}</ul>
              </D>
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
      </main>

      {/* Fixed bottom bar */}
      <footer className="shrink-0 border-t border-amber-200/30 dark:border-white/10" style={{ backgroundColor: 'var(--det-paper)', paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        {phase === 'clue' && foundClues.size > 0 && (
          <div className="px-4 py-2.5 flex justify-center">
            {allCriticalFound || clueLocked ? (
              <button onClick={enterReasoning} className="px-6 py-2.5 rounded-full text-base font-medium bg-cyan-600 text-white hover:bg-cyan-500 shadow-md transition-all">
                {allCriticalFound ? DIALOGUE.clueReady : DIALOGUE.clueForceAdvance}
              </button>
            ) : (
              <span className="text-sm text-slate-400 dark:text-white/35">{DIALOGUE.clueHintMore}</span>
            )}
          </div>
        )}

        {phase === 'clue' && !clueLocked && (
          <div className="px-4 pb-1 flex justify-end">
            <button
              disabled={scanOnCooldown}
              onClick={() => { setActiveScanning(true); setToast(DIALOGUE.scanActivate); }}
              className={`text-xs flex items-center gap-1 px-3 py-1 rounded-full border transition-all
                ${scanOnCooldown
                  ? 'border-slate-200 dark:border-white/10 text-slate-300 dark:text-white/20 cursor-not-allowed'
                  : 'border-cyan-300 dark:border-cyan-700/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/10 shadow-sm active:scale-95'
                }`}
            >
              🔍 {scanOnCooldown ? DIALOGUE.scanCooldownMsg : '掃描模式'}
            </button>
          </div>
        )}

        <div className="px-4 py-1.5 flex items-center justify-between">
          <span className="text-xs text-slate-300 dark:text-white/20">{question.tags.slice(0, 3).map(t => `#${t}`).join(' ')}</span>
          {phase === 'solution' && <button onClick={onBack} className="text-sm text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/70">回到題庫</button>}
        </div>
      </footer>

      {/* Notebook overlay — fixed top-down from below header */}
      {isNotebookOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            style={{ top: headerH }}
            onClick={closeNotebook}
          />
          <div
            className={`fixed inset-x-0 mx-auto z-50 w-full max-w-2xl overflow-hidden flex flex-col ${isClosing ? 'notebook-slide-out' : 'notebook-slide-in'}`}
            style={{ top: headerH + 10, maxHeight: '68vh', boxShadow: '6px 10px 36px rgba(80,60,30,0.22), 2px 4px 12px rgba(80,60,30,0.1)' }}
          >
            {/* 頂部撕裂紙邊 */}
            <div className="paper-tear-top" aria-hidden="true" />

            {/* 筆記本內容（可捲動） */}
            <div className="notebook-paper overflow-y-auto flex-1" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
              <div className="max-w-xl mx-auto px-6 pt-5 pb-2">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-xl text-slate-700 dark:text-white/80 flex items-center gap-2">
                    <span className="text-2xl">📓</span> {DIALOGUE.notebookTitle}
                  </h2>
                  <button onClick={closeNotebook}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-white/40 hover:text-slate-600 dark:hover:text-white/70">
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  {question.figureImage && (
                    <div className="flex justify-center py-2">
                      <div className="relative">
                        <div className="absolute -top-5 right-6 z-10 rotate-[-8deg]"><PaperclipIcon /></div>
                        <div className="bg-white dark:bg-white/90 p-2 pb-3 shadow-md rotate-[-1.5deg] rounded-sm">
                          <img src={question.figureImage} alt="案件附圖" className="w-full max-w-[260px] mix-blend-darken dark:mix-blend-normal rounded-sm" />
                        </div>
                      </div>
                    </div>
                  )}

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
                                {clue.why}
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

            {/* 底部撕裂紙邊（更破爛） */}
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

    </div>
  );
}
