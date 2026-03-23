const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/taiwan_counties.geojson', 'utf8'));

function simplifyCoords(coords, tolerance = 0.003) {
  if (coords.length <= 2) return coords;

  // Douglas-Peucker simplification
  let maxDist = 0;
  let maxIdx = 0;
  const start = coords[0];
  const end = coords[coords.length - 1];

  for (let i = 1; i < coords.length - 1; i++) {
    const dist = pointToLineDist(coords[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyCoords(coords.slice(0, maxIdx + 1), tolerance);
    const right = simplifyCoords(coords.slice(maxIdx), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [start, end];
}

function pointToLineDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((p[0] - a[0]) ** 2 + (p[1] - a[1]) ** 2);
  let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = a[0] + t * dx;
  const projY = a[1] + t * dy;
  return Math.sqrt((p[0] - projX) ** 2 + (p[1] - projY) ** 2);
}

function roundCoords(coords) {
  return coords.map(c => [Math.round(c[0] * 1000) / 1000, Math.round(c[1] * 1000) / 1000]);
}

function processRing(ring, tolerance) {
  const simplified = simplifyCoords(ring, tolerance);
  return roundCoords(simplified);
}

function processGeometry(geometry, isIsland) {
  // Use finer tolerance for islands to preserve detail
  const tolerance = isIsland ? 0.001 : 0.002;

  if (geometry.type === 'Polygon') {
    return {
      type: 'Polygon',
      coordinates: geometry.coordinates.map(ring => processRing(ring, tolerance))
    };
  } else if (geometry.type === 'MultiPolygon') {
    return {
      type: 'MultiPolygon',
      coordinates: geometry.coordinates.map(poly =>
        poly.map(ring => processRing(ring, tolerance))
      )
    };
  }
  return geometry;
}

const offshoreCounties = ['金門縣', '澎湖縣', '連江縣'];

const output = {
  type: 'FeatureCollection',
  features: data.features.map(f => {
    const name = f.properties.COUNTYNAME;
    const isIsland = offshoreCounties.includes(name);
    return {
      type: 'Feature',
      properties: { name },
      geometry: processGeometry(f.geometry, isIsland)
    };
  })
};

const json = JSON.stringify(output);
fs.writeFileSync('src/data/taiwan.geo.json', json);
console.log(`Output size: ${(json.length / 1024).toFixed(0)} KB`);
console.log(`Features: ${output.features.length}`);
output.features.forEach(f => {
  const g = f.geometry;
  let pts = 0;
  if (g.type === 'Polygon') pts = g.coordinates.reduce((s, r) => s + r.length, 0);
  else if (g.type === 'MultiPolygon') pts = g.coordinates.reduce((s, p) => s + p.reduce((s2, r) => s2 + r.length, 0), 0);
  console.log(`  ${f.properties.name}: ${pts} points`);
});
