// src/app/taipei-lake-demo/page.tsx
import { LayeredMapOrchestrator } from '@/components/layered-map-experiment/LayeredMapOrchestrator';
import type { LayerManifest } from '@/components/layered-map-experiment/types';

const TAIPEI_LAKE_LAYERS: LayerManifest[] = [
  {
    id: 'base_taipei',
    name: '大台北盆地 (現代地形)',
    category: 'base',
    isBaseMap: true,
    visibleByDefault: true,
    renderType: 'polygon',
    opacity: 1.0,
    // 讓 AI 從 taiwan.geo.json 裡面過濾出 台北市、新北市
    dataSourceUri: 'mock:taipei_base'
  },
  {
    id: 'lake_mask',
    name: '古台北湖 (5000年前)',
    category: 'geology',
    isBaseMap: false,
    visibleByDefault: true,
    renderType: 'polygon',
    opacity: 0.8,
    // 假資料：提供一個覆蓋大半個台北盆地邊界的多邊形
    dataSourceUri: 'mock:taipei_lake',
    controls: [
      {
        variableName: 'seaLevel',
        label: '海平面上升模擬',
        type: 'slider',
        min: 0,
        max: 10,
        step: 0.5,
        defaultValue: 6,
        unit: 'm'
      }
    ]
  },
  {
    id: 'archaeology_sites',
    name: '史前文化遺址',
    category: 'history',
    isBaseMap: false,
    visibleByDefault: true,
    renderType: 'points',
    opacity: 1.0,
    // 假資料：圓山、芝山岩、大龍峒的點位
    dataSourceUri: 'mock:archaeology'
  }
];

export default function TaipeiLakeDemoPage() {
  return (
    <main className="w-screen h-screen">
      <LayeredMapOrchestrator initialLayers={TAIPEI_LAKE_LAYERS} />
    </main>
  );
}
