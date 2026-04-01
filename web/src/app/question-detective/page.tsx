'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DetectivePlayer } from '@/components/question-detective/DetectivePlayer';
import type { DetectiveQuestion } from '@/components/question-detective/types';

import q1 from '@/data/detective-questions/114-history-20.json';
import q2 from '@/data/detective-questions/114-history-31.json';

const ALL_QUESTIONS: DetectiveQuestion[] = [q1, q2] as DetectiveQuestion[];

function DifficultyDots({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3].map(d => (
        <span key={d} className={`w-1.5 h-1.5 rounded-full ${d <= level ? 'bg-amber-400' : 'bg-white/15'}`} />
      ))}
    </span>
  );
}

export default function QuestionDetectivePage() {
  const router = useRouter();
  const [activeQuestion, setActiveQuestion] = useState<DetectiveQuestion | null>(null);

  if (activeQuestion) {
    return <DetectivePlayer question={activeQuestion} onBack={() => setActiveQuestion(null)} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#050510] text-white flex flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-white/10 px-5 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-white/50 hover:text-white/80 transition-colors text-sm flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            首頁
          </button>
          <div className="flex-1" />
        </div>
      </header>

      {/* Title */}
      <div className="shrink-0 px-5 pt-8 pb-6 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold tracking-tight">
          <span className="text-cyan-400">🔍</span> 題目偵探
        </h1>
        <p className="text-sm text-white/45 mt-2 leading-relaxed">
          不急著算答案。先像偵探一樣收集線索、推理，找到突破口再破案。
        </p>
      </div>

      {/* Question list */}
      <main className="flex-1 px-5 pb-8 max-w-2xl mx-auto w-full">
        <div className="space-y-3">
          {ALL_QUESTIONS.map((q) => (
            <button
              key={q.id}
              onClick={() => setActiveQuestion(q)}
              className="w-full text-left rounded-xl p-4 border border-white/10 hover:border-white/20 hover:bg-white/3 transition-all group"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs text-white/40">{q.source}</span>
                    <DifficultyDots level={q.difficulty} />
                  </div>
                  <p className="text-sm text-white/75 leading-relaxed line-clamp-2 group-hover:text-white/90 transition-colors">
                    {q.stem}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {q.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-white/35 border border-white/8">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <svg className="w-5 h-5 text-white/20 group-hover:text-white/40 transition-colors shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
