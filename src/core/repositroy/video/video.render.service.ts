import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { prisma } from '@/lib/db/prisma';
import type { VideoScene, VideoScript } from './video.script.type';

type VideoJobWithScript = {
  id: bigint | number;
  quiz_set_id: bigint | number;
  status: string;
  output_path: string | null;
  script_path: string | null;
};

type AudioQcResult = {
  status: 'pass' | 'warn' | 'fail';
  measured: {
    meanVolumeDb: number | null;
    maxVolumeDb: number | null;
    silenceRatio: number | null;
  };
  thresholds: {
    meanVolumeWarnDb: number;
    meanVolumeFailDb: number;
    maxVolumeWarnDb: number;
    maxVolumeFailDb: number;
    silenceWarnRatio: number;
    silenceFailRatio: number;
  };
  reasons: string[];
  recommendations: {
    narrationVolume: number;
    bgmVolume: number;
    sfxVolume: number;
  };
  analyzedAt: string;
};

function ffmpegFilterPath(inputPath: string): string {
  return inputPath.replace(/\\/g, '/').replace(':', '\\:');
}

function ffmpegConcatPath(inputPath: string): string {
  return inputPath.replace(/\\/g, '/').replace(/'/g, "'\\''");
}

function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function mapRatePctToSapiRate(ratePct: number): number {
  const normalized = (ratePct - 100) / 10;
  return clampInt(normalized, -5, 5, 0);
}

function runCommand(command: string, args: string[], options?: { shell?: boolean }) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: options?.shell ?? false,
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr || `${command} failed with code ${code}`));
      }
    });
  });
}

function runCommandCapture(command: string, args: string[], options?: { shell?: boolean }) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: options?.shell ?? false,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(stderr || `${command} failed with code ${code}`));
      }
    });
  });
}

function buildSceneText(scene: VideoScene): string {
  if (scene.type === 'question') {
    const options = scene.choices.map((choice, index) => `${index + 1}. ${choice}`);
    return [`Question ${scene.questionId}`, scene.text, ...options].join('\n');
  }
  return [
    `Answer ${scene.questionId}`,
    `Correct: ${scene.correctIndex + 1}. ${scene.correctChoice}`,
    scene.explanation ? `Explanation: ${scene.explanation}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function buildNarrationText(scene: VideoScene): string {
  if (scene.type === 'question') {
    return scene.text;
  }
  const explanation = scene.explanation?.trim() ? ` ${scene.explanation}` : '';
  return `정답은 ${scene.correctChoice} 입니다.${explanation}`;
}

async function getVideoJob(videoJobId: number): Promise<VideoJobWithScript | null> {
  const rows = (await prisma.$queryRawUnsafe(
    `
      SELECT
        vj.id,
        vj.quiz_set_id,
        vj.status,
        vj.output_path,
        (
          SELECT vjf.file_path
          FROM quiz.video_job_file vjf
          WHERE vjf.video_job_id = vj.id
            AND vjf.kind = 'script_json'
          ORDER BY vjf.id DESC
          LIMIT 1
        ) AS script_path
      FROM quiz.video_job vj
      WHERE vj.id = $1::bigint
      LIMIT 1
    `,
    videoJobId,
  )) as VideoJobWithScript[];
  return rows[0] ?? null;
}

async function updateStatus(videoJobId: number, status: string, outputPath?: string | null) {
  await prisma.$executeRawUnsafe(
    `
      UPDATE quiz.video_job
      SET status = $2::text,
          output_path = COALESCE($3::text, output_path),
          updated_at = NOW()
      WHERE id = $1::bigint
    `,
    videoJobId,
    status,
    outputPath ?? null,
  );
}

async function updateAudioQcStatus(videoJobId: number, qcStatus: 'pass' | 'warn' | 'fail') {
  await prisma.$executeRawUnsafe(
    `
      UPDATE quiz.video_job
      SET audio_qc_status = $2::text,
          updated_at = NOW()
      WHERE id = $1::bigint
    `,
    videoJobId,
    qcStatus,
  );
}

async function insertArtifact(videoJobId: number, kind: string, filePath: string) {
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO quiz.video_job_file (video_job_id, kind, file_path, created_at)
      VALUES ($1::bigint, $2::text, $3::text, NOW())
    `,
    videoJobId,
    kind,
    filePath,
  );
}

