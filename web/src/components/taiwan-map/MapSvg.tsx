'use client';

import type { GeoProjection } from 'd3-geo';
import { useTaiwanMap } from './context';
import { SVG_W, SVG_H } from './defaults';
import { MapDefs } from './MapDefs';
import { MapBackground } from './MapBackground';
import { MapMainland } from './MapMainland';
import { MapInsets } from './MapInsets';
import { MapLabels } from './MapLabels';
import { MapLegend } from './MapLegend';
import type { ProcessedRegion, InsetRenderData, MapTitle, LegendConfig } from './types';

export function MapSvg({
  mainRegions,
  mainProjection,
  mainCentroids,
  insets,
  title,
  legend,
}: {
  mainRegions: ProcessedRegion[];
  mainProjection: GeoProjection;
  mainCentroids: Record<string, [number, number]>;
  insets: InsetRenderData[];
  title: MapTitle;
  legend?: LegendConfig;
}) {
  const { theme } = useTaiwanMap();

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      width="100%"
      height="100%"
      style={{ background: theme.background }}
    >
      <MapDefs />
      <MapBackground title={title} />
      <MapMainland
        projection={mainProjection}
        mainRegions={mainRegions}
        centroids={mainCentroids}
      />
      <MapInsets insets={insets} />
      <MapLabels centroids={mainCentroids} />
      {legend && <MapLegend legend={legend} />}

      {/* Scanlines overlay — rendered last to sit on top of everything */}
      {theme.showScanlines && (
        <rect
          width={SVG_W} height={SVG_H}
          fill="url(#scanlines)"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </svg>
  );
}
