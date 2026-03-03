#!/usr/bin/env node
/*
  Usage:
  node scripts/video/render-remotion.mjs --script=output/video-scripts/foo.json --out=output/videos/foo.mp4
*/

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : '';
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: true });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} failed with code ${code}`));
    });
  });
}

const scriptPathArg = getArg('script');
const outPathArg = getArg('out');

if (!scriptPathArg || !outPathArg) {
  console.error('Missing args. Expected --script=... --out=...');
  process.exit(1);
}

const scriptPath = path.resolve(process.cwd(), scriptPathArg);
const outPath = path.resolve(process.cwd(), outPathArg);

const raw = await readFile(scriptPath, 'utf-8');
const script = JSON.parse(raw);
if (!script?.scenes?.length) {
  console.error('Invalid script: scenes missing.');
  process.exit(1);
}

const sceneSec = Array.isArray(script?.scenes)
  ? script.scenes.reduce((acc, scene) => acc + Number(scene.durationSec ?? 0), 0)
  : Number(script.totalDurationSec ?? 0);
const introOutroSec = 3;
const frames = Math.max(1, Math.round((sceneSec + introOutroSec) * 30));
const tmpDir = path.join(process.cwd(), 'output', 'videos', 'tmp');
const propsPath = path.join(
  tmpDir,
  `remotion-props-${Date.now()}-${Math.random().toString(36).slice(2)}.json`,
);
await mkdir(tmpDir, { recursive: true });
await writeFile(propsPath, JSON.stringify({ script }, null, 2), 'utf-8');

await run('npm', [
  'exec',
  '--',
  'remotion',
  'render',
  path.join('src', 'video', 'index.ts'),
  'QuizVideo',
  outPath,
  '--props',
  propsPath,
  '--frames',
  `0-${frames - 1}`,
  '--codec',
  'h264',
  '--pixel-format',
  'yuv420p',
]);