async function renderWithFfmpeg(videoJobId: number, scriptPath: string, silentVideoPath: string) {
  const script = JSON.parse(await readFile(scriptPath, 'utf-8')) as VideoScript;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const tmpDir = path.join(process.cwd(), 'output', 'videos', 'tmp', `job-${videoJobId}-${timestamp}`);
  await mkdir(tmpDir, { recursive: true });

  const fontPath = ffmpegFilterPath(path.join(process.env.WINDIR ?? 'C:\\Windows', 'Fonts', 'malgun.ttf'));
  const segments: string[] = [];

  for (let i = 0; i < script.scenes.length; i += 1) {
    const scene = script.scenes[i];
    const textFile = path.join(tmpDir, `scene-${i + 1}.txt`);
    const segment = path.join(tmpDir, `scene-${i + 1}.mp4`);
    await writeFile(textFile, buildSceneText(scene), 'utf-8');
    const vf = [
      `drawtext=fontfile='${fontPath}'`,
      `textfile='${ffmpegFilterPath(textFile)}'`,
      'fontcolor=white',
      'fontsize=42',
      'line_spacing=10',
      'x=(w-text_w)/2',
      'y=(h-text_h)/2',
      'box=1',
      'boxcolor=black@0.45',
      'boxborderw=24',
    ].join(':');
    const bg = scene.type === 'question' ? '#1f2937' : '#14532d';
    await runCommand('ffmpeg', [
      '-y',
      '-f',
      'lavfi',
      '-i',
      `color=c=${bg}:s=1280x720:d=${scene.durationSec}`,
      '-vf',
      vf,
      '-r',
      '30',
      '-c:v',
      'libx264',
      '-pix_fmt',
      'yuv420p',
      segment,
    ]);
    segments.push(segment);
  }

  const concatFile = path.join(tmpDir, 'concat.txt');
  await writeFile(concatFile, segments.map((s) => `file '${ffmpegConcatPath(s)}'`).join('\n'), 'utf-8');
  await runCommand('ffmpeg', [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    concatFile,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    silentVideoPath,
  ]);
}

async function renderWithRemotion(scriptPath: string, silentVideoPath: string) {
  await runCommand(
    'node',
    [
      'scripts/video/render-remotion.mjs',
      `--script=${scriptPath}`,
      `--out=${silentVideoPath}`,
    ],
    { shell: true },
  );
  await access(silentVideoPath);
}

function getRenderEngine(): 'ffmpeg' | 'remotion' {
  const v = String(process.env.VIDEO_RENDER_ENGINE ?? 'ffmpeg').toLowerCase();
  return v === 'remotion' ? 'remotion' : 'ffmpeg';
}

