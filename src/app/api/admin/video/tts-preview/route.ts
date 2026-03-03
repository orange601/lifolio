import { NextResponse } from 'next/server';
import { access, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

type Body = {
  text?: string;
  ttsProvider?: string;
  voiceTone?: string;
  ratePct?: number;
};

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
      if (code === 0) resolve();
      else reject(new Error(stderr || `${command} failed with code ${code}`));
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
      if (code === 0) resolve({ stdout, stderr });
      else reject(new Error(stderr || `${command} failed with code ${code}`));
    });
  });
}

function clampInt(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(value)));
}

function mapRatePctToSapiRate(ratePct: number): number {
  const normalized = (ratePct - 100) / 10;
  return clampInt(normalized, -5, 5, 0);
}

function extractMediaPath(stdout: string): string | null {
  const m1 = stdout.match(/^MEDIA:\s*(.+)\s*$/m);
  if (m1?.[1]) return m1[1].trim();
  try {
    const json = JSON.parse(stdout) as { result?: { payloads?: Array<{ text?: string }> } };
    const joined = (json.result?.payloads ?? []).map((p) => p.text ?? '').join('\n');
    const m2 = joined.match(/^MEDIA:\s*(.+)\s*$/m);
    if (m2?.[1]) return m2[1].trim();
  } catch {
    // ignore
  }
  return null;
}

async function ttsLocal(text: string, outWav: string, ratePct: number) {
  const rate = mapRatePctToSapiRate(ratePct);
  const script = [
    '$ErrorActionPreference = "Stop"',
    'Add-Type -AssemblyName System.Speech',
    '$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer',
    `$synth.Rate = ${rate}`,
    '$synth.Volume = 100',
    '$synth.SetOutputToWaveFile($args[1])',
    '$synth.Speak($args[0])',
    '$synth.Dispose()',
  ].join('; ');
  await runCommand('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script, text, outWav], {
    shell: true,
  });
}

async function ttsOpenClaw(text: string, outWav: string, tone: string, ratePct: number) {
  const agent = (process.env.OPENCLAW_AGENT ?? 'main').trim() || 'main';
  const prompt = `[TTS_REQUEST]
text=${text}
tone=${tone}
rate_pct=${clampInt(ratePct, 70, 140, 100)}
target=telegram`;
  const { stdout } = await runCommandCapture(
    'openclaw',
    ['agent', '--agent', agent, '--message', prompt, '--json', '--timeout', '60'],
    { shell: true },
  );
  const mediaPath = extractMediaPath(stdout);
  if (!mediaPath) throw new Error('MEDIA path not found from OpenClaw.');
  await access(mediaPath);
  await runCommand('ffmpeg', ['-y', '-i', mediaPath, '-ar', '44100', '-ac', '2', outWav], {
    shell: true,
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const text = (body.text ?? '').trim();
    if (!text) {
      return NextResponse.json(
        { ok: false, code: 'TEXT_REQUIRED', message: 'text is required.' },
        { status: 400 },
      );
    }

    const provider = String(body.ttsProvider ?? process.env.TTS_PROVIDER ?? 'local')
      .toLowerCase()
      .trim();
    const tone = String(body.voiceTone ?? 'calm').trim() || 'calm';
    const ratePct = clampInt(Number(body.ratePct ?? 100), 70, 140, 100);

    const outDir = path.join(process.cwd(), 'output', 'videos', 'previews');
    await mkdir(outDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const wavPath = path.join(outDir, `tts-preview-${stamp}.wav`);
    const mp3Path = path.join(outDir, `tts-preview-${stamp}.mp3`);

    if (provider === 'openclaw') {
      try {
        await ttsOpenClaw(text, wavPath, tone, ratePct);
      } catch {
        await ttsLocal(text, wavPath, ratePct);
      }
    } else {
      await ttsLocal(text, wavPath, ratePct);
    }

    await runCommand('ffmpeg', ['-y', '-i', wavPath, '-c:a', 'libmp3lame', '-b:a', '160k', mp3Path], {
      shell: true,
    });

    return NextResponse.json(
      {
        ok: true,
        relativePath: path.relative(process.cwd(), mp3Path).replace(/\\/g, '/'),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'TTS preview failed.',
      },
      { status: 500 },
    );
  }
}

