import { useState, useMemo, useEffect } from 'react';
import type { DetectiveQuestion } from '../types';

interface Props {
  question: DetectiveQuestion;
  updateQuestion: (updates: Partial<DetectiveQuestion>) => void;
}

// 科目 → 細分領域對照
const SUB_SUBJECTS: Record<string, string[]> = {
  '社會': ['歷史', '地理', '公民'],
  '自然': ['生物', '理化', '地科'],
  '數學': [],
  '國文': [],
  '英文': [],
};

// 中文科目 → 英文 slug
const SUBJECT_SLUG: Record<string, string> = {
  '社會': 'social', '自然': 'science', '數學': 'math', '國文': 'chinese', '英文': 'english',
};
const SUB_SLUG: Record<string, string> = {
  '歷史': 'history', '地理': 'geography', '公民': 'civics',
  '生物': 'biology', '理化': 'physics', '地科': 'earth',
};

function generateId(source: string, subject: string, subSubject: string): string {
  // 從 source 解析年份和題號：「114年會考-社會-第20題」→ 114, 20
  const yearMatch = source.match(/^(\d+)年/);
  const numMatch = source.match(/第(\d+)題/);
  if (!yearMatch || !numMatch) return '';
  const year = yearMatch[1];
  const num = numMatch[1].padStart(2, '0');
  const subj = SUBJECT_SLUG[subject] || subject.toLowerCase();
  const sub = SUB_SLUG[subSubject] || subSubject.toLowerCase();
  return sub ? `${year}-${subj}-${sub}-${num}` : `${year}-${subj}-${num}`;
}

function generateSource(year: string, subject: string, num: string): string {
  return `${year}年會考-${subject}-第${num}題`;
}

