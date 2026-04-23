'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GAME } from './detective-config';
import type { CutsceneStyle } from '@/config/themes';

export type CutsceneVariant = 'caseSolved' | 'cluesReady';

interface CutsceneOverlayProps {
  variant: CutsceneVariant;
  text: string;
  subtext?: string;
  /** 主題特化樣式 — null 用預設動畫，未來換特效只改 registry */
  style?: CutsceneStyle | null;
  onDismiss: () => void;
  /** 預留音效 hook — 日後接入 Web Audio */
  onPlaySound?: () => void;
}

export function CutsceneOverlay({ variant, text, subtext, style: cutsceneStyle, onDismiss, onPlaySound }: CutsceneOverlayProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    onPlaySound?.();
    const duration = variant === 'caseSolved' ? GAME.cutsceneDuration : GAME.cutsceneBannerDuration;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isFull = variant === 'caseSolved';

  // 主題特化 CSS class
  const themeClass = cutsceneStyle?.className ?? '';
  const variantClass = isFull
    ? (cutsceneStyle?.solvedClass ?? '')
    : (cutsceneStyle?.readyClass ?? '');

  // 閃光背景：主題覆蓋 > 預設 gradient
  const defaultFlashBg = isFull
    ? 'radial-gradient(circle, var(--dt-accent, #f59e0b) 0%, transparent 70%)'
    : 'linear-gradient(90deg, transparent, var(--dt-accent, #f59e0b), transparent)';
  const flashBg = cutsceneStyle?.flashBg ?? defaultFlashBg;

  const overlay = (
    <div className={`fixed inset-0 pointer-events-none ${themeClass} ${variantClass}`.trim()} style={{ zIndex: 99999 }} aria-hidden>
      {/* 閃光層 */}
      <div
        className="absolute inset-0"
        style={{
          background: flashBg,
          animation: `cutscene-flash ${isFull ? '400ms' : '300ms'} ease-out forwards`,
        }}
      />

      {/* 文字容器 */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          animation: `cutscene-slide-in 400ms cubic-bezier(0.22, 1, 0.36, 1) ${isFull ? '150ms' : '100ms'} both,
                      cutscene-shake 500ms ease-in-out ${isFull ? '550ms' : '500ms'} both,
                      cutscene-fade-out 400ms ease-in ${isFull ? '1600ms' : '1400ms'} forwards`,
        }}
      >
        {/* 背景條 */}
        <div
          className={`${isFull ? 'px-12 py-6' : 'px-8 py-3'} cutscene-text-bg`}
          style={{
            background: isFull
              ? 'linear-gradient(90deg, transparent, var(--dt-card, rgba(0,0,0,0.85)) 15%, var(--dt-card, rgba(0,0,0,0.85)) 85%, transparent)'
              : 'linear-gradient(90deg, transparent, var(--dt-card, rgba(0,0,0,0.85)) 10%, var(--dt-card, rgba(0,0,0,0.85)) 90%, transparent)',
            width: '100vw',
            textAlign: 'center',
          }}
        >
          <div
            className={`cutscene-text font-black tracking-wider ${isFull ? 'text-3xl sm:text-4xl' : 'text-xl sm:text-2xl'}`}
            style={{ color: 'var(--dt-accent, #f59e0b)' }}
          >
            {text}
          </div>
          {subtext && (
            <div
              className={`mt-1 tracking-wide ${isFull ? 'text-base sm:text-lg' : 'text-sm sm:text-base'}`}
              style={{ color: 'var(--dt-text, #e8e0d0)' }}
            >
              {subtext}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Portal 到 document.body，完全跳出所有父層 stacking context
  if (!mounted) return null;
  return createPortal(overlay, document.body);
}
