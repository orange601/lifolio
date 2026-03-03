import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

function isUnderBase(base: string, target: string): boolean {
  const normalizedBase = path.resolve(base);
  const normalizedTarget = path.resolve(target);
  return normalizedTarget.startsWith(normalizedBase + path.sep) || normalizedTarget === normalizedBase;
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.mp4') return 'video/mp4';
  if (ext === '.mp3') return 'audio/mpeg';
  if (ext === '.wav') return 'audio/wav';
  if (ext === '.m4a') return 'audio/mp4';
  if (ext === '.ogg') return 'audio/ogg';
  return 'application/octet-stream';
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const relativePath = url.searchParams.get('path');

    if (!relativePath) {
      return NextResponse.json(
        { ok: false, code: 'PATH_REQUIRED', message: 'path query is required.' },
        { status: 400 },
      );
    }

    const baseDir = path.join(process.cwd(), 'output', 'videos');
    const normalizedInput = relativePath.replace(/[\\/]+/g, path.sep);
    const targetPath = path.resolve(process.cwd(), normalizedInput);

    if (!isUnderBase(baseDir, targetPath)) {
      return NextResponse.json(
        { ok: false, code: 'INVALID_PATH', message: 'Invalid file path.' },
        { status: 400 },
      );
    }

    const data = await readFile(targetPath);
    return new NextResponse(data, {
      status: 200,
      headers: {
        'content-type': getContentType(targetPath),
        'cache-control': 'no-store',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read file.';
    return NextResponse.json(
      { ok: false, code: 'FILE_READ_FAILED', message },
      { status: 404 },
    );
  }
}