async function ttsWithWindowsSapi(text: string, outputWavPath: string, ratePct = 100) {
  const tmpDir = path.dirname(outputWavPath);
  const scriptFile = path.join(tmpDir, `tts-${Date.now()}-${Math.random().toString(36).slice(2)}.ps1`);
  const textFile = path.join(tmpDir, `tts-${Date.now()}-${Math.random().toString(36).slice(2)}.txt`);
  await writeFile(textFile, text, 'utf-8');
  const ps = [
    '$ErrorActionPreference = "Stop"',
    'Add-Type -AssemblyName System.Speech',
    '$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer',
    `$synth.Rate = ${mapRatePctToSapiRate(ratePct)}`,
    '$synth.Volume = 100',
    '$text = Get-Content -LiteralPath $args[0] -Raw -Encoding UTF8',
    '$synth.SetOutputToWaveFile($args[1])',
    '$synth.Speak($text)',
    '$synth.Dispose()',
  ].join('; ');
  await writeFile(scriptFile, ps, 'utf-8');
  await runCommand('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptFile, textFile, outputWavPath], { shell: true });
}

function extractMediaPathFromOpenClawOutput(stdout: string): string | null {
  const mediaRegex = /^MEDIA:\s*(.+)\s*$/m;
  const direct = stdout.match(mediaRegex);
  if (direct?.[1]) return direct[1].trim();

  try {
    const parsed = JSON.parse(stdout) as {
      result?: { payloads?: Array<{ text?: string | null }> };
    };
    const joined = (parsed.result?.payloads ?? [])
      .map((p) => p.text ?? '')
      .join('\n');
    const m = joined.match(mediaRegex);
    if (m?.[1]) return m[1].trim();
  } catch {
    // ignore parse error
  }

  return null;
}

async function ttsWithOpenClaw(
  text: string,
  outputWavPath: string,
  options?: { tone?: string; ratePct?: number },
) {
  const agent = (process.env.OPENCLAW_AGENT ?? 'main').trim() || 'main';
  const timeoutSecRaw = Number(process.env.OPENCLAW_TIMEOUT_SEC ?? 60);
  const timeoutSec = Number.isFinite(timeoutSecRaw)
    ? Math.max(10, Math.min(180, Math.floor(timeoutSecRaw)))
    : 60;
  const tone = (options?.tone ?? 'calm').trim() || 'calm';
  const ratePct = clampInt(Number(options?.ratePct ?? 100), 70, 140, 100);
  const prompt = `[TTS_REQUEST]
text=${text}
tone=${tone}
rate_pct=${ratePct}
target=telegram`;

  const { stdout } = await runCommandCapture(
    'openclaw',
    [
      'agent',
      '--agent',
      agent,
      '--message',
      prompt,
      '--json',
      '--timeout',
      String(timeoutSec),
    ],
    { shell: true },
  );

  const mediaPath = extractMediaPathFromOpenClawOutput(stdout);
  if (!mediaPath) {
    throw new Error('OpenClaw response did not include MEDIA path.');
  }

  await access(mediaPath);
  await runCommand('ffmpeg', [
    '-y',
    '-i',
    mediaPath,
    '-ar',
    '44100',
    '-ac',
    '2',
    outputWavPath,
  ]);
}

async function ttsWithProvider(
  text: string,
  outputWavPath: string,
  options?: { tone?: string; ratePct?: number },
) {
  const provider = String(process.env.TTS_PROVIDER ?? 'local').toLowerCase();
  if (provider === 'openclaw') {
    try {
      await ttsWithOpenClaw(text, outputWavPath, options);
      return;
    } catch {
      await ttsWithWindowsSapi(text, outputWavPath, options?.ratePct ?? 100);
      return;
    }
  }
  await ttsWithWindowsSapi(text, outputWavPath, options?.ratePct ?? 100);
}

async function ttsWithProviderForScript(
  script: VideoScript,
  text: string,
  outputWavPath: string,
  options?: { tone?: string; ratePct?: number },
) {
  const requested = String(script.audio?.ttsProvider ?? '').toLowerCase().trim();
  const envProvider = String(process.env.TTS_PROVIDER ?? 'local').toLowerCase().trim();
  const provider = requested || envProvider || 'local';

  if (provider === 'openclaw') {
    try {
      await ttsWithOpenClaw(text, outputWavPath, options);
      return;
    } catch {
      await ttsWithWindowsSapi(text, outputWavPath, options?.ratePct ?? 100);
      return;
    }
  }

  await ttsWithProvider(text, outputWavPath, options);
}

function getSceneSpeechControls(script: VideoScript, scene: VideoScene) {
  const tone = String(script.audio?.voiceTone ?? 'calm').trim() || 'calm';
  const ratePct =
    scene.type === 'question'
      ? clampInt(Number(script.audio?.questionRatePct ?? 100), 70, 140, 100)
      : clampInt(Number(script.audio?.answerRatePct ?? 100), 70, 140, 100);
  const pauseMs =
    scene.type === 'question'
      ? clampInt(Number(script.audio?.questionPauseMs ?? 300), 0, 2000, 300)
      : clampInt(Number(script.audio?.answerPauseMs ?? 350), 0, 2000, 350);
  return { tone, ratePct, pauseMs };
}

async function buildNarrationTrack(
  videoJobId: number,
  script: VideoScript,
  tmpDir: string,
): Promise<string | null> {
  if (script.audio?.narrationEnabled === false) return null;
  const segmentPaths: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < script.scenes.length; i += 1) {
    const scene = script.scenes[i];
    const narration = buildNarrationText(scene);
    if (!narration.trim()) continue;
    const controls = getSceneSpeechControls(script, scene);
    const narrationWithPause =
      controls.pauseMs > 0 ? `${narration} ${'.'.repeat(Math.max(1, Math.floor(controls.pauseMs / 300)))}` : narration;

    const rawTts = path.join(tmpDir, `tts-raw-${i + 1}.wav`);
    const segWav = path.join(tmpDir, `tts-seg-${i + 1}.wav`);

    try {
      await ttsWithProviderForScript(script, narrationWithPause, rawTts, {
        tone: controls.tone,
        ratePct: controls.ratePct,
      });
      await runCommand('ffmpeg', [
        '-y',
        '-i',
        rawTts,
        '-af',
        'apad',
        '-t',
        String(scene.durationSec),
        '-ar',
        '44100',
        '-ac',
        '2',
        segWav,
      ]);
      segmentPaths.push(segWav);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown tts error';
      errors.push(`scene ${i + 1}: ${message}`);
    }
  }

  if (segmentPaths.length === 0) {
    if (script.audio?.narrationEnabled === false) return null;
    throw new Error(
      `TTS narration generation failed for all scenes. ${errors.slice(0, 2).join(' | ')}`,
    );
  }

  const concatFile = path.join(tmpDir, `tts-concat-${videoJobId}.txt`);
  await writeFile(concatFile, segmentPaths.map((s) => `file '${ffmpegConcatPath(s)}'`).join('\n'), 'utf-8');

  const narrationWav = path.join(tmpDir, `narration-${videoJobId}.wav`);
  await runCommand('ffmpeg', [
    '-y',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    concatFile,
    '-ar',
    '44100',
    '-ac',
    '2',
    narrationWav,
  ]);

  const narrationMaster = path.join(tmpDir, `narration-master-${videoJobId}.wav`);
  await runCommand('ffmpeg', [
    '-y',
    '-i',
    narrationWav,
    '-af',
    'highpass=f=100,dynaudnorm=f=150:g=11,volume=1.25',
    '-ar',
    '44100',
    '-ac',
    '2',
    narrationMaster,
  ]);
  return narrationMaster;
}

