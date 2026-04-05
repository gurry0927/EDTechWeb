import { useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { JsonEditor } from './components/JsonEditor';
import { StemVisualizer } from './components/StemVisualizer';
import { useApiKeys } from './hooks/useApiKeys';
import { useQuestion } from './hooks/useQuestion';
import { callWithRotation, ApiError } from './api';
import { buildTokenizePrompt, validateTokens } from './tokenize';

export default function App() {
  const apiKeys = useApiKeys();
  const q = useQuestion();

  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [lastSwitchMsg, setLastSwitchMsg] = useState('');

  async function handleRunTokenize() {
    if (!q.question) { setStatus('✗ 請先載入題目 JSON'); return; }
    if (!apiKeys.orderedKeys.length) { setStatus('✗ 請先設定 API Key'); return; }

    setIsRunning(true);
    setStatus('呼叫 AI…');
    setLastSwitchMsg('');

    try {
      const prompt = buildTokenizePrompt(q.question);
      const { result, usedKeyIndex } = await callWithRotation(
        apiKeys.orderedKeys,
        prompt,
        (from, to) => setLastSwitchMsg(`⚡ ${from} 限速，切換至 ${to}`),
      );

      // 若輪替到後面的 key，更新 activeId 讓下次從這裡開始
      if (usedKeyIndex > 0) {
        apiKeys.selectKey(apiKeys.orderedKeys[usedKeyIndex].id);
      }

      const validation = validateTokens(result, q.question.mainStem);
      if (!validation.ok) {
        setStatus(`✗ 驗證失敗：${validation.reason}`);
        return;
      }

      q.updateTokens(validation.tokens);
      setStatus(`✓ 完成，共 ${validation.tokens.length} 個詞段`);
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.message}（HTTP ${e.status}）` : e instanceof Error ? e.message : '未知錯誤';
      setStatus(`✗ ${msg}`);
    } finally {
      setIsRunning(false);
    }
  }

  function handleMerge(a: number, b: number) {
    if (!q.question?.stemTokens) return;
    const tokens = [...q.question.stemTokens];
    tokens.splice(a, 2, tokens[a] + tokens[b]);
    q.updateTokens(tokens);
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 relative">
      <Toolbar
        keys={apiKeys.keys}
        activeId={apiKeys.activeId}
        onSelectKey={apiKeys.selectKey}
        onAddKey={apiKeys.addKey}
        onRemoveKey={apiKeys.removeKey}
        onLoadFile={q.loadFile}
        onExport={q.exportJson}
        onRunTokenize={handleRunTokenize}
        isRunning={isRunning}
        status={status}
        lastSwitchMsg={lastSwitchMsg}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 左：JSON 編輯器 */}
        <div className="w-1/3 border-r border-slate-300 overflow-hidden flex flex-col">
          <JsonEditor
            value={q.jsonText}
            error={q.jsonError}
            onChange={q.applyJson}
            onApply={() => q.applyJson(q.jsonText)}
          />
        </div>

        {/* 右：視覺化 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-white border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase">詞段視覺化</span>
            {q.question && (
              <span className="ml-3 text-xs text-slate-500">{q.question.id} — {q.question.source}</span>
            )}
          </div>
          <div className="flex-1 overflow-auto bg-white">
            {q.question
              ? <StemVisualizer question={q.question} onMerge={handleMerge} />
              : <div className="flex items-center justify-center h-full text-slate-400 text-sm">載入一個題目 JSON 開始</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
