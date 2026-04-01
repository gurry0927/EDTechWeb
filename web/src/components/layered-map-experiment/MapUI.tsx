// src/components/layered-map-experiment/MapUI.tsx
'use client';

import React from 'react';
import type { LayerManifest } from './types';

// 🚨 AI 開發者請注意：
// 1. 本檔案負責「畫面排版」與「功能面板」。
// 2. 嚴禁使用 Inline style，請一律使用 Tailwind CSS。
// 3. 我已經搭好「左側地圖區」與「右側控制面板區」的版型。

interface MapUIProps {
  layers: LayerManifest[];
  activeLayers: string[];
  onToggleLayer: (layerId: string) => void;
  /** 全域控制變數的當前值 */
  controlValues: Record<string, number>;
  /** 當滑桿或控制項改變時呼叫 */
  onControlChange: (variableName: string, value: number) => void;
  // TODO: AI FILL HERE - 你可以擴充傳入 Orchestrator 的 props (例如 children) 來塞入 SVG 地圖
  children?: React.ReactNode;
}

export function MapUI({ layers, activeLayers, onToggleLayer, controlValues, onControlChange, children }: MapUIProps) {
  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* ── 左側：地圖渲染區 ── */}
      <main className="flex-1 relative border-r border-slate-700">
        {/* 標題列 */}
        <div className="absolute top-4 left-6 z-10 pointer-events-none">
          <h1 className="text-3xl font-bold tracking-wider text-slate-100 drop-shadow-md">
            時空智能層疊模型
          </h1>
          <p className="text-slate-400 text-sm tracking-widest mt-1">
            SPATIAL INTELLIGENCE LAYER SYSTEM
          </p>
        </div>

        {/* ======================================================= */}
        {/* TODO: AI FILL HERE - 請將渲染好的 SVG 地圖放在這裡 (children) */}
        {/* ======================================================= */}
        <div className="w-full h-full flex items-center justify-center p-8">
          {children || (
            <div className="text-slate-500 flex flex-col items-center">
              <svg className="w-16 h-16 mb-4 animate-pulse opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              等待 AI 載入地圖渲染模組...
            </div>
          )}
        </div>
      </main>

      {/* ── 右側：控制面板區 ── */}
      <aside className="w-80 bg-slate-800 flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-sky-400">圖層控制台 Layers</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* ======================================================= */}
          {/* TODO: AI FILL HERE - 請實作一個美觀的「勾選圖層清單」 */}
          {/* 提示：可以按照 category (基底/地科/社會) 進行分組渲染 */}
          {/* ======================================================= */}
          {layers.map(layer => {
            const isActive = activeLayers.includes(layer.id);
            return (
              <div key={layer.id} className={`flex flex-col space-y-2 p-3 rounded transition-colors border ${isActive ? 'bg-slate-700/80 border-sky-500/50' : 'bg-slate-700/30 border-slate-600/30 hover:bg-slate-700/50'}`}>
                {/* 勾選區塊 */}
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="form-checkbox h-5 w-5 text-sky-500 rounded border-slate-500 bg-slate-800 focus:ring-sky-500/50 focus:ring-offset-0 group-hover:border-sky-400 transition"
                    checked={isActive}
                    onChange={() => onToggleLayer(layer.id)}
                  />
                  <div className="flex flex-col">
                    <span className={`font-medium transition ${isActive ? 'text-sky-300' : 'text-slate-300 group-hover:text-slate-200'}`}>{layer.name}</span>
                    <span className="text-slate-400 text-xs">Type: {layer.renderType}</span>
                  </div>
                </label>

                {/* 動態控制區 (只有當該圖層有 controls 且被打開時才顯示) */}
                {isActive && layer.controls && layer.controls.length > 0 && (
                  <div className="pt-2 mt-1 border-t border-slate-600/50 pl-8 pr-2 space-y-3">
                    {layer.controls.map(ctrl => (
                      <div key={ctrl.variableName} className="flex flex-col space-y-1">
                        <div className="flex justify-between text-xs text-sky-200">
                          <span>{ctrl.label}</span>
                          <span className="font-mono bg-slate-800/80 px-1.5 py-0.5 rounded text-sky-300 border border-sky-500/30">
                            {controlValues[ctrl.variableName]} {ctrl.unit || ''}
                          </span>
                        </div>
                        {ctrl.type === 'slider' && (
                          <input 
                            type="range"
                            min={ctrl.min}
                            max={ctrl.max}
                            step={ctrl.step || 1}
                            value={controlValues[ctrl.variableName] ?? ctrl.defaultValue}
                            onChange={(e) => onControlChange(ctrl.variableName, parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-sky-400"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 蘇格拉底 AI 引導區塊 (預留殼) */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <div className="flex items-center space-x-2 text-emerald-400 mb-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span className="font-medium text-sm">AI 蘇格拉底洞察</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            當你勾選不同的知識圖層交疊時，這裡將會產生跨學科的問答引導。（建置中）
          </p>
        </div>
      </aside>

    </div>
  );
}
