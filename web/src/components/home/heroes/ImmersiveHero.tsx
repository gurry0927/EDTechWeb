'use client';

import { useEffect, useRef } from 'react';
import { ImmersiveHeroConfig } from '@/config/themeHeroes';

interface Props {
  config: ImmersiveHeroConfig;
}

export function ImmersiveHero({ config }: Props) {
  const charRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number;
    let tx = 0, ty = 0;
    let cx = 0, cy = 0;

    const tick = () => {
      cx += (tx - cx) * 0.05; // 稍慢一點，更有重量感
      cy += (ty - cy) * 0.05;

      if (charRef.current) {
        // 位移 + 透視傾斜：製造 2.5D 立體感
        const rotY = (cx / 22) * 4;   // 最大 ±4deg
        const rotX = -(cy / 10) * 2;  // 最大 ±2deg，往下看時微微仰頭
        charRef.current.style.transform = [
          `translateX(calc(-50% + ${cx.toFixed(2)}px))`,
          `translateY(${cy.toFixed(2)}px)`,
          `perspective(800px)`,
          `rotateY(${rotY.toFixed(2)}deg)`,
          `rotateX(${rotX.toFixed(2)}deg)`,
        ].join(' ');
      }

      // 背景反向微移，強化景深
      if (bgRef.current) {
        bgRef.current.style.transform =
          `translate(${(-cx * 0.3).toFixed(2)}px, ${(-cy * 0.3).toFixed(2)}px) scale(1.08)`;
      }

      // 煙霧淡出淡入
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
      tx = ((e.clientX - hw) / hw) * 22; // 14 → 22，位移更明顯
      ty = ((e.clientY - hh) / hh) * 10;
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tx = Math.max(-22, Math.min(22, e.gamma * 0.5));
      ty = Math.max(-10, Math.min(10, (e.beta - 45) * 0.22));
    };

    window.addEventListener('mousemove', onMouse);
    window.addEventListener('deviceorientation', onOrientation);

    const tryGyro = async () => {
      const DOE = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
      if (typeof DOE.requestPermission === 'function') {
        try {
          const result = await DOE.requestPermission();
          if (result === 'granted') window.addEventListener('deviceorientation', onOrientation);
        } catch { /* user declined */ }
      }
    };
    window.addEventListener('click', tryGyro, { once: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('deviceorientation', onOrientation);
    };
  }, [config]);

  return (
    <>
      {/* 背景 video — 反向微移，scale(1.08) 防止邊緣露白 */}
      <div
        ref={bgRef}
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{ willChange: 'transform' }}
      >
        <video
          ref={videoRef}
          autoPlay muted loop playsInline
          className="w-full h-full object-cover"
          style={{ mixBlendMode: 'screen', opacity: config.smokeOpacity }}
        >
          <source src={config.bgVideo} type="video/mp4" />
        </video>
      </div>

      {/* 角色 — perspective 讓 rotateY/X 有真實透視感 */}
      <div
        ref={charRef}
        className="absolute left-1/2 pointer-events-none z-[2]"
        style={{
          top: `${config.charTopDvh}dvh`,
          marginLeft: `${config.charOffsetX}vw`,
          willChange: 'transform',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={config.idleImage}
          alt=""
          style={{
            width: `min(${config.charWidthVw}vw, ${config.charMaxWidthPx}px)`,
            maxWidth: 'none',
            height: 'auto',
            filter: 'drop-shadow(0 8px 64px rgba(130,50,210,0.5))',
            transformStyle: 'preserve-3d',
          }}
          draggable={false}
        />
      </div>

      {/* 漸層遮罩 */}
      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-[3]"
        style={{
          height: `${config.gradientHeightDvh}dvh`,
          background: `linear-gradient(to bottom, transparent 0%, #12100c ${config.gradientSolidAt}%)`,
        }}
      />
    </>
  );
}
