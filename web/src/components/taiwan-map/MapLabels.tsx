'use client';

import { useTaiwanMap } from './context';
import { labelWidth } from './defaults';

export function MapLabels({
  centroids,
}: {
  centroids: Record<string, [number, number]>;
}) {
  const { hoveredId, theme, getRegionConfig } = useTaiwanMap();

  // Only show for mainland regions that have centroids
  if (!hoveredId || !centroids[hoveredId]) return null;

  const label = getRegionConfig(hoveredId).label;
  const w = labelWidth(label);
  const [cx, cy] = centroids[hoveredId];

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect
        x={cx - w / 2} y={cy - 32} width={w} height={24} rx={4}
        fill={theme.labelBackground} fillOpacity={0.9}
        stroke={theme.accentColor} strokeWidth={0.5}
      />
      <text
        x={cx} y={cy - 16} textAnchor="middle"
        fill={theme.labelColor}
        fontSize={12} fontWeight={600}
        fontFamily={theme.fontFamily}
      >
        {label}
      </text>
    </g>
  );
}
