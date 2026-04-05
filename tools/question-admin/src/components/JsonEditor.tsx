interface Props {
  value: string;
  error: string | null;
  onChange: (v: string) => void;
  onApply: () => void;
}

export function JsonEditor({ value, error, onChange, onApply }: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase">JSON 編輯器</span>
        <button
          onClick={onApply}
          className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors text-white"
        >
          套用
        </button>
      </div>
      <textarea
        className={`flex-1 w-full bg-slate-950 text-slate-200 font-mono text-xs p-3 resize-none outline-none border-2 transition-colors ${
          error ? 'border-red-500/60' : 'border-transparent'
        }`}
        value={value}
        onChange={e => onChange(e.target.value)}
        spellCheck={false}
      />
      {error && (
        <div className="px-3 py-2 bg-red-900/40 text-red-300 text-xs border-t border-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