async function buildBgmTrack(
  totalDurationSec: number,
  tmpDir: string,
  videoJobId: number,
  preset: string,
  bgmVolume: number,
) {
  const bgmWav = path.join(tmpDir, `bgm-${videoJobId}.wav`);
  const presetLower = (preset || 'focus').toLowerCase();
  const candidateExt = ['mp3', 'wav', 'm4a'];
  let presetFile: string | null = null;
  for (const ext of candidateExt) {
    const c = path.join(process.cwd(), 'public', 'audio', `bgm-${presetLower}.${ext}`);
    try {
      await access(c);
      presetFile = c;
      break;
    } catch {
      // ignore
    }
  }

  if (presetFile) {
    await runCommand('ffmpeg', [
      '-y',
      '-stream_loop',
      '-1',
      '-i',
      presetFile,
      '-t',
      String(totalDurationSec),
        '-af',
        `volume=${Math.max(0, Math.min(1, bgmVolume))}`,
        '-ar',
        '44100',
        '-ac',
      '2',
      bgmWav,
    ]);
    return bgmWav;
  }

  const freq = presetLower === 'bright' ? 330 : presetLower === 'tension' ? 150 : 220;
  const volBase = presetLower === 'bright' ? 0.05 : presetLower === 'tension' ? 0.045 : 0.06;
  const vol = volBase * Math.max(0, Math.min(1, bgmVolume));
  await runCommand('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `sine=frequency=${freq}:sample_rate=44100:duration=${totalDurationSec}`,
    '-af',
    `volume=${vol}`,
    '-ar',
    '44100',
    '-ac',
    '2',
    bgmWav,
  ]);
  return bgmWav;
}

type SfxCue = {
  kind: 'question_intro' | 'option_tick' | 'answer_reveal';
  delayMs: number;
  durationSec: number;
  freq: number;
  volume: number;
};

type SfxLibrary = {
  question_intro: string | null;
  option_tick: string | null;
  answer_reveal: string | null;
};

async function findAudioFile(baseDir: string, baseName: string): Promise<string | null> {
  for (const ext of ['wav', 'mp3', 'm4a']) {
    const fullPath = path.join(baseDir, `${baseName}.${ext}`);
    try {
      await access(fullPath);
      return fullPath;
    } catch {
      // continue
    }
  }
  return null;
}

async function loadSfxLibrary(): Promise<SfxLibrary> {
  const sfxDir = path.join(process.cwd(), 'public', 'audio', 'sfx');

  const questionIntro =
    (await findAudioFile(sfxDir, 'question-intro')) ??
    (await findAudioFile(sfxDir, 'q-intro'));
  const optionTick =
    (await findAudioFile(sfxDir, 'option-tick')) ??
    (await findAudioFile(sfxDir, 'tick'));
  const answerReveal =
    (await findAudioFile(sfxDir, 'answer-reveal')) ??
    (await findAudioFile(sfxDir, 'correct'));

  return {
    question_intro: questionIntro,
    option_tick: optionTick,
    answer_reveal: answerReveal,
  };
}

