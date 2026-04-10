import { VALID_THEME_IDS, DEFAULT_THEME } from '@/config/themes';

export type ThemeId = string;

/** 同步讀取主題（用於 useState lazy initializer，避免閃爍） */
export function getInitialTheme(): ThemeId {
  if (typeof window === 'undefined') return DEFAULT_THEME;
  const fromUrl = new URLSearchParams(window.location.search).get('theme');
  if (fromUrl && VALID_THEME_IDS.includes(fromUrl)) {
    localStorage.setItem('dt-theme', fromUrl);
    return fromUrl;
  }
  const saved = localStorage.getItem('dt-theme');
  if (saved && VALID_THEME_IDS.includes(saved)) return saved;
  return DEFAULT_THEME;
}
