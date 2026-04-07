import { useState } from 'react';
import type { DetectiveQuestion } from '../types';
import { TextMarker, type MarkActions } from './TextMarker';

type SegKind = 'critical' | 'auxiliary' | 'context' | 'noise' | 'blank';

interface SegInfo {
  text: string;
  kind: SegKind;
  tokenIndex?: number;
  segIndex: number;
}

function findAllOccurrences(haystack: string, needle: string): number[] {
  const positions: number[] = [];
  let from = 0;
  while (from <= haystack.length - needle.length) {
    const pos = haystack.indexOf(needle, from);
    if (pos < 0) break;
    positions.push(pos);
    from = pos + 1;
  }
  return positions;
}

function buildSegInfos(
  q: DetectiveQuestion,
  tokens: string[],
  location: 'stem' | 'figure',
): SegInfo[] {
  const src = location === 'stem' ? q.mainStem : q.figure;

  interface Mark { start: number; end: number; kind: SegKind }
  const marks: Mark[] = [];
  const primaryStarts = new Set<number>();

  for (const c of q.clues) {
    if (c.location === location) {
      const kind: SegKind = c.isCritical ? 'critical' : 'auxiliary';
      marks.push({ start: c.startIndex, end: c.startIndex + c.length, kind });
      primaryStarts.add(c.startIndex);
    }
  }
  for (const s of q.scaffolding ?? []) {
    if (s.location === location) {
      marks.push({ start: s.startIndex, end: s.startIndex + s.length, kind: s.type === 'context' ? 'context' : 'noise' });
      primaryStarts.add(s.startIndex);
    }
  }

  if (src) {
    for (const c of q.clues) {
      const kind: SegKind = c.isCritical ? 'critical' : 'auxiliary';
      for (const alias of c.aliases ?? []) {
        for (const pos of findAllOccurrences(src, alias)) {
          if (!primaryStarts.has(pos)) {
            marks.push({ start: pos, end: pos + alias.length, kind });
          }
        }
      }
    }
    for (const s of q.scaffolding ?? []) {
      const kind: SegKind = s.type === 'context' ? 'context' : 'noise';
      for (const alias of s.aliases ?? []) {
        for (const pos of findAllOccurrences(src, alias)) {
          if (!primaryStarts.has(pos)) {
            marks.push({ start: pos, end: pos + alias.length, kind });
          }
        }
      }
    }
  }

  let charPos = 0;
  let blankIdx = 0;
  return tokens.map((text, i) => {
    const end = charPos + text.length;
    const mark = marks.find(m => m.start < end && m.end > charPos);
    const kind = mark?.kind ?? 'blank';
    const info: SegInfo = { text, kind, segIndex: i, ...(kind === 'blank' ? { tokenIndex: blankIdx++ } : {}) };
    charPos = end;
    return info;
  });
}

const KIND_STYLE: Record<SegKind, string> = {
  critical:  'bg-blue-200 text-blue-900 ring-1 ring-blue-400',
  auxiliary: 'bg-sky-100 text-sky-800 ring-1 ring-sky-300',
  context:   'bg-amber-200 text-amber-900 ring-1 ring-amber-400',
  noise:     'bg-red-200 text-red-900 ring-1 ring-red-400',
  blank:     'bg-slate-200 text-slate-700 hover:bg-slate-300',
};

const KIND_LABEL: Record<SegKind, string> = {
  critical:  '關鍵線索',
  auxiliary: '輔助線索',
  context:   '脈絡',
  noise:     '雜訊',
  blank:     '',
};

interface Props {
  question: DetectiveQuestion;
  onMergeStem: (a: number, b: number) => void;
  onMergeFigure: (a: number, b: number) => void;
  onSplitStem: (segIndex: number, charOffset: number) => void;
  onSplitFigure: (segIndex: number, charOffset: number) => void;
  markActions: MarkActions;
}