function buildSfxCues(script: VideoScript): SfxCue[] {
  if (script.audio?.sfxEnabled === false) return [];
  const cues: SfxCue[] = [];
  let cursorSec = 0;

  for (const scene of script.scenes) {
    if (scene.type === 'question') {
      cues.push({
        kind: 'question_intro',
        delayMs: Math.max(0, Math.round((cursorSec + 0.05) * 1000)),
        durationSec: 0.09,
        freq: 900,
        volume: 0.35,
      });
      for (let i = 0; i < 4; i += 1) {
        const delay = cursorSec + 0.8 + i * 0.25;
        if (delay < cursorSec + scene.durationSec - 0.2) {
          cues.push({
            kind: 'option_tick',
            delayMs: Math.round(delay * 1000),
            durationSec: 0.06,
            freq: 700 + i * 40,
            volume: 0.25,
          });
        }
      }
    } else {
      cues.push({
        kind: 'answer_reveal',
        delayMs: Math.max(0, Math.round((cursorSec + 0.1) * 1000)),
        durationSec: 0.18,
        freq: 1100,
        volume: 0.45,
      });
    }
    cursorSec += scene.durationSec;
  }

  return cues.slice(0, 80);
}

async function buildSfxTrack(
  script: VideoScript,
  totalDurationSec: number,
  tmpDir: string,
  videoJobId: number,
  sfxVolume: number,
): Promise<string | null> {
  const cues = buildSfxCues(script);
  if (cues.length === 0) return null;
  const sfxLibrary = await loadSfxLibrary();

  const outPath = path.join(tmpDir, `sfx-${videoJobId}.wav`);
  const args: string[] = ['-y'];
  args.push('-f', 'lavfi', '-i', `anullsrc=r=44100:cl=stereo:d=${totalDurationSec}`);
  for (const cue of cues) {
    const samplePath = sfxLibrary[cue.kind];
    if (samplePath) {
      args.push('-i', samplePath);
    } else {
      args.push(
        '-f',
        'lavfi',
        '-i',
        `sine=frequency=${cue.freq}:sample_rate=44100:duration=${cue.durationSec}`,
      );
    }
  }

  const filterParts: string[] = [];
  filterParts.push('[0:a]volume=0.0[b0]');
  for (let i = 0; i < cues.length; i += 1) {
    const inIdx = i + 1;
    const cue = cues[i];
    const cueVol = Math.max(0, Math.min(1, cue.volume * Math.max(0, Math.min(1, sfxVolume))));
    filterParts.push(
      `[${inIdx}:a]atrim=0:${cue.durationSec.toFixed(3)},asetpts=PTS-STARTPTS,volume=${cueVol},adelay=${cue.delayMs}|${cue.delayMs}[c${inIdx}]`,
    );
  }
  const mixInputs = ['[b0]', ...cues.map((_, i) => `[c${i + 1}]`)].join('');
  filterParts.push(`${mixInputs}amix=inputs=${cues.length + 1}:normalize=0[sfx]`);

  args.push(
    '-filter_complex',
    filterParts.join(';'),
    '-map',
    '[sfx]',
    '-ar',
    '44100',
    '-ac',
    '2',
    outPath,
  );
  await runCommand('ffmpeg', args);
  return outPath;
}

