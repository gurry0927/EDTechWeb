'use client';

import { useState, useEffect, useCallback } from 'react';
import { VALID_THEME_IDS, DEFAULT_THEME } from '@/config/themes';
import { CharacterHero } from '@/components/home/CharacterHero';
import { ContinueButton } from '@/components/home/ContinueButton';
import { ModeSelector } from '@/components/home/ModeSelector';
import { BottomNav, type Tab } from '@/components/home/BottomNav';
import { AlbumPanel } from '@/components/home/AlbumPanel';
import { MePanel } from '@/components/home/MePanel';

export default function Home() {
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [activeTab, setActiveTab] = useState<Tab>('home');

  // hydration-safe: 延遲讀取 localStorage
  useEffect(() => {
    const stored = localStorage.getItem('dt-theme');
    if (stored && VALID_THEME_IDS.includes(stored)) setTheme(stored);
  }, []);

  // 點擊角色切換主題
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

  return (
    <div data-dt-theme={theme} className="min-h-[100dvh] flex flex-col" suppressHydrationWarning
      style={{ background: 'var(--dt-wood, #c8b49a)' }}
    >
      <div className="flex-1 max-w-md mx-auto w-full pb-20 flex flex-col gap-4">
        {activeTab === 'home' && (
          <>
            <CharacterHero themeId={theme} onThemeSwitch={cycleTheme} />
            <ContinueButton themeId={theme} />
            <ModeSelector themeId={theme} />
          </>
        )}
        {activeTab === 'album' && <AlbumPanel />}
        {activeTab === 'me' && <MePanel theme={theme} onThemeChange={handleThemeChange} />}
      </div>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
