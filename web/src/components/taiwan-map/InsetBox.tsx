'use client';

import { useTaiwanMap } from './context';
import { DEFAULT_INSET_HOVER_SCALE, PATH_TRANSITION } from './defaults';
import type { InsetRenderData } from './types';

export function InsetBox({ config, paths, hoverId, displayLabel }: InsetRenderData) {
  const { theme, hoveredId, hoverEffect, handleEnter, handleLeave, handleClick, getRegionConfig, scaleFont } = useTaiwanMap();

  // Box is hovered if hoveredId matches any of its regionIds
  const isHovered = hoveredId !== null && config.regionIds.includes(hoveredId);
  const { box, label, subBoxes, transformOrigin } = config;

  // Only show pointer if any region in this inset is interactive
  const isInteractive = paths.some(p => getRegionConfig(p.regionId).interaction === 'interactive');

  return (
    <g
      onMouseEnter={isInteractive ? () => handleEnter(hoverId) : undefined}
      onMouseLeave={isInteractive ? handleLeave : undefined}
      onClick={isInteractive ? () => handleClick(hoverId) : undefined}
      style={{ cursor: isInteractive ? 'pointer' : 'default' }}
    >
      {/* Box background */}
      <rect
        x={box.x} y={box.y} width={box.width} height={box.height}
        fill={theme.insetBackground}
        stroke={isHovered ? theme.accentColor : theme.insetBorder}
        strokeWidth={isHovered ? 1.2 : 1}
        rx={4}
        style={{ transition: 'stroke 0.3s ease' }}
      />

      {/* Box label — natural SVG units (no compensation): scales with box, never overflows */}
      <text
        x={box.x + 10} y={box.y + 25}
        fill={theme.secondaryAccent}
        fontSize={20} fontFamily={theme.fontFamily}
        fontWeight={600}
        style={{ pointerEvents: 'none' }}
      >
        {label}
      </text>

      {/* Sub-boxes (e.g., 東引 dashed box) */}
      {subBoxes?.map((sub, i) => (
        <g key={i} style={{ pointerEvents: 'none' }}>
          <rect
            x={sub.x} y={sub.y} width={sub.width} height={sub.height}
            fill="none" stroke={theme.insetBorder} strokeWidth={0.8}
            strokeDasharray={sub.strokeDasharray} rx={3}
          />
          <text
            x={sub.x + 10} y={sub.y + 20}
            fill={theme.secondaryAccent} fontSize={16}
            fontFamily={theme.fontFamily}
          >
            {sub.label}
          </text>
        </g>
      ))}

      {/* Island paths with hover transform — respects per-region config */}
      <g style={{
        transform: isHovered ? `scale(${DEFAULT_INSET_HOVER_SCALE})` : 'none',
        transformOrigin: `${transformOrigin.x}px ${transformOrigin.y}px`,
        transition: hoverEffect.transition,
        pointerEvents: 'none',
      }}>
        {paths.map(({ regionId, d }, i) => {
          const regionCfg = getRegionConfig(regionId);
          const fill = isHovered
            ? (regionCfg.hoverFill ?? theme.defaultHoverFill)
            : (regionCfg.fill ?? theme.defaultFill);
          const stroke = isHovered
            ? (regionCfg.hoverStroke ?? theme.defaultHoverStroke)
            : (regionCfg.stroke ?? theme.defaultStroke);
          return (
            <path
              key={i}
              d={d}
              fill={fill}
              stroke={stroke}
              strokeWidth={isHovered ? 1.5 : 0.8}
              style={{
                filter: isHovered ? `url(#${hoverEffect.filterId})` : 'none',
                transition: PATH_TRANSITION,
              }}
            />
          );
        })}
      </g>

      {/* Hover label (below box) — floating, so scaleFont is correct here.
          Width must track the compensated font size, not a fixed estimate. */}
      {isHovered && (() => {
        const fs = scaleFont(18);
        const w = displayLabel.length * fs * 0.9 + 24;
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height + 15;
        const h = fs + 12;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={4}
              fill={theme.labelBackground} fillOpacity={0.9}
              stroke={theme.accentColor} strokeWidth={0.5}
            />
            <text
              x={cx} y={cy + fs / 2 - 2} textAnchor="middle"
              fill={theme.labelColor}
              fontSize={fs} fontWeight={600}
              fontFamily={theme.fontFamily}
            >
              {displayLabel}
            </text>
          </g>
        );
      })()}
    </g>
  );
}
