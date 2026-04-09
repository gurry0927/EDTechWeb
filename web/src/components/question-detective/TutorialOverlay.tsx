'use client';

import { useState, useEffect, useCallback } from 'react';

interface TutorialStep {
  target: string;       // CSS selector
  title: string;
  text: string;
  position?: 'top' | 'bottom';
  waitForEvent?: string;  // 'click-target' = 等使用者點目標才進下一步
}

const STEPS: TutorialStep[] = [
  {
    target: '.case-file',
    title: '📖 案件証詞',
    text: '這是案件的核心資料。仔細閱讀，找出你認為可疑的字詞，直接點擊它！',
    position: 'bottom',
  },
  {
    target: '.dt-btn-scan',
    title: '🔍 掃描器',
    text: '卡住了？點這個按鈕啟動掃描，系統會高亮可疑區域給你提示。',
    position: 'bottom',
  },
  {
    target: '.folder-tab-2',
    title: '📓 筆記本',
    text: '找到的線索會記錄在這裡。點開可以看到線索分析和詳細資訊。',
    position: 'bottom',
  },
  {
    target: '.dt-btn-primary',
    title: '🧠 推理階段',
    text: '集齊關鍵線索後，這個按鈕會出現。點擊進入推理，回答問題並指認證據！',
    position: 'top',
    waitForEvent: 'click-target',
  },
];

interface Props {
  onComplete: () => void;
}

export function TutorialOverlay({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const currentStep = STEPS[step];

  // 定位目標元素
  const updateRect = useCallback(() => {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (el) {
      setRect(el.getBoundingClientRect());
    } else {
      setRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [updateRect]);

  const handleNext = () => {
    if (step >= STEPS.length - 1) {
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!currentStep) return null;

  // Spotlight clip-path: 挖洞
  const padding = 8;
  const clipPath = rect
    ? `polygon(
        0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
        ${rect.left - padding}px ${rect.top - padding}px,
        ${rect.left - padding}px ${rect.bottom + padding}px,
        ${rect.right + padding}px ${rect.bottom + padding}px,
        ${rect.right + padding}px ${rect.top - padding}px,
        ${rect.left - padding}px ${rect.top - padding}px
      )`
    : undefined;

  // 泡泡位置
  const bubbleStyle: React.CSSProperties = rect ? {
    position: 'fixed',
    left: Math.max(16, Math.min(rect.left, window.innerWidth - 300)),
    ...(currentStep.position === 'top'
      ? { bottom: window.innerHeight - rect.top + padding + 12 }
      : { top: rect.bottom + padding + 12 }),
    zIndex: 10001,
    maxWidth: 280,
  } : {
    position: 'fixed',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10001,
    maxWidth: 300,
  };

  return (
    <>
      {/* 遮罩 + 挖洞 */}
      <div
        className="fixed inset-0 z-[10000] transition-all duration-300"
        style={{
          backgroundColor: 'rgba(0,0,0,0.6)',
          clipPath,
        }}
        onClick={handleNext}
      />

      {/* 高亮邊框 */}
      {rect && (
        <div
          className="fixed z-[10000] pointer-events-none rounded-lg transition-all duration-300"
          style={{
            top: rect.top - padding,
            left: rect.left - padding,
            width: rect.width + padding * 2,
            height: rect.height + padding * 2,
            boxShadow: '0 0 0 3px var(--dt-scan), 0 0 20px rgba(6,182,212,0.3)',
          }}
        />
      )}

      {/* 說明泡泡 */}
      <div style={bubbleStyle} className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-4 border border-slate-200 dark:border-slate-700">
        <div className="text-sm font-bold text-slate-800 dark:text-white mb-1">{currentStep.title}</div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{currentStep.text}</p>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400">{step + 1} / {STEPS.length}</span>
          <div className="flex gap-2">
            <button onClick={handleSkip} className="text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1">
              跳過教學
            </button>
            <button onClick={handleNext} className="text-[11px] font-bold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-lg transition-colors">
              {step >= STEPS.length - 1 ? '開始遊戲！' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
