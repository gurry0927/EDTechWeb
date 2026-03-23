'use client';

import { useTaiwanMap } from './context';
import { PATH_TRANSITION } from './defaults';
import type { RegionId } from './types';

/**
 * Atomic interactive region. Renders:
 * 1. Static hit area (transparent, wide stroke, catches mouse events)
 * 2. Visual path wrapped in a <g> — parent can style this via `visualStyle`
 */
export function MapRegion({
  regionId,
  pathD,
  paletteIndex,
  visualStyle,
}: {
  regionId: RegionId;
  pathD: string;
  paletteIndex: number;
  visualStyle?: React.CSSProperties;
}) {
  const { theme, hoveredId, hoverEffect, handleEnter, handleLeave, handleClick, getRegionConfig } = useTaiwanMap();
  const config = getRegionConfig(regionId);

  if (config.interaction === 'hidden') return null;

  const isInteractive = config.interaction === 'interactive';
  const isHovered = hoveredId === regionId;

  const fill = isHovered
    ? (config.hoverFill ?? theme.defaultHoverFill)
    : (config.fill ?? theme.regionPalette[paletteIndex % theme.regionPalette.length]);
  const stroke = isHovered
    ? (config.hoverStroke ?? theme.defaultHoverStroke)
    : (config.stroke ?? theme.defaultStroke);
  const strokeWidth = isHovered ? 1.5 : 0.8;
  const filter = isHovered ? `url(#${hoverEffect.filterId})` : 'none';
  const opacity = config.opacity ?? 1;

  return (
    <>
      {/* Static hit area — never transforms */}
      {isInteractive && (
        <path
          d={pathD}
          fill="transparent"
          stroke="transparent"
          strokeWidth={6}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => handleEnter(regionId)}
          onMouseLeave={handleLeave}
          onClick={() => handleClick(regionId)}
        />
      )}
      {/* Visual layer — parent can apply transform via visualStyle */}
      <g style={{ pointerEvents: 'none', ...visualStyle }}>
        <path
          d={pathD}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          opacity={opacity}
          style={{ filter, transition: PATH_TRANSITION }}
        />
      </g>
    </>
  );
}
