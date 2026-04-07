import { useState, useRef, useCallback } from 'react';
import type { Clue, ScaffoldingRegion } from '../types';

export interface MarkActions {
  addClue: (clue: Clue) => void;
  updateClue: (index: number, clue: Clue) => void;
  removeClue: (index: number) => void;
  addScaffolding: (s: ScaffoldingRegion) => void;
  updateScaffolding: (index: number, s: ScaffoldingRegion) => void;
  removeScaffolding: (index: number) => void;
}

type MarkKind = 'critical' | 'auxiliary' | 'context' | 'noise';

interface Selection { text: string; startIndex: number; length: number }

interface DisplayMark {
  start: number; end: number; kind: MarkKind;
  source: 'clue' | 'scaffolding'; index: number; text: string;
}

const KIND_STYLE: Record<MarkKind, string> = {
  critical:  'bg-blue-200/70',
  auxiliary: 'bg-sky-100/70',
  context:   'bg-amber-200/70',
  noise:     'bg-red-200/70',
};

const KIND_LABEL: Record<MarkKind, string> = {
  critical: '關鍵線索',
  auxiliary: '輔助線索',
  context:  '脈絡鷹架',
  noise:    '雜訊鷹架',
};

interface Props {
  text: string;
  location: 'stem' | 'figure';
  clues: Clue[];
  scaffolding: ScaffoldingRegion[];
  actions: MarkActions;
}

