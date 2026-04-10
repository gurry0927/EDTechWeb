'use client';

import { THEME_REGISTRY } from '@/components/question-detective/theme-registry';

interface Props {
  themeId: string;
  onThemeSwitch: () => void;
}

export function CharacterHero({ themeId, onThemeSwitch }: Props) {
  const entry = THEME_REGISTRY[themeId];
  const avatar = entry?.avatar.detective ?? '🕵️';
  const quote = entry?.homepageQuote ?? '準備好了嗎？';

  return (
    <div className="relative flex flex-col items-center justify-end h-[42dvh] overflow-hidden select-none">
      {/* 頂部快捷列 — 未來放公告/每日任務/設定等 */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 pt-3">
        <div className="flex gap-2">
          {/* 左側預留：公告、每日任務等 */}
        </div>
        <div className="flex gap-2">
          {/* 右側預留：設定、通知等 */}
        </div>
      </div>

      {/* 背景裝飾 */}
      <div className="absolute inset-0 opacity-20" style={{
        background: `radial-gradient(ellipse at 50% 60%, var(--dt-accent, #c2553a) 0%, transparent 70%)`,
      }} />

      {/* 角色 */}
      <button
        onClick={onThemeSwitch}
        className="relative z-10 text-[10rem] sm:text-[12rem] leading-none transition-transform duration-300 hover:scale-110 active:scale-95 cursor-pointer"
        title="切換主題"
      >
        {avatar}
      </button>

      {/* 台詞氣泡 */}
      <div className="relative z-10 mt-4 px-5 py-2.5 rounded-2xl max-w-[280px] text-center"
        style={{
          background: 'color-mix(in srgb, var(--dt-card, #f8f4eb) 90%, transparent)',
          border: '1px solid var(--dt-border, rgba(140,120,80,0.15))',
        }}
      >
        <p className="text-sm leading-relaxed" style={{ color: 'var(--dt-text, #3d3426)' }}>
          「{quote}」
        </p>
      </div>

      {/* 主題指示器 */}
      <div className="relative z-10 mt-3 flex gap-1.5">
        {Object.keys(THEME_REGISTRY).map(id => (
          <div
            key={id}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              id === themeId ? 'scale-125' : 'opacity-40'
            }`}
            style={{ background: id === themeId ? 'var(--dt-accent, #c2553a)' : 'var(--dt-text-muted, #94a3b8)' }}
          />
        ))}
      </div>
    </div>
  );
}
