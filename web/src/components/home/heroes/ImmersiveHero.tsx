'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { ImmersiveHeroConfig } from '@/config/themeHeroes';

export interface ImmersiveHeroHandle {
  triggerLook: () => void;
}

interface Props {
  config: ImmersiveHeroConfig;
  onCharClick?: () => void;
}

export const ImmersiveHero = forwardRef<ImmersiveHeroHandle, Props>(function ImmersiveHero(
  { config, onCharClick },
  ref
) {
  const charRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const [looking, setLooking] = useState(false);
  const lookTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerLook = useCallback(() => {
    if (!config.lookImage) return;
    if (lookTimerRef.current) clearTimeout(lookTimerRef.current);
    setLooking(true);
    lookTimerRef.current = setTimeout(() => setLooking(false), 1800);
  }, [config.lookImage]);

  useImperativeHandle(ref, () => ({ triggerLook }), [triggerLook]);

  // 視差 + 煙霧 RAF
  useEffect(() => {
    let rafId: number;
    let tx = 0, ty = 0;
    let cx = 0, cy = 0;

    const tick = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;

      if (charRef.current) {
        const rotY = (cx / 22) * 4;
        const rotX = -(cy / 10) * 2;
        charRef.current.style.transform = [
          `translateX(calc(-50% + ${cx.toFixed(2)}px))`,
          `translateY(${cy.toFixed(2)}px)`,
          `perspective(800px)`,
          `rotateY(${rotY.toFixed(2)}deg)`,
          `rotateX(${rotX.toFixed(2)}deg)`,
        ].join(' ');
      }

      if (bgRef.current) {
        bgRef.current.style.transform =
          `translate(${(-cx * 0.3).toFixed(2)}px, ${(-cy * 0.3).toFixed(2)}px) scale(1.08)`;
      }

      const vid = videoRef.current;
      if (vid && vid.duration) {
        const t = vid.currentTime;
        const d = vid.duration;
        const f = config.fadeSecs;
        let opacity = config.smokeOpacity;
        if (t < f) opacity = (t / f) * config.smokeOpacity;
        else if (d - t < f) opacity = ((d - t) / f) * config.smokeOpacity;
        vid.style.opacity = opacity.toFixed(3);
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onMouse = (e: MouseEvent) => {
      const hw = window.innerWidth / 2;
      const hh = window.innerHeight / 2;
      tx = ((e.clientX - hw) / hw) * 22;
      ty = ((e.clientY - hh) / hh) * 10;
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tx = Math.max(-22, Math.min(22, e.gamma * 0.5));
      ty = Math.max(-10, Math.min(10, (e.beta - 45) * 0.22));
    };

    window.addEventListener('mousemove', onMouse);

    const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    const enableGyro = () => {
      window.addEventListener('deviceorientation', onOrientation);
      localStorage.setItem('gyro-permission', 'granted');
    };
    const tryGyro = async () => {
      if (typeof DOE.requestPermission !== 'function') { enableGyro(); return; }
      try {
        const result = await DOE.requestPermission();
        if (result === 'granted') enableGyro();
      } catch { /* declined */ }
    };
    window.addEventListener('click', tryGyro, { once: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('deviceorientation', onOrientation);
    };
  }, [config]);

  const handleCharClick = () => {
    triggerLook();
    onCharClick?.();
  };

  return (
    <>
      <div ref={bgRef} className="absolute inset-0 pointer-events-none z-[1]" style={{ willChange: 'transform' }}>
        <video
          ref={videoRef}
          autoPlay muted loop playsInline
          className="w-full h-full object-cover"
          style={{ mixBlendMode: 'screen', opacity: config.smokeOpacity }}
        >
          <source src={config.bgVideo} type="video/mp4" />
        </video>
      </div>

      <div
        ref={charRef}
        className="absolute left-1/2 z-[2] cursor-pointer"
        style={{ top: `${config.charTopDvh}dvh`, marginLeft: `${config.charOffsetX}vw`, willChange: 'transform' }}
        onClick={handleCharClick}
      >
        <div className="relative" style={{ width: `min(${config.charWidthVw}vw, ${config.charMaxWidthPx}px)` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={config.idleImage}
            alt=""
            style={{
              width: '100%', height: 'auto', maxWidth: 'none',
              filter: `drop-shadow(0 8px 64px ${config.charGlowColor ?? 'rgba(130,50,210,0.5)'})`,
              transition: 'opacity 0.6s ease',
              opacity: looking ? 0 : 1,
              position: 'relative',
            }}
            draggable={false}
          />
          {config.lookImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.lookImage}
              alt=""
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: 'auto', maxWidth: 'none',
                filter: `drop-shadow(0 8px 64px ${config.charGlowColor ?? 'rgba(130,50,210,0.7)'})`,
                transition: 'opacity 0.6s ease',
                opacity: looking ? 1 : 0,
              }}
              draggable={false}
            />
          )}
        </div>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-[3]"
        style={{
          height: `${config.gradientHeightDvh}dvh`,
          background: `linear-gradient(to bottom, transparent 0%, var(--dt-wood) ${config.gradientSolidAt}%)`,
        }}
      />
    </>
  );
});
