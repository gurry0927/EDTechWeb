'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import type { RegionId, MapTheme, RegionConfig, ResolvedHoverEffect, MapCallbacks, ProcessedRegion } from './types';

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
  callbacks = {},
  colorIndex,
  children,
}: {
  theme: MapTheme;
  regions: Map<RegionId, ProcessedRegion>;
  hoverEffect: ResolvedHoverEffect;
  callbacks?: MapCallbacks;
  colorIndex: Record<string, number>;
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
    if (region && region.config.interaction !== 'interactive') return;
    setHoveredId(id);
    callbacks.onRegionHover?.(id, region?.config.data);
  }, [regions, callbacks]);

  const handleLeave = useCallback(() => {
    leaveTimerRef.current = setTimeout(() => {
      setHoveredId(null);
      leaveTimerRef.current = null;
      callbacks.onRegionHover?.(null);
    }, hoverEffect.leaveDelay);
  }, [hoverEffect.leaveDelay, callbacks]);

  const handleClick = useCallback((id: RegionId) => {
    const region = regions.get(id);
    if (region && region.config.interaction !== 'interactive') return;
    callbacks.onRegionClick?.(id, region?.config.data);
  }, [regions, callbacks]);

  const getRegionConfig = useCallback((id: RegionId): RegionConfig => {
    const region = regions.get(id);
    if (region) return region.config;
    return { id, label: id, interaction: 'static' };
  }, [regions]);

  return (
    <TaiwanMapContext.Provider value={{
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
    }}>
      {children}
    </TaiwanMapContext.Provider>
  );
}
