/* ─── Region & Interaction ─── */

export type RegionId = string;
export type InteractionMode = 'interactive' | 'static' | 'hidden';

export interface RegionConfig {
  id: RegionId;
  label: string;
  subtitle?: string;
  interaction: InteractionMode;
  fill?: string;
  hoverFill?: string;
  stroke?: string;
  hoverStroke?: string;
  opacity?: number;
  data?: Record<string, unknown>;
  group?: string;
}

export interface SubRegionSplit {
  sourceCounty: string;
  classify: (center: [number, number], polygonIndex: number) => RegionId;
  regions: Record<RegionId, Partial<RegionConfig>>;
}

/* ─── Hover Effect ─── */

export interface HoverEffect {
  scale?: number;
  filterId?: string;
  transition?: string;
  leaveDelay?: number;
}

export interface ResolvedHoverEffect {
  scale: number;
  filterId: string;
  transition: string;
  leaveDelay: number;
}

/* ─── Theme ─── */

export interface MapTheme {
  background: string;
  defaultFill: string;
  defaultStroke: string;
  defaultHoverFill: string;
  defaultHoverStroke: string;
  accentColor: string;
  secondaryAccent: string;
  labelColor: string;
  labelBackground: string;
  titleColor: string;
  fontFamily: string;
  showGrid: boolean;
  showScanlines: boolean;
  showCorners: boolean;
  regionPalette: string[];
  insetBackground: string;
  insetBorder: string;
}

/* ─── Inset ─── */

export interface InsetSubBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  strokeDasharray?: string;
}

export interface InsetConfig {
  regionIds: RegionId[];
  box: { x: number; y: number; width: number; height: number };
  transformOrigin: { x: number; y: number };
  label: string;
  subBoxes?: InsetSubBox[];
  fitExtents: Array<{
    regionIds: RegionId[];
    extent: [[number, number], [number, number]];
  }>;
}

/* ─── Overlay ─── */

export interface OverlayLayer {
  id: string;
  name: string;
  geojson: GeoJSON.FeatureCollection;
  style: {
    fill: string;
    fillOpacity: number;
    stroke: string;
    strokeWidth: number;
    strokeDasharray?: string;
  };
  showLabels?: boolean;
  visible?: boolean;
}

/* ─── Legend ─── */

export interface LegendConfig {
  title: string;
  items: Array<{ color: string; label: string; group?: string }>;
  position?: 'top-right' | 'bottom-right' | 'bottom-left';
}

/* ─── Callbacks ─── */

export interface MapCallbacks {
  onRegionHover?: (regionId: RegionId | null, data?: Record<string, unknown>) => void;
  onRegionClick?: (regionId: RegionId, data?: Record<string, unknown>) => void;
}

/* ─── Title ─── */

export interface MapTitle {
  primary: string;
  secondary?: string;
  position?: { x: number; y: number };
}

/* ─── Lesson Config (top-level) ─── */

export interface LessonConfig {
  id: string;
  title: MapTitle;
  theme: MapTheme | 'dark-tech' | 'textbook' | 'warm-earth';
  regions: Record<RegionId, Partial<RegionConfig>>;
  defaultInteraction?: InteractionMode;
  subRegionSplits?: SubRegionSplit[];
  hoverEffect?: HoverEffect;
  insets?: InsetConfig[];
  overlays?: OverlayLayer[];
  displayNames?: Record<string, string>;
  legend?: LegendConfig;
  callbacks?: MapCallbacks;
}

/* ─── Internal: Geometry ─── */

export interface CountyFeature {
  type: 'Feature';
  properties: { name: string };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface ProcessedRegion {
  id: RegionId;
  config: RegionConfig;
  feature: CountyFeature;
  centroid: [number, number] | null;
  isInset: boolean;
}

/* ─── Render data for insets (computed by InteractiveMap) ─── */

export interface InsetRenderData {
  config: InsetConfig;
  paths: Array<{ regionId: RegionId; d: string }>;
  hoverId: RegionId;
  displayLabel: string;
}
