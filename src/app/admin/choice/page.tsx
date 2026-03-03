'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { listCategories, type CategoryItem } from '@/app/admin/actions';
import { saveMCQQuestion } from './actions';

type ChoiceForm = {
  content: string;
  is_correct: boolean;
};

const DEFAULT_CHOICES: ChoiceForm[] = [
  { content: '', is_correct: true },
  { content: '', is_correct: false },
  { content: '', is_correct: false },
  { content: '', is_correct: false },
];

export default function CreateMCQQuestionPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [status, setStatus] = useState<'published' | 'draft'>('draft');
  const [difficulty, setDifficulty] = useState<number | ''>(1);
  const [grade, setGrade] = useState('general');
  const [language, setLanguage] = useState('ko');

  const [stem, setStem] = useState('');
  const [explanation, setExplanation] = useState('');
  const [choices, setChoices] = useState<ChoiceForm[]>(DEFAULT_CHOICES);

  const [notice, setNotice] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const rows = await listCategories();
      setCategories(rows.filter((row) => row.published !== false));
    });
  }, []);

  const correctCount = useMemo(
    () => choices.filter((c) => c.is_correct).length,
    [choices],
  );

  const canSubmit = useMemo(() => {
    if (!categoryId) return false;
    if (!stem.trim()) return false;
    if (choices.length !== 4) return false;
    if (choices.some((c) => !c.content.trim())) return false;
    if (correctCount !== 1) return false;
    return true;
  }, [categoryId, stem, choices, correctCount]);

  function resetForm() {
    setStem('');
    setExplanation('');
    setChoices(DEFAULT_CHOICES);
  }

  function updateChoiceContent(index: number, value: string) {
    setChoices((prev) =>
      prev.map((c, i) => (i === index ? { ...c, content: value } : c)),
    );
  }

  function markCorrect(index: number) {
    setChoices((prev) => prev.map((c, i) => ({ ...c, is_correct: i === index })));
  }

  function onSubmit() {
    if (!canSubmit) return;

    setNotice('');
    startTransition(async () => {
      const result = await saveMCQQuestion({
        stem: stem.trim(),
        explanation: explanation.trim() ? explanation.trim() : null,
        difficulty: typeof difficulty === 'number' ? difficulty : null,
        grade: grade || 'general',
        language: language || 'ko',
        status,
        category_id: Number(categoryId),
        choices: choices.map((c, index) => ({
          content: c.content.trim(),
          is_correct: c.is_correct,
          order_no: index + 1,
        })),
      });

      if (!result.success) {
        setNotice(result.message ?? 'Save failed');
        return;
      }

      setNotice(`Saved question id=${result.id}`);
      resetForm();
    });
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Create MCQ Question</h1>

      <div className="grid md:grid-cols-2 gap-3 border rounded p-4 bg-white">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            className="w-full border rounded p-2"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id}. {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            className="w-full border rounded p-2"
            value={status}
            onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Difficulty</label>
          <input
            type="number"
            min={1}
            max={5}
            className="w-full border rounded p-2"
            value={difficulty}
            onChange={(e) =>
              setDifficulty(
                e.target.value === ''
                  ? ''
                  : Math.max(1, Math.min(5, Number(e.target.value) || 1)),
              )
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Grade</label>
          <input
            className="w-full border rounded p-2"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Language</label>
          <input
            className="w-full border rounded p-2"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded p-4 bg-white space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Question</label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            value={stem}
            onChange={(e) => setStem(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Choices (exactly 4, single correct)</label>
          {choices.map((choice, index) => (
            <div className="flex items-center gap-2" key={index}>
              <input
                type="radio"
                name="correct-choice"
                checked={choice.is_correct}
                onChange={() => markCorrect(index)}
                aria-label={`choice-${index + 1}-correct`}
              />
              <input
                className="flex-1 border rounded p-2"
                value={choice.content}
                onChange={(e) => updateChoiceContent(index, e.target.value)}
                placeholder={`Choice ${index + 1}`}
              />
            </div>
          ))}
          <p className="text-xs text-gray-600">Current correct choices: {correctCount}</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Explanation (optional)</label>
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          onClick={onSubmit}
          disabled={!canSubmit || isPending}
        >
          {isPending ? 'Saving...' : 'Save Question'}
        </button>
        <button type="button" className="px-4 py-2 rounded border" onClick={resetForm}>
          Reset
        </button>
      </div>

      {notice && (
        <div className="border rounded p-3 text-sm bg-gray-50">
          {notice}
        </div>
      )}
    </div>
  );
}