export function StemVisualizer({ question, onMergeStem, onMergeFigure, onSplitStem, onSplitFigure, markActions }: Props) {
  const stemTokens = question.stemTokens;
  const figureTokens = question.figureTokens;
  const hasFigure = !!question.figure;

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      {/* ── 題幹 ── */}
      <section className="space-y-3">
        <div className="text-xs font-semibold text-slate-400 tracking-widest uppercase">題幹</div>
        <TextMarker
          text={question.mainStem}
          location="stem"
          clues={question.clues}
          scaffolding={question.scaffolding ?? []}
          actions={markActions}
        />
        {stemTokens ? (
          <>
            <div className="text-[11px] text-slate-400 mt-1">詞段切分</div>
            <TokenRow segs={buildSegInfos(question, stemTokens, 'stem')} onMerge={onMergeStem} onSplit={onSplitStem} />
            <ValidationBadge tokens={stemTokens} source={question.mainStem} label="mainStem" />
          </>
        ) : (
          <div className="text-slate-400 text-xs">尚未切分 — 先標記線索/鷹架，再執行 AI 切分</div>
        )}
      </section>

      {/* ── 證物細節 ── */}
      {hasFigure && (
        <section className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 tracking-widest uppercase">證物細節</div>
          <TextMarker
            text={question.figure!}
            location="figure"
            clues={question.clues}
            scaffolding={question.scaffolding ?? []}
            actions={markActions}
          />
          {figureTokens ? (
            <>
              <div className="text-[11px] text-slate-400 mt-1">詞段切分</div>
              <TokenRow segs={buildSegInfos(question, figureTokens, 'figure')} onMerge={onMergeFigure} onSplit={onSplitFigure} />
              <ValidationBadge tokens={figureTokens} source={question.figure!} label="figure" />
            </>
          ) : (
            <div className="text-slate-400 text-xs">尚未切分</div>
          )}
        </section>
      )}

      {/* 圖例 + 操作說明 */}
      <div className="space-y-2 border-t border-slate-200 pt-3">
        <div className="flex gap-3 flex-wrap text-xs">
          {(['critical', 'auxiliary', 'context', 'noise', 'blank'] as const).map(k => (
            <span key={k} className={`px-2 py-0.5 rounded ${KIND_STYLE[k]}`}>
              {k === 'blank' ? '空白 #n' : KIND_LABEL[k]}
            </span>
          ))}
        </div>
        <div className="text-[11px] text-slate-400">
          拖選原文 → 建立標記 ・ 點擊空白詞段 ✂ 拆分 ・ 相鄰空白 ⊕ 合併
        </div>
      </div>
    </div>
  );
}

function ValidationBadge({ tokens, source, label }: { tokens: string[]; source: string; label: string }) {
  const valid = tokens.join('') === source;
  return (
    <div className="text-xs font-mono text-slate-500 mt-1">
      <span className="font-semibold text-slate-400">串接驗證（{label}）：</span>
      {valid
        ? <span className="text-emerald-600 ml-1">✓ 吻合</span>
        : <span className="text-red-500 ml-1">✗ 不吻合！請重新執行或手動修正</span>
      }
    </div>
  );
}

interface TokenRowProps {
  segs: SegInfo[];
  onMerge: (a: number, b: number) => void;
  onSplit: (segIndex: number, charOffset: number) => void;
}

function TokenRow({ segs, onMerge, onSplit }: TokenRowProps) {
  const [expandedSeg, setExpandedSeg] = useState<number | null>(null);

  return (
    <div className="flex flex-wrap gap-1 leading-relaxed items-start">
      {segs.map((seg, i) => {
        const prevBlank = i > 0 && segs[i - 1].kind === 'blank' && seg.kind === 'blank';
        return (
          <div key={i} className="inline-flex items-start gap-1">
            {prevBlank && (
              <button
                className="self-center text-slate-400 hover:text-blue-500 text-xs leading-none px-0.5 transition-colors"
                title="合併這兩個詞段"
                onClick={() => { onMerge(i - 1, i); setExpandedSeg(null); }}
              >⊕</button>
            )}
            {seg.kind === 'blank' && expandedSeg === seg.segIndex ? (
              <SplitView
                text={seg.text}
                tokenIndex={seg.tokenIndex!}
                onSplit={co => { onSplit(seg.segIndex, co); setExpandedSeg(null); }}
                onClose={() => setExpandedSeg(null)}
              />
            ) : (
              <span
                className={`inline-flex flex-col items-center px-1.5 py-0.5 rounded text-sm cursor-pointer select-none transition-colors ${KIND_STYLE[seg.kind]}`}
                title={seg.kind === 'blank' ? '點擊展開切分模式' : KIND_LABEL[seg.kind]}
                onClick={() => { if (seg.kind === 'blank') setExpandedSeg(expandedSeg === seg.segIndex ? null : seg.segIndex); }}
              >
                <span>{seg.text}</span>
                {seg.kind === 'blank' && <span className="text-[9px] opacity-50">#{seg.tokenIndex}</span>}
                {seg.kind !== 'blank' && <span className="text-[9px] opacity-60">{KIND_LABEL[seg.kind]}</span>}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SplitView({ text, tokenIndex, onSplit, onClose }: {
  text: string; tokenIndex: number;
  onSplit: (charOffset: number) => void; onClose: () => void;
}) {
  return (
    <span className="inline-flex flex-col items-center bg-slate-100 ring-2 ring-blue-400 rounded px-1 py-0.5">
      <span className="inline-flex items-center text-sm">
        {[...text].map((char, ci) => (
          <span key={ci} className="inline-flex items-center">
            {ci > 0 && ci < text.length && (
              <button
                className="text-blue-400 hover:text-red-500 text-[10px] leading-none px-px mx-px transition-colors hover:scale-125"
                title={`在「${text.slice(0, ci)}」和「${text.slice(ci)}」之間切開`}
                onClick={() => onSplit(ci)}
              >✂</button>
            )}
            <span className="px-px">{char}</span>
          </span>
        ))}
      </span>
      <span className="flex items-center gap-1 text-[9px]">
        <span className="opacity-50">#{tokenIndex}</span>
        <button className="text-slate-400 hover:text-slate-600" onClick={onClose}>✕</button>
      </span>
    </span>
  );
}
