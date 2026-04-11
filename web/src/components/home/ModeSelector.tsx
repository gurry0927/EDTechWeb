'use client';

import { GAME_MODES } from '@/config/gameModes';

interface Props {
  themeId: string;
  onNavigate: (href: string) => void;
}

export function ModeSelector({ themeId, onNavigate }: Props) {
  return (
    <div className="px-6 max-w-md mx-auto w-full">
      <div className="text-[11px] font-medium tracking-wider mb-3 opacity-50"
        style={{ color: 'var(--dt-text-muted, #94a3b8)' }}>
        遊戲模式
      </div>
      <div className="flex gap-3">
        {GAME_MODES.map(mode => {
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
            <div
              key={mode.id}
              className="flex-1"
              onClick={() => onNavigate(`${mode.href}?theme=${themeId}`)}
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
