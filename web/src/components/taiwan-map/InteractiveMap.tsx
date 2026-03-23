'use client';

import { useMemo } from 'react';
import { geoMercator, geoPath, geoCentroid } from 'd3-geo';
import type { GeoPermissibleObjects } from 'd3-geo';
import taiwanGeoRaw from '@/data/taiwan.geo.json';
import { resolveTheme } from './themes';
import {
  DEFAULT_HOVER_EFFECT,
  DEFAULT_INSETS,
  DEFAULT_SPLITS,
  MAIN_EXTENT,
} from './defaults';
import { TaiwanMapProvider } from './context';
import { splitFeatureByClassifier, filterSignificantPolys } from './geometry';
import { MapSvg } from './MapSvg';
import type {
  LessonConfig,
  CountyFeature,
  ProcessedRegion,
  RegionConfig,
  RegionId,
  ResolvedHoverEffect,
  InsetRenderData,
} from './types';

export function InteractiveMap({ config }: { config: LessonConfig }) {
  const theme = useMemo(() => resolveTheme(config.theme), [config.theme]);

  const hoverEffect: ResolvedHoverEffect = useMemo(() => ({
    ...DEFAULT_HOVER_EFFECT,
    ...config.hoverEffect,
  }), [config.hoverEffect]);

  const insetConfigs = config.insets ?? DEFAULT_INSETS;
  const splits = config.subRegionSplits ?? DEFAULT_SPLITS;
  const defaultInteraction = config.defaultInteraction ?? 'interactive';

  /* ─── Process GeoJSON features ─── */
  const { allFeatures, insetRegionIds } = useMemo(() => {
    const rawFeatures = (taiwanGeoRaw as { features: CountyFeature[] }).features;
    const result = new Map<RegionId, CountyFeature>();

    const insetIds = new Set<RegionId>();
    for (const inset of insetConfigs) {
      for (const rid of inset.regionIds) insetIds.add(rid);
    }

    for (const feature of rawFeatures) {
      const name = feature.properties.name;

      const split = splits.find(s => s.sourceCounty === name);
      if (split) {
        const subFeatures = splitFeatureByClassifier(feature, split.classify);
        for (const [subId, subFeature] of subFeatures) {
          result.set(subId, filterSignificantPolys(subFeature, 3));
        }
        continue;
      }

      if (insetIds.has(name)) {
        result.set(name, filterSignificantPolys(feature));
      } else {
        result.set(name, feature);
      }
    }

    return { allFeatures: result, insetRegionIds: insetIds };
  }, [insetConfigs, splits]);

  /* ─── Build region map + separate main/inset ─── */
  const { regionMap, mainRegions, colorIndex } = useMemo(() => {
    const rMap = new Map<RegionId, ProcessedRegion>();
    const main: ProcessedRegion[] = [];
    const cIdx: Record<string, number> = {};
    let idx = 0;

    for (const [id, feature] of allFeatures) {
      const isInset = insetRegionIds.has(id);
      const partial = config.regions[id];
      const regionCfg: RegionConfig = {
        ...partial,
        id,
        label: config.displayNames?.[id] ?? partial?.label ?? id,
        interaction: partial?.interaction ?? defaultInteraction,
      };

      const processed: ProcessedRegion = {
        id,
        config: regionCfg,
        feature,
        centroid: null,
        isInset,
      };

      rMap.set(id, processed);

      if (!isInset) {
        cIdx[id] = idx++;
        main.push(processed);
      }
    }

    return { regionMap: rMap, mainRegions: main, colorIndex: cIdx };
  }, [allFeatures, insetRegionIds, config.regions, config.displayNames, defaultInteraction]);

  /* ─── Main projection ─── */
  const mainProjection = useMemo(() => {
    const fc = { type: 'FeatureCollection' as const, features: mainRegions.map(r => r.feature) };
    return geoMercator().fitExtent(MAIN_EXTENT, fc as GeoPermissibleObjects);
  }, [mainRegions]);

  /* ─── Main centroids ─── */
  const mainCentroids = useMemo(() => {
    const map: Record<string, [number, number]> = {};
    for (const r of mainRegions) {
      const c = mainProjection(geoCentroid(r.feature as GeoPermissibleObjects));
      if (c) map[r.id] = c as [number, number];
    }
    return map;
  }, [mainRegions, mainProjection]);

  /* ─── Inset render data ─── */
  const insets: InsetRenderData[] = useMemo(() => {
    return insetConfigs.map(insetCfg => {
      const paths: Array<{ regionId: RegionId; d: string }> = [];

      for (const fitExt of insetCfg.fitExtents) {
        const features: Array<{ id: RegionId; feature: CountyFeature }> = [];
        for (const rid of fitExt.regionIds) {
          const f = allFeatures.get(rid);
          if (f) features.push({ id: rid, feature: f });
        }
        if (features.length === 0) continue;

        const fc = {
          type: 'FeatureCollection' as const,
          features: features.map(f => f.feature),
        };
        const proj = geoMercator().fitExtent(fitExt.extent, fc as GeoPermissibleObjects);
        const pathFn = geoPath(proj);

        for (const { id, feature } of features) {
          const d = pathFn(feature as GeoPermissibleObjects);
          if (d) paths.push({ regionId: id, d });
        }
      }

      const hoverId = insetCfg.regionIds.find(rid => allFeatures.has(rid)) ?? insetCfg.regionIds[0];
      const displayLabel = config.displayNames?.[insetCfg.regionIds[0]] ?? insetCfg.regionIds[0];

      return { config: insetCfg, paths, hoverId, displayLabel };
    });
  }, [insetConfigs, allFeatures, config.displayNames]);

  return (
    <TaiwanMapProvider
      theme={theme}
      regions={regionMap}
      hoverEffect={hoverEffect}
      callbacks={config.callbacks}
      colorIndex={colorIndex}
    >
      <MapSvg
        mainRegions={mainRegions}
        mainProjection={mainProjection}
        mainCentroids={mainCentroids}
        insets={insets}
        title={config.title}
        legend={config.legend}
      />
    </TaiwanMapProvider>
  );
}
