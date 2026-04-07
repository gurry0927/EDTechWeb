import type { QuestionListItem } from '../hooks/useQuestion';

interface Props {
  items: QuestionListItem[];
  loading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
}

export function QuestionList({ items, loading, activeId, onSelect, onDelete }: Props) {
  if (loading) {
    return <div className="px-3 py-2 text-xs text-slate-400">載入題目列表…</div>;
  }

  if (items.length === 0) {
    return <div className="px-3 py-2 text-xs text-slate-400">資料庫尚無題目 — 載入 JSON 後點「儲存到 DB」</div>;
  }

  return (
    <div className="border-b border-slate-300 max-h-48 overflow-auto bg-white">
      <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 tracking-widest uppercase sticky top-0 bg-white border-b border-slate-200">
        題庫（{items.length}）
      </div>
      {items.map(item => (
        <div
          key={item.id}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${activeId === item.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
          onClick={() => onSelect(item.id)}
        >
          <span className="flex-1 truncate">{item.id}</span>
          <span className="text-slate-400 shrink-0">{item.subject}</span>
          <button
            onClick={e => { e.stopPropagation(); if (confirm(`刪除「${item.id}」？`)) onDelete(item.id); }}
            className="text-red-300 hover:text-red-500 shrink-0"
            title="刪除"
          >✕</button>
        </div>
      ))}
    </div>
  );
}
