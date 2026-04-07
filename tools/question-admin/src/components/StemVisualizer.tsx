import type { DetectiveQuestion } from '../types';

interface SegInfo {
  text: string;
  kind: 'clue' | 'context' | 'noise' | 'blank';
  tokenIndex?: number;
  segIndex: number;
}

function buildSegInfos(
  q: DetectiveQuestion,
  tokens: string[],
  location: 'stem' | 'figure',
): SegInfo[] {
  interface Mark { start: number; end: number; kind: 'clue' | 'context' | 'noise' }
  const marks: Mark[] = [];

  for (const c of q.clues) {
    if (c.location === location) marks.push({ start: c.startIndex, end: c.startIndex + c.length, kind: 'clue' });
  }
  for (const s of q.scaffolding ?? []) {
    if (s.location === location) marks.push({ start: s.startIndex, end: s.startIndex + s.length, kind: s.type === 'context' ? 'context' : 'noise' });
  }

  let charPos = 0;
  let blankIdx = 0;
  return tokens.map((text, i) => {
    const end = charPos + text.length;
    const mark = marks.find(m => m.start <= charPos && m.end >= end);
    const kind = mark?.kind ?? 'blank';
    const info: SegInfo = { text, kind, segIndex: i, ...(kind === 'blank' ? { tokenIndex: blankIdx++ } : {}) };
    charPos = end;
    return info;
  });
}

const KIND_STYLE: Record<SegInfo['kind'], string> = {
  clue:    'bg-blue-200 text-blue-900 ring-1 ring-blue-400',
  context: 'bg-amber-200 text-amber-900 ring-1 ring-amber-400',
  noise:   'bg-red-200 text-red-900 ring-1 ring-red-400',
  blank:   'bg-slate-200 text-slate-700 hover:bg-slate-300',
};

const KIND_LABEL: Record<SegInfo['kind'], string> = {
  clue:    '線索',
  context: '脈絡',
  noise:   '雜訊',
  blank:   '',
};

interface Props {
  question: DetectiveQuestion;
  onMergeStem: (a: number, b: number) => void;
  onMergeFigure: (a: number, b: number) => void;
}

export function StemVisualizer({ question, onMergeStem, onMergeFigure }: Props) {
  const stemTokens = question.stemTokens;
  const figureTokens = question.figureTokens;
  const hasFigure = !!question.figure;

  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      {/* ── 題幹詞段 ── */}
      <div>
        <div className="text-xs font-semibold text-slate-400 tracking-widest uppercase mb-2">題幹詞段</div>
        {stemTokens ? (
          <>
            <TokenRow segs={buildSegInfos(question, stemTokens, 'stem')} onMerge={onMergeStem} />
            <ValidationBadge tokens={stemTokens} source={question.mainStem} label="mainStem" />
          </>
        ) : (
          <EmptyState text="尚未執行 AI 切分，或手動在 JSON 中加入 stemTokens" />
        )}
      </div>

      {/* ── 證物細節詞段 ── */}
      {hasFigure && (
        <div>
          <div className="text-xs font-semibold text-slate-400 tracking-widest uppercase mb-2">證物細節詞段</div>
          {figureTokens ? (
            <>
              <TokenRow segs={buildSegInfos(question, figureTokens, 'figure')} onMerge={onMergeFigure} />
              <ValidationBadge tokens={figureTokens} source={question.figure!} label="figure" />
            </>
          ) : (
            <EmptyState text="尚未執行 AI 切分，或手動在 JSON 中加入 figureTokens" />
          )}
        </div>
      )}

      {/* 圖例 */}
      <div className="flex gap-3 flex-wrap text-xs">
        {(['clue', 'context', 'noise', 'blank'] as const).map(k => (
          <span key={k} className={`px-2 py-0.5 rounded ${KIND_STYLE[k]}`}>
            {k === 'blank' ? `空白 #n` : KIND_LABEL[k]}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="text-slate-400 text-sm py-2">{text}</div>;
}

function ValidationBadge({ tokens, source, label }: { tokens: string[]; source: string; label: string }) {
  const valid = tokens.join('') === source;
  return (
    <div className="text-xs font-mono text-slate-500 mt-2">
      <span className="font-semibold text-slate-400">串接驗證（{label}）：</span>
      {valid
        ? <span className="text-emerald-600 ml-1">✓ 吻合</span>
        : <span className="text-red-500 ml-1">✗ 不吻合！請重新執行或手動修正</span>
      }
    </div>
  );
}

function TokenRow({ segs, onMerge }: { segs: SegInfo[]; onMerge: (a: number, b: number) => void }) {
  return (
    <div className="flex flex-wrap gap-1 leading-relaxed">
      {segs.map((seg, i) => (
        <span
          key={i}
          className={`inline-flex flex-col items-center px-1.5 py-0.5 rounded text-sm cursor-pointer select-none transition-colors ${KIND_STYLE[seg.kind]}`}
          title={seg.kind === 'blank' ? `tokenIndex: ${seg.tokenIndex}　點擊選取，選兩個相鄰詞段可合併` : KIND_LABEL[seg.kind]}
          onClick={() => {
            if (i > 0 && segs[i - 1].kind === 'blank' && seg.kind === 'blank') {
              onMerge(i - 1, i);
            }
          }}
        >
          <span>{seg.text}</span>
          {seg.kind === 'blank' && (
            <span className="text-[9px] opacity-50">#{seg.tokenIndex}</span>
          )}
          {seg.kind !== 'blank' && (
            <span className="text-[9px] opacity-60">{KIND_LABEL[seg.kind]}</span>
          )}
        </span>
      ))}
    </div>
  );
}
