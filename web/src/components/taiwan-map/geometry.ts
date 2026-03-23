import type { CountyFeature, RegionId } from './types';

export function polyCenter(ring: number[][]): [number, number] {
  let sx = 0, sy = 0;
  for (const c of ring) { sx += c[0]; sy += c[1]; }
  return [sx / ring.length, sy / ring.length];
}

/**
 * Generic feature splitter: classifies each polygon by its center
 * and groups them into separate features keyed by RegionId.
 */
export function splitFeatureByClassifier(
  feature: CountyFeature,
  classify: (center: [number, number], index: number) => RegionId,
  minPoints = 3,
): Map<RegionId, CountyFeature> {
  const result = new Map<RegionId, number[][][][]>();

  if (feature.geometry.type === 'Polygon') {
    const ring = feature.geometry.coordinates[0] as number[][];
    const center = polyCenter(ring);
    const id = classify(center, 0);
    result.set(id, [feature.geometry.coordinates as number[][][]]);
    return mapToFeatures(result, feature.properties.name);
  }

  const coords = feature.geometry.coordinates as number[][][][];
  coords.forEach((poly, idx) => {
    const outer = poly[0];
    if (outer.length < minPoints) return;
    const center = polyCenter(outer);
    const id = classify(center, idx);
    if (!result.has(id)) result.set(id, []);
    result.get(id)!.push(poly);
  });

  return mapToFeatures(result, feature.properties.name);
}

function mapToFeatures(
  groups: Map<RegionId, number[][][][]>,
  sourceName: string,
): Map<RegionId, CountyFeature> {
  const out = new Map<RegionId, CountyFeature>();
  for (const [id, coords] of groups) {
    if (coords.length === 0) continue;
    out.set(id, {
      type: 'Feature',
      properties: { name: id },
      geometry: { type: 'MultiPolygon', coordinates: coords },
    });
  }
  return out;
}

export function filterSignificantPolys(feature: CountyFeature, minPoints = 4): CountyFeature {
  if (feature.geometry.type === 'Polygon') return feature;
  const coords = feature.geometry.coordinates as number[][][][];
  const filtered = coords.filter(poly => poly[0].length >= minPoints);
  return {
    ...feature,
    geometry: {
      type: 'MultiPolygon',
      coordinates: filtered.length ? filtered : coords.slice(0, 1),
    },
  };
}
