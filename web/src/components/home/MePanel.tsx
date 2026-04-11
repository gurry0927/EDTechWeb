'use client';

import { useEffect, useState } from 'react';
import { THEME_LIST } from '@/config/themes';

interface Props {
  theme: string;
  onThemeChange: (id: string) => void;
}

export function MePanel({ theme, onThemeChange }: Props) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleThemeChange = (id: string) => {
    onThemeChange(id);
    localStorage.setItem('dt-theme', id);
  };

  return (
    <div className="px-6 pt-6 pb-20 max-w-md mx-auto">
      {/* 主題切換 */}
      <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--dt-text, #3d3426)' }}>
        主題風格
      </h2>
      <div className="grid grid-cols-3 gap-2 mb-8">
        {THEME_LIST.map(t => (
          <button
            key={t.id}
            onClick={() => handleThemeChange(t.id)}
            className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-200 ${
              t.id === theme ? 'ring-2 scale-105' : 'opacity-60 hover:opacity-80'
            }`}
            style={{
              background: 'color-mix(in srgb, var(--dt-card, #f8f4eb) 80%, transparent)',
              border: '1px solid var(--dt-border, rgba(140,120,80,0.15))',
              '--tw-ring-color': 'var(--dt-accent, #c2553a)',
            } as React.CSSProperties}
          >
            {t.avatar.detective.startsWith('/') ? (
              <img src={t.avatar.detective} alt="" className="w-8 h-8 object-contain" />
            ) : (
              <span className="text-2xl">{t.avatar.detective}</span>
            )}
            <span className="text-[11px] font-medium" style={{ color: 'var(--dt-text, #3d3426)' }}>
              {t.label}
            </span>
            <span className="text-[10px] opacity-50" style={{ color: 'var(--dt-text-muted, #94a3b8)' }}>
              {t.desc}
            </span>
          </button>
        ))}
      </div>

      {/* 深色模式 */}
      <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--dt-text, #3d3426)' }}>
        顯示
      </h2>
      <button
        onClick={toggleDark}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200"
        style={{
          background: 'color-mix(in srgb, var(--dt-card, #f8f4eb) 80%, transparent)',
          border: '1px solid var(--dt-border, rgba(140,120,80,0.15))',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{dark ? '🌙' : '☀️'}</span>
          <span className="text-sm font-medium" style={{ color: 'var(--dt-text, #3d3426)' }}>
            {dark ? '深色模式' : '淺色模式'}
          </span>
        </div>
        <div className={`w-10 h-6 rounded-full transition-colors duration-200 relative ${dark ? 'bg-blue-500' : 'bg-gray-300'}`}>
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${dark ? 'translate-x-5' : 'translate-x-1'}`} />
        </div>
      </button>

      {/* 版本資訊 */}
      <div className="mt-12 text-center">
        <p className="text-[11px] opacity-30" style={{ color: 'var(--dt-text-muted, #94a3b8)' }}>
          EDTech — 互動教學平台
        </p>
      </div>
    </div>
  );
}
