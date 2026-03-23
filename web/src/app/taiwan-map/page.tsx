'use client';

import { useState } from 'react';
import { InteractiveMap } from '@/components/taiwan-map';
import type { LessonConfig } from '@/components/taiwan-map';
import { administrativeLesson, indigenousLesson } from '@/lessons';

const LESSONS: LessonConfig[] = [administrativeLesson, indigenousLesson];

export default function TaiwanMapPage() {
  const [lessonIdx, setLessonIdx] = useState(0);
  const lesson = LESSONS[lessonIdx];

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#050510',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Lesson switcher */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          display: 'flex',
          gap: 8,
        }}
      >
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

      <div style={{ width: '100%', height: '100%', maxWidth: 900, maxHeight: '100vh' }}>
        <InteractiveMap config={lesson} />
      </div>
    </main>
  );
}
