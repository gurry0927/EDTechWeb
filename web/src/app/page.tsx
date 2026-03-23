'use client';

import Link from 'next/link';
import { subjects } from '@/config';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-300">
      {/* Hero */}
      <header className="relative flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        <div className="relative z-10 max-w-2xl">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 dark:from-blue-400 dark:via-cyan-300 dark:to-teal-400 bg-clip-text text-transparent">
              EDTech
            </span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 leading-relaxed">
            互動式數位教材，讓每堂課都是一場探索
          </p>
        </div>
      </header>

      {/* Subject grid */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-8">
          選擇科目
        </h2>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const hasCourses = subject.courses.length > 0;
            const cardClass = `group relative rounded-2xl border border-card-border bg-card-bg p-6 transition-all duration-300 ${
              hasCourses
                ? 'hover:border-card-border-hover hover:bg-card-bg-hover hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-none cursor-pointer'
                : 'opacity-50 cursor-default'
            }`;

            const cardContent = (
              <>
                {hasCourses && (
                  <div
                    className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background: `radial-gradient(400px circle at 50% 50%, ${subject.color}12, transparent 60%)`,
                    }}
                  />
                )}
                <div className="relative z-10">
                  <div className="text-4xl mb-4">{subject.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{subject.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    {subject.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{
                        color: hasCourses ? subject.color : '#999',
                        background: hasCourses ? `${subject.color}12` : 'var(--card-bg)',
                      }}
                    >
                      {hasCourses ? `${subject.courses.length} 個課程` : '即將推出'}
                    </span>
                    {hasCourses && (
                      <svg
                        className="w-4 h-4 text-zinc-400 dark:text-zinc-600 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </div>
              </>
            );

            return hasCourses ? (
              <Link key={subject.id} href={`/${subject.id}`} className={cardClass}>
                {cardContent}
              </Link>
            ) : (
              <div key={subject.id} className={cardClass}>
                {cardContent}
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-card-border py-8 text-center text-xs text-zinc-400 dark:text-zinc-600">
        EDTech — 互動教學平台
      </footer>
    </div>
  );
}
