'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TutorialStep {
  target: string;          // CSS selector
  title: string;
  text: string;
  action: string;          // 按鈕文字（引導使用者操作）
  position?: 'top' | 'bottom';
  requireClick?: boolean;  // true = 必須點擊目標元素才能進下一步
  listenInside?: boolean;  // true = 監聽目標元素「內部」的任何點擊（用於題幹點字）
  pulseTarget?: boolean;   // true = 目標元素加跳動動畫吸引注意
}

const STEPS: TutorialStep[] = [
  {
    target: '.case-file',
    title: '👆 試著點擊証詞中的字詞',
    text: '案件証詞裡藏著線索。注意跳動的文字——試著點擊它，或點擊任何你覺得可疑的字詞！',
    action: '👆 請點擊証詞中的文字',
    position: 'bottom',
    listenInside: true,
  },
  {
    target: '.dt-btn-scan',
    title: '🔍 掃描器',
    text: '看不出線索在哪？點擊掃描器按鈕，系統會高亮可疑區域。試試看！',
    action: '👆 請點擊掃描器',
    position: 'bottom',
    requireClick: true,
    pulseTarget: true,
  },
  {
    target: '.folder-tab-2',
    title: '📓 筆記本',
    text: '找到的線索和偵探分析都記錄在筆記本裡。點開來看看！',
    action: '👆 請點擊筆記本',
    position: 'bottom',
    requireClick: true,
    pulseTarget: true,
  },
  {
    target: '.case-file',
    title: '🎯 開始正式調查',
    text: '關掉筆記本，回到案件。點擊題幹中的可疑字詞蒐集線索，集齊關鍵線索後就能進入推理！',
    action: '開始調查！',
    position: 'bottom',
  },
];

interface Props {
  onComplete: () => void;
}

export function TutorialOverlay({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const listenerRef = useRef<(() => void) | null>(null);

  const currentStep = STEPS[step];

  // 定位目標元素
  const updateRect = useCallback(() => {
    if (!currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (el) {
      setRect(el.getBoundingClientRect());
      // 跳動動畫
      if (currentStep.pulseTarget) {
        el.classList.add('tutorial-pulse');
      }
    } else {
      setRect(null);
    }
  }, [currentStep]);

  // 清理上一步的跳動
  useEffect(() => {
    return () => {
      document.querySelectorAll('.tutorial-pulse').forEach(el => el.classList.remove('tutorial-pulse'));
    };
  }, [step]);

  useEffect(() => {
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [updateRect]);

  // requireClick / listenInside: 監聽目標元素的 click 事件
  useEffect(() => {
    const needsClick = currentStep?.requireClick || currentStep?.listenInside;
    if (!needsClick) return;

    const handler = () => {
      document.querySelectorAll('.tutorial-pulse').forEach(el => el.classList.remove('tutorial-pulse'));
      advance();
    };

    const t = setTimeout(() => {
      const el = document.querySelector(currentStep!.target);
      if (el) {
        el.addEventListener('click', handler, { once: true });
        listenerRef.current = () => el.removeEventListener('click', handler);
      }
    }, 100);

    return () => {
      clearTimeout(t);
      listenerRef.current?.();
      listenerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const advance = useCallback(() => {
    if (step >= STEPS.length - 1) {
      onComplete();
    } else {
      setStep(s => s + 1);
    }
  }, [step, onComplete]);

  if (!currentStep) return null;

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
      {/* 遮罩 + 挖洞（requireClick 時不攔截點擊，讓使用者能點目標） */}
      <div
        className="fixed inset-0 z-[10000] transition-all duration-300"
        style={{
          backgroundColor: 'rgba(0,0,0,0.6)',
          clipPath,
          pointerEvents: (currentStep.requireClick || currentStep.listenInside) ? 'none' : 'auto',
        }}
        onClick={(!currentStep.requireClick && !currentStep.listenInside) ? advance : undefined}
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
            <button onClick={onComplete} className="text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1">
              跳過
            </button>
            {!currentStep.requireClick && !currentStep.listenInside && (
              <button onClick={advance} className="text-[11px] font-bold text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded-lg transition-colors">
                {currentStep.action}
              </button>
            )}
            {(currentStep.requireClick || currentStep.listenInside) && (
              <span className="text-[11px] font-bold text-blue-400 px-3 py-1 animate-pulse">
                {currentStep.action}
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
