import { useState } from 'react';
import type { DetectiveQuestion, Clue, ScaffoldingRegion, ApiKey } from '../types';
import { callWithRotation } from '../api';

interface Props {
  question: DetectiveQuestion;
  updateQuestion: (updates: Partial<DetectiveQuestion>) => void;
  apiKeys: ApiKey[];
}

export function ClueDetailEditor({ question, updateQuestion, apiKeys }: Props) {
  const [isGenerating, setIsGenerating] = useState<number | string | null>(null);

  const handleUpdateClue = (idx: number, updates: Partial<Clue>) => {
    const next = [...question.clues];
    next[idx] = { ...next[idx], ...updates };
    updateQuestion({ clues: next });
  };

  const handleUpdateScaffold = (idx: number, updates: Partial<ScaffoldingRegion>) => {
    const next = [...(question.scaffolding ?? [])];
    next[idx] = { ...next[idx], ...updates };
    updateQuestion({ scaffolding: next });
  };

  async function handleAiGenerate(clueIdx: number) {
    const clue = question.clues[clueIdx];
    setIsGenerating(clueIdx);
    
    const prompt = `
你是一位專業的「問題偵探」遊戲設計師。請根據以下題幹與選定的線索，設計具備懸念的「引子 (teaser)」與具備教學意義的「筆記本詳解 (why)」。

題幹："""${question.mainStem}"""
線索："""${clue.text}"""
屬性：${clue.isCritical ? '關鍵線索 (引導核心推理)' : '輔助線索 (補充背景)'}

任務需求：
1. teaser (聊天室引子)：一句話。要帶有神秘感、鉤子，話說一半，引發學生點擊筆記本看詳解。
2. why (筆記本詳解)：1-3 句話。解釋為什麼這是一個重要線索，它背後的社會科（歷史/地理/公民）知識點是什麼。
3. reasoning (推理小題，選填)：若此線索值得深挖，設計一個選擇題。包含 prompt (問題), choices (4個選項), answerIndex (正確索引0-3), correct (答對語氣), wrong (答錯語氣)。

請回傳 JSON 格式：
{
  "teaser": "...",
  "why": "...",
  "reasoning": { "prompt": "...", "choices": ["...", "..."], "answerIndex": 0, "correct": "...", "wrong": "..." }
}
`;

    try {
      const { result } = await callWithRotation(apiKeys, prompt);
      let json = result;
      // AI 可能包在 ```json ... ``` 裡
      const fenced = result.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenced) json = fenced[1];
      const data = JSON.parse(json);
      handleUpdateClue(clueIdx, data);
    } catch (e) {
      alert('AI 生成失敗：' + (e instanceof Error ? e.message : '未知錯誤'));
    } finally {
      setIsGenerating(null);
    }
  }

  async function handleAiGenerateAll() {
    setIsGenerating('all');
    for (let i = 0; i < question.clues.length; i++) {
      try {
        await handleAiGenerate(i);
      } catch {
        break; // 失敗就停
      }
    }
    setIsGenerating(null);
  }

  const fieldClass = "w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none";
  const sectionLabel = "text-[10px] font-bold text-slate-400 uppercase tracking-tighter block mb-1";

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      <header className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">內容深層設計</h2>
          <p className="text-sm text-slate-500">在此為標記好的線索撰寫對話、筆記詳解與推理題目。</p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> 關鍵線索
            <span className="w-2 h-2 rounded-full bg-sky-400 ml-2" /> 輔助線索
          </div>
          {question.clues.length > 0 && (
            <button
              disabled={isGenerating !== null}
              onClick={handleAiGenerateAll}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 px-3 py-1 rounded bg-indigo-50 border border-indigo-200 shadow-sm active:scale-95 disabled:opacity-50 transition-all"
            >
              {isGenerating !== null ? '✨ 生成中…' : '✨ 全部 AI 生成'}
            </button>
          )}
        </div>
      </header>

      <div className="space-y-6">
        {question.clues.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-400">尚未在「線索標記」階段建立任何線索。</p>
          </div>
        )}

        {question.clues.map((clue, idx) => (
          <div key={idx} className={`relative bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${clue.isCritical ? 'border-blue-200 ring-1 ring-blue-50' : 'border-slate-200'}`}>
            {/* Header */}
            <div className={`px-4 py-2 flex items-center justify-between ${clue.isCritical ? 'bg-blue-50/50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${clue.isCritical ? 'bg-blue-600 text-white' : 'bg-sky-400 text-white'}`}>
                  {clue.isCritical ? '關鍵' : '輔助'}
                </span>
                <span className="font-bold text-slate-700">「{clue.text}」</span>
              </div>
              <button
                disabled={isGenerating !== null}
                onClick={() => handleAiGenerate(idx)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded bg-white border border-blue-200 shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isGenerating === idx ? '✨ 生成中...' : '✨ AI 生成內容'}
              </button>
            </div>

            {/* Content */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className={sectionLabel}>聊天室引子 (teaser) — 懸念/鉤子</label>
                  <textarea
                    rows={2}
                    value={clue.teaser || ''}
                    onChange={e => handleUpdateClue(idx, { teaser: e.target.value })}
                    className={fieldClass}
                    placeholder="點中後立刻說出的話，例如: 這正是政策的核心對象。這種身分在目前的農村體系中扮演什麼角色？"
                  />
                </div>
                <div>
                  <label className={sectionLabel}>筆記本詳解 (why) — 核心知識點</label>
                  <textarea
                    rows={4}
                    value={clue.why || ''}
                    onChange={e => handleUpdateClue(idx, { why: e.target.value })}
                    className={fieldClass}
                    placeholder="筆記本內的資訊，例如: 「農業移工」的出現象徵了國家對傳統產業的制度性救援..."
                  />
                </div>
              </div>

              <div className="space-y-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                <label className={sectionLabel}>分支推理小題 (reasoning) — 選填</label>
                {clue.reasoning ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={clue.reasoning.prompt}
                      onChange={e => handleUpdateClue(idx, { reasoning: { ...clue.reasoning!, prompt: e.target.value } })}
                      className={fieldClass}
                      placeholder="推理問題..."
                    />
                    <div className="grid grid-cols-2 gap-2">
                      {clue.reasoning.choices.map((choice, ci) => (
                        <div key={ci} className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            checked={clue.reasoning!.answerIndex === ci}
                            onChange={() => handleUpdateClue(idx, { reasoning: { ...clue.reasoning!, answerIndex: ci } })}
                            id={`r-${idx}-${ci}`}
                          />
                          <input
                            type="text"
                            value={choice}
                            onChange={e => {
                              const nextChoices = [...clue.reasoning!.choices];
                              nextChoices[ci] = e.target.value;
                              handleUpdateClue(idx, { reasoning: { ...clue.reasoning!, choices: nextChoices } });
                            }}
                            className={`${fieldClass} py-1 text-xs`}
                          />
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={() => handleUpdateClue(idx, { reasoning: undefined })}
                      className="text-[10px] text-red-400 hover:text-red-500"
                    >移除推理題</button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpdateClue(idx, { reasoning: { prompt: '', choices: ['', '', '', ''], answerIndex: 0, correct: '正確！你觀察得很細微。', wrong: '再想想看，這個線索沒那麼簡單。' } })}
                    className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 text-xs hover:border-slate-300 hover:text-slate-500 transition-all"
                  >
                    + 新增推理小題
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* 鷹架區域 */}
        {(question.scaffolding ?? []).length > 0 && (
          <div className="mt-12 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">鷹架與雜訊訊息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.scaffolding!.map((scaf, idx) => (
                <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${scaf.type === 'context' ? 'bg-amber-400' : 'bg-red-400'}`} />
                       <span className="text-sm font-bold text-slate-700">「{scaf.text}」</span>
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase">{scaf.type === 'context' ? '脈絡提示' : '雜訊干擾'}</span>
                  </div>
                  <textarea
                    rows={2}
                    value={scaf.hint}
                    onChange={e => handleUpdateScaffold(idx, { hint: e.target.value })}
                    className={fieldClass}
                    placeholder="命中時偵探會說什麼？"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
