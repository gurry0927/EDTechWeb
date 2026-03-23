import Link from 'next/link';
import { notFound } from 'next/navigation';
import { subjects, getSubject } from '@/config';

export function generateStaticParams() {
  return subjects.map((s) => ({ subject: s.id }));
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: subjectId } = await params;
  const subject = getSubject(subjectId);
  if (!subject) notFound();

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Back + header */}
      <header className="mx-auto max-w-5xl px-6 pt-12 pb-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回首頁
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-5xl">{subject.icon}</span>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">{subject.name}</h1>
            <p className="mt-1 text-zinc-500 dark:text-zinc-400">{subject.description}</p>
          </div>
        </div>
      </header>

      {/* Course list */}
      <main className="mx-auto max-w-5xl px-6 pb-24">
        {subject.courses.length === 0 ? (
          <div className="rounded-2xl border border-card-border bg-card-bg p-16 text-center">
            <p className="text-zinc-500 text-lg">此科目的課程正在準備中</p>
            <p className="text-zinc-400 dark:text-zinc-600 text-sm mt-2">敬請期待</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {subject.courses.map((course) => (
              <Link
                key={course.id}
                href={course.path}
                className="group relative rounded-2xl border border-card-border bg-card-bg p-6 transition-all duration-300 hover:border-card-border-hover hover:bg-card-bg-hover hover:scale-[1.02] hover:shadow-lg dark:hover:shadow-none"
              >
                {/* Accent glow */}
                <div
                  className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(300px circle at 50% 50%, ${subject.color}12, transparent 60%)`,
                  }}
                />

                <div className="relative z-10">
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-foreground transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                    {course.description}
                  </p>

                  {course.tags && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full border border-card-border text-zinc-400 dark:text-zinc-500"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm font-medium transition-colors"
                    style={{ color: subject.color }}
                  >
                    開始學習
                    <svg
                      className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
