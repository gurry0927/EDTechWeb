import { useState, useCallback, useEffect } from 'react';
import type { DetectiveQuestion, Clue, ScaffoldingRegion } from '../types';
import { supabase } from '../supabase';

const TABLE = 'detective_questions';

// ── 題目列表項 ──
export interface QuestionListItem {
  id: string;
  source: string;
  subject: string;
  updated_at: string;
}

export function useQuestion() {
  // 列表
  const [list, setList] = useState<QuestionListItem[]>([]);
  const [listLoading, setListLoading] = useState(true);

  // 當前編輯的題目
  const [question, setQuestion] = useState<DetectiveQuestion | null>(null);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── 載入列表 ──
  const fetchList = useCallback(async () => {
    setListLoading(true);
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, source, subject, updated_at')
      .order('updated_at', { ascending: false });
    if (!error && data) setList(data);
    setListLoading(false);
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // ── 設定當前題目（本地 state）──
  const setActive = useCallback((q: DetectiveQuestion | null) => {
    setQuestion(q);
    setJsonText(q ? JSON.stringify(q, null, 2) : '');
    setJsonError(null);
  }, []);

  // ── 從 Supabase 讀取單題 ──
  const loadById = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('data')
      .eq('id', id)
      .single();
    if (!error && data) {
      setActive(data.data as DetectiveQuestion);
    }
  }, [setActive]);

  // ── 儲存到 Supabase（upsert）──
  const saveToDb = useCallback(async (q: DetectiveQuestion) => {
    setSaving(true);
    const { error } = await supabase
      .from(TABLE)
      .upsert({
        id: q.id,
        source: q.source,
        subject: q.subject,
        data: q,
      }, { onConflict: 'id' });
    setSaving(false);
    if (error) {
      console.error('[supabase] save failed', error);
      return false;
    }
    // 刷新列表
    fetchList();
    return true;
  }, [fetchList]);

  // ── 從 Supabase 刪除 ──
  const deleteFromDb = useCallback(async (id: string) => {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (!error) {
      if (question?.id === id) setActive(null);
      fetchList();
    }
    return !error;
  }, [question, setActive, fetchList]);

  // ── 本地更新（不自動存 DB，需手動 save）──
  const updateQuestion = useCallback((next: DetectiveQuestion) => {
    setQuestion(next);
    setJsonText(JSON.stringify(next, null, 2));
    setJsonError(null);
  }, []);

  const applyJson = useCallback((text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text) as DetectiveQuestion;
      setQuestion(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : '無效的 JSON');
    }
  }, []);

  // ── 便捷 mutators ──
  const updateTokens = useCallback((tokens: string[]) => {
    if (!question) return;
    updateQuestion({ ...question, stemTokens: tokens });
  }, [question, updateQuestion]);

  const updateFigureTokens = useCallback((tokens: string[]) => {
    if (!question) return;
    updateQuestion({ ...question, figureTokens: tokens });
  }, [question, updateQuestion]);

  const addClue = useCallback((clue: Clue) => {
    if (!question) return;
    updateQuestion({ ...question, clues: [...question.clues, clue] });
  }, [question, updateQuestion]);

  const updateClue = useCallback((index: number, clue: Clue) => {
    if (!question) return;
    const clues = [...question.clues];
    clues[index] = clue;
    updateQuestion({ ...question, clues });
  }, [question, updateQuestion]);

  const removeClue = useCallback((index: number) => {
    if (!question) return;
    updateQuestion({ ...question, clues: question.clues.filter((_, i) => i !== index) });
  }, [question, updateQuestion]);

  const addScaffolding = useCallback((s: ScaffoldingRegion) => {
    if (!question) return;
    updateQuestion({ ...question, scaffolding: [...(question.scaffolding ?? []), s] });
  }, [question, updateQuestion]);

  const updateScaffolding = useCallback((index: number, s: ScaffoldingRegion) => {
    if (!question) return;
    const scaffolding = [...(question.scaffolding ?? [])];
    scaffolding[index] = s;
    updateQuestion({ ...question, scaffolding });
  }, [question, updateQuestion]);

  const removeScaffolding = useCallback((index: number) => {
    if (!question) return;
    updateQuestion({ ...question, scaffolding: (question.scaffolding ?? []).filter((_, i) => i !== index) });
  }, [question, updateQuestion]);

  // ── 檔案匯入/匯出（保留）──
  const loadFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = e => applyJson(e.target?.result as string ?? '');
    reader.readAsText(file);
  }, [applyJson]);

  const exportJson = useCallback(() => {
    if (!question) return;
    const blob = new Blob([JSON.stringify(question, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${question.id ?? 'question'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [question]);

  return {
    // 列表
    list, listLoading, fetchList, loadById, deleteFromDb,
    // 當前題目
    question, jsonText, jsonError, saving,
    // 操作
    applyJson, updateQuestion, setActive,
    saveToDb,
    updateTokens, updateFigureTokens,
    addClue, updateClue, removeClue,
    addScaffolding, updateScaffolding, removeScaffolding,
    loadFile, exportJson,
  };
}
