import type { MapTheme } from './types';

export const DARK_TECH_THEME: MapTheme = {
  background: 'linear-gradient(180deg, #050510 0%, #0a0a1a 100%)',
  defaultFill: '#0d1b2e',
  defaultStroke: '#1b4965',
  defaultHoverFill: '#1a4a7a',
  defaultHoverStroke: '#00d4ff',
  accentColor: '#00d4ff',
  secondaryAccent: '#4a7a9a',
  labelColor: '#e0f0ff',
  labelBackground: '#0a0a1a',
  titleColor: '#00d4ff',
  fontFamily: "'Noto Sans TC', sans-serif",
  showGrid: true,
  showScanlines: true,
  showCorners: true,
  regionPalette: [
    '#0d1b2e', '#0f1f33', '#101d30', '#0e1a2c',
    '#111e31', '#0c1927', '#0d1c2d', '#0f2035',
    '#10223a', '#0e1e32', '#0d1a2b', '#0f1d30',
    '#111f34', '#0c1826', '#0d1b2e', '#0f2136',
    '#10243e', '#0e1f33', '#0d1c2e', '#101e32',
    '#0c1927', '#0f2035',
  ],
  insetBackground: '#060610',
  insetBorder: '#1b4965',
};

export const TEXTBOOK_THEME: MapTheme = {
  background: '#f5f0e8',
  defaultFill: '#e8e0d0',
  defaultStroke: '#8b7355',
  defaultHoverFill: '#d4c4a8',
  defaultHoverStroke: '#5a3e1b',
  accentColor: '#5a3e1b',
  secondaryAccent: '#8b7355',
  labelColor: '#2c1810',
  labelBackground: '#f5f0e8',
  titleColor: '#2c1810',
  fontFamily: "'Noto Serif TC', serif",
  showGrid: false,
  showScanlines: false,
  showCorners: false,
  regionPalette: [
    '#e8e0d0', '#ddd5c5', '#d2cabc', '#c7bfb3',
    '#e0d8c8', '#d5cdbd', '#cac2b4', '#bfb7ab',
  ],
  insetBackground: '#ede5d5',
  insetBorder: '#8b7355',
};

export const WARM_EARTH_THEME: MapTheme = {
  background: '#1a1410',
  defaultFill: '#2d2318',
  defaultStroke: '#6b4c30',
  defaultHoverFill: '#4a3520',
  defaultHoverStroke: '#d4a060',
  accentColor: '#d4a060',
  secondaryAccent: '#8b6540',
  labelColor: '#f0e0c8',
  labelBackground: '#1a1410',
  titleColor: '#d4a060',
  fontFamily: "'Noto Sans TC', sans-serif",
  showGrid: false,
  showScanlines: false,
  showCorners: true,
  regionPalette: [
    '#2d2318', '#322820', '#2a2015', '#35291d',
    '#2f2519', '#33271c', '#2b2116', '#302620',
  ],
  insetBackground: '#15100a',
  insetBorder: '#6b4c30',
};

export function resolveTheme(theme: MapTheme | string): MapTheme {
  if (typeof theme === 'object') return theme;
  switch (theme) {
    case 'dark-tech': return DARK_TECH_THEME;
    case 'textbook': return TEXTBOOK_THEME;
    case 'warm-earth': return WARM_EARTH_THEME;
    default: return DARK_TECH_THEME;
  }
}