export function MetadataEditor({ question, updateQuestion }: Props) {
  const [idMode, setIdMode] = useState<'auto' | 'custom'>('auto');
  const [examYear, setExamYear] = useState('');
  const [examNum, setExamNum] = useState('');

  // 從現有 source 初始化 year/num
  useEffect(() => {
    const ym = question.source.match(/^(\d+)年/);
    const nm = question.source.match(/第(\d+)題/);
    if (ym) setExamYear(ym[1]);
    if (nm) setExamNum(nm[1]);
  }, [question.id]); // 只在切換題目時重算

  const autoId = useMemo(
    () => generateId(question.source, question.subject, question.subSubject || ''),
    [question.source, question.subject, question.subSubject]
  );

  const handleChange = <K extends keyof DetectiveQuestion>(field: K, value: DetectiveQuestion[K]) => {
    updateQuestion({ [field]: value });
  };

  const handleSubjectChange = (subject: DetectiveQuestion['subject']) => {
    const subs = SUB_SUBJECTS[subject] || [];
    updateQuestion({
      subject,
      subSubject: subs[0] || '',
    });
  };

  const handleExamFieldChange = (year: string, num: string, subject: string, subSubject: string) => {
    const src = generateSource(year, subject, num);
    const updates: Partial<DetectiveQuestion> = { source: src };
    if (idMode === 'auto') {
      updates.id = generateId(src, subject, subSubject);
    }
    updateQuestion(updates);
  };

  const handleOptionChange = (idx: number, value: string) => {
    const next = [...question.options];
    next[idx] = value;
    updateQuestion({ options: next });
  };

  const handleTagsChange = (value: string) => {
    updateQuestion({ tags: value.split(/[,、]/).map(t => t.trim()).filter(Boolean) });
  };

  const subOptions = SUB_SUBJECTS[question.subject] || [];

  const fieldClass = "w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1";

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* ID 模式切換 + 會考快速填寫 */}
      <section className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-4">
          <label className="text-xs font-bold text-blue-700">題目 ID 模式</label>
          <div className="flex gap-2">
            <button
              onClick={() => { setIdMode('auto'); if (autoId) updateQuestion({ id: autoId }); }}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${idMode === 'auto' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
            >自動生成</button>
            <button
              onClick={() => setIdMode('custom')}
              className={`px-3 py-1 text-xs rounded-full border transition-all ${idMode === 'custom' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}
            >自訂</button>
          </div>
        </div>

        {idMode === 'auto' ? (
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className={labelClass}>年份</label>
              <input
                type="text"
                value={examYear}
                onChange={e => { setExamYear(e.target.value); handleExamFieldChange(e.target.value, examNum, question.subject, question.subSubject || ''); }}
                className={fieldClass}
                placeholder="114"
              />
            </div>
            <div>
              <label className={labelClass}>科目</label>
              <select
                value={question.subject}
                onChange={e => { handleSubjectChange(e.target.value as DetectiveQuestion['subject']); handleExamFieldChange(examYear, examNum, e.target.value, SUB_SUBJECTS[e.target.value]?.[0] || ''); }}
                className={fieldClass}
              >
                {Object.keys(SUB_SUBJECTS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>領域</label>
              {subOptions.length > 0 ? (
                <select
                  value={question.subSubject || ''}
                  onChange={e => { handleChange('subSubject', e.target.value); handleExamFieldChange(examYear, examNum, question.subject, e.target.value); }}
                  className={fieldClass}
                >
                  {subOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input type="text" value={question.subSubject || ''} onChange={e => handleChange('subSubject', e.target.value)} className={fieldClass} placeholder="選填" />
              )}
            </div>
            <div>
              <label className={labelClass}>題號</label>
              <input
                type="text"
                value={examNum}
                onChange={e => { setExamNum(e.target.value); handleExamFieldChange(examYear, e.target.value, question.subject, question.subSubject || ''); }}
                className={fieldClass}
                placeholder="20"
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>題目 ID</label>
              <input type="text" value={question.id} onChange={e => handleChange('id', e.target.value)} className={fieldClass} placeholder="如: 114-social-history-20" />
            </div>
            <div>
              <label className={labelClass}>來源出處</label>
              <input type="text" value={question.source} onChange={e => handleChange('source', e.target.value)} className={fieldClass} placeholder="如: 114年會考-社會-第20題" />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">預覽：</span>
          <code className="px-2 py-0.5 bg-white border border-slate-200 rounded text-blue-600 font-mono">{question.id || '（未設定）'}</code>
          <span className="text-slate-300">→</span>
          <span className="text-slate-500">{question.source || '（未設定）'}</span>
        </div>
      </section>

      {/* 難度 / 年級 / 標籤 */}
      <section className="grid grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>難度</label>
          <div className="flex gap-2">
            {([1, 2, 3] as const).map(d => (
              <button
                key={d}
                onClick={() => handleChange('difficulty', d)}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                  question.difficulty === d ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >{'⭐'.repeat(d)}</button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>適用年級 (gradeLevel)</label>
          <input type="text" value={question.gradeLevel || ''} onChange={e => handleChange('gradeLevel', e.target.value)} className={fieldClass} placeholder="如: 一上 / 九年級" />
        </div>
        <div>
          <label className={labelClass}>標籤 (tags，逗號分隔)</label>
          <input type="text" value={(question.tags || []).join('、')} onChange={e => handleTagsChange(e.target.value)} className={fieldClass} placeholder="如: 清領時期、台灣糖業" />
        </div>
      </section>

      {/* 題幹內容 */}
      <section className="space-y-4">
        <div>
          <label className={labelClass}>題幹主文 (mainStem)</label>
          <textarea
            rows={5}
            value={question.mainStem}
            onChange={e => handleChange('mainStem', e.target.value)}
            className={`${fieldClass} font-serif leading-relaxed text-base`}
            placeholder="請輸入完整題幹..."
          />
        </div>
        <div>
          <label className={labelClass}>證物細節文字 (figure)</label>
          <textarea
            rows={2}
            value={question.figure || ''}
            onChange={e => handleChange('figure', e.target.value)}
            className={fieldClass}
            placeholder="若有地圖或圖表中的文字描述，請輸入於此..."
          />
        </div>
        <div>
          <label className={labelClass}>證物圖片路徑 (figureImage)</label>
          <input type="text" value={question.figureImage || ''} onChange={e => handleChange('figureImage', e.target.value)} className={fieldClass} placeholder="/images/detective/xxx.png" />
        </div>
      </section>

      {/* 選項與答案 */}
      <section className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
        <label className={labelClass}>選項與正確答案</label>
        <div className="grid grid-cols-2 gap-4">
          {['(A)', '(B)', '(C)', '(D)'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">{label}</span>
              <input type="text" value={question.options[i] || ''} onChange={e => handleOptionChange(i, e.target.value)} className={fieldClass} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 pt-2">
          <span className="text-sm font-bold text-slate-600">正確答案：</span>
          <div className="flex gap-2">
            {['A', 'B', 'C', 'D'].map(letter => (
              <button
                key={letter}
                onClick={() => handleChange('answer', letter)}
                className={`w-10 h-10 rounded-full font-bold transition-all border-2 ${
                  question.answer === letter ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                }`}
              >{letter}</button>
            ))}
          </div>
        </div>
      </section>

      {/* 偵探對話設定 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>偵探開場問題 (caseQuestion)</label>
          <textarea rows={3} value={question.caseQuestion || ''} onChange={e => handleChange('caseQuestion', e.target.value)} className={fieldClass} placeholder="例如: 究竟是哪個環節出了問題?" />
        </div>
        <div>
          <label className={labelClass}>筆記本初始提示 (startHint)</label>
          <textarea rows={3} value={question.startHint || ''} onChange={e => handleChange('startHint', e.target.value)} className={fieldClass} placeholder="尚未找到線索時的提示..." />
        </div>
      </section>
    </div>
  );
}
