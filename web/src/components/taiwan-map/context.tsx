'use client';

import { createContext, useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { RegionId, MapTheme, RegionConfig, ResolvedHoverEffect, MapCallbacks, ProcessedRegion } from './types';
import { SVG_W } from './defaults';

const EMPTY_CALLBACKS: MapCallbacks = {};

interface TaiwanMapContextValue {
  theme: MapTheme;
  regions: Map<RegionId, ProcessedRegion>;
  hoveredId: RegionId | null;
  hoverEffect: ResolvedHoverEffect;
  callbacks: MapCallbacks;
  handleEnter: (id: RegionId) => void;
  handleLeave: () => void;
  handleClick: (id: RegionId) => void;
  getRegionConfig: (id: RegionId) => RegionConfig;
  /** Stable color index per region (avoids shift on hover reorder) */
  colorIndex: Record<string, number>;
  /** Convert target pixel size to SVG units, compensating for render scale */
  scaleFont: (targetPx: number) => number;
}

const TaiwanMapContext = createContext<TaiwanMapContextValue | null>(null);

export function useTaiwanMap() {
  const ctx = useContext(TaiwanMapContext);
  if (!ctx) throw new Error('useTaiwanMap must be used within TaiwanMapProvider');
  return ctx;
}

export function TaiwanMapProvider({
  theme,
  regions,
  hoverEffect,
  callbacks = EMPTY_CALLBACKS,
  colorIndex,
  subToSource,
  containerWidth = SVG_W,
  children,
}: {
  theme: MapTheme;
  regions: Map<RegionId, ProcessedRegion>;
  hoverEffect: ResolvedHoverEffect;
  callbacks?: MapCallbacks;
  colorIndex: Record<string, number>;
  /** SubRegionSplit 產生的 sub-region → sourceCounty 映射 */
  subToSource?: Map<RegionId, RegionId>;
  containerWidth?: number;
  children: React.ReactNode;
}) {
  const [hoveredId, setHoveredId] = useState<RegionId | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const handleEnter = useCallback((id: RegionId) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    const region = regions.get(id);
    if (!region || region.config.interaction !== 'interactive') return;
    setHoveredId(id);
    // Sub-region → 回報 sourceCounty ID 給外部 callback
    const callbackId = subToSource?.get(id) ?? id;
    callbacks.onRegionHover?.(callbackId, region.config.data);
  }, [regions, callbacks, subToSource]);

  const handleLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setHoveredId(null);
      leaveTimerRef.current = null;
      callbacks.onRegionHover?.(null);
    }, hoverEffect.leaveDelay);
  }, [hoverEffect.leaveDelay, callbacks]);

  const handleClick = useCallback((id: RegionId) => {
    const region = regions.get(id);
    if (!region || region.config.interaction !== 'interactive') return;
    const callbackId = subToSource?.get(id) ?? id;
    callbacks.onRegionClick?.(callbackId, region.config.data);
  }, [regions, callbacks, subToSource]);

  const getRegionConfig = useCallback((id: RegionId): RegionConfig => {
    const region = regions.get(id);
    if (region) return region.config;
    return { id, label: id, interaction: 'static' };
  }, [regions]);

  /**
   * Convert a target pixel size to SVG user-unit font-size,
   * compensating for the SVG's viewBox scaling.
   *
   * WHEN TO USE:
   *   ✅ Floating / overlay labels (MapLabels hover pill, InsetBox hover tooltip)
   *      — no bounding-box constraint, text should always be ~targetPx on screen.
   *
   * WHEN NOT TO USE:
   *   ❌ Labels inside fixed SVG containers (InsetBox header, MapLegend items)
   *      — use a natural SVG font-size integer instead (e.g. fontSize={20}).
   *      Compensated font-size in SVG units grows large on small screens and
   *      will overflow the fixed container dimensions.
   *
   * The 0.55 floor prevents over-compensation on very narrow screens while
   * keeping text proportional to its surrounding SVG layout.
   */
  const scaleFont = useCallback((targetPx: number): number => {
    const renderScale = Math.max(containerWidth / SVG_W, 0.55);
    return targetPx / renderScale;
  }, [containerWidth]);

  const value = useMemo<TaiwanMapContextValue>(() => ({
    theme,
    regions,
    hoveredId,
    hoverEffect,
    callbacks,
    handleEnter,
    handleLeave,
    handleClick,
    getRegionConfig,
    colorIndex,
    scaleFont,
  }), [theme, regions, hoveredId, hoverEffect, callbacks,
       handleEnter, handleLeave, handleClick, getRegionConfig, colorIndex, scaleFont]);

  return (
    <TaiwanMapContext.Provider value={value}>
      {children}
    </TaiwanMapContext.Provider>
  );
}
