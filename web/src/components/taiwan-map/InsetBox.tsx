'use client';

import { useTaiwanMap } from './context';
import { DEFAULT_INSET_HOVER_SCALE, PATH_TRANSITION, labelWidth } from './defaults';
import type { InsetRenderData } from './types';

export function InsetBox({ config, paths, hoverId, displayLabel }: InsetRenderData) {
  const { theme, hoveredId, hoverEffect, handleEnter, handleLeave, getRegionConfig } = useTaiwanMap();

  // Box is hovered if hoveredId matches any of its regionIds
  const isHovered = hoveredId !== null && config.regionIds.includes(hoveredId);
  const { box, label, subBoxes, transformOrigin } = config;

  // Only show pointer if any region in this inset is interactive
  const isInteractive = paths.some(p => getRegionConfig(p.regionId).interaction === 'interactive');

  return (
    <g
      onMouseEnter={isInteractive ? () => handleEnter(hoverId) : undefined}
      onMouseLeave={isInteractive ? handleLeave : undefined}
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

      {/* Box label */}
      <text
        x={box.x + 10} y={box.y + 18}
        fill={theme.secondaryAccent}
        fontSize={12} fontFamily={theme.fontFamily}
        fontWeight={500}
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
            x={sub.x + 10} y={sub.y + 15}
            fill={theme.secondaryAccent} fontSize={9}
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
                filter: isHovered ? 'url(#glow)' : 'none',
                transition: PATH_TRANSITION,
              }}
            />
          );
        })}
      </g>

      {/* Hover label (below box) */}
      {isHovered && (() => {
        const w = labelWidth(displayLabel);
        const cx = box.x + box.width / 2;
        const cy = box.y + box.height + 15;
        return (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={cx - w / 2} y={cy - 12} width={w} height={24} rx={4}
              fill={theme.labelBackground} fillOpacity={0.9}
              stroke={theme.accentColor} strokeWidth={0.5}
            />
            <text
              x={cx} y={cy + 2} textAnchor="middle"
              fill={theme.labelColor}
              fontSize={12} fontWeight={600}
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
