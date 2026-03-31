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
    initialLayers.map(l => l.id) // 預設強制全開，避免使用者進來看到空白
  );

  // 初始化控制變數的值 (從 layer configs 中榨取出來的 defaultValue)
  const [controlValues, setControlValues] = useState<Record<string, number>>(() => {
    const initVals: Record<string, number> = {};
    initialLayers.forEach(layer => {
      if (layer.controls) {
        layer.controls.forEach(c => {
          initVals[c.variableName] = c.defaultValue;
        });
      }
    });
    return initVals;
  });

  // 用來裝從 API/JSON 下載回來的 Geo 原始資料
  const [geoDataCache, setGeoDataCache] = useState<Record<string, any>>({});

  const handleToggleLayer = (layerId: string) => {
    setActiveLayers(prev =>
      prev.includes(layerId)
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  };

  const handleControlChange = (variableName: string, value: number) => {
    setControlValues(prev => ({ ...prev, [variableName]: value }));
  };

  // 用來追蹤已經開始下載或下載完成的圖層
  const fetchedLayers = React.useRef<Set<string>>(new Set());

  // ── TODO: AI FILL HERE (Data Fetching) ──
  useEffect(() => {
    initialLayers.forEach(async (layer) => {
      const layerId = layer.id;
      if (fetchedLayers.current.has(layerId)) return;
      if (!layer.dataSourceUri) return;

      // 標記為已處理 (避免重複 fetch)
      fetchedLayers.current.add(layerId);

      try {
        console.log(`[Orchestrator] Loading data for layer: ${layerId} (${layer.dataSourceUri})`);
        let featureData: any = null;

        if (layer.dataSourceUri === 'local:taiwan') {
          // 動態載入台灣地理資料
          const data = await import('@/data/taiwan.geo.json');
          featureData = data.default || data;
        } else if (layer.dataSourceUri === 'mock:taipei_base') {
          const data = await import('@/data/taiwan.geo.json');
          const fullData = data.default || data;
          featureData = {
            ...fullData,
            features: fullData.features.filter((f: any) =>
              f.properties.name === '臺北市' || f.properties.name === '新北市' || f.properties.name === '台北市'
            )
          };
        } else if (layer.dataSourceUri === 'mock:taiwan_strait_bounds') {
          // [全域視野 Bounding Box] - 台灣海峽完整範圍
          // ⚠️ GeoJSON Polygons require Counter-Clockwise winding order
          featureData = {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { name: 'Taiwan Strait Bounds' },
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [118.0, 26.0], // 左上 NW
                    [118.0, 21.5], // 左下 SW
                    [122.5, 21.5], // 右下 SE
                    [122.5, 26.0], // 右上 NE
                    [118.0, 26.0]  // 閉合 NW
                  ]]
                }
              }
            ]
          };
        } else if (layer.dataSourceUri === 'mock:taiwan_and_fujian') {
          // [台灣與福建海岸線] - 載入台灣資料並加入福建邊緣
          const data = await import('@/data/taiwan.geo.json');
          const taiwanData = data.default || data;
          
          const validFeatures = Array.isArray(taiwanData.features) ? taiwanData.features : [];

          const fujianCoast: any = {
            type: 'Feature',
            properties: { name: 'Fujian Coast' },
            geometry: {
              type: 'Polygon',
              coordinates: [[
                [118.0, 26.0], // NW
                [118.0, 22.0], // SW
                [118.5, 22.5], 
                [119.5, 23.5], 
                [120.0, 25.5], // NE
                [118.0, 26.0]  // 閉合 NW
              ]]
            }
          };
          featureData = {
            type: 'FeatureCollection',
            features: [...validFeatures, fujianCoast]
          };
        } else if (layer.dataSourceUri === 'mock:land_bridge_mask') {
          // [冰河時期陸橋] - 台灣海峽的淺水區多邊形
          featureData = {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { name: '台灣海峽陸橋' },
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [119.5, 25.5], // NW (Fujian North)
                    [118.5, 23.5], // SW (Fujian South)
                    [120.0, 23.0], // SE (Tainan)
                    [120.5, 24.0], // SE (Taichung)
                    [121.0, 25.0], // NE (Taipei)
                    [119.5, 25.5]  // NW
                  ]]
                }
              }
            ]
          };
        } else if (layer.dataSourceUri === 'mock:animal_migration') {
          // [冰河期特有種播遷路徑] - 線條
          featureData = {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { name: '台灣黑熊', species: 'bear' },
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [119.0, 25.5],   // 福建起點
                    [119.5, 25.2],
                    [120.0, 24.5],   // 陸橋中間
                    [120.5, 24.2],
                    [121.0, 24.0]    // 登陸雪山山脈
                  ]
                }
              },
              {
                type: 'Feature',
                properties: { name: '櫻花鉤吻鮭', species: 'salmon' },
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [118.3, 23.8],   // 福建起點
                    [119.0, 23.6],
                    [119.5, 23.5],
                    [120.0, 23.4],
                    [120.5, 23.5],
                    [120.8, 23.6],
                    [121.0, 23.8],
                    [121.2, 24.0],
                    [121.3, 24.2]    // 台灣溪流終點
                  ]
                }
              }
            ]
          };
        } else if (layer.dataSourceUri === 'mock:anping_siltation') {
          // [安平沖積平原] - 台江內海與安平古堡
          featureData = {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: { name: '台江內海', type: 'water' },
                geometry: {
                  type: 'Polygon',
                  coordinates: [[
                    [120.10, 23.05], // NW
                    [120.08, 22.98], // W
                    [120.10, 22.92], // SW
                    [120.15, 22.90], // SW
                    [120.20, 22.92], // SE
                    [120.22, 22.98], // SE
                    [120.20, 23.05], // NE
                    [120.10, 23.05]  // NW
                  ]]
                }
              },
              {
                type: 'Feature',
                properties: { name: '安平古堡 (熱蘭遮城 1624)', type: 'fortress' },
                geometry: {
                  type: 'Point',
                  coordinates: [120.15, 23.00]
                }
              }
            ]
          };
        } else if (layer.dataSourceUri === 'mock:lines') {
          featureData = {
            type: 'FeatureCollection',
            features: [
              { type: 'Feature', properties: { name: '車籠埔斷層' }, geometry: { type: 'LineString', coordinates: [[120.71, 24.35], [120.72, 24.15], [120.73, 23.85], [120.68, 23.50]] } }
            ]
          };
        }

        if (featureData && featureData.features) {
          console.log(`[Orchestrator] Data loaded for ${layerId}, count: ${featureData.features.length}`);
          setGeoDataCache(prev => ({ ...prev, [layerId]: featureData }));
        } else {
          console.warn(`[Orchestrator] Data loaded for ${layerId} is invalid (no features)!`);
        }
      } catch (err) {
        console.error(`Failed to load data for layer ${layerId}`, err);
        // 如果失敗，可以考慮把它從 Set 移除讓下次還有機會重試
        fetchedLayers.current.delete(layerId);
      }
    });
  }, [initialLayers]);

  // ── D3 Projection & Path Generator ──
  const { projection, pathGenerator } = React.useMemo(() => {
    const width = 800;
    const height = 600;

    // 建立投影：預設以台灣海峽為中心
    // 捨棄 fitSize 自動縮放，避免 GeoJSON 右手法則(多邊形繪製順序)
    // 造成 D3 誤判為「地球除外」的剩餘區域而自動縮滿全球
    const proj = d3.geoMercator()
      .center([120.0, 23.8]) // 台灣海峽中央偏北，確保包含苗栗/台中與福建
      .scale(6500)          // 放大比例，6500 適合 800x600 塞入台灣西半部 + 海峽
      .translate([width / 2, height / 2]);

    const path = d3.geoPath().projection(proj);

    return { projection: proj, pathGenerator: path };
  }, [geoDataCache, initialLayers]);

  return (
    <MapUI
      layers={initialLayers}
      activeLayers={activeLayers}
      onToggleLayer={handleToggleLayer}
      controlValues={controlValues}
      onControlChange={handleControlChange}
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
            <linearGradient id="lakeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(14, 165, 233, 0.5)" />
              <stop offset="100%" stopColor="rgba(2, 132, 199, 0.8)" />
            </linearGradient>

            {/* 冰河陸橋漸層 - 黃綠色土地/植被感 */}
            <linearGradient id="landBridgeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(134, 239, 172, 0.7)" />
              <stop offset="50%" stopColor="rgba(134, 239, 172, 0.5)" />
              <stop offset="100%" stopColor="rgba(163, 230, 53, 0.6)" />
            </linearGradient>

            {/* 陸橋地紋濾鏡 - feTurbulence 製造自然紋理 */}
            <filter id="landTexture" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
            </filter>

            {/* 海浪濾鏡 - 波浪效果 */}
            <filter id="waveEffect" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="2" result="wave" />
              <feDisplacementMap in="SourceGraphic" in2="wave" scale="5" xChannelSelector="R" yChannelSelector="B" />
            </filter>

            {/* 暖化淹沒特效漸層 - 微藍色 */}
            <linearGradient id="floodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(96, 165, 250, 0.4)" />
              <stop offset="100%" stopColor="rgba(37, 99, 235, 0.6)" />
            </linearGradient>

            {/* 安平古堡金色邊框漸層 */}
            <linearGradient id="fortressGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="50%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>

            {/* 動物遷徙路徑發光效果 */}
            <filter id="migrationGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
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
                    // 冰河陸橋渲染 - 根據 seaLevel 控制
                    if (layer.id === 'land_bridge') {
                      const seaLevel = controlValues['seaLevel'] ?? 0;
                      // 冰河期：seaLevel <= -50 時陸橋浮現
                      if (seaLevel <= -50) {
                        return (
                          <path
                            key={idx}
                            d={pathGenerator(feature) || ''}
                            fill="url(#landBridgeGradient)"
                            filter="url(#landTexture)"
                            className="transition-opacity duration-1000"
                            opacity={0.8}
                            stroke="rgba(134, 239, 172, 0.8)"
                            strokeWidth={1}
                          />
                        );
                      }
                      // 暖化期：seaLevel > 0 時微微發藍 (淹沒特效)
                      if (seaLevel > 0) {
                        return (
                          <path
                            key={idx}
                            d={pathGenerator(feature) || ''}
                            fill="url(#floodGradient)"
                            filter="url(#waveEffect)"
                            className="transition-opacity duration-1000"
                            opacity={Math.min(seaLevel / 100, 0.5)}
                            stroke="rgba(96, 165, 250, 0.6)"
                            strokeWidth={1}
                          />
                        );
                      }
                      // 正常情況不渲染
                      return null;
                    }

                    // 安平沖積平原 - 台江內海渲染
                    if (layer.id === 'anping_siltation') {
                      const year = controlValues['historyYear'] ?? 1624;
                      // 1624年為最大 (100%), 2024年為最小 (10% 避免完全消失看不到)
                      const siltScale = Math.max(0.1, 1 - (year - 1624) / 400); 
                      
                      // 安平悖論：內海淤積是「向海岸線(陸地)退縮」
                      // 我們讓它向右上角 (東邊陸地) 縮小
                      return (
                        <path
                          key={idx}
                          d={pathGenerator(feature) || ''}
                          fill="url(#lakeGradient)"
                          className="transition-all duration-1000"
                          stroke="rgba(14, 165, 233, 0.8)"
                          strokeWidth={1.5}
                          style={{
                            transformOrigin: '70% 30%', 
                            transformBox: 'fill-box',
                            transform: `scale(${siltScale})`,
                            opacity: siltScale > 0.15 ? 0.8 : 0,
                          }}
                        />
                      );
                    }

                    // 正常的 Polygon 渲染 (提高基礎圖層亮度)
                    const isBaseLayer = layer.id === 'base_taiwan';
                    return (
                      <path
                        key={idx}
                        d={pathGenerator(feature) || ''}
                        className={layer.opacity === 0 ? "fill-transparent" : (
                          isBaseLayer 
                            ? "fill-slate-600 stroke-slate-500 hover:fill-slate-500" 
                            : "fill-slate-700 stroke-slate-600 hover:fill-slate-600"
                        ) + " transition-all cursor-crosshair"}
                        strokeWidth={layer.opacity === 0 ? 0 : 0.8}
                      />
                    );
                  }

                  // 點圖層渲染
                  if (layer.renderType === 'points' && feature.geometry.type === 'Point') {
                    const coords = projection(feature.geometry.coordinates);
                    if (!coords) return null;
                    const [x, y] = coords;

                    // 安平古堡特殊樣式 - 強烈對比色方形
                    if (layer.id === 'anping_siltation' && feature.properties.type === 'fortress') {
                      return (
                        <g key={idx}>
                          {/* 安平古堡 - 金色邊框的紅色正方形 */}
                          <rect
                            x={x - 8}
                            y={y - 8}
                            width={16}
                            height={16}
                            fill="url(#fortressGold)"
                            stroke="#78350f"
                            strokeWidth={2}
                            className="drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                          />
                          {/* 古堡標籤 */}
                          <text
                            x={x}
                            y={y - 14}
                            textAnchor="middle"
                            className="fill-amber-200 text-[9px] font-bold pointer-events-none"
                            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                          >
                            {feature.properties.name}
                          </text>
                        </g>
                      );
                    }

                    // 正常標記點...
                    return (
                      <g key={idx}>
                        <circle cx={x} cy={y} r={6} className="fill-rose-500 shadow-md stroke-slate-100" strokeWidth={2}></circle>
                        <text x={x + 10} y={y + 4} className="fill-rose-300 text-[10px] font-bold pointer-events-none">{feature.properties.name}</text>
                      </g>
                    );
                  }

                  // 斷層線與歷史遷徙線渲染
                  if (layer.renderType === 'lines') {
                    // 動物遷徙路徑 - 只有在冰河期 (seaLevel <= -50) 才可見
                    if (layer.id === 'animal_migration') {
                      const seaLevel = controlValues['seaLevel'] ?? 0;

                      // 非冰河期不渲染
                      if (seaLevel > -50) {
                        return null;
                      }

                      // 根據物種給予不同顏色
                      const isBear = feature.properties.species === 'bear';
                      const strokeColor = isBear ? 'stroke-amber-400' : 'stroke-sky-400';
                      const glowColor = isBear ? 'rgba(251, 191, 36, 0.6)' : 'rgba(56, 189, 248, 0.5)';

                      return (
                        <g key={idx}>
                          {/* 遷徙路徑線條 - 動態 dash 效果 */}
                          <path
                            d={pathGenerator(feature) || ''}
                            fill="none"
                            className={`${strokeColor} drop-shadow-[0_0_8px_${glowColor.replace(/\s+/g, '')}]`}
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeDasharray="6,8"
                            filter="url(#migrationGlow)"
                          >
                            {/* 動畫 title - 顯示物種名稱 */}
                            <title>{feature.properties.name}</title>
                          </path>
                          {/* 終點標記 */}
                          {(() => {
                            const coords = feature.geometry.coordinates;
                            const endPoint = coords[coords.length - 1];
                            const endCoords = projection(endPoint);
                            if (!endCoords) return null;
                            const [ex, ey] = endCoords;
                            return (
                              <g>
                                <circle
                                  cx={ex}
                                  cy={ey}
                                  r={5}
                                  className={isBear ? 'fill-amber-500' : 'fill-sky-500'}
                                  stroke="#fff"
                                  strokeWidth={1.5}
                                />
                                <text
                                  x={ex + 10}
                                  y={ey + 4}
                                  className={`${isBear ? 'fill-amber-300' : 'fill-sky-300'} text-[9px] font-bold pointer-events-none`}
                                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                                >
                                  {feature.properties.name}
                                </text>
                              </g>
                            );
                          })()}
                        </g>
                      );
                    }

                    // 正常的線條 (車籠埔斷層等)...
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