async function buildMixedAudioTrack(
  videoJobId: number,
  script: VideoScript,
  tmpDir: string,
): Promise<string | null> {
  const totalDurationSec = Math.max(1, Number(script.totalDurationSec || 1));
  const narrationVolume = Math.max(0, Math.min(1, Number(script.audio?.narrationVolume ?? 1)));
  const bgmVolume = Math.max(0, Math.min(1, Number(script.audio?.bgmVolume ?? 0.08)));
  const sfxVolume = Math.max(0, Math.min(1, Number(script.audio?.sfxVolume ?? 1)));
  const narration = await buildNarrationTrack(videoJobId, script, tmpDir);
  const bgm = await buildBgmTrack(
    totalDurationSec,
    tmpDir,
    videoJobId,
    script.audio?.bgmPreset ?? 'focus',
    bgmVolume,
  );
  const sfx = await buildSfxTrack(script, totalDurationSec, tmpDir, videoJobId, sfxVolume);
  const mixed = path.join(tmpDir, `audio-mix-${videoJobId}.wav`);
  const nVol = Number.isFinite(narrationVolume) ? narrationVolume : 1;

  if (narration && sfx) {
    await runCommand('ffmpeg', [
      '-y',
      '-i',
      narration,
      '-i',
      bgm,
      '-i',
      sfx,
      '-filter_complex',
      `[0:a]volume=${nVol}[n];[1:a][n]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=350[duck];[n][duck][2:a]amix=inputs=3:weights='1 0.9 0.9':normalize=0[mix]`,
      '-map',
      '[mix]',
      '-ar',
      '44100',
      '-ac',
      '2',
      mixed,
    ]);
  } else if (narration) {
    await runCommand('ffmpeg', [
      '-y',
      '-i',
      narration,
      '-i',
      bgm,
      '-filter_complex',
      `[0:a]volume=${nVol}[n];[1:a][n]sidechaincompress=threshold=0.02:ratio=8:attack=20:release=350[duck];[n][duck]amix=inputs=2:weights='1 0.9':normalize=0[mix]`,
      '-map',
      '[mix]',
      '-ar',
      '44100',
      '-ac',
      '2',
      mixed,
    ]);
  } else if (sfx) {
    await runCommand('ffmpeg', [
      '-y',
      '-i',
      bgm,
      '-i',
      sfx,
      '-filter_complex',
      "[0:a][1:a]amix=inputs=2:weights='1 1':normalize=0[mix]",
      '-map',
      '[mix]',
      '-ar',
      '44100',
      '-ac',
      '2',
      mixed,
    ]);
  } else {
    await runCommand('ffmpeg', [
      '-y',
      '-i',
      bgm,
      '-ar',
      '44100',
      '-ac',
      '2',
      mixed,
    ]);
  }

  return applyMasteringTrack(videoJobId, script, tmpDir, mixed);
}

function buildMasteringFilter(presetRaw: string, targetLufsRaw: number): string {
  const preset = (presetRaw || 'voice_focus').toLowerCase();
  const targetLufs = Math.max(-24, Math.min(-10, Number(targetLufsRaw)));

  if (preset === 'impact') {
    return [
      'highpass=f=45',
      'acompressor=threshold=-20dB:ratio=3.4:attack=6:release=130:makeup=3',
      `loudnorm=I=${targetLufs}:TP=-1.3:LRA=9`,
      'alimiter=limit=0.96',
    ].join(',');
  }
  if (preset === 'balanced') {
    return [
      'highpass=f=50',
      'acompressor=threshold=-19dB:ratio=2.6:attack=8:release=160:makeup=2',
      `loudnorm=I=${targetLufs}:TP=-1.5:LRA=10`,
      'alimiter=limit=0.95',
    ].join(',');
  }
  return [
    'highpass=f=55',
    'acompressor=threshold=-18dB:ratio=2.4:attack=10:release=190:makeup=2',
    `loudnorm=I=${targetLufs}:TP=-1.8:LRA=7`,
    'alimiter=limit=0.94',
  ].join(',');
}

async function applyMasteringTrack(
  videoJobId: number,
  script: VideoScript,
  tmpDir: string,
  mixedPath: string,
): Promise<string> {
  const masterPath = path.join(tmpDir, `audio-master-${videoJobId}.wav`);
  const filter = buildMasteringFilter(
    String(script.audio?.masteringPreset ?? 'voice_focus'),
    Number(script.audio?.targetLufs ?? -16),
  );

  await runCommand('ffmpeg', [
    '-y',
    '-i',
    mixedPath,
    '-af',
    filter,
    '-ar',
    '44100',
    '-ac',
    '2',
    masterPath,
  ]);

  return masterPath;
}

async function muxVideoAndAudio(silentVideoPath: string, audioPath: string, outputPath: string) {
  await runCommand('ffmpeg', [
    '-y',
    '-i',
    silentVideoPath,
    '-i',
    audioPath,
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-shortest',
    outputPath,
  ]);
}

function parseNumberFromFfmpegLog(log: string, key: 'mean_volume' | 'max_volume'): number | null {
  const m = log.match(new RegExp(`${key}:\\s*(-?[0-9]+(?:\\.[0-9]+)?)\\s*dB`));
  if (!m) return null;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : null;
}

