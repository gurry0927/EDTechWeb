export const VALID_THEMES = ['classic', 'cyber'] as const;
export type ThemeId = typeof VALID_THEMES[number];

/** 主題 → 深淺色對應 */
const THEME_DARK: Record<ThemeId, boolean> = {
  classic: false,
  cyber: true,
};

/** 同步讀取主題（用於 useState lazy initializer，避免閃爍） */
export function getInitialTheme(): ThemeId {
  if (typeof window === 'undefined') return 'classic';
  const fromUrl = new URLSearchParams(window.location.search).get('theme');
  if (fromUrl && VALID_THEMES.includes(fromUrl as ThemeId)) {
    const id = fromUrl as ThemeId;
    localStorage.setItem('dt-theme', id);
    applyDarkMode(id);
    return id;
  }
  const saved = localStorage.getItem('dt-theme');
  if (saved && VALID_THEMES.includes(saved as ThemeId)) {
    applyDarkMode(saved as ThemeId);
    return saved as ThemeId;
  }
  applyDarkMode('classic');
  return 'classic';
}

/** 切換主題時同步設定 dark class */
export function applyDarkMode(theme: ThemeId) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', THEME_DARK[theme]);
}
