// src/components/layered-map-experiment/types.ts

// 🚨 AI 開發者請注意：此檔案為「核心 API 契約」，嚴禁修改此檔案內的任何介面與型別定義。
// 本框架專為「跨學科空間層疊」設計。

export type BaseCoordinates = [number, number]; // [經度, 緯度]

/**
 * 通用的地理圖徵 (Geo Feature) 介面
 * 允許擴充不同的屬性，供 hover 或 click 時讀取
 */
export interface DefaultGeoFeatureProperties {
  id: string;
  name: string;
  [key: string]: any;
}

/**
 * 單一圖層的描述清單 (Manifest)
 * 定義一個圖層的元資料、從哪裡取得資料、預設如何顯示
 */
export interface LayerManifest {
  /** 圖層唯一識別碼 (例: 'base_taiwan', 'fault_lines', 'population_density') */
  id: string;
  /** 顯示名稱 */
  name: string;
  /** 圖層分類 (基底, 地科, 社會, 歷史等) */
  category: 'base' | 'geology' | 'society' | 'history' | 'math' | 'custom';
  /** 提供給 AI 的知識片段，當打開此層時，AI 能知道背景資訊 */
  aiKnowledgeContext?: string;
  
  // ── 以下為渲染控制屬性，請在實作介面時讀取 ──

  /** 是否為主要底圖 (會影響預設背景渲染策略) */
  isBaseMap?: boolean;
  /** 此圖層是否可被核取/開啟 (預設 true) */
  visibleByDefault?: boolean;
  /** 透明度 (0~1) */
  opacity?: number;
  /** 定義預設的渲染方式 (由實作層去解譯) */
  renderType: 'polygon' | 'heatmap' | 'lines' | 'points';
  
  /** 資料來源 URI (如果是內建資料，可以寫 'local:taiwan', 如果是外部檔案寫 'json/xxx.json') */
  dataSourceUri: string;
}

/**
 * 地圖容器所提供的 Context
 * 用來讓各圖層與子元件知道目前「哪些層開了」、「滑鼠指在哪」
 */
export interface MapContextState {
  activeLayers: string[];
  hoveredFeature: { layerId: string; featureId: string; properties: any } | null;
  selectedFeatures: string[];
}
