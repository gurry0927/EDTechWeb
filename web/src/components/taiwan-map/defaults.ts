import type { InsetConfig, ResolvedHoverEffect, SubRegionSplit } from './types';

export const SVG_W = 1000;
export const SVG_H = 1200;

export const DEFAULT_HOVER_EFFECT: ResolvedHoverEffect = {
  scale: 1.06,
  filterId: 'floatShadow',
  transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
  leaveDelay: 80,
};

export const DEFAULT_INSET_HOVER_SCALE = 1.04;

export const PATH_TRANSITION = 'fill 0.3s ease, stroke 0.3s ease, stroke-width 0.3s ease, filter 0.3s ease';

/** Standard offshore county names in the base GeoJSON */
export const DEFAULT_OFFSHORE = ['金門縣', '澎湖縣', '連江縣'];

/** Default inset configs matching the current hardcoded layout */
export const DEFAULT_INSETS: InsetConfig[] = [
  {
    regionIds: ['連江縣', '東引', '馬祖'],
    box: { x: 20, y: 130, width: 220, height: 330 },
    transformOrigin: { x: 125, y: 300 },
    label: '連江縣（馬祖）',
    subBoxes: [
      { x: 45, y: 160, width: 175, height: 80, label: '東引鄉', strokeDasharray: '5 3' },
    ],
    fitExtents: [
      { regionIds: ['東引'], extent: [[60, 170], [200, 230]] },
      { regionIds: ['馬祖'], extent: [[40, 250], [210, 440]] },
    ],
  },
  {
    regionIds: ['澎湖縣'],
    box: { x: 20, y: 490, width: 220, height: 270 },
    transformOrigin: { x: 125, y: 640 },
    label: '澎湖縣',
    fitExtents: [
      { regionIds: ['澎湖縣'], extent: [[35, 520], [215, 740]] },
    ],
  },
  {
    regionIds: ['金門縣'],
    box: { x: 20, y: 790, width: 220, height: 170 },
    transformOrigin: { x: 125, y: 880 },
    label: '金門縣',
    fitExtents: [
      { regionIds: ['金門縣'], extent: [[35, 810], [215, 940]] },
    ],
  },
];

/** Default sub-region split for 連江縣 (separating 東引 from main Matsu) */
export const DEFAULT_LIENCHIANG_SPLIT = {
  sourceCounty: '連江縣',
  classify: (center: [number, number]) => center[0] > 120.3 ? '東引' : '馬祖',
  regions: {
    '東引': { label: '東引鄉' },
    '馬祖': { label: '連江縣（馬祖）' },
  },
};

/** Stable default splits array (avoids new reference per render) */
export const DEFAULT_SPLITS: SubRegionSplit[] = [DEFAULT_LIENCHIANG_SPLIT];

export const MAIN_EXTENT: [[number, number], [number, number]] = [[300, 100], [900, 1100]];

/** Estimate SVG label pill width for CJK/mixed text at fontSize 12 */
export function labelWidth(text: string): number {
  return text.length * 14 + 16;
}
