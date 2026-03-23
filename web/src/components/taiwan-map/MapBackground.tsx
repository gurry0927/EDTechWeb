'use client';

import { useTaiwanMap } from './context';
import { SVG_W, SVG_H } from './defaults';
import type { MapTitle } from './types';

export function MapBackground({ title }: { title: MapTitle }) {
  const { theme } = useTaiwanMap();
  const titleX = title.position?.x ?? 600;
  const titleY = title.position?.y ?? 55;

  return (
    <>
      {/* Background grid */}
      {theme.showGrid && (
        <rect width={SVG_W} height={SVG_H} fill="url(#grid)" opacity={0.5} />
      )}

      {/* Title */}
      <text
        x={titleX} y={titleY} textAnchor="middle" fill={theme.titleColor}
        fontSize={28} fontWeight={700} fontFamily={theme.fontFamily}
        style={{ filter: 'url(#titleGlow)' }}
      >
        {title.primary}
      </text>
      {title.secondary && (
        <text
          x={titleX} y={titleY + 25} textAnchor="middle" fill={theme.secondaryAccent}
          fontSize={12} fontFamily="monospace" letterSpacing={3}
        >
          {title.secondary}
        </text>
      )}

      {/* Decorative corners */}
      {theme.showCorners && (
        <g stroke={theme.insetBorder} strokeWidth={1} fill="none" opacity={0.5}
          style={{ pointerEvents: 'none' }}>
          <path d="M 15 20 L 15 5 L 30 5" />
          <path d={`M ${SVG_W - 15} 20 L ${SVG_W - 15} 5 L ${SVG_W - 30} 5`} />
          <path d={`M 15 ${SVG_H - 20} L 15 ${SVG_H - 5} L 30 ${SVG_H - 5}`} />
          <path d={`M ${SVG_W - 15} ${SVG_H - 20} L ${SVG_W - 15} ${SVG_H - 5} L ${SVG_W - 30} ${SVG_H - 5}`} />
        </g>
      )}

    </>
  );
}
