'use client';

import { use, useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  getQuizSetDetail,
  publishQuizSet,
  removeQuizSetItem,
  reorderQuizSetItems,
  type QuizSetDetailItem,
} from '@/app/admin/theme/actions';
import type { VideoScript } from '@/core/repositroy/video/video.script.type';

export default function QuizSetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idString } = use(params);
  const quizSetId = Number(idString);

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('');
  const [items, setItems] = useState<QuizSetDetailItem[]>([]);
  const [notice, setNotice] = useState('');
  const [script, setScript] = useState<VideoScript | null>(null);
  const [videoJobDbId, setVideoJobDbId] = useState<number | null>(null);
  const [videoRelativePath, setVideoRelativePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [isPending, startTransition] = useTransition();

  const invalidIds = useMemo(
    () => items.filter((item) => !item.videoReady).map((item) => item.question_id),
    [items],
  );

  const canPublish = items.length > 0 && invalidIds.length === 0 && status !== 'published';

  const loadDetail = useCallback(() => {
    if (!Number.isInteger(quizSetId) || quizSetId <= 0) {
      setLoading(false);
      setNotice('Invalid quiz set id.');
      return;
    }

    startTransition(async () => {
      const detail = await getQuizSetDetail(quizSetId);
      if (!detail) {
        setNotice('Quiz set not found.');
        setLoading(false);
        return;
      }

      setTitle(detail.title);
      setStatus(detail.status);
      setItems(detail.items);
      setLoading(false);
    });
  }, [quizSetId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  function move(questionId: number, dir: -1 | 1) {
    setItems((prev) => {
      const idx = prev.findIndex((item) => item.question_id === questionId);
      if (idx < 0) return prev;
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[nextIdx]] = [copy[nextIdx], copy[idx]];
      return copy.map((item, index) => ({ ...item, order_no: index + 1 }));
    });
  }

  function remove(questionId: number) {
    setNotice('');
    startTransition(async () => {
      const res = await removeQuizSetItem({ quizSetId, questionId });
      if (!res.success) {
        setNotice(res.message ?? 'Failed to remove item.');
        return;
      }
      await loadDetail();
      setNotice('Item removed.');
    });
  }

  function saveOrder() {
    setNotice('');
    startTransition(async () => {
      const res = await reorderQuizSetItems({
        quizSetId,
        questionIdsInOrder: items.map((item) => item.question_id),
      });
      if (!res.success) {
        setNotice(res.message ?? 'Failed to save order.');
        return;
      }
      setNotice('Order saved.');
      await loadDetail();
    });
  }

  function publish() {
    setNotice('');
    startTransition(async () => {
      const res = await publishQuizSet({ quizSetId });
      if (!res.success) {
        if (res.invalidQuestionIds && res.invalidQuestionIds.length > 0) {
          setNotice(
            `${res.message} Invalid ids: ${res.invalidQuestionIds.join(', ')}`,
          );
          return;
        }
        setNotice(res.message ?? 'Failed to publish.');
        return;
      }
      setNotice('Published.');
      await loadDetail();
    });
  }

  function generateScript() {
    setNotice('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/video/jobs', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ quizSetId, questionDurationSec: 7, answerDurationSec: 4 }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          if (Array.isArray(data?.invalidQuestionIds) && data.invalidQuestionIds.length > 0) {
            setNotice(`${data?.message ?? 'Failed'} Invalid ids: ${data.invalidQuestionIds.join(', ')}`);
            return;
          }
          setNotice(data?.message ?? 'Failed to generate script.');
          return;
        }
        setScript(data.script as VideoScript);
        setVideoJobDbId(
          typeof data.job?.dbId === 'number' && data.job.dbId > 0 ? data.job.dbId : null,
        );
        setNotice(
          `Script generated. job=${data.job?.id}, dbId=${data.job?.dbId ?? 'n/a'}, file=${data.file?.relativePath ?? 'n/a'}`,
        );
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
        const relativePath =
          typeof data?.file?.relativePath === 'string' ? data.file.relativePath : null;
        setVideoRelativePath(relativePath);
        setNotice(
          `Video rendered. jobDbId=${videoJobDbId}, file=${relativePath ?? 'n/a'}`,
        );
      } catch {
        setNotice('Request failed while rendering video.');
      }
    });
  }

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Video Set Detail</h1>
        <Link className="px-3 py-2 border rounded" href="/admin/questions/list">
          Back to Questions
        </Link>
      </div>

      <div className="border rounded p-3 bg-white text-sm space-y-1">
        <div>
          <strong>ID:</strong> {quizSetId}
        </div>
        <div>
          <strong>Title:</strong> {title}
        </div>
        <div>
          <strong>Status:</strong> {status}
        </div>
        <div>
          <strong>Items:</strong> {items.length}
        </div>
        <div>
          <strong>Video-ready:</strong> {items.length - invalidIds.length} / {items.length}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          className="px-3 py-2 rounded border"
          onClick={saveOrder}
          disabled={isPending || items.length === 0}
        >
          Save Order
        </button>
        <button
          className="px-3 py-2 rounded bg-black text-white disabled:opacity-50"
          onClick={publish}
          disabled={isPending || !canPublish}
        >
          Publish
        </button>
        <button
          className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={generateScript}
          disabled={isPending || status !== 'published'}
        >
          Generate Script JSON
        </button>
        <button
          className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
          onClick={renderVideo}
          disabled={isPending || !videoJobDbId}
        >
          Render MP4
        </button>
      </div>

      {notice && <div className="border rounded p-3 bg-gray-50 text-sm">{notice}</div>}
      {script && (
        <pre className="border rounded p-3 bg-black text-green-300 text-xs overflow-auto">
          {JSON.stringify(script, null, 2)}
        </pre>
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

      <div className="overflow-auto border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-2">Order</th>
              <th className="text-left p-2">QID</th>
              <th className="text-left p-2">Type</th>
              <th className="text-left p-2">Question</th>
              <th className="text-left p-2">Choices</th>
              <th className="text-left p-2">Correct</th>
              <th className="text-left p-2">Ready</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-500">
                  No items
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.question_id} className="border-b align-top">
                  <td className="p-2">{index + 1}</td>
                  <td className="p-2">{item.question_id}</td>
                  <td className="p-2">{item.type ?? '-'}</td>
                  <td className="p-2">{item.stem ?? '-'}</td>
                  <td className="p-2">{item.choicesCount}</td>
                  <td className="p-2">{item.correctCount}</td>
                  <td className="p-2">{item.videoReady ? 'OK' : 'INVALID'}</td>
                  <td className="p-2">
                    <div className="flex gap-1">
                      <button
                        className="px-2 py-1 border rounded"
                        onClick={() => move(item.question_id, -1)}
                        disabled={index === 0 || isPending}
                      >
                        Up
                      </button>
                      <button
                        className="px-2 py-1 border rounded"
                        onClick={() => move(item.question_id, 1)}
                        disabled={index === items.length - 1 || isPending}
                      >
                        Down
                      </button>
                      <button
                        className="px-2 py-1 border rounded"
                        onClick={() => remove(item.question_id)}
                        disabled={isPending}
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
