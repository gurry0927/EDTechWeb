import { notFound } from 'next/navigation';
import { ALL_QUESTIONS } from '@/data/detective-questions';
import { DetectiveGamePage } from '@/components/question-detective/DetectiveGamePage';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const question = ALL_QUESTIONS.find(q => q.id === id);
  if (!question) notFound();
  return <DetectiveGamePage question={question} />;
}

export function generateStaticParams() {
  return ALL_QUESTIONS.map(q => ({ id: q.id }));
}
