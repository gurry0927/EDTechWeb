'use client';

import { useTaiwanMap } from './context';
import { SVG_W, SVG_H } from './defaults';
import type { LegendConfig } from './types';

export function MapLegend({ legend }: { legend: LegendConfig }) {
  const { theme } = useTaiwanMap();
  const { title, items, position = 'bottom-right' } = legend;

  const itemH = 20;
  const padding = 12;
  const w = 150;
  const h = padding * 2 + 24 + items.length * itemH;

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
      <text
        x={x + padding} y={y + padding + 12}
        fill={theme.titleColor} fontSize={13} fontWeight={600}
        fontFamily={theme.fontFamily}
      >
        {title}
      </text>
      {items.map((item, i) => (
        <g key={i}>
          <rect
            x={x + padding}
            y={y + padding + 24 + i * itemH}
            width={14} height={14} rx={2}
            fill={item.color}
          />
          <text
            x={x + padding + 20}
            y={y + padding + 24 + i * itemH + 11}
            fill={theme.labelColor} fontSize={11}
            fontFamily={theme.fontFamily}
          >
            {item.label}
          </text>
        </g>
      ))}
    </g>
  );
}
