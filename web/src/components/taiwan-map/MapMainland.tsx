'use client';

import { useMemo } from 'react';
import { geoPath } from 'd3-geo';
import type { GeoPermissibleObjects, GeoProjection } from 'd3-geo';
import { useTaiwanMap } from './context';
import { MapRegion } from './MapRegion';
import type { ProcessedRegion } from './types';

export function MapMainland({
  projection,
  mainRegions,
  centroids,
}: {
  projection: GeoProjection;
  mainRegions: ProcessedRegion[];
  centroids: Record<string, [number, number]>;
}) {
  const { hoveredId, hoverEffect, colorIndex } = useTaiwanMap();
  const pathFn = useMemo(() => geoPath(projection), [projection]);

  // Split: non-hovered first, hovered last (z-order)
  const nonHovered = mainRegions.filter(r => r.id !== hoveredId);
  const hoveredRegion = mainRegions.find(r => r.id === hoveredId) ?? null;

  return (
    <>
      {/* Non-hovered counties */}
      {nonHovered.map(region => {
        const d = pathFn(region.feature as GeoPermissibleObjects);
        if (!d) return null;
        return (
          <g key={region.id}>
            <MapRegion
              regionId={region.id}
              pathD={d}
              paletteIndex={colorIndex[region.id] ?? 0}
            />
          </g>
        );
      })}

      {/* Hovered county — rendered last for z-index, with scale transform */}
      {hoveredRegion && (() => {
        const d = pathFn(hoveredRegion.feature as GeoPermissibleObjects);
        if (!d) return null;
        const centroid = centroids[hoveredRegion.id];
        const ox = centroid ? centroid[0] : 0;
        const oy = centroid ? centroid[1] : 0;
        return (
          <g key={hoveredRegion.id}>
            <MapRegion
              regionId={hoveredRegion.id}
              pathD={d}
              paletteIndex={colorIndex[hoveredRegion.id] ?? 0}
              visualStyle={{
                transform: `translate(${ox}px, ${oy}px) scale(${hoverEffect.scale}) translate(${-ox}px, ${-oy}px)`,
                transition: hoverEffect.transition,
              }}
            />
          </g>
        );
      })()}
    </>
  );
}
