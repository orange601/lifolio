'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { searchQuestions } from '@/app/admin/actions';
import { createVideoSetFromQuestions } from './actions';

type Question = {
  id: number;
  type: string | null;
  stem: string | null;
  difficulty: number | null;
  grade: string | null;
  language: string | null;
  status: string | null;
  category_id: number | null;
};

const PAGE_SIZE = 20;

export default function QuestionsListPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [videoSetTitle, setVideoSetTitle] = useState('');
  const [notice, setNotice] = useState('');
  const [createdQuizSetId, setCreatedQuizSetId] = useState<number | null>(null);

  const [isPending, startTransition] = useTransition();
  const [isSaving, startSavingTransition] = useTransition();

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  const visibleSelectableIds = useMemo(
    () =>
      items
        .filter((item) => (item.type ?? '').toUpperCase() === 'MCQ')
        .map((item) => item.id),
    [items],
  );

  const selectedCount = selectedIds.length;
  const isAllVisibleSelected =
    visibleSelectableIds.length > 0 &&
    visibleSelectableIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    startTransition(async () => {
      const res = await searchQuestions({ query, page, pageSize: PAGE_SIZE });
      setItems(res.items);
      setTotal(res.total);
    });
  }, [query, page]);

  function toggleQuestion(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter((value) => value !== id);
    });
  }

  function toggleAllVisible(checked: boolean) {
    setSelectedIds((prev) => {
      if (!checked) {
        return prev.filter((id) => !visibleSelectableIds.includes(id));
      }
      return Array.from(new Set([...prev, ...visibleSelectableIds]));
    });
  }

  function clearSelected() {
    setSelectedIds([]);
  }

  function createVideoSet() {
    if (!videoSetTitle.trim() || selectedIds.length === 0) return;

    setNotice('');
    setCreatedQuizSetId(null);
    startSavingTransition(async () => {
      try {
        const result = await createVideoSetFromQuestions({
          title: videoSetTitle.trim(),
          questionIds: selectedIds,
        });

        if (!result.success) {
          if (result.invalidQuestionIds && result.invalidQuestionIds.length > 0) {
            setNotice(
              `${result.message} Invalid ids: ${result.invalidQuestionIds.join(', ')}`,
            );
            return;
          }
          setNotice(result.message ?? 'Failed to create video set.');
          return;
        }

        setNotice(
          `Video set created. quiz_set id=${result.quizSetId}, questions=${result.savedCount}`,
        );
        setCreatedQuizSetId(result.quizSetId ?? null);
        setSelectedIds([]);
        setVideoSetTitle('');
      } catch {
        setNotice('Request failed. Check server log and retry.');
      }
    });
  }

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Questions List</h1>

      <div className="border rounded p-3 bg-white space-y-3">
        <div className="flex items-center gap-2">
          <input
            className="flex-1 border rounded p-2"
            value={query}
            onChange={(e) => {
              setPage(1);
              setQuery(e.target.value);
            }}
            placeholder="Search by question text"
          />
        </div>

        <div className="grid md:grid-cols-[1fr_auto_auto] gap-2 items-center">
          <input
            className="border rounded p-2"
            value={videoSetTitle}
            onChange={(e) => setVideoSetTitle(e.target.value)}
            placeholder="Video set title"
          />
          <button
            className="px-3 py-2 rounded border"
            onClick={clearSelected}
            disabled={selectedCount === 0 || isSaving}
          >
            Clear Selected ({selectedCount})
          </button>
          <button
            className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={createVideoSet}
            disabled={!videoSetTitle.trim() || selectedCount === 0 || isSaving}
          >
            {isSaving ? 'Saving...' : 'Create Video Set'}
          </button>
        </div>
      </div>

      {notice && <div className="border rounded p-3 bg-gray-50 text-sm">{notice}</div>}
      {createdQuizSetId && (
        <div className="border rounded p-3 bg-blue-50 text-sm">
          <Link className="underline" href={`/admin/theme/${createdQuizSetId}`}>
            Open video set detail #{createdQuizSetId}
          </Link>
        </div>
      )}

      <div className="overflow-auto border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-2">
                <input
                  type="checkbox"
                  checked={isAllVisibleSelected}
                  onChange={(e) => toggleAllVisible(e.target.checked)}
                  aria-label="select-visible"
                />
              </th>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Question</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Difficulty</th>
              <th className="text-left p-2">Grade</th>
              <th className="text-left p-2">Language</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Edit</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={10} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">
                  No results
                </td>
              </tr>
            ) : (
              items.map((q) => {
                const selectable = (q.type ?? '').toUpperCase() === 'MCQ';
                return (
                  <tr key={q.id} className="border-b align-top">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(q.id)}
                        disabled={!selectable}
                        onChange={(e) => toggleQuestion(q.id, e.target.checked)}
                        aria-label={`select-${q.id}`}
                      />
                    </td>
                    <td className="p-2">{q.id}</td>
                    <td className="p-2">{q.type ?? '-'}</td>
                    <td className="p-2">{q.stem ?? '-'}</td>
                    <td className="p-2">{q.category_id ?? '-'}</td>
                    <td className="p-2">{q.difficulty ?? '-'}</td>
                    <td className="p-2">{q.grade ?? '-'}</td>
                    <td className="p-2">{q.language ?? '-'}</td>
                    <td className="p-2">{q.status ?? '-'}</td>
                    <td className="p-2">
                      <Link className="px-2 py-1 border rounded inline-block" href={`/admin/questions/${q.id}`}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          className="px-2 py-1 border rounded"
          disabled={page <= 1 || isPending}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <div className="text-sm">
          {page} / {totalPages}
        </div>
        <button
          className="px-2 py-1 border rounded"
          disabled={page >= totalPages || isPending}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
