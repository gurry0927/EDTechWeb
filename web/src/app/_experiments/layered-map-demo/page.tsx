// src/app/layered-map-demo/page.tsx
import { LayeredMapOrchestrator } from '@/components/_experiments-layered-map/LayeredMapOrchestrator';
import type { LayerManifest } from '@/components/_experiments-layered-map/types';

// 這是我們傳給簡易 AI 的 Dummy Data 設定。
// 旨在測試它能否處理「地理輪廓(Polygon)」+「密度熱區(Heatmap)」+「斷層線段(Lines)」的疊加渲染。
const DEMO_LAYERS: LayerManifest[] = [
  {
    id: 'base_taiwan',
    name: '台灣行政區域 (Base)',
    category: 'base',
    isBaseMap: true,
    visibleByDefault: true,
    renderType: 'polygon',
    opacity: 1.0,
    dataSourceUri: 'local:taiwan' // 提示 AI 去 load @/data/taiwan.geo.json
  },
  {
    id: 'demo_population_density',
    name: '人口密度預測模型 (Society)',
    category: 'society',
    isBaseMap: false,
    visibleByDefault: false,
    renderType: 'heatmap',
    opacity: 0.7,
    // 因為這只是 demo，我留了一個假 URL，要求 AI 自動生成或手寫一段假資料陣列來展示 Heatmap
    dataSourceUri: 'mock:heatmap' 
  },
  {
    id: 'demo_fault_lines',
    name: '主要活動斷層帶 (Geology)',
    category: 'geology',
    isBaseMap: false,
    visibleByDefault: false,
    renderType: 'lines',
    opacity: 0.9,
    // 提供給 AI 兩條經緯度線段(LineString)，代表車籠埔斷層跟米崙斷層
    dataSourceUri: 'mock:lines'
  }
];

export default function LayeredMapDemoPage() {
  return (
    // 使用全螢幕，讓 MapUI 自己佔滿畫面
    <main className="w-screen h-screen">
      <LayeredMapOrchestrator initialLayers={DEMO_LAYERS} />
    </main>
  );
}