export function TextMarker({ text, location, clues, scaffolding, actions }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [editing, setEditing] = useState<{ source: 'clue' | 'scaffolding'; index: number } | null>(null);

  // Build display marks for this location
  const displayMarks: DisplayMark[] = [];
  clues.forEach((c, i) => {
    if (c.location === location) {
      displayMarks.push({ start: c.startIndex, end: c.startIndex + c.length, kind: c.isCritical ? 'critical' : 'auxiliary', source: 'clue', index: i, text: c.text });
    }
  });
  (scaffolding ?? []).forEach((s, i) => {
    if (s.location === location) {
      displayMarks.push({ start: s.startIndex, end: s.startIndex + s.length, kind: s.type === 'context' ? 'context' : 'noise', source: 'scaffolding', index: i, text: s.text });
    }
  });
  displayMarks.sort((a, b) => a.start - b.start);

  // Build text segments (plain / marked)
  const segments: { text: string; mark: DisplayMark | null }[] = [];
  let pos = 0;
  for (const m of displayMarks) {
    if (m.start > pos) segments.push({ text: text.slice(pos, m.start), mark: null });
    if (m.end > pos) {
      segments.push({ text: text.slice(Math.max(pos, m.start), m.end), mark: m });
      pos = m.end;
    }
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), mark: null });

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !containerRef.current) return;
    const range = sel.getRangeAt(0);
    if (!containerRef.current.contains(range.startContainer)) return;

    const preRange = document.createRange();
    preRange.selectNodeContents(containerRef.current);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startIndex = preRange.toString().length;
    const selectedText = sel.toString();
    if (selectedText.length > 0) {
      setSelection({ text: selectedText, startIndex, length: selectedText.length });
      setEditing(null);
    }
  }, []);

  const handleAddMark = (kind: MarkKind) => {
    if (!selection) return;
    if (kind === 'critical' || kind === 'auxiliary') {
      const clue: Clue = {
        text: selection.text, location,
        startIndex: selection.startIndex, length: selection.length,
        why: '', ...(kind === 'critical' ? { isCritical: true } : { isAuxiliary: true }),
      };
      actions.addClue(clue);
      setEditing({ source: 'clue', index: clues.length });
    } else {
      const s: ScaffoldingRegion = {
        text: selection.text, location,
        startIndex: selection.startIndex, length: selection.length,
        type: kind === 'context' ? 'context' : 'noise', hint: '',
      };
      actions.addScaffolding(s);
      setEditing({ source: 'scaffolding', index: (scaffolding ?? []).length });
    }
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleRemove = (dm: DisplayMark) => {
    if (dm.source === 'clue') {
      actions.removeClue(dm.index);
      if (editing?.source === 'clue') {
        if (editing.index === dm.index) setEditing(null);
        else if (editing.index > dm.index) setEditing({ ...editing, index: editing.index - 1 });
      }
    } else {
      actions.removeScaffolding(dm.index);
      if (editing?.source === 'scaffolding') {
        if (editing.index === dm.index) setEditing(null);
        else if (editing.index > dm.index) setEditing({ ...editing, index: editing.index - 1 });
      }
    }
  };

  const isEditing = (dm: DisplayMark) => editing?.source === dm.source && editing?.index === dm.index;

  return (
    <div className="space-y-2">
      {/* Selectable text */}
      <div
        ref={containerRef}
        onMouseUp={handleMouseUp}
        className="text-sm leading-relaxed p-2 bg-slate-50 rounded border border-slate-200 cursor-text select-text"
      >
        {segments.map((seg, i) =>
          seg.mark ? (
            <span
              key={i}
              className={`rounded px-0.5 cursor-pointer ${KIND_STYLE[seg.mark.kind]} ${isEditing(seg.mark) ? 'ring-2 ring-blue-500' : ''}`}
              onClick={e => { e.stopPropagation(); setEditing({ source: seg.mark!.source, index: seg.mark!.index }); setSelection(null); }}
            >{seg.text}</span>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </div>

      {/* Type picker */}
      {selection && (
        <div className="flex items-center gap-1 flex-wrap text-xs">
          <span className="text-slate-500">「{selection.text}」→</span>
          {(['critical', 'auxiliary', 'context', 'noise'] as const).map(k => (
            <button key={k} onClick={() => handleAddMark(k)} className={`px-2 py-0.5 rounded hover:opacity-80 ${KIND_STYLE[k]}`}>{KIND_LABEL[k]}</button>
          ))}
          <button onClick={() => { setSelection(null); window.getSelection()?.removeAllRanges(); }} className="px-1 text-slate-400 hover:text-slate-600">✕</button>
        </div>
      )}

      {/* Mark list */}
      {displayMarks.length > 0 && (
        <div className="space-y-1">
          {displayMarks.map(dm => (
            <div key={`${dm.source}-${dm.index}`} className="text-xs flex items-center gap-2">
              <span className={`px-1.5 py-0.5 rounded ${KIND_STYLE[dm.kind]}`}>{KIND_LABEL[dm.kind]}</span>
              <span className="font-mono text-slate-500">「{dm.text}」<span className="text-slate-400">[{dm.start}:{dm.end}]</span></span>
              <button
                onClick={() => setEditing(isEditing(dm) ? null : { source: dm.source, index: dm.index })}
                className="text-blue-500 hover:text-blue-700"
              >{isEditing(dm) ? '收起' : '編輯'}</button>
              <button onClick={() => handleRemove(dm)} className="text-red-400 hover:text-red-600">刪除</button>
            </div>
          ))}
        </div>
      )}

      {/* Edit form */}
      {editing?.source === 'clue' && clues[editing.index] && (
        <ClueForm clue={clues[editing.index]} onUpdate={c => actions.updateClue(editing.index, c)} onClose={() => setEditing(null)} />
      )}
      {editing?.source === 'scaffolding' && (scaffolding ?? [])[editing.index] && (
        <ScaffoldingForm scaffolding={(scaffolding ?? [])[editing.index]} onUpdate={s => actions.updateScaffolding(editing.index, s)} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

/* ── Clue edit form ── */

function ClueForm({ clue, onUpdate, onClose }: { clue: Clue; onUpdate: (c: Clue) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Clue>({ ...clue });
  const save = () => { onUpdate(draft); onClose(); };
  const upd = (p: Partial<Clue>) => setDraft(d => ({ ...d, ...p }));

  return (
    <div className="bg-white border border-slate-200 rounded p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-600">線索：「{draft.text}」</span>
        <div className="flex gap-3">
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" name={`clue-type-${draft.startIndex}`} checked={!!draft.isCritical} onChange={() => upd({ isCritical: true, isAuxiliary: undefined })} /> 關鍵
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" name={`clue-type-${draft.startIndex}`} checked={!draft.isCritical} onChange={() => upd({ isCritical: undefined, isAuxiliary: true })} /> 輔助
          </label>
        </div>
      </div>
      <Field label="teaser" value={draft.teaser ?? ''} onChange={v => upd({ teaser: v || undefined })} placeholder="翻線索前的誘導句（選填）" />
      <Field label="why" value={draft.why} onChange={v => upd({ why: v })} placeholder="這條線索為什麼重要？（必填）" />
      <Field label="aliases" value={(draft.aliases ?? []).join('、')} onChange={v => upd({ aliases: v ? v.split(/[、,]/).map(s => s.trim()).filter(Boolean) : undefined })} placeholder="別名，用「、」分隔（選填）" />
      <div className="flex gap-2 pt-1">
        <button onClick={save} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">確認</button>
        <button onClick={onClose} className="px-3 py-1 text-slate-500 hover:text-slate-700">取消</button>
      </div>
    </div>
  );
}

/* ── Scaffolding edit form ── */

function ScaffoldingForm({ scaffolding, onUpdate, onClose }: { scaffolding: ScaffoldingRegion; onUpdate: (s: ScaffoldingRegion) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<ScaffoldingRegion>({ ...scaffolding });
  const save = () => { onUpdate(draft); onClose(); };
  const upd = (p: Partial<ScaffoldingRegion>) => setDraft(d => ({ ...d, ...p }));

  return (
    <div className="bg-white border border-slate-200 rounded p-3 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-600">鷹架：「{draft.text}」</span>
        <div className="flex gap-3">
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" name={`scaf-type-${draft.startIndex}`} checked={draft.type === 'context'} onChange={() => upd({ type: 'context' })} /> 脈絡
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input type="radio" name={`scaf-type-${draft.startIndex}`} checked={draft.type === 'noise'} onChange={() => upd({ type: 'noise' })} /> 雜訊
          </label>
        </div>
      </div>
      <Field label="hint" value={draft.hint} onChange={v => upd({ hint: v })} placeholder="學生點到此鷹架時的提示文字（必填）" />
      <Field label="aliases" value={(draft.aliases ?? []).join('、')} onChange={v => upd({ aliases: v ? v.split(/[、,]/).map(s => s.trim()).filter(Boolean) : undefined })} placeholder="別名，用「、」分隔（選填）" />
      <div className="flex gap-2 pt-1">
        <button onClick={save} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">確認</button>
        <button onClick={onClose} className="px-3 py-1 text-slate-500 hover:text-slate-700">取消</button>
      </div>
    </div>
  );
}

/* ── Shared field ── */

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-slate-400 mb-0.5">{label}</label>
      <textarea
        className="w-full px-2 py-1 border border-slate-200 rounded text-xs resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
        rows={2}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
