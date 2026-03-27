'use client';

import { useTaiwanMap } from './context';
import { SVG_W, SVG_H } from './defaults';
import type { LegendConfig } from './types';

export function MapLegend({ legend }: { legend: LegendConfig }) {
  const { theme, scaleFont } = useTaiwanMap();
  const { title, items, position = 'bottom-right' } = legend;

  const itemH = 30;
  const padding = 14;
  const w = 200;
  const h = padding * 2 + 30 + items.length * itemH;

  let x: number, y: number;
  switch (position) {
    case 'top-right':
      x = SVG_W - w - 20; y = 100;
      break;
    case 'bottom-left':
      x = 20; y = SVG_H - h - 20;
      break;
    default: // bottom-right
      x = SVG_W - w - 20; y = SVG_H - h - 20;
  }

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={x} y={y} width={w} height={h} rx={6}
        fill={theme.labelBackground} fillOpacity={0.9}
        stroke={theme.insetBorder} strokeWidth={0.5}
      />
      {/* Title — natural SVG units so it stays within the box */}
      <text
        x={x + padding} y={y + padding + 22}
        fill={theme.titleColor} fontSize={22} fontWeight={600}
        fontFamily={theme.fontFamily}
      >
        {title}
      </text>
      {items.map((item, i) => (
        <g key={i}>
          <rect
            x={x + padding}
            y={y + padding + 30 + i * itemH + 6}
            width={16} height={16} rx={3}
            fill={item.color}
          />
          <text
            x={x + padding + 24}
            y={y + padding + 30 + i * itemH + 20}
            fill={theme.labelColor} fontSize={20}
            fontFamily={theme.fontFamily}
          >
            {item.label}
          </text>
        </g>
      ))}
    </g>
  );
}
