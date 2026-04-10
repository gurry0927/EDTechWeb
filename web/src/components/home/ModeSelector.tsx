'use client';

import Link from 'next/link';

interface GameMode {
  id: string;
  label: string;
  icon: string;
  href?: string;
  locked: boolean;
}

const MODES: GameMode[] = [
  { id: 'detective', label: '偵探', icon: '🔍', href: '/question-detective', locked: false },
  { id: 'spy',       label: '臥底', icon: '🎭', locked: true },
  { id: 'bomb',      label: '拆彈', icon: '💣', locked: true },
  { id: 'decrypt',   label: '解密', icon: '🧩', locked: true },
];

interface Props {
  themeId: string;
}

export function ModeSelector({ themeId }: Props) {
  return (
    <div className="px-6 mt-6 max-w-md mx-auto w-full">
      <div className="text-[11px] font-medium tracking-wider mb-3 opacity-50"
        style={{ color: 'var(--dt-text-muted, #94a3b8)' }}>
        遊戲模式
      </div>
      <div className="flex gap-3">
        {MODES.map(mode => {
          const inner = (
            <div className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all duration-200 ${
              mode.locked ? 'opacity-40 cursor-default' : 'hover:scale-105 active:scale-95 cursor-pointer'
            }`}
              style={{
                background: 'color-mix(in srgb, var(--dt-card, #f8f4eb) 80%, transparent)',
                border: `1px solid ${mode.locked ? 'transparent' : 'var(--dt-border, rgba(140,120,80,0.15))'}`,
              }}
            >
              <span className="text-2xl relative">
                {mode.icon}
                {mode.locked && (
                  <span className="absolute -bottom-0.5 -right-1 text-xs">🔒</span>
                )}
              </span>
              <span className="text-[11px] font-medium" style={{ color: 'var(--dt-text, #3d3426)' }}>
                {mode.label}
              </span>
            </div>
          );

          if (mode.locked || !mode.href) {
            return <div key={mode.id} className="flex-1">{inner}</div>;
          }
          return (
            <Link key={mode.id} href={`${mode.href}?theme=${themeId}`} className="flex-1">
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
