import type { DetectiveQuestion } from '../types';

interface Props {
  question: DetectiveQuestion;
  updateQuestion: (updates: Partial<DetectiveQuestion>) => void;
}

export function MetadataEditor({ question, updateQuestion }: Props) {
  const handleChange = <K extends keyof DetectiveQuestion>(field: K, value: DetectiveQuestion[K]) => {
    updateQuestion({ [field]: value });
  };

  const handleOptionChange = (idx: number, value: string) => {
    const next = [...question.options];
    next[idx] = value;
    updateQuestion({ options: next });
  };

  const fieldClass = "w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all";
  const labelClass = "block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1";

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      {/* 核心資訊 */}
      <section className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>題目 ID</label>
          <input 
            type="text" 
            value={question.id} 
            onChange={e => handleChange('id', e.target.value)}
            className={fieldClass}
            placeholder="如: 114-social-history-20"
          />
        </div>
        <div>
          <label className={labelClass}>來源出處</label>
          <input 
            type="text" 
            value={question.source} 
            onChange={e => handleChange('source', e.target.value)}
            className={fieldClass}
            placeholder="如: 114年會考-社會-第20題"
          />
        </div>
        <div>
          <label className={labelClass}>科目</label>
          <select 
            value={question.subject} 
            onChange={e => handleChange('subject', e.target.value as DetectiveQuestion['subject'])}
            className={fieldClass}
          >
            <option value="社會">社會</option>
            <option value="自然">自然</option>
            <option value="數學">數學</option>
            <option value="國文">國文</option>
            <option value="英文">英文</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>細分領域 (subSubject)</label>
          <input 
            type="text" 
            value={question.subSubject || ''} 
            onChange={e => handleChange('subSubject', e.target.value)}
            className={fieldClass}
            placeholder="如: 歷史 / 地理 / 公民"
          />
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
          <input 
            type="text" 
            value={question.figureImage || ''} 
            onChange={e => handleChange('figureImage', e.target.value)}
            className={fieldClass}
            placeholder="/images/detective/xxx.png"
          />
        </div>
      </section>

      {/* 選項與答案 */}
      <section className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
        <label className={labelClass}>選項與正確答案</label>
        <div className="grid grid-cols-2 gap-4">
          {['(A)', '(B)', '(C)', '(D)'].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">{label}</span>
              <input 
                type="text" 
                value={question.options[i] || ''} 
                onChange={e => handleOptionChange(i, e.target.value)}
                className={fieldClass}
              />
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
                className={`w-10 h-10 rounded-full font-bold transition-all border-2
                  ${question.answer === letter 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
              >{letter}</button>
            ))}
          </div>
        </div>
      </section>

      {/* 偵探對話設定 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className={labelClass}>偵探開場問題 (caseQuestion)</label>
          <textarea 
            rows={3}
            value={question.caseQuestion || ''} 
            onChange={e => handleChange('caseQuestion', e.target.value)}
            className={fieldClass}
            placeholder="例如: 究竟是哪個環節出了問題? 試著從證言中尋找蛛絲馬跡..."
          />
        </div>
        <div>
          <label className={labelClass}>筆記本初始提示 (startHint)</label>
          <textarea 
            rows={3}
            value={question.startHint || ''} 
            onChange={e => handleChange('startHint', e.target.value)}
            className={fieldClass}
            placeholder="尚未找到線索時，開啟筆記面板會看到的提示..."
          />
        </div>
      </section>
    </div>
  );
}
