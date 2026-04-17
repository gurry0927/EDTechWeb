'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { VALID_THEME_IDS, DEFAULT_THEME } from '@/config/themes';
import { ThemeHero, type ThemeHeroHandle } from '@/components/home/ThemeHero';
import { ContinueButton } from '@/components/home/ContinueButton';
import { ModeSelector } from '@/components/home/ModeSelector';
import { BottomNav, type Tab } from '@/components/home/BottomNav';
import { AlbumPanel } from '@/components/home/AlbumPanel';
import { MePanel } from '@/components/home/MePanel';

export default function Home() {
  const router = useRouter();
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const heroRef = useRef<ThemeHeroHandle>(null);
  const wipeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('theme');
    const stored = localStorage.getItem('dt-theme');
    const resolved = [param, stored].find(t => t && VALID_THEME_IDS.includes(t!));
    if (resolved) setTheme(resolved);
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme(prev => {
      const idx = VALID_THEME_IDS.indexOf(prev);
      const next = VALID_THEME_IDS[(idx + 1) % VALID_THEME_IDS.length];
      localStorage.setItem('dt-theme', next);
      return next;
    });
  }, []);

  const handleThemeChange = useCallback((id: string) => {
    setTheme(id);
    localStorage.setItem('dt-theme', id);
  }, []);

  // 導航序列：衝擊波 → 轉頭等待 → 黑幕 wipe → 跳轉
  const handleNavigate = useCallback((href: string) => {
    heroRef.current?.triggerImpact();

    const wipe = wipeRef.current;
    if (!wipe) { router.push(href); return; }

    // 600ms 讓角色轉頭完成 + 衝擊波展開後，黑幕才進來
    setTimeout(() => {
      wipe.classList.remove('page-wipe-in', 'page-wipe-out');
      void wipe.offsetWidth;
      wipe.classList.add('page-wipe-in');
    }, 600);

    // wipe-in 完成後跳轉
    setTimeout(() => {
      router.push(href);
    }, 600 + 350);
  }, [router]);

  return (
    <div
      data-dt-theme={theme}
      className="relative h-[100dvh] flex flex-col overflow-hidden"
      suppressHydrationWarning
      style={{ background: 'var(--dt-wood, #c8b49a)' }}
    >
      {/* 黑幕轉場 overlay */}
      <div
        ref={wipeRef}
        className="fixed inset-0 z-[100] pointer-events-none"
        style={{ background: '#0a0806', transform: 'scaleX(0)', transformOrigin: 'left' }}
      />

      <div className="relative z-10 flex-1 max-w-md mx-auto w-full flex flex-col gap-4 overflow-hidden"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
        {activeTab === 'home' && (
          <>
            <ThemeHero ref={heroRef} themeId={theme} onThemeSwitch={cycleTheme} />
            <ContinueButton themeId={theme} onNavigate={handleNavigate} />
            <ModeSelector themeId={theme} onNavigate={handleNavigate} />
          </>
        )}
        {activeTab === 'album' && <AlbumPanel />}
        {activeTab === 'me' && <MePanel theme={theme} onThemeChange={handleThemeChange} />}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
