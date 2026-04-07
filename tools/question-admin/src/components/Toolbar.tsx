import { useRef, useState } from 'react';
import type { ApiKey, Provider } from '../types';
import { PROVIDER_MODELS } from '../types';
import { testKey } from '../api';

interface Props {
  keys: ApiKey[];
  activeId: string;
  onSelectKey: (id: string) => void;
  onAddKey: (label: string, value: string, provider: Provider, model: string) => void;
  onRemoveKey: (id: string) => void;
  onLoadFile: (file: File) => void;
  onExport: () => void;
  onRunTokenize: () => void;
  onSave: () => void;
  saving: boolean;
  isRunning: boolean;
  status: string;
  lastSwitchMsg: string;
}

const PROVIDER_LABEL: Record<Provider, string> = { gemini: 'Gemini', openai: 'OpenAI' };

export function Toolbar({
  keys, activeId, onSelectKey, onAddKey, onRemoveKey,
  onLoadFile, onExport, onRunTokenize, onSave, saving, isRunning, status, lastSwitchMsg,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showKeyManager, setShowKeyManager] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newProvider, setNewProvider] = useState<Provider>('gemini');
  const [newModel, setNewModel] = useState(PROVIDER_MODELS.gemini[0]);
  const [testResults, setTestResults] = useState<Record<string, 'testing' | 'ok' | string>>({});

  function handleProviderChange(p: Provider) {
    setNewProvider(p);
    setNewModel(PROVIDER_MODELS[p][0]);
  }

  async function handleTest(k: ApiKey) {
    setTestResults(r => ({ ...r, [k.id]: 'testing' }));
    const err = await testKey(k);
    setTestResults(r => ({ ...r, [k.id]: err ?? 'ok' }));
  }

  function handleAdd() {
    if (!newLabel.trim() || !newValue.trim()) return;
    onAddKey(newLabel.trim(), newValue.trim(), newProvider, newModel);
    setNewLabel('');
    setNewValue('');
  }

  const activeKey = keys.find(k => k.id === activeId);

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-900 text-white text-sm border-b border-slate-700 relative">

      {/* Key 選單 */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 shrink-0">API Key：</span>
        {keys.length === 0 ? (
          <span className="text-amber-400">尚未設定</span>
        ) : (
          <select
            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white"
            value={activeId}
            onChange={e => onSelectKey(e.target.value)}
          >
            {keys.map(k => (
              <option key={k.id} value={k.id}>
                {k.label}（{PROVIDER_LABEL[k.provider]} / {k.model}）
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setShowKeyManager(v => !v)}
          className="text-slate-400 hover:text-white transition-colors px-1"
          title="管理 API Keys"
        >⚙</button>
      </div>

      {activeKey && (
        <span className="text-xs text-slate-500 font-mono">
          {PROVIDER_LABEL[activeKey.provider]} · {activeKey.model}
        </span>
      )}

      <div className="w-px h-5 bg-slate-700" />

      {/* 執行 */}
      <button
        onClick={onRunTokenize}
        disabled={isRunning || keys.length === 0}
        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded font-medium transition-colors"
      >
        {isRunning ? '執行中…' : '▶ AI 詞段切分'}
      </button>

      {status && (
        <span className={`text-xs ${status.startsWith('✓') ? 'text-emerald-400' : status.startsWith('✗') ? 'text-red-400' : 'text-slate-400'}`}>
          {status}
        </span>
      )}
      {lastSwitchMsg && (
        <span className="text-xs text-amber-400">{lastSwitchMsg}</span>
      )}

      <div className="flex-1" />

      {/* 載入 / 匯出 */}
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onLoadFile(f); e.target.value = ''; }}
      />
      <button onClick={() => fileRef.current?.click()} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors">
        載入 JSON
      </button>
      <button onClick={onExport} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors">
        匯出 JSON
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded font-medium transition-colors"
      >
        {saving ? '儲存中…' : '儲存到 DB'}
      </button>

      {/* Key 管理浮層 */}
      {showKeyManager && (
        <div className="absolute top-14 left-4 z-50 w-[28rem] bg-slate-800 border border-slate-600 rounded-lg shadow-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">管理 API Keys</span>
            <button onClick={() => setShowKeyManager(false)} className="text-slate-400 hover:text-white">✕</button>
          </div>

          {/* 現有 keys */}
          {keys.length === 0 && <p className="text-slate-500 text-sm">尚無 Key</p>}
          {keys.map(k => {
            const tr = testResults[k.id];
            return (
              <div key={k.id} className="space-y-0.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 rounded text-[10px] flex items-center justify-center bg-slate-700 text-slate-300 shrink-0">
                    {k.provider === 'gemini' ? 'G' : 'O'}
                  </span>
                  <span className="flex-1 truncate">{k.label}</span>
                  <span className="text-slate-500 text-xs shrink-0">{k.model}</span>
                  <span className="text-slate-600 font-mono text-xs shrink-0">{k.value.slice(0, 6)}…</span>
                  <button
                    onClick={() => handleTest(k)}
                    disabled={tr === 'testing'}
                    className="text-sky-400 hover:text-sky-300 disabled:opacity-40 shrink-0 text-xs"
                  >
                    {tr === 'testing' ? '測試中…' : '測試'}
                  </button>
                  <button onClick={() => onRemoveKey(k.id)} className="text-red-400 hover:text-red-300 shrink-0">刪除</button>
                </div>
                {tr && tr !== 'testing' && (
                  <p className={`text-xs pl-7 ${tr === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tr === 'ok' ? '✓ 連線正常' : `✗ ${tr}`}
                  </p>
                )}
              </div>
            );
          })}

          {/* 新增 */}
          <div className="border-t border-slate-700 pt-3 space-y-2">
            <div className="flex gap-2">
              <select
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm flex-1"
                value={newProvider}
                onChange={e => handleProviderChange(e.target.value as Provider)}
              >
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
              </select>
              <select
                className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm flex-1"
                value={newModel}
                onChange={e => setNewModel(e.target.value)}
              >
                {PROVIDER_MODELS[newProvider].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <input
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm"
              placeholder="名稱（如：Gemini Flash、GPT 備用）"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
            />
            <input
              className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm font-mono"
              placeholder="API Key 值"
              type="password"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="w-full py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-sm transition-colors"
            >
              新增
            </button>
          </div>
          <p className="text-xs text-slate-500">Keys 存在 localStorage，不會上傳或提交到 git。</p>
        </div>
      )}
    </div>
  );
}
