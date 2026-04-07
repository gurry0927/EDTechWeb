import { useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { JsonEditor } from './components/JsonEditor';
import { StemVisualizer } from './components/StemVisualizer';
import { QuestionList } from './components/QuestionList';
import { useApiKeys } from './hooks/useApiKeys';
import { useQuestion } from './hooks/useQuestion';
import { callWithRotation, ApiError } from './api';
import { buildTokenizePrompt, buildFigureTokenizePrompt, validateTokens } from './tokenize';

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
    setLastSwitchMsg('');

    const onSwitch = (from: string, to: string) => setLastSwitchMsg(`⚡ ${from} 限速，切換至 ${to}`);

    try {
      // ── 題幹切分 ──
      setStatus('題幹切分中…');
      const stemPrompt = buildTokenizePrompt(q.question);
      const stemRes = await callWithRotation(apiKeys.orderedKeys, stemPrompt, onSwitch);

      if (stemRes.usedKeyIndex > 0) {
        apiKeys.selectKey(apiKeys.orderedKeys[stemRes.usedKeyIndex].id);
      }

      const stemVal = validateTokens(stemRes.result, q.question.mainStem);
      if (!stemVal.ok) {
        setStatus(`✗ 題幹驗證失敗：${stemVal.reason}`);
        return;
      }
      q.updateTokens(stemVal.tokens);

      // ── 證物細節切分（若有 figure）──
      const figurePrompt = buildFigureTokenizePrompt(q.question);
      if (figurePrompt) {
        setStatus('證物細節切分中…');
        const figRes = await callWithRotation(apiKeys.orderedKeys, figurePrompt, onSwitch);

        if (figRes.usedKeyIndex > 0) {
          apiKeys.selectKey(apiKeys.orderedKeys[figRes.usedKeyIndex].id);
        }

        const figVal = validateTokens(figRes.result, q.question.figure!);
        if (!figVal.ok) {
          setStatus(`✓ 題幹 ${stemVal.tokens.length} 段｜✗ 證物細節驗證失敗：${figVal.reason}`);
          return;
        }
        q.updateFigureTokens(figVal.tokens);
        setStatus(`✓ 題幹 ${stemVal.tokens.length} 段｜證物細節 ${figVal.tokens.length} 段`);
      } else {
        setStatus(`✓ 題幹 ${stemVal.tokens.length} 段（無證物細節）`);
      }
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.message}（HTTP ${e.status}）` : e instanceof Error ? e.message : '未知錯誤';
      setStatus(`✗ ${msg}`);
    } finally {
      setIsRunning(false);
    }
  }

  async function handleSave() {
    if (!q.question) return;
    const ok = await q.saveToDb(q.question);
    setStatus(ok ? '✓ 已儲存到資料庫' : '✗ 儲存失敗');
  }

  function handleMergeStem(a: number, b: number) {
    if (!q.question?.stemTokens) return;
    const tokens = [...q.question.stemTokens];
    tokens.splice(a, 2, tokens[a] + tokens[b]);
    q.updateTokens(tokens);
  }

  function handleMergeFigure(a: number, b: number) {
    if (!q.question?.figureTokens) return;
    const tokens = [...q.question.figureTokens];
    tokens.splice(a, 2, tokens[a] + tokens[b]);
    q.updateFigureTokens(tokens);
  }

  function handleSplitStem(segIndex: number, charOffset: number) {
    if (!q.question?.stemTokens) return;
    const tokens = [...q.question.stemTokens];
    const orig = tokens[segIndex];
    tokens.splice(segIndex, 1, orig.slice(0, charOffset), orig.slice(charOffset));
    q.updateTokens(tokens);
  }

  function handleSplitFigure(segIndex: number, charOffset: number) {
    if (!q.question?.figureTokens) return;
    const tokens = [...q.question.figureTokens];
    const orig = tokens[segIndex];
    tokens.splice(segIndex, 1, orig.slice(0, charOffset), orig.slice(charOffset));
    q.updateFigureTokens(tokens);
  }

  const markActions = {
    addClue: q.addClue, updateClue: q.updateClue, removeClue: q.removeClue,
    addScaffolding: q.addScaffolding, updateScaffolding: q.updateScaffolding, removeScaffolding: q.removeScaffolding,
  };

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
        onSave={handleSave}
        saving={q.saving}
        isRunning={isRunning}
        status={status}
        lastSwitchMsg={lastSwitchMsg}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 左側：題目列表 + JSON 編輯器 */}
        <div className="w-1/3 border-r border-slate-300 overflow-hidden flex flex-col">
          <QuestionList
            items={q.list}
            loading={q.listLoading}
            activeId={q.question?.id ?? null}
            onSelect={q.loadById}
            onDelete={q.deleteFromDb}
          />
          <div className="flex-1 overflow-hidden">
            <JsonEditor
              value={q.jsonText}
              error={q.jsonError}
              onChange={q.applyJson}
              onApply={() => q.applyJson(q.jsonText)}
            />
          </div>
        </div>

        {/* 右：視覺化 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="px-3 py-2 bg-white border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase">題目編輯器</span>
            {q.question && (
              <span className="ml-3 text-xs text-slate-500">{q.question.id} — {q.question.source}</span>
            )}
          </div>
          <div className="flex-1 overflow-auto bg-white">
            {q.question
              ? <StemVisualizer question={q.question} onMergeStem={handleMergeStem} onMergeFigure={handleMergeFigure} onSplitStem={handleSplitStem} onSplitFigure={handleSplitFigure} markActions={markActions} />
              : <div className="flex items-center justify-center h-full text-slate-400 text-sm">從左側列表選取題目，或載入 JSON 檔案</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
