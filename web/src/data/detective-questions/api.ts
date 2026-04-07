import { supabase } from '@/lib/supabase';
import type { DetectiveQuestion } from '@/components/question-detective/types';

// 公開資料（列表頁用，不含答案/線索）
export type PublicQuestion = Pick<DetectiveQuestion,
  'id' | 'source' | 'subject' | 'difficulty' | 'tags' |
  'subSubject' | 'gradeLevel' | 'mainStem' | 'figure' |
  'figureImage' | 'options' | 'caseQuestion' | 'startHint'
>;

export async function fetchPublicQuestions(): Promise<PublicQuestion[]> {
  const { data, error } = await supabase.rpc('get_public_questions');
  if (error) {
    console.error('[supabase] fetchPublicQuestions failed', error);
    return [];
  }
  return (data ?? []) as PublicQuestion[];
}

// 完整資料（遊戲頁用，使用者互動後才載入）
export async function fetchQuestionDetail(id: string): Promise<DetectiveQuestion | null> {
  const { data, error } = await supabase.rpc('get_question_detail', { question_id: id });
  if (error) {
    console.error('[supabase] fetchQuestionDetail failed', error);
    return null;
  }
  return (data as DetectiveQuestion) ?? null;
}
