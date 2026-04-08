import { useState, useMemo } from 'react';
import type { QuestionListItem } from '../hooks/useQuestion';

interface Props {
  items: QuestionListItem[];
  loading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => Promise<boolean>;
  onCreate: () => void;
}

export function QuestionList({ items, loading, activeId, onSelect, onDelete, onCreate }: Props) {
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);

  const subjects = useMemo(() => {
    const s = new Set<string>();
    items.forEach(i => s.add(i.subject));
    return Array.from(s).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.id.toLowerCase().includes(search.toLowerCase());
      const matchSubject = !subjectFilter || item.subject === subjectFilter;
      return matchSearch && matchSubject;
    });
  }, [items, search, subjectFilter]);

  if (loading) {
    return <div className="px-3 py-2 text-xs text-slate-400">載入題目列表…</div>;
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      {/* 新增題目 */}
      <div className="p-3 border-b border-slate-200 bg-white">
        <button
          onClick={onCreate}
          className="w-full py-2 text-xs font-bold text-blue-600 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all"
        >
          ＋ 新增空白題目
        </button>
      </div>

      {/* 搜尋與篩選 */}
      <div className="p-3 space-y-2 border-b border-slate-200 bg-white">
        <div className="relative">
          <input
            type="text"
            placeholder="搜尋題目 ID..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border-none rounded-md focus:ring-2 focus:ring-blue-500 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="absolute left-2.5 top-1.5 opacity-40">🔍</span>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSubjectFilter(null)}
            className={`px-2 py-0.5 text-[10px] rounded-full border transition-all
              ${!subjectFilter ? 'bg-blue-500 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
          >全部</button>
          {subjects.map(s => (
            <button
              key={s}
              onClick={() => setSubjectFilter(s)}
              className={`px-2 py-0.5 text-[10px] rounded-full border transition-all
                ${subjectFilter === s ? 'bg-blue-500 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
            >{s}</button>
          ))}
        </div>
      </div>

      <div className="px-3 py-2 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
        題庫（{filteredItems.length}）
      </div>

      <div className="flex-1 overflow-auto">
        {filteredItems.length === 0 ? (
          <div className="px-3 py-4 text-xs text-slate-400 text-center italic">無符合條件的題目</div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className={`group flex items-center gap-2 px-3 py-2.5 text-xs cursor-pointer border-b border-slate-100 hover:bg-white transition-colors
                ${activeId === item.id ? 'bg-blue-50 text-blue-700 border-l-4 border-l-blue-500 pl-2' : 'bg-white/50 text-slate-700'}`}
              onClick={() => onSelect(item.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{item.id}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{item.subject}</div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); if (confirm(`刪除「${item.id}」？`)) onDelete(item.id); }}
                className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                title="刪除"
              >✕</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
