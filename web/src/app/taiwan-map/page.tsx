'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InteractiveMap } from '@/components/taiwan-map';
import type { LessonConfig } from '@/components/taiwan-map';
import { administrativeLesson, indigenousLesson } from '@/lessons';

const LESSONS: LessonConfig[] = [administrativeLesson, indigenousLesson];

export default function TaiwanMapPage() {
  const router = useRouter();
  const [lessonIdx, setLessonIdx] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const lesson = LESSONS[lessonIdx];

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050510] flex items-center justify-center">
      {/* Top bar — hideable for teacher projection mode */}
      {showUI && (
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-all"
            style={{
              fontFamily: "'Noto Sans TC', sans-serif",
              border: '1px solid #1b4965',
              background: 'rgba(5,5,16,0.9)',
              color: '#4a7a9a',
              cursor: 'pointer',
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>

          {/* Lesson switcher */}
          <div className="flex gap-2">
            {LESSONS.map((l, i) => (
              <button
                key={l.id}
                onClick={() => setLessonIdx(i)}
                style={{
                  padding: '8px 16px',
                  fontSize: 13,
                  fontFamily: "'Noto Sans TC', sans-serif",
                  border: `1px solid ${i === lessonIdx ? '#00d4ff' : '#1b4965'}`,
                  borderRadius: 6,
                  background: i === lessonIdx ? 'rgba(0,212,255,0.15)' : 'rgba(5,5,16,0.9)',
                  color: i === lessonIdx ? '#00d4ff' : '#4a7a9a',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                {l.title.primary}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle UI visibility (bottom-right, always visible) */}
      <button
        onClick={() => setShowUI(!showUI)}
        className="absolute bottom-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all"
        style={{
          background: 'rgba(5,5,16,0.8)',
          border: '1px solid #1b4965',
          color: '#4a7a9a',
          fontSize: 14,
        }}
        title={showUI ? '隱藏介面（投影模式）' : '顯示介面'}
      >
        {showUI ? '◉' : '○'}
      </button>

      <div className="w-full h-full max-w-[900px] max-h-screen">
        <InteractiveMap config={lesson} />
      </div>
    </main>
  );
}
