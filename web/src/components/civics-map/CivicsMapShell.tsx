'use client';

import { useMemo, useState, useCallback } from 'react';
import { InteractiveMap } from '@/components/taiwan-map';
import type { LessonConfig } from '@/components/taiwan-map';
import { civicsLocalGovLesson } from '@/lessons/civics-local-gov';
import { GovSidePanel, GovMobileBar } from './GovSidePanel';
import { NotesOverlay } from './NotesOverlay';
import type { LocalGovData } from './types';
import { isLocalGovData } from './types';

type Mode = 'overview' | 'quiz';

// 測驗模式：統一暗色底，不透露分類
const QUIZ_FILL = '#0D0D1A';

export function CivicsMapShell() {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [hoveredData, setHoveredData] = useState<LocalGovData | null>(null);
  const [mobileBarExpanded, setMobileBarExpanded] = useState(false);
  const [mode, setMode] = useState<Mode>('overview');
  const [showNotes, setShowNotes] = useState(false);

  const handleInteraction = useCallback(
    (regionId: string | null, data?: Record<string, unknown>) => {
      setHoveredRegion(regionId);
      setHoveredData(regionId && isLocalGovData(data) ? data : null);
      // 點到地圖時自動收合行動版抽屜
      if (regionId) setMobileBarExpanded(false);
    },
    [],
  );

  const handleModeSwitch = useCallback((next: Mode) => {
    setMode(next);
    // 切換模式時清除 hover 狀態，避免殘留
    setHoveredRegion(null);
    setHoveredData(null);
  }, []);

  const config: LessonConfig = useMemo(() => {
    const baseRegions = civicsLocalGovLesson.regions;
    const regions =
      mode === 'quiz'
        ? Object.fromEntries(
            Object.entries(baseRegions).map(([key, val]) => [key, { ...val, fill: QUIZ_FILL }]),
          )
        : baseRegions;

    return {
      ...civicsLocalGovLesson,
      regions,
      callbacks: {
        ...civicsLocalGovLesson.callbacks,
        onRegionHover: handleInteraction,
        // 手機點擊 = 選取（等同 hover）
        onRegionClick: handleInteraction,
      },
    };
  }, [handleInteraction, mode]);

  return (
    <div className="w-full h-full flex min-h-0 relative">
      {/* 模式切換按鈕 */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex rounded-lg overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.12)' }}
      >
        {(['overview', 'quiz'] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeSwitch(m)}
            className="px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer"
            style={{
              background: mode === m ? 'rgba(255,255,255,0.15)' : 'rgba(5,5,16,0.85)',
              color: mode === m ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)',
            }}
          >
            {m === 'overview' ? '總覽' : '測驗'}
          </button>
        ))}
      </div>

      {/* 左側：地圖 + 筆記按鈕 + 筆記展開層 */}
      <div className="flex-1 min-w-0 relative">
        <InteractiveMap config={config} />

        {/* 筆記按鈕（右上角，點擊切換開關） */}
        <button
          onClick={() => setShowNotes(v => !v)}
          className="absolute top-4 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
          style={{
            background: showNotes ? 'rgba(255,255,255,0.15)' : 'rgba(5,5,16,0.85)',
            border: `1px solid ${showNotes ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'}`,
            color: showNotes ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)',
          }}
        >
          <span>📋</span>
          <span>{showNotes ? '關閉筆記' : '筆記'}</span>
        </button>

        {/* 筆記展開層：從右上角動畫展開 */}
        <div
          className="absolute inset-0 z-30"
          style={{
            transformOrigin: 'top right',
            transform: showNotes ? 'scale(1)' : 'scale(0)',
            opacity: showNotes ? 1 : 0,
            pointerEvents: showNotes ? 'auto' : 'none',
            transition: 'transform 0.35s cubic-bezier(0.34,1.26,0.64,1), opacity 0.25s ease',
          }}
        >
          <NotesOverlay onClose={() => setShowNotes(false)} />
        </div>
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
