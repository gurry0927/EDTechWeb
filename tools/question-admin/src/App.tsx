import { useState } from 'react';
import { Toolbar } from './components/Toolbar';
import { JsonEditor } from './components/JsonEditor';
import { StemVisualizer } from './components/StemVisualizer';
import { QuestionList } from './components/QuestionList';
import { useApiKeys } from './hooks/useApiKeys';
import { useQuestion } from './hooks/useQuestion';
import { callWithRotation, ApiError } from './api';
import { buildTokenizePrompt, buildFigureTokenizePrompt, validateTokens, buildClueExtractPrompt, validateExtractedClues } from './tokenize';

export default function App() {
  const apiKeys = useApiKeys();
  const q = useQuestion();

  const [isRunning, setIsRunning] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [status, setStatus] = useState('');
  const [lastSwitchMsg, setLastSwitchMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'setup' | 'marking' | 'design' | 'tokenize'>('setup');
  const [isJsonDrawerOpen, setIsJsonDrawerOpen] = useState(false);

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

  async function handleExtractClues() {
    if (!q.question) { setStatus('✗ 請先填入題幹'); return; }
    if (!q.question.mainStem) { setStatus('✗ 題幹不能為空'); return; }
    if (!apiKeys.orderedKeys.length) { setStatus('✗ 請先設定 API Key'); return; }
    if (q.question.clues.length > 0 && !confirm('此操作將覆蓋現有的線索標記，確定繼續？')) return;

    setIsExtracting(true);
    setStatus('線索提取中…');
    try {
      const prompt = buildClueExtractPrompt(q.question);
      const res = await callWithRotation(apiKeys.orderedKeys, prompt);
      const result = validateExtractedClues(res.result, q.question);
      if (!result.ok) { setStatus(`✗ 線索提取失敗：${result.reason}`); return; }
      q.updateQuestion({ clues: result.clues });
      setStatus(`✓ 已提取 ${result.clues.length} 個線索`);
      setActiveTab('marking');
    } catch (e) {
      const msg = e instanceof ApiError ? `${e.message}（HTTP ${e.status}）` : e instanceof Error ? e.message : '未知錯誤';
      setStatus(`✗ ${msg}`);
    } finally {
      setIsExtracting(false);
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

  const TABS = [
    { id: 'setup', label: '1. 基礎設定', icon: '📝' },
    { id: 'marking', label: '2. 線索標記', icon: '🖍️' },
    { id: 'design', label: '3. 內容設計', icon: '🎨' },
    { id: 'tokenize', label: '4. 詞段切分', icon: '✂️' },
  ] as const;

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
        isJsonOpen={isJsonDrawerOpen}
        onToggleJson={() => setIsJsonDrawerOpen(!isJsonDrawerOpen)}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* 左側：題目列表 */}
        <div className="w-1/4 border-r border-slate-300 overflow-hidden flex flex-col bg-slate-50">
          <QuestionList
            items={q.list}
            loading={q.listLoading}
            activeId={q.question?.id ?? null}
            onSelect={q.loadById}
            onDelete={q.deleteFromDb}
            onCreate={q.createNew}
          />
        </div>

        {/* 右：視覺化工作區 */}
        <div className="flex-1 overflow-hidden flex flex-col bg-white">
          {/* Tab 導覽 */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-all flex items-center justify-center gap-2
                  ${activeTab === tab.id 
                    ? 'border-blue-500 text-blue-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto">
            {q.question ? (
              <StemVisualizer
                question={q.question}
                activeTab={activeTab}
                onMergeStem={handleMergeStem}
                onMergeFigure={handleMergeFigure}
                onSplitStem={handleSplitStem}
                onSplitFigure={handleSplitFigure}
                markActions={markActions}
                updateQuestion={q.updateQuestion}
                apiKeys={apiKeys.orderedKeys}
                onExtractClues={handleExtractClues}
                isExtracting={isExtracting}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm flex-col gap-4">
                <div className="text-4xl opacity-20">📂</div>
                請從左側列表選取題目，或點擊上方「載入 JSON」
              </div>
            )}
          </div>
        </div>

        {/* JSON 抽屜 (Absolute Overlay) */}
        {isJsonDrawerOpen && (
          <div className="absolute inset-y-0 right-0 w-1/2 bg-white shadow-2xl border-l border-slate-300 z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-bold text-slate-700 flex items-center gap-2">
                <span>📄</span> JSON 原始碼編輯
              </span>
              <button 
                onClick={() => setIsJsonDrawerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >✕</button>
            </div>
            <div className="flex-1 overflow-hidden">
              <JsonEditor
                value={q.jsonText}
                error={q.jsonError}
                onChange={q.applyJson}
                onApply={() => q.applyJson(q.jsonText)}
              />
            </div>
          </div>
        )}
      </div>
    </div>

  );
}
