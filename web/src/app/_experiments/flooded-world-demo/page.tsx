// src/app/flooded-world-demo/page.tsx
import { LayeredMapOrchestrator } from '@/components/_experiments-layered-map/LayeredMapOrchestrator';
import type { LayerManifest } from '@/components/_experiments-layered-map/types';

const FLOODED_WORLD_LAYERS: LayerManifest[] = [
  {
    id: 'bounding_box',
    name: '視野控制層 (隱藏)',
    category: 'base',
    isBaseMap: true, // 用來讓 D3 算出涵蓋台灣海峽的大視野
    visibleByDefault: true,
    renderType: 'polygon',
    opacity: 0, 
    dataSourceUri: 'mock:taiwan_strait_bounds'
  },
  {
    id: 'base_taiwan',
    name: '現代台灣與大陸邊緣 (Base)',
    category: 'base',
    isBaseMap: false,
    visibleByDefault: true,
    renderType: 'polygon',
    opacity: 1.0,
    dataSourceUri: 'mock:taiwan_and_fujian'
  },
  {
    id: 'land_bridge',
    name: '全域海平面模擬 (Ice Age ~ Global Warming)',
    category: 'geology',
    isBaseMap: false,
    visibleByDefault: true,
    renderType: 'polygon',
    opacity: 0.8,
    dataSourceUri: 'mock:land_bridge_mask',
    controls: [
      {
        variableName: 'seaLevel',
        label: '海平面上升/下降',
        type: 'slider',
        min: -150,
        max: 20,
        step: 5,
        defaultValue: 0,
        unit: 'm'
      }
    ]
  },
  {
    id: 'animal_migration',
    name: '冰河期特有種播遷路徑',
    category: 'history',
    isBaseMap: false,
    visibleByDefault: true,
    renderType: 'lines',
    opacity: 1.0,
    dataSourceUri: 'mock:animal_migration'
  },
  {
    id: 'anping_siltation',
    name: '台江內海淤積變遷 (安平悖論)',
    category: 'history',
    isBaseMap: false,
    visibleByDefault: true,
    renderType: 'polygon',
    opacity: 0.8,
    dataSourceUri: 'mock:anping_siltation',
    controls: [
      {
        variableName: 'historyYear',
        label: '時光機 (河川沖積)',
        type: 'slider',
        min: 1624,
        max: 2024,
        step: 10,
        defaultValue: 1624,
        unit: '年'
      }
    ]
  }
];

export default function FloodedWorldDemoPage() {
  return (
    <main className="w-screen h-screen">
      <LayeredMapOrchestrator initialLayers={FLOODED_WORLD_LAYERS} />
    </main>
  );
}
