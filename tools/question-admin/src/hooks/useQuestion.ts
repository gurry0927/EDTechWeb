import { useState, useCallback } from 'react';
import type { DetectiveQuestion } from '../types';

const STORAGE_KEY = 'qa-current-question';

function loadSaved(): DetectiveQuestion | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function useQuestion() {
  const [question, setQuestion] = useState<DetectiveQuestion | null>(loadSaved);
  const [jsonText, setJsonText] = useState<string>(
    () => question ? JSON.stringify(question, null, 2) : ''
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const applyJson = useCallback((text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text) as DetectiveQuestion;
      setQuestion(parsed);
      setJsonError(null);
      localStorage.setItem(STORAGE_KEY, text);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : '無效的 JSON');
    }
  }, []);

  const updateQuestion = useCallback((next: DetectiveQuestion) => {
    const text = JSON.stringify(next, null, 2);
    setQuestion(next);
    setJsonText(text);
    setJsonError(null);
    localStorage.setItem(STORAGE_KEY, text);
  }, []);

  const updateTokens = useCallback((tokens: string[]) => {
    if (!question) return;
    updateQuestion({ ...question, stemTokens: tokens });
  }, [question, updateQuestion]);

  const updateFigureTokens = useCallback((tokens: string[]) => {
    if (!question) return;
    updateQuestion({ ...question, figureTokens: tokens });
  }, [question, updateQuestion]);

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

  return { question, jsonText, jsonError, applyJson, updateQuestion, updateTokens, updateFigureTokens, loadFile, exportJson };
}
