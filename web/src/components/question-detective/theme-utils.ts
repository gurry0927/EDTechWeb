export const VALID_THEMES = ['classic', 'cyber'] as const;
export type ThemeId = typeof VALID_THEMES[number];

/** 同步讀取主題（用於 useState lazy initializer，避免閃爍） */
export function getInitialTheme(): ThemeId {
  if (typeof window === 'undefined') return 'classic';
  const fromUrl = new URLSearchParams(window.location.search).get('theme');
  if (fromUrl && VALID_THEMES.includes(fromUrl as ThemeId)) {
    localStorage.setItem('dt-theme', fromUrl);
    return fromUrl as ThemeId;
  }
  const saved = localStorage.getItem('dt-theme');
  if (saved && VALID_THEMES.includes(saved as ThemeId)) return saved as ThemeId;
  return 'classic';
}