function parseSilenceRatioFromLog(log: string, totalDurationSec: number): number | null {
  const starts: number[] = [];
  const ends: number[] = [];

  const startRegex = /silence_start:\s*([0-9]+(?:\.[0-9]+)?)/g;
  const endRegex = /silence_end:\s*([0-9]+(?:\.[0-9]+)?)/g;

  let match: RegExpExecArray | null;
  while ((match = startRegex.exec(log)) !== null) {
    const n = Number(match[1]);
    if (Number.isFinite(n)) starts.push(n);
  }
  while ((match = endRegex.exec(log)) !== null) {
    const n = Number(match[1]);
    if (Number.isFinite(n)) ends.push(n);
  }

  if (starts.length === 0 && ends.length === 0) return 0;
  const safeTotal = Math.max(0.001, totalDurationSec);
  let silenceSec = 0;
  for (let i = 0; i < starts.length; i += 1) {
    const s = starts[i];
    const e = i < ends.length ? ends[i] : safeTotal;
    if (e > s) silenceSec += e - s;
  }
  return Math.max(0, Math.min(1, silenceSec / safeTotal));
}

async function analyzeAudioQc(audioPath: string, totalDurationSec: number): Promise<AudioQcResult> {
  const { stderr: volumeLog } = await runCommandCapture(
    'ffmpeg',
    ['-hide_banner', '-i', audioPath, '-af', 'volumedetect', '-f', 'null', 'NUL'],
    { shell: true },
  );
  const { stderr: silenceLog } = await runCommandCapture(
    'ffmpeg',
    ['-hide_banner', '-i', audioPath, '-af', 'silencedetect=noise=-42dB:d=0.35', '-f', 'null', 'NUL'],
    { shell: true },
  );

  const meanVolumeDb = parseNumberFromFfmpegLog(volumeLog, 'mean_volume');
  const maxVolumeDb = parseNumberFromFfmpegLog(volumeLog, 'max_volume');
  const silenceRatio = parseSilenceRatioFromLog(silenceLog, totalDurationSec);

  const thresholds = {
    meanVolumeWarnDb: -24,
    meanVolumeFailDb: -30,
    maxVolumeWarnDb: -6,
    maxVolumeFailDb: -10,
    silenceWarnRatio: 0.35,
    silenceFailRatio: 0.55,
  };

  const reasons: string[] = [];
  const recommendations = {
    narrationVolume: 1,
    bgmVolume: 0.08,
    sfxVolume: 1,
  };
  let status: 'pass' | 'warn' | 'fail' = 'pass';

  if (meanVolumeDb == null || maxVolumeDb == null || silenceRatio == null) {
    status = 'warn';
    reasons.push('incomplete_metrics');
  } else {
    if (meanVolumeDb < thresholds.meanVolumeFailDb) {
      status = 'fail';
      reasons.push('mean_volume_too_low');
      recommendations.narrationVolume = 1;
      recommendations.bgmVolume = 0.03;
      recommendations.sfxVolume = 0.7;
    } else if (meanVolumeDb < thresholds.meanVolumeWarnDb) {
      if (status !== 'fail') status = 'warn';
      reasons.push('mean_volume_low');
      recommendations.narrationVolume = 1;
      recommendations.bgmVolume = 0.05;
      recommendations.sfxVolume = 0.85;
    }

    if (maxVolumeDb < thresholds.maxVolumeFailDb) {
      status = 'fail';
      reasons.push('peak_too_low');
    } else if (maxVolumeDb < thresholds.maxVolumeWarnDb) {
      if (status !== 'fail') status = 'warn';
      reasons.push('peak_low');
    }

    if (silenceRatio > thresholds.silenceFailRatio) {
      status = 'fail';
      reasons.push('too_much_silence');
      recommendations.narrationVolume = 1;
      recommendations.bgmVolume = 0.02;
      recommendations.sfxVolume = 0.5;
    } else if (silenceRatio > thresholds.silenceWarnRatio) {
      if (status !== 'fail') status = 'warn';
      reasons.push('silence_high');
    }
  }

  return {
    status,
    measured: {
      meanVolumeDb,
      maxVolumeDb,
      silenceRatio,
    },
    thresholds,
    reasons,
    recommendations,
    analyzedAt: new Date().toISOString(),
  };
}

function qcScore(status: 'pass' | 'warn' | 'fail'): number {
  if (status === 'pass') return 3;
  if (status === 'warn') return 2;
  return 1;
}

export async function enqueueVideoRender(videoJobId: number) {
  const job = await getVideoJob(videoJobId);
  if (!job) return { ok: false as const, message: 'Video job not found.' };
  if (!job.script_path) return { ok: false as const, message: 'Script artifact not found.' };
  if (job.status === 'running') return { ok: false as const, message: 'Job already running.' };
  await updateStatus(videoJobId, 'pending');
  return { ok: true as const };
}

