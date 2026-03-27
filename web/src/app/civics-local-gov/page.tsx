'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CivicsMapShell } from '@/components/civics-map/CivicsMapShell';

export default function CivicsLocalGovPage() {
  const router = useRouter();
  const [showUI, setShowUI] = useState(true);

  return (
    <main className="relative w-screen h-[100dvh] overflow-hidden bg-[#050510] flex flex-col">
      {/* Top bar */}
      {showUI && (
        <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between">
          <button
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/civics'))}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-all cursor-pointer"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(5,5,16,0.9)',
              color: 'rgba(255,255,255,0.5)',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
        </div>
      )}

      {/* Toggle UI */}
      <button
        onClick={() => setShowUI(!showUI)}
        className="absolute bottom-4 right-4 z-30 w-8 h-8 flex items-center justify-center rounded-full transition-all cursor-pointer"
        style={{
          background: 'rgba(5,5,16,0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.4)',
          fontSize: 14,
        }}
        title={showUI ? '隱藏介面（投影模式）' : '顯示介面'}
        aria-label={showUI ? '隱藏介面' : '顯示介面'}
      >
        {showUI ? '◉' : '○'}
      </button>

      {/* Map + side panel */}
      <div className="flex-1 min-h-0">
        <CivicsMapShell />
      </div>
    </main>
  );
}
