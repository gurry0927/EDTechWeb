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

      {/* Hero feature — Question Detective */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 mb-16">
        <Link
          href="/question-detective"
          className="group relative block rounded-2xl border border-amber-200/60 dark:border-amber-800/30 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/20 p-8 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-amber-300 dark:hover:border-amber-700/50 overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute top-4 right-6 text-7xl opacity-10 dark:opacity-5 select-none pointer-events-none">🔍</div>

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-3xl shrink-0 border border-amber-200/50 dark:border-amber-800/30">
              🕵️
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-amber-900 dark:text-amber-200 mb-1.5" style={{ fontFamily: '"Noto Serif TC", Georgia, serif' }}>
                未解檔案室
              </h2>
              <p className="text-sm text-amber-800/70 dark:text-amber-300/50 leading-relaxed">
                每份會考題都藏著未解的謎團。扮演偵探，從證詞中找出線索、推理破案。
              </p>
            </div>
            <svg className="w-6 h-6 text-amber-400 dark:text-amber-600 transition-transform duration-300 group-hover:translate-x-1 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </section>

      {/* Subject grid */}
      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-8">
          其他學習模組
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
