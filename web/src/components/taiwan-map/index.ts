import dynamic from 'next/dynamic';

export const InteractiveMap = dynamic(
  () => import('./InteractiveMap').then(m => ({ default: m.InteractiveMap })),
  { ssr: false },
);
export type {
  LessonConfig,
  RegionConfig,
  RegionId,
  InteractionMode,
  MapTheme,
  HoverEffect,
  InsetConfig,
  SubRegionSplit,
  OverlayLayer,
  LegendConfig,
  MapCallbacks,
  MapTitle,
} from './types';
export { DARK_TECH_THEME, TEXTBOOK_THEME, WARM_EARTH_THEME } from './themes';
export { DEFAULT_INSETS, DEFAULT_LIENCHIANG_SPLIT, DEFAULT_OFFSHORE } from './defaults';
