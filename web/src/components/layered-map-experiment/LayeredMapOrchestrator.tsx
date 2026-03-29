// src/components/layered-map-experiment/LayeredMapOrchestrator.tsx
'use client';

import React, { useState, useEffect } from 'react';
import type { LayerManifest } from './types';
import { MapUI } from './MapUI';
import * as d3 from 'd3-geo';

// 🚨 AI 開發者請注意：
// 1. 本檔案是控制核心 (Orchestrator)，負責取得資料、管理狀態 (Context)、建立 d3 的 geoPath。
// 2. 嚴禁在此檔內寫死任何跟「台灣」有關的邏輯，所有地理資訊都必須依賴傳入的 `layers`。
// 3. 我已經搭好了 useState 跟 fetch 的空殼結構。

interface Props {
  // 由外部（例如 demo page）定義本場實驗有哪幾個圖層可選
  initialLayers: LayerManifest[];
}

export function LayeredMapOrchestrator({ initialLayers }: Props) {
  // 已經勾選準備渲染的圖層 ID
  const [activeLayers, setActiveLayers] = useState<string[]>(
    initialLayers.filter(l => l.visibleByDefault !== false).map(l => l.id)
  );

  // 用來裝從 API/JSON 下載回來的 Geo 原始資料
  const [geoDataCache, setGeoDataCache] = useState<Record<string, any>>({});

  const handleToggleLayer = (layerId: string) => {
    setActiveLayers(prev => 
      prev.includes(layerId) 
        ? prev.filter(id => id !== layerId) 
        : [...prev, layerId]
    );
  };

  // ── TODO: AI FILL HERE (Data Fetching) ──
  useEffect(() => {
    const fetchData = async () => {
      const newCache = { ...geoDataCache };
      let changed = false;

      for (const layerId of activeLayers) {
        if (newCache[layerId]) continue;

        const layer = initialLayers.find(l => l.id === layerId);
        if (!layer) continue;

        changed = true;
        if (layer.dataSourceUri === 'local:taiwan') {
          try {
            // 動態載入台灣地理資料
            const data = await import('@/data/taiwan.geo.json');
            newCache[layerId] = data.default || data;
          } catch (err) {
            console.error('Failed to load Taiwan geojson', err);
          }
        } else if (layer.dataSourceUri === 'mock:heatmap') {
          // 生成模擬的人口密度熱點 (主要城市)
          newCache[layerId] = {
            type: 'FeatureCollection',
            features: [
              { type: 'Feature', properties: { intensity: 0.9, radius: 45 }, geometry: { type: 'Point', coordinates: [121.56, 25.03] } }, // 台北
              { type: 'Feature', properties: { intensity: 0.8, radius: 35 }, geometry: { type: 'Point', coordinates: [120.67, 24.14] } }, // 台中
              { type: 'Feature', properties: { intensity: 0.85, radius: 38 }, geometry: { type: 'Point', coordinates: [120.30, 22.61] } }, // 高雄
              { type: 'Feature', properties: { intensity: 0.6, radius: 25 }, geometry: { type: 'Point', coordinates: [120.96, 24.81] } }  // 新竹
            ]
          };
        } else if (layer.dataSourceUri === 'mock:lines') {
          // 生成模擬的斷層線 (車籠埔斷層示意)
          newCache[layerId] = {
            type: 'FeatureCollection',
            features: [
              { 
                type: 'Feature', 
                properties: { name: '車籠埔斷層' }, 
                geometry: { 
                  type: 'LineString', 
                  coordinates: [[120.71, 24.35], [120.72, 24.15], [120.73, 23.85], [120.68, 23.50]] 
                } 
              }
            ]
          };
        }
      }

      if (changed) {
        setGeoDataCache(newCache);
      }
    };

    fetchData();
  }, [activeLayers, initialLayers, geoDataCache]);

  // ── TODO: AI FILL HERE (D3 Projection & Path Generator) ──
  const { projection, pathGenerator } = React.useMemo(() => {
    const width = 800;
    const height = 600;
    
    // 建立投影：預設以台灣為中心。
    const proj = d3.geoMercator()
      .center([121, 23.6])
      .scale(7000)
      .translate([width / 2, height / 2]);

    // 尋找 baseMap 資料來校準投影範圍 (fitSize)
    const baseLayerId = initialLayers.find(l => l.isBaseMap)?.id;
    const baseData = baseLayerId ? geoDataCache[baseLayerId] : null;
    
    if (baseData) {
      proj.fitSize([width - 80, height - 80], baseData);
    }

    const path = d3.geoPath().projection(proj);
    
    return { projection: proj, pathGenerator: path };
  }, [geoDataCache, initialLayers]);

  return (
    <MapUI 
      layers={initialLayers} 
      activeLayers={activeLayers} 
      onToggleLayer={handleToggleLayer}
    >
      {/* ── TODO: AI FILL HERE (SVG Render) ── */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-6 bg-slate-900/50 rounded-2xl border border-slate-700/50 shadow-inner">
        <svg 
          viewBox="0 0 800 600" 
          className="w-full h-full max-w-4xl max-h-full transition-all duration-700 ease-out"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 定義 SVG 特效：漸層與濾鏡 */}
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="popHeat">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.6)" />
              <stop offset="50%" stopColor="rgba(56, 189, 248, 0.2)" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
            </radialGradient>
          </defs>

          {/* 渲染圖層：按照 Manifest 順序疊加 */}
          {initialLayers.map(layer => {
            const isVisible = activeLayers.includes(layer.id);
            const data = geoDataCache[layer.id];
            
            if (!isVisible || !data) return null;

            return (
              <g key={layer.id} opacity={layer.opacity ?? 1} className="transition-opacity duration-1000">
                {data.features.map((feature: any, idx: number) => {
                  // 行政區域渲染
                  if (layer.renderType === 'polygon') {
                    return (
                      <path
                        key={idx}
                        d={pathGenerator(feature) || ''}
                        className="fill-slate-800 stroke-slate-700 hover:fill-slate-700 hover:stroke-sky-400 transition-all cursor-crosshair"
                        strokeWidth={0.8}
                      />
                    );
                  }

                  // 斷層線渲染
                  if (layer.renderType === 'lines') {
                    return (
                      <path
                        key={idx}
                        d={pathGenerator(feature) || ''}
                        fill="none"
                        className="stroke-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeDasharray="4,6"
                      />
                    );
                  }

                  // 人口熱度渲染
                  if (layer.renderType === 'heatmap' && feature.geometry.type === 'Point') {
                    const [x, y] = projection(feature.geometry.coordinates) || [0, 0];
                    return (
                      <g key={idx} className="animate-pulse">
                        <circle
                          cx={x}
                          cy={y}
                          r={feature.properties.radius || 30}
                          fill="url(#popHeat)"
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r={3}
                          className="fill-sky-400"
                        />
                      </g>
                    );
                  }

                  return null;
                })}
              </g>
            );
          })}
        </svg>

        {/* 浮動浮水印裝飾 */}
        <div className="absolute bottom-4 right-6 text-[10px] font-mono text-slate-500 tracking-tighter opacity-40 uppercase">
          Neural-Spatial Layering v1.0 // Rendering Core: D3.js
        </div>
      </div>
    </MapUI>
  );
}
