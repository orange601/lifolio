'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { listCategories, searchQuestions, type CategoryItem } from '@/app/admin/actions';
import { createVideoSetFromQuestions } from '@/app/admin/questions/list/actions';
import {
  addQuestionToQuizSet,
  getQuizSetDetail,
  publishQuizSet,
  removeQuizSetItem,
  reorderQuizSetItems,
  type QuizSetDetailItem,
} from '@/app/admin/theme/actions';
import type { VideoScript } from '@/core/repositroy/video/video.script.type';

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

type LocalSelectedItem = {
  question_id: number;
  stem: string | null;
  type: string | null;
};

const PAGE_SIZE = 20;

export default function VideoBuilderPage() {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [items, setItems] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);

  const [setTitle, setSetTitle] = useState('');
  const [currentSetId, setCurrentSetId] = useState<number | null>(null);
  const [currentSetStatus, setCurrentSetStatus] = useState<string>('draft');
  const [persistedItems, setPersistedItems] = useState<QuizSetDetailItem[]>([]);
  const [localSelected, setLocalSelected] = useState<LocalSelectedItem[]>([]);

  const [script, setScript] = useState<VideoScript | null>(null);
  const [videoJobDbId, setVideoJobDbId] = useState<number | null>(null);
  const [videoRelativePath, setVideoRelativePath] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [ttsProvider, setTtsProvider] = useState<'local' | 'openclaw'>('openclaw');
  const [voiceTone, setVoiceTone] = useState<'calm' | 'bright' | 'serious'>('calm');
  const [questionRatePct, setQuestionRatePct] = useState(100);
  const [answerRatePct, setAnswerRatePct] = useState(100);
  const [questionPauseMs, setQuestionPauseMs] = useState(300);
  const [answerPauseMs, setAnswerPauseMs] = useState(350);
  const [narrationEnabled, setNarrationEnabled] = useState(true);
  const [sfxEnabled, setSfxEnabled] = useState(true);
  const [bgmPreset, setBgmPreset] = useState<'focus' | 'bright' | 'tension'>('focus');
  const [narrationVolume, setNarrationVolume] = useState(1);
  const [bgmVolume, setBgmVolume] = useState(0.08);
  const [sfxVolume, setSfxVolume] = useState(1);
  const [masteringPreset, setMasteringPreset] = useState<'voice_focus' | 'balanced' | 'impact'>(
    'voice_focus',
  );
  const [targetLufs, setTargetLufs] = useState(-16);
  const [previewText, setPreviewText] = useState('');
  const [previewAudioPath, setPreviewAudioPath] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);
  const isDraftMode = currentSetId == null;
  const currentItems = isDraftMode
    ? localSelected.map((item, index) => ({
      question_id: item.question_id,
      order_no: index + 1,
      stem: item.stem,
      type: item.type,
      videoReady: (item.type ?? '').toUpperCase() === 'MCQ',
      choicesCount: 0,
      correctCount: 0,
      points: 1,
    }))
    : persistedItems;

  const invalidIds = useMemo(
    () =>
      currentItems
        .filter((item) => !item.videoReady)
        .map((item) => item.question_id),
    [currentItems],
  );

  useEffect(() => {
    startTransition(async () => {
      const rows = await listCategories();
      setCategories(rows.filter((row) => row.published !== false));
    });
  }, []);

  useEffect(() => {
    startTransition(async () => {
      const res = await searchQuestions({
        query,
        page,
        pageSize: PAGE_SIZE,
        category_id: categoryId || undefined,
        status: statusFilter || undefined,
      });
      setItems(res.items);
      setTotal(res.total);
    });
  }, [query, page, categoryId, statusFilter]);

  useEffect(() => {
    if (!previewText && currentItems.length > 0) {
      const text = currentItems[0].stem?.trim();
      if (text) setPreviewText(text);
    }
  }, [currentItems, previewText]);

  function isAlreadySelected(questionId: number): boolean {
    if (isDraftMode) return localSelected.some((item) => item.question_id === questionId);
    return persistedItems.some((item) => item.question_id === questionId);
  }

  async function loadSetDetail(quizSetId: number) {
    const detail = await getQuizSetDetail(quizSetId);
    if (!detail) {
      setNotice('Quiz set not found.');
      return;
    }
    setCurrentSetId(detail.id);
    setCurrentSetStatus(detail.status);
    setSetTitle(detail.title);
    setPersistedItems(detail.items);
  }

  function addQuestion(question: Question) {
    if (!question?.id || isAlreadySelected(question.id)) return;
    setNotice('');

    if (isDraftMode) {
      setLocalSelected((prev) => [
        ...prev,
        {
          question_id: question.id,
          stem: question.stem,
          type: question.type,
        },
      ]);
      return;
    }

    startTransition(async () => {
      try {
        await addQuestionToQuizSet({
          quiz_id: currentSetId,
          question_id: question.id,
          order_no: persistedItems.length + 1,
          points: 1,
        });
        await loadSetDetail(currentSetId);
      } catch {
        setNotice('Failed to add question to video set.');
      }
    });
  }

  function removeQuestion(questionId: number) {
    setNotice('');
    if (isDraftMode) {
      setLocalSelected((prev) => prev.filter((item) => item.question_id !== questionId));
      return;
    }

    startTransition(async () => {
      const res = await removeQuizSetItem({ quizSetId: currentSetId, questionId });
      if (!res.success) {
        setNotice(res.message ?? 'Failed to remove question.');
        return;
      }
      await loadSetDetail(currentSetId);
    });
  }

  function moveQuestion(questionId: number, dir: -1 | 1) {
    if (isDraftMode) {
      setLocalSelected((prev) => {
        const idx = prev.findIndex((item) => item.question_id === questionId);
        if (idx < 0) return prev;
        const nextIdx = idx + dir;
        if (nextIdx < 0 || nextIdx >= prev.length) return prev;
        const copy = [...prev];
        [copy[idx], copy[nextIdx]] = [copy[nextIdx], copy[idx]];
        return copy;
      });
      return;
    }

    const idx = persistedItems.findIndex((item) => item.question_id === questionId);
    if (idx < 0) return;
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= persistedItems.length) return;

    const copy = [...persistedItems];
    [copy[idx], copy[nextIdx]] = [copy[nextIdx], copy[idx]];
    const orderIds = copy.map((item) => item.question_id);

    startTransition(async () => {
      const res = await reorderQuizSetItems({
        quizSetId: currentSetId,
        questionIdsInOrder: orderIds,
      });
      if (!res.success) {
        setNotice(res.message ?? 'Failed to reorder.');
        return;
      }
      await loadSetDetail(currentSetId);
    });
  }

  function createDraftSet() {
    setNotice('');
    if (!setTitle.trim()) {
      setNotice('Set title is required.');
      return;
    }
    if (localSelected.length === 0) {
      setNotice('Select at least one question.');
      return;
    }

    startTransition(async () => {
      const result = await createVideoSetFromQuestions({
        title: setTitle.trim(),
        questionIds: localSelected.map((item) => item.question_id),
      });
      if (!result.success || !result.quizSetId) {
        if (result.invalidQuestionIds && result.invalidQuestionIds.length > 0) {
          setNotice(`Invalid questions: ${result.invalidQuestionIds.join(', ')}`);
          return;
        }
        setNotice(result.message ?? 'Failed to create draft set.');
        return;
      }
      setNotice(`Draft set created. id=${result.quizSetId}`);
      setLocalSelected([]);
      await loadSetDetail(result.quizSetId);
    });
  }

  function publishSet() {
    if (!currentSetId) return;
    setNotice('');
    startTransition(async () => {
      const result = await publishQuizSet({ quizSetId: currentSetId });
      if (!result.success) {
        if (result.invalidQuestionIds?.length) {
          setNotice(`${result.message} Invalid ids: ${result.invalidQuestionIds.join(', ')}`);
          return;
        }
        setNotice(result.message ?? 'Failed to publish.');
        return;
      }
      setNotice('Published.');
      await loadSetDetail(currentSetId);
    });
  }

  function generateScript() {
    if (!currentSetId) return;
    setNotice('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/video/jobs', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            quizSetId: currentSetId,
            ttsProvider,
            voiceTone,
            questionRatePct,
            answerRatePct,
            questionPauseMs,
            answerPauseMs,
            narrationEnabled,
            sfxEnabled,
            bgmPreset,
            narrationVolume,
            bgmVolume,
            sfxVolume,
            masteringPreset,
            targetLufs,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          setNotice(data?.message ?? 'Failed to generate script.');
          return;
        }
        setScript(data.script as VideoScript);
        setVideoJobDbId(
          typeof data.job?.dbId === 'number' && data.job.dbId > 0 ? data.job.dbId : null,
        );
        setNotice(`Script generated. dbId=${data.job?.dbId ?? 'n/a'}`);
      } catch {
        setNotice('Request failed while generating script.');
      }
    });
  }

  function renderVideo() {
    if (!videoJobDbId) return;
    setNotice('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/video/render', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ videoJobId: videoJobDbId }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          setNotice(data?.message ?? 'Failed to render video.');
          return;
        }
        setNotice(`Render queued. jobDbId=${videoJobDbId}`);
      } catch {
        setNotice('Request failed while rendering video.');
      }
    });
  }

  function runWorkerOnce() {
    setNotice('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/video/worker/run-once', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ videoJobId: videoJobDbId ?? undefined }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          setNotice(data?.message ?? 'Worker run failed.');
          return;
        }
        const relativePath =
          typeof data?.processed?.relativePath === 'string' ? data.processed.relativePath : null;
        if (relativePath) {
          setVideoRelativePath(relativePath);
        }
        setNotice(
          `Worker done. processed job=${data?.processed?.videoJobId}, engine=${data?.processed?.engine ?? 'unknown'}`,
        );
      } catch {
        setNotice('Request failed while running worker.');
      }
    });
  }

  function resetBuilder() {
    setCurrentSetId(null);
    setCurrentSetStatus('draft');
    setPersistedItems([]);
    setLocalSelected([]);
    setScript(null);
    setVideoJobDbId(null);
    setVideoRelativePath(null);
    setNotice('Builder reset.');
  }

  function previewTts() {
    const text = previewText.trim();
    if (!text) {
      setNotice('Preview text is required.');
      return;
    }
    setNotice('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/video/tts-preview', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            text,
            ttsProvider,
            voiceTone,
            ratePct: questionRatePct,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          setNotice(data?.message ?? 'TTS preview failed.');
          return;
        }
        setPreviewAudioPath(data.relativePath ?? null);
        setNotice('TTS preview generated.');
      } catch {
        setNotice('Request failed while generating TTS preview.');
      }
    });
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">V - Builder</h1>

      <div className="border rounded p-3 bg-white grid md:grid-cols-[1fr_auto_auto_auto_auto] gap-2 items-center">
        <input
          className="border rounded p-2"
          value={setTitle}
          onChange={(e) => setSetTitle(e.target.value)}
          placeholder="Video set title"
          disabled={!isDraftMode}
        />
        <button
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
          onClick={createDraftSet}
          disabled={!isDraftMode || !setTitle.trim() || localSelected.length === 0 || isPending}
        >
          Save Draft
        </button>
        <button
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={publishSet}
          disabled={isDraftMode || currentSetStatus === 'published' || invalidIds.length > 0 || isPending}
        >
          Publish
        </button>
        <button
          className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50"
          onClick={generateScript}
          disabled={isDraftMode || currentSetStatus !== 'published' || isPending}
        >
          Generate Script
        </button>
        <button
          className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
          onClick={renderVideo}
          disabled={!videoJobDbId || isPending}
        >
          Queue Render
        </button>
        <button
          className="px-3 py-2 rounded bg-teal-700 text-white disabled:opacity-50"
          onClick={runWorkerOnce}
          disabled={isPending}
        >
          Run Worker Once
        </button>
      </div>

      <div className="border rounded p-3 bg-white grid md:grid-cols-3 gap-3 items-center">
        <label className="flex items-center gap-2 text-sm">
          <span>TTS</span>
          <select
            className="border rounded px-2 py-1"
            value={ttsProvider}
            onChange={(e) => setTtsProvider(e.target.value as 'local' | 'openclaw')}
          >
            <option value="openclaw">openclaw</option>
            <option value="local">local</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span>Tone</span>
          <select
            className="border rounded px-2 py-1"
            value={voiceTone}
            onChange={(e) => setVoiceTone(e.target.value as 'calm' | 'bright' | 'serious')}
          >
            <option value="calm">calm</option>
            <option value="bright">bright</option>
            <option value="serious">serious</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="min-w-24">Q Rate %</span>
          <input
            type="range"
            min={70}
            max={140}
            step={1}
            value={questionRatePct}
            onChange={(e) => setQuestionRatePct(Number(e.target.value))}
          />
          <span className="w-12 text-right">{questionRatePct}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="min-w-24">A Rate %</span>
          <input
            type="range"
            min={70}
            max={140}
            step={1}
            value={answerRatePct}
            onChange={(e) => setAnswerRatePct(Number(e.target.value))}
          />
          <span className="w-12 text-right">{answerRatePct}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="min-w-24">Q Pause ms</span>
          <input
            type="range"
            min={0}
            max={2000}
            step={50}
            value={questionPauseMs}
            onChange={(e) => setQuestionPauseMs(Number(e.target.value))}
          />
          <span className="w-12 text-right">{questionPauseMs}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="min-w-24">A Pause ms</span>
          <input
            type="range"
            min={0}
            max={2000}
            step={50}
            value={answerPauseMs}
            onChange={(e) => setAnswerPauseMs(Number(e.target.value))}
          />
          <span className="w-12 text-right">{answerPauseMs}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={narrationEnabled}
            onChange={(e) => setNarrationEnabled(e.target.checked)}
          />
          Narration (TTS)
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sfxEnabled}
            onChange={(e) => setSfxEnabled(e.target.checked)}
          />
          SFX
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span>BGM</span>
          <select
            className="border rounded px-2 py-1"
            value={bgmPreset}
            onChange={(e) => setBgmPreset(e.target.value as 'focus' | 'bright' | 'tension')}
          >
            <option value="focus">focus</option>
            <option value="bright">bright</option>
            <option value="tension">tension</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="min-w-24">Narration Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={narrationVolume}
            onChange={(e) => setNarrationVolume(Number(e.target.value))}
          />
          <span className="w-12 text-right">{narrationVolume.toFixed(2)}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="min-w-24">BGM Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={bgmVolume}
            onChange={(e) => setBgmVolume(Number(e.target.value))}
          />
          <span className="w-12 text-right">{bgmVolume.toFixed(2)}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="min-w-24">SFX Vol</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={sfxVolume}
            onChange={(e) => setSfxVolume(Number(e.target.value))}
          />
          <span className="w-12 text-right">{sfxVolume.toFixed(2)}</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="min-w-24">Master</span>
          <select
            className="border rounded px-2 py-1"
            value={masteringPreset}
            onChange={(e) =>
              setMasteringPreset(e.target.value as 'voice_focus' | 'balanced' | 'impact')
            }
          >
            <option value="voice_focus">voice_focus</option>
            <option value="balanced">balanced</option>
            <option value="impact">impact</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="min-w-24">Target LUFS</span>
          <input
            type="range"
            min={-24}
            max={-10}
            step={1}
            value={targetLufs}
            onChange={(e) => setTargetLufs(Number(e.target.value))}
          />
          <span className="w-12 text-right">{targetLufs}</span>
        </label>
      </div>

      <div className="border rounded p-3 bg-white space-y-2">
        <div className="text-sm font-medium">TTS Preview</div>
        <textarea
          className="w-full border rounded p-2 text-sm min-h-20"
          value={previewText}
          onChange={(e) => setPreviewText(e.target.value)}
          placeholder="Preview narration text"
        />
        <button
          className="px-3 py-2 rounded border text-sm disabled:opacity-50"
          onClick={previewTts}
          disabled={isPending || !previewText.trim()}
        >
          Preview TTS
        </button>
        {previewAudioPath && (
          <audio
            controls
            preload="metadata"
            className="w-full"
            src={`/api/admin/video/file?path=${encodeURIComponent(previewAudioPath)}`}
          />
        )}
      </div>

      <div className="text-sm border rounded p-3 bg-gray-50">
        mode: {isDraftMode ? 'draft-builder' : 'persisted-set'} / setId: {currentSetId ?? '-'} / status:{' '}
        {currentSetStatus} / selected: {currentItems.length} / invalid: {invalidIds.length}
        {!isDraftMode && (
          <>
            {' '}
            / <Link className="underline" href={`/admin/theme/${currentSetId}`}>open detail</Link>
          </>
        )}
      </div>

      {notice && <div className="border rounded p-3 bg-amber-50 text-sm">{notice}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="border rounded p-3 bg-white space-y-3">
          <h2 className="font-semibold">Question Search</h2>
          <div className="grid md:grid-cols-3 gap-2">
            <input
              className="border rounded p-2 md:col-span-2"
              value={query}
              onChange={(e) => {
                setPage(1);
                setQuery(e.target.value);
              }}
              placeholder="Search question text"
            />
            <select
              className="border rounded p-2"
              value={categoryId}
              onChange={(e) => {
                setPage(1);
                setCategoryId(e.target.value ? Number(e.target.value) : '');
              }}
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.id}. {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            <select
              className="border rounded p-2"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
            >
              <option value="">All status</option>
              <option value="published">published</option>
              <option value="draft">draft</option>
            </select>
            <button
              className="border rounded p-2"
              onClick={() => {
                setQuery('');
                setCategoryId('');
                setStatusFilter('');
                setPage(1);
              }}
            >
              Clear Filters
            </button>
          </div>

          <div className="overflow-auto border rounded">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Question</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Add</th>
                </tr>
              </thead>
              <tbody>
                {isPending ? (
                  <tr>
                    <td className="p-4 text-center" colSpan={5}>
                      Loading...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={5}>
                      No results
                    </td>
                  </tr>
                ) : (
                  items.map((question) => (
                    <tr key={question.id} className="border-b align-top">
                      <td className="p-2">{question.id}</td>
                      <td className="p-2">{question.type ?? '-'}</td>
                      <td className="p-2">{question.stem ?? '-'}</td>
                      <td className="p-2">{question.status ?? '-'}</td>
                      <td className="p-2">
                        <button
                          className="px-2 py-1 border rounded disabled:opacity-50"
                          disabled={isAlreadySelected(question.id)}
                          onClick={() => addQuestion(question)}
                        >
                          Add
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              className="px-2 py-1 border rounded"
              disabled={page <= 1 || isPending}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>
            <div className="text-sm">
              {page} / {totalPages}
            </div>
            <button
              className="px-2 py-1 border rounded"
              disabled={page >= totalPages || isPending}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </section>

        <section className="border rounded p-3 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Selected Questions</h2>
            <button className="px-2 py-1 border rounded text-sm" onClick={resetBuilder}>
              Reset Builder
            </button>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-auto">
            {currentItems.length === 0 ? (
              <div className="text-sm text-gray-500">No selected questions</div>
            ) : (
              currentItems.map((item, index) => (
                <div key={item.question_id} className="border rounded p-2">
                  <div className="text-sm">
                    #{index + 1} / QID {item.question_id} / {item.type ?? '-'} /{' '}
                    {item.videoReady ? 'OK' : 'INVALID'}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">{item.stem ?? '-'}</div>
                  <div className="mt-2 flex gap-1">
                    <button
                      className="px-2 py-1 border rounded text-xs"
                      onClick={() => moveQuestion(item.question_id, -1)}
                      disabled={index === 0 || isPending}
                    >
                      Up
                    </button>
                    <button
                      className="px-2 py-1 border rounded text-xs"
                      onClick={() => moveQuestion(item.question_id, 1)}
                      disabled={index === currentItems.length - 1 || isPending}
                    >
                      Down
                    </button>
                    <button
                      className="px-2 py-1 border rounded text-xs"
                      onClick={() => removeQuestion(item.question_id)}
                      disabled={isPending}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {script && (
        <details className="border rounded p-3 bg-black text-green-300 text-xs">
          <summary className="cursor-pointer">Script JSON Preview</summary>
          <pre className="mt-2 overflow-auto">{JSON.stringify(script, null, 2)}</pre>
        </details>
      )}

      {videoRelativePath && (
        <div className="border rounded p-3 bg-white space-y-2">
          <div className="text-sm font-medium">Video Preview</div>
          <video
            className="w-full rounded border"
            controls
            preload="metadata"
            src={`/api/admin/video/file?path=${encodeURIComponent(videoRelativePath)}`}
          />
          <div className="text-xs text-gray-600">{videoRelativePath}</div>
        </div>
      )}
    </div>
  );
}
