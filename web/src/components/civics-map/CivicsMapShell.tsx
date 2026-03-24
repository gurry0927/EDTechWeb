'use client';

import { useMemo, useState, useCallback } from 'react';
import { InteractiveMap } from '@/components/taiwan-map';
import type { LessonConfig } from '@/components/taiwan-map';
import { civicsLocalGovLesson } from '@/lessons/civics-local-gov';
import { GovSidePanel, GovMobileBar } from './GovSidePanel';
import type { LocalGovData } from './types';
import { isLocalGovData } from './types';

export function CivicsMapShell() {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredData, setHoveredData] = useState<LocalGovData | null>(null);
  const [mobileBarExpanded, setMobileBarExpanded] = useState(false);

  const handleInteraction = useCallback(
    (regionId: string | null, data?: Record<string, unknown>) => {
      setHoveredRegion(regionId);
      setHoveredData(regionId && isLocalGovData(data) ? data : null);
      // 點到地圖時自動收合行動版抽屜
      if (regionId) setMobileBarExpanded(false);
    },
    [],
  );

  const config: LessonConfig = useMemo(
    () => ({
      ...civicsLocalGovLesson,
      callbacks: {
        ...civicsLocalGovLesson.callbacks,
        onRegionHover: handleInteraction,
        // 手機點擊 = 選取（等同 hover）
        onRegionClick: handleInteraction,
      },
    }),
    [handleInteraction],
  );

  return (
    <div className="w-full h-full flex min-h-0 relative">
      {/* 左側：地圖 */}
      <div className="flex-1 min-w-0">
        <InteractiveMap config={config} />
      </div>

      {/* 右側：資訊卡片（lg 以上顯示） */}
      <GovSidePanel hoveredRegion={hoveredRegion} hoveredData={hoveredData} />

      {/* 行動版底部列（lg 以下顯示） */}
      <GovMobileBar
        hoveredRegion={hoveredRegion}
        hoveredData={hoveredData}
        expanded={mobileBarExpanded}
        onToggle={() => setMobileBarExpanded(v => !v)}
      />
    </div>
  );
}
