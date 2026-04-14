'use client';

import { useLastPlayed } from './useLastPlayed';

interface Props {
  themeId: string;
  onNavigate: (href: string) => void;
}

export function ContinueButton({ themeId, onNavigate }: Props) {
  const { lastPlayed } = useLastPlayed();

  const href = lastPlayed
    ? lastPlayed.mode === 'spy'
      ? `/question-spy/${lastPlayed.questionId}?theme=${themeId}`
      : `/question-detective/${lastPlayed.questionId}?theme=${themeId}`
    : `/question-detective?theme=${themeId}`;

  const label = lastPlayed ? (lastPlayed.mode === 'spy' ? '繼續臥底' : '繼續調查') : '開始第一案';
  const subtitle = lastPlayed ? lastPlayed.questionTitle : '從檔案室挑選案件';

  return (
    <div className="px-6 max-w-md mx-auto w-full">
      <button
        onClick={() => onNavigate(href)}
        className="group flex items-center gap-4 w-full px-6 py-4 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'var(--dt-accent, #c2553a)',
          color: 'var(--dt-btn-text, white)',
          boxShadow: '0 4px 20px color-mix(in srgb, var(--dt-accent, #c2553a) 40%, transparent)',
        }}
      >
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="text-lg font-bold">{label}</div>
          <div className="text-xs opacity-80 truncate">{subtitle}</div>
        </div>
        <svg className="w-5 h-5 opacity-60 transition-transform group-hover:translate-x-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
