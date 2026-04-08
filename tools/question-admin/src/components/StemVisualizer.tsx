import { useState } from 'react';
import type { DetectiveQuestion, ApiKey } from '../types';
import { TextMarker, type MarkActions } from './TextMarker';
import { MetadataEditor } from './MetadataEditor';
import { ClueDetailEditor } from './ClueDetailEditor';

type SegKind = 'critical' | 'auxiliary' | 'context' | 'noise' | 'blank';

interface SegInfo {
  text: string;
  kind: SegKind;
  tokenIndex?: number;
  segIndex: number;
}

// ... existing helper functions (findAllOccurrences, buildSegInfos)
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
  activeTab: 'setup' | 'marking' | 'design' | 'tokenize';
  onMergeStem: (a: number, b: number) => void;
  onMergeFigure: (a: number, b: number) => void;
  onSplitStem: (segIndex: number, charOffset: number) => void;
  onSplitFigure: (segIndex: number, charOffset: number) => void;
  markActions: MarkActions;
  updateQuestion: (updates: Partial<DetectiveQuestion>) => void;
  apiKeys: ApiKey[];
  onExtractClues: () => void;
  isExtracting: boolean;
}

export function StemVisualizer({
  question, activeTab, onMergeStem, onMergeFigure, onSplitStem, onSplitFigure, markActions,
  updateQuestion, apiKeys, onExtractClues, isExtracting
}: Props) {
  const stemTokens = question.stemTokens;
  const figureTokens = question.figureTokens;
  const hasFigure = !!question.figure;

  if (activeTab === 'setup') {
    return <MetadataEditor question={question} updateQuestion={updateQuestion} />;
  }

  if (activeTab === 'design') {
    return <ClueDetailEditor question={question} updateQuestion={updateQuestion} apiKeys={apiKeys} />;
  }

  if (activeTab === 'tokenize') {
    return (
      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        <section className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <div>
              <p className="font-bold">詞段切分提示</p>
              <p className="mt-1 opacity-80">這是遊戲中掃描器掃出的區塊。AI 通常能處理得很好，但如果它切斷了關鍵字，請手動點擊 ⊕ 合併。標記區域（藍/黃/紅）會自動保持連貫。</p>
            </div>
          </div>

          <div className="space-y-6 bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">題幹詞段 (mainStem)</label>
              {stemTokens ? (
                <TokenRow segs={buildSegInfos(question, stemTokens, 'stem')} onMerge={onMergeStem} onSplit={onSplitStem} />
              ) : (
                <div className="text-slate-400 text-sm italic py-4">尚未執行切分...</div>
              )}
            </div>

            {hasFigure && (
              <div className="space-y-3 pt-6 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">證物細節詞段 (figure)</label>
                {figureTokens ? (
                  <TokenRow segs={buildSegInfos(question, figureTokens, 'figure')} onMerge={onMergeFigure} onSplit={onSplitFigure} />
                ) : (
                  <div className="text-slate-400 text-sm italic py-4">尚未執行切分...</div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Default: Marking Tab
  return (
    <div className="h-full overflow-auto p-6 space-y-8 max-w-5xl mx-auto">
      {/* AI 提取線索 */}
      <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <button
          onClick={onExtractClues}
          disabled={isExtracting || !question.mainStem}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg text-sm font-bold transition-colors shrink-0"
        >
          {isExtracting ? '⏳ 提取中…' : '🤖 AI 自動提取線索'}
        </button>
        <p className="text-xs text-indigo-700 opacity-80">
          AI 會從題幹中識別 2 個關鍵線索、2 個輔助線索。<br />
          <span className="font-bold text-red-500">注意：會覆蓋現有標記。</span>也可忽略此步驟直接拖選文字手動標記。
        </p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">題幹原文</label>
            <div className="flex gap-2 text-[10px] text-slate-400 italic">
              <span>滑鼠拖選文字即可標記</span>
            </div>
          </div>
          <TextMarker
            text={question.mainStem}
            location="stem"
            clues={question.clues}
            scaffolding={question.scaffolding ?? []}
            actions={markActions}
          />
        </div>

        {hasFigure && (
          <div className="space-y-2 pt-6 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">證物細節原文</label>
            <TextMarker
              text={question.figure!}
              location="figure"
              clues={question.clues}
              scaffolding={question.scaffolding ?? []}
              actions={markActions}
            />
          </div>
        )}
      </section>

      {/* 圖例說明 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex gap-4">
          {(['critical', 'auxiliary', 'context', 'noise'] as const).map(k => (
            <div key={k} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${KIND_STYLE[k].split(' ')[0]}`} />
              <span className="text-xs font-medium text-slate-600">{KIND_LABEL[k]}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-slate-400">標記完成後，請前往「內容設計」階段撰寫線索筆記。</p>
      </div>
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
