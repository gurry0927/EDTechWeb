'use client';

import { useRef, useCallback } from 'react';
import { THEME_REGISTRY } from '@/config/themes';
import { HERO_REGISTRY } from '@/config/themeHeroes';
import { SimpleHero } from './heroes/SimpleHero';
import { ImmersiveHero } from './heroes/ImmersiveHero';

interface Props {
  themeId: string;
  onThemeSwitch: () => void;
}

export function ThemeHero({ themeId, onThemeSwitch }: Props) {
  const heroConfig = HERO_REGISTRY[themeId];
  const themeEntry = THEME_REGISTRY[themeId];
  const quote = themeEntry?.homepageQuote ?? '準備好了嗎？';
  const isImmersive = heroConfig?.variant === 'immersive';
  const shockwaveRef = useRef<HTMLDivElement>(null);

  const triggerImpact = useCallback(() => {
    const el = shockwaveRef.current;
    if (!el) return;
    // 重置 animation
    el.style.animation = 'none';
    void el.offsetWidth; // reflow
    el.style.animation = '';
    el.classList.remove('shockwave-active');
    void el.offsetWidth;
    el.classList.add('shockwave-active');
  }, []);

  return (
    <div className={`relative flex flex-col items-center justify-end overflow-hidden select-none ${
      isImmersive ? 'h-[70dvh]' : 'flex-1 min-h-[200px]'
    }`}>

      {isImmersive && heroConfig.variant === 'immersive' && (
        <ImmersiveHero config={heroConfig} onImpact={triggerImpact} />
      )}

      {!isImmersive && (
        <SimpleHero themeId={themeId} onThemeSwitch={onThemeSwitch} />
      )}

      {/* 衝擊波 overlay */}
      <div
        ref={shockwaveRef}
        className="absolute inset-0 pointer-events-none z-[8]"
        style={{ borderRadius: 'inherit' }}
      />

      {/* 台詞氣泡 */}
      <div
        className="relative z-10 mt-4 px-5 py-2.5 rounded-2xl max-w-[280px] text-center"
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
      <div className="relative z-10 mt-3 flex gap-1.5" onClick={onThemeSwitch} role="button">
        {Object.keys(THEME_REGISTRY).map(id => (
          <div
            key={id}
            className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
              id === themeId ? 'scale-125' : 'opacity-40'
            }`}
            style={{
              background: id === themeId
                ? 'var(--dt-accent, #c2553a)'
                : 'var(--dt-text-muted, #94a3b8)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
