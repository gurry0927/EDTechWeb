'use client';

import { useEffect, useRef } from 'react';

// ============================================================
// 調整區：改這裡就好
// ============================================================
const CONFIG = {
  // 角色圖寬度（vw），越大越滿版
  charWidthVw: 100,
  // 角色底部距螢幕底部的距離（dvh），越小越往下沉
  charBottomDvh: 10,
  // 角色水平偏移（vw），正數往右、負數往左
  charOffsetX: 2,
  // 煙霧透明度 0~1
  smokeOpacity: 0.55,
  // 漸層遮罩高度（dvh），越高角色越早消融
  gradientHeightDvh: 45,
  // 漸層完全不透明的位置（0~100%），越小消融越早
  gradientSolidAt: 60,
  // 淡出開始時間（距結尾幾秒）
  fadeSecs: 1.5,
};
// ============================================================

export function GuofengImmersive() {
  const charRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 視差 + 煙霧淡出淡入，統一在同一個 RAF loop
  useEffect(() => {
    let rafId: number;
    let tx = 0, ty = 0;
    let cx = 0, cy = 0;

    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      if (charRef.current) {
        charRef.current.style.transform =
          `translateX(calc(-50% + ${cx.toFixed(2)}px)) translateY(${cy.toFixed(2)}px)`;
      }

      // 煙霧淡出淡入
      const vid = videoRef.current;
      if (vid && vid.duration) {
        const t = vid.currentTime;
        const d = vid.duration;
        const f = CONFIG.fadeSecs;
        let opacity = CONFIG.smokeOpacity;
        if (t < f) opacity = (t / f) * CONFIG.smokeOpacity;
        else if (d - t < f) opacity = ((d - t) / f) * CONFIG.smokeOpacity;
        vid.style.opacity = opacity.toFixed(3);
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const onMouse = (e: MouseEvent) => {
      const hw = window.innerWidth / 2;
      const hh = window.innerHeight / 2;
      tx = ((e.clientX - hw) / hw) * 14;
      ty = ((e.clientY - hh) / hh) * 8;
    };

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      tx = Math.max(-14, Math.min(14, e.gamma * 0.35));
      ty = Math.max(-8, Math.min(8, (e.beta - 45) * 0.18));
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
  }, []);


  return (
    <>
      <video
        ref={videoRef}
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none z-[1]"
        style={{ mixBlendMode: 'screen', opacity: CONFIG.smokeOpacity, transition: 'none' }}
      >
        <source src="/avatars/darksmoke.mp4" type="video/mp4" />
      </video>

      <div
        ref={charRef}
        className="absolute left-1/2 pointer-events-none z-[2]"
        style={{ bottom: `${CONFIG.charBottomDvh}dvh`, marginLeft: `${CONFIG.charOffsetX}vw` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/avatars/Jianghu01.png"
          alt=""
          style={{
            width: `${CONFIG.charWidthVw}vw`,
            maxWidth: 'none',
            height: 'auto',
            filter: 'drop-shadow(0 8px 64px rgba(130,50,210,0.5))',
          }}
          draggable={false}
        />
      </div>

      <div
        className="absolute inset-x-0 bottom-0 pointer-events-none z-[3]"
        style={{
          height: `${CONFIG.gradientHeightDvh}dvh`,
          background: `linear-gradient(to bottom, transparent 0%, #12100c ${CONFIG.gradientSolidAt}%)`,
        }}
      />
    </>
  );
}
