'use client';

import { useEffect, useState, useTransition } from 'react';

type VideoJobItem = {
  id: number;
  quizSetId: number;
  status: string;
  audioQcStatus?: string;
  outputPath: string | null;
  audio?: {
    ttsProvider?: string;
    voiceTone?: string;
    questionRatePct?: number;
    answerRatePct?: number;
    questionPauseMs?: number;
    answerPauseMs?: number;
    narrationEnabled?: boolean;
    sfxEnabled?: boolean;
    bgmPreset?: string;
    narrationVolume?: number;
    bgmVolume?: number;
    sfxVolume?: number;
    masteringPreset?: string;
    targetLufs?: number;
  };
  createdAt: string;
  updatedAt: string;
};

export default function VideoJobsPage() {
  const [items, setItems] = useState<VideoJobItem[]>([]);
  const [notice, setNotice] = useState('');
  const [isPending, startTransition] = useTransition();
  const qcSummary = {
    pass: items.filter((item) => item.audioQcStatus === 'pass').length,
    warn: items.filter((item) => item.audioQcStatus === 'warn').length,
    fail: items.filter((item) => item.audioQcStatus === 'fail').length,
    unknown: items.filter((item) => !item.audioQcStatus || item.audioQcStatus === 'unknown').length,
  };

  function runWorkerOnce(videoJobId?: number) {
    setNotice('');
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/video/worker/run-once', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ videoJobId }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          setNotice(data?.message ?? 'Worker run failed.');
          return;
        }
        setNotice(`Processed job=${data?.processed?.videoJobId}`);
        loadJobs();
      } catch {
        setNotice('Request failed while running worker.');
      }
    });
  }

  function loadJobs() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/video/jobs?limit=50');
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          setNotice(data?.message ?? 'Failed to load jobs.');
          return;
        }
        setItems(data.items ?? []);
      } catch {
        setNotice('Request failed while loading jobs.');
      }
    });
  }

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <div className="p-4 max-w-6xl mx-auto space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Video Jobs</h1>
        <div className="flex gap-2">
          <button className="px-3 py-2 border rounded" onClick={() => runWorkerOnce()} disabled={isPending}>
            Run Worker Once
          </button>
          <button className="px-3 py-2 border rounded" onClick={loadJobs} disabled={isPending}>
            Refresh
          </button>
        </div>
      </div>

      {notice && <div className="border rounded p-3 bg-amber-50 text-sm">{notice}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="border rounded p-2 bg-green-50">QC pass: {qcSummary.pass}</div>
        <div className="border rounded p-2 bg-yellow-50">QC warn: {qcSummary.warn}</div>
        <div className="border rounded p-2 bg-red-50">QC fail: {qcSummary.fail}</div>
        <div className="border rounded p-2 bg-gray-50">QC unknown: {qcSummary.unknown}</div>
      </div>

      <div className="overflow-auto border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-2">Job ID</th>
              <th className="text-left p-2">Quiz Set</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Audio QC</th>
              <th className="text-left p-2">Audio</th>
              <th className="text-left p-2">Output</th>
              <th className="text-left p-2">Created</th>
              <th className="text-left p-2">Updated</th>
              <th className="text-left p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {isPending ? (
              <tr>
                <td colSpan={9} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-4 text-center text-gray-500">
                  No jobs
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b align-top">
                  <td className="p-2">{item.id}</td>
                  <td className="p-2">{item.quizSetId}</td>
                  <td className="p-2">{item.status}</td>
                  <td className="p-2">{item.audioQcStatus ?? 'unknown'}</td>
                  <td className="p-2">
                    tts:{item.audio?.ttsProvider ?? 'local'} / n:
                    {item.audio?.narrationEnabled === false ? 'off' : 'on'} / sfx:
                    {item.audio?.sfxEnabled === false ? 'off' : 'on'} / bgm:
                    {item.audio?.bgmPreset ?? 'focus'} / nv:
                    {(item.audio?.narrationVolume ?? 1).toFixed(2)} / bv:
                    {(item.audio?.bgmVolume ?? 0.08).toFixed(2)} / sv:
                    {(item.audio?.sfxVolume ?? 1).toFixed(2)} / m:
                    {item.audio?.masteringPreset ?? 'voice_focus'} / lufs:
                    {Math.round(item.audio?.targetLufs ?? -16)} / tone:
                    {item.audio?.voiceTone ?? 'calm'} / q%:
                    {Math.round(item.audio?.questionRatePct ?? 100)} / a%:
                    {Math.round(item.audio?.answerRatePct ?? 100)}
                  </td>
                  <td className="p-2 break-all">{item.outputPath ?? '-'}</td>
                  <td className="p-2">{item.createdAt}</td>
                  <td className="p-2">{item.updatedAt}</td>
                  <td className="p-2">
                    <button
                      className="px-2 py-1 border rounded text-xs"
                      onClick={() => runWorkerOnce(item.id)}
                      disabled={isPending || item.status === 'running'}
                    >
                      Run
                    </button>
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
