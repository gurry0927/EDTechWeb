'use client';

import { useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import { THEME_REGISTRY } from '@/config/themes';
import { HERO_REGISTRY } from '@/config/themeHeroes';
import { SimpleHero } from './heroes/SimpleHero';
import { ImmersiveHero } from './heroes/ImmersiveHero';

export interface ThemeHeroHandle {
  triggerImpact: () => void;
}

interface Props {
  themeId: string;
  onThemeSwitch: () => void;
}

export const ThemeHero = forwardRef<ThemeHeroHandle, Props>(function ThemeHero(
  { themeId, onThemeSwitch },
  ref
) {
  const heroConfig = HERO_REGISTRY[themeId];
  const themeEntry = THEME_REGISTRY[themeId];
  const quote = themeEntry?.homepageQuote ?? '準備好了嗎？';
  const isImmersive = heroConfig?.variant === 'immersive';

  const ring1Ref = useRef<HTMLDivElement>(null);
  const ring2Ref = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);

  const triggerImpact = useCallback(() => {
    [ring1Ref, ring2Ref, flashRef].forEach(r => {
      if (!r.current) return;
      r.current.classList.remove('active');
      void r.current.offsetWidth; // reflow
      r.current.classList.add('active');
    });
  }, []);

  useImperativeHandle(ref, () => ({ triggerImpact }), [triggerImpact]);

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

      {/* 衝擊波圓環 */}
      <div ref={ring1Ref} className="shockwave-ring z-[9]" />
      <div ref={ring2Ref} className="shockwave-ring ring2 z-[9]" />
      <div ref={flashRef} className="shockwave-flash z-[9]" />

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
});
