'use client';

import Link from 'next/link';
import { subjects } from '@/config';

export function AlbumPanel() {
  const activeCourses = subjects.flatMap(s =>
    s.courses.map(c => ({ ...c, subjectIcon: s.icon, subjectName: s.name }))
  );

  return (
    <div className="px-6 pt-6 pb-20 max-w-md mx-auto">
      {/* 收集冊佔位 */}
      <div className="mb-8">
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--dt-text, #3d3426)' }}>
          收集冊
        </h2>
        <div className="rounded-2xl p-6 text-center"
          style={{
            background: 'color-mix(in srgb, var(--dt-card, #f8f4eb) 80%, transparent)',
            border: '1px dashed var(--dt-border, rgba(140,120,80,0.15))',
          }}
        >
          <div className="text-3xl mb-2">📖</div>
          <p className="text-xs opacity-50" style={{ color: 'var(--dt-text-muted, #94a3b8)' }}>
            即將推出 — 收集線索卡片，隨時複習知識點
          </p>
        </div>
      </div>

      {/* 學習工具 */}
      <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--dt-text, #3d3426)' }}>
        學習工具
      </h2>
      <div className="space-y-2">
        {activeCourses.map(course => (
          <Link
            key={course.id}
            href={course.path}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: 'color-mix(in srgb, var(--dt-card, #f8f4eb) 80%, transparent)',
              border: '1px solid var(--dt-border, rgba(140,120,80,0.15))',
            }}
          >
            <span className="text-xl">{course.subjectIcon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate" style={{ color: 'var(--dt-text, #3d3426)' }}>
                {course.title}
              </div>
              <div className="text-[11px] opacity-50 truncate" style={{ color: 'var(--dt-text-muted, #94a3b8)' }}>
                {course.subjectName}
              </div>
            </div>
            <svg className="w-4 h-4 opacity-30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {activeCourses.length === 0 && (
        <p className="text-xs text-center opacity-40 py-8" style={{ color: 'var(--dt-text-muted, #94a3b8)' }}>
          尚無學習工具
        </p>
      )}
    </div>
  );
}
