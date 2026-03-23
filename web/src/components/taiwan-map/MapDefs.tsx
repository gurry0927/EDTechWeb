'use client';

import { useTaiwanMap } from './context';

export function MapDefs() {
  const { theme } = useTaiwanMap();
  const accent = theme.accentColor;

  return (
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
        <feFlood floodColor={accent} floodOpacity="0.6" />
        <feComposite in2="blur" operator="in" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="floatShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="6" result="shadow" />
        <feFlood floodColor="#000" floodOpacity="0.5" />
        <feComposite in2="shadow" operator="in" result="darkShadow" />
        <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="glowBlur" />
        <feFlood floodColor={accent} floodOpacity="0.6" />
        <feComposite in2="glowBlur" operator="in" result="coloredGlow" />
        <feMerge>
          <feMergeNode in="darkShadow" />
          <feMergeNode in="coloredGlow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="titleGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
        <feFlood floodColor={accent} floodOpacity="0.3" />
        <feComposite in2="blur" operator="in" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f1525" strokeWidth="0.5" />
      </pattern>

      <pattern id="scanlines" width="4" height="4" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="4" y2="0" stroke="#000" strokeWidth="1" opacity="0.04" />
      </pattern>
    </defs>
  );
}