export async function processOneVideoRenderJob(targetVideoJobId?: number) {
  const rows = (await prisma.$queryRawUnsafe(
    `
      SELECT id
      FROM quiz.video_job
      WHERE ($1::bigint IS NULL OR id = $1::bigint)
        AND status = 'pending'
      ORDER BY id ASC
      LIMIT 1
    `,
    targetVideoJobId ?? null,
  )) as Array<{ id: bigint | number }>;

  if (rows.length === 0) return { ok: false as const, message: 'No pending job.' };
  const videoJobId = Number(rows[0].id);
  const job = await getVideoJob(videoJobId);
  if (!job || !job.script_path) return { ok: false as const, message: 'Invalid job data.' };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(process.cwd(), 'output', 'videos');
  const tmpDir = path.join(outDir, 'tmp', `job-${videoJobId}-${timestamp}`);
  const outputName = `${timestamp}-video-job-${videoJobId}.mp4`;
  const outputPath = path.join(outDir, outputName);
  const silentVideoPath = path.join(tmpDir, `video-silent-${videoJobId}.mp4`);
  await mkdir(outDir, { recursive: true });
  await mkdir(tmpDir, { recursive: true });

  try {
    await updateStatus(videoJobId, 'running');
    const script = JSON.parse(await readFile(job.script_path, 'utf-8')) as VideoScript;

    const engine = getRenderEngine();
    if (engine === 'remotion') {
      await renderWithRemotion(job.script_path, silentVideoPath);
    } else {
      await renderWithFfmpeg(videoJobId, job.script_path, silentVideoPath);
    }

    const audioMixPath = await buildMixedAudioTrack(videoJobId, script, tmpDir);
    let qcResult: AudioQcResult | null = null;
    if (audioMixPath) {
      await insertArtifact(videoJobId, 'audio_mix_wav', audioMixPath);
      qcResult = await analyzeAudioQc(audioMixPath, Number(script.totalDurationSec || 0));
      let selectedMixPath = audioMixPath;
      let selectedQcResult = qcResult;

      if (qcResult.status !== 'pass') {
        const adjustedScript: VideoScript = {
          ...script,
          audio: {
            ...(script.audio ?? {}),
            narrationVolume: Math.max(
              Number(script.audio?.narrationVolume ?? 1),
              qcResult.recommendations.narrationVolume,
            ),
            bgmVolume: Math.min(
              Number(script.audio?.bgmVolume ?? 0.08),
              qcResult.recommendations.bgmVolume,
            ),
            sfxVolume: Math.min(
              Number(script.audio?.sfxVolume ?? 1),
              qcResult.recommendations.sfxVolume,
            ),
          },
        };
        const retryMixPath = await buildMixedAudioTrack(videoJobId, adjustedScript, tmpDir);
        if (retryMixPath) {
          const retryQc = await analyzeAudioQc(retryMixPath, Number(script.totalDurationSec || 0));
          if (qcScore(retryQc.status) >= qcScore(qcResult.status)) {
            selectedMixPath = retryMixPath;
            selectedQcResult = retryQc;
          }
        }
      }

      const qcDir = path.join(process.cwd(), 'output', 'video-qc');
      await mkdir(qcDir, { recursive: true });
      const qcPath = path.join(qcDir, `${timestamp}-video-job-${videoJobId}-audio-qc.json`);
      await writeFile(
        qcPath,
        `${JSON.stringify({ selected: selectedQcResult, initial: qcResult }, null, 2)}\n`,
        'utf-8',
      );
      await insertArtifact(videoJobId, 'audio_qc_json', qcPath);
      await updateAudioQcStatus(videoJobId, selectedQcResult.status);
      await muxVideoAndAudio(silentVideoPath, selectedMixPath, outputPath);
      await insertArtifact(videoJobId, 'video_with_audio_mp4', outputPath);
    } else {
      await writeFile(outputPath, await readFile(silentVideoPath));
      await updateAudioQcStatus(videoJobId, 'fail');
    }

    await updateStatus(videoJobId, 'done', outputPath);
    await insertArtifact(videoJobId, 'video_mp4', outputPath);

    return { ok: true as const, videoJobId, outputPath, engine };
  } catch (error) {
    await updateStatus(videoJobId, 'failed');
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : 'Render failed.',
    };
  }
}

