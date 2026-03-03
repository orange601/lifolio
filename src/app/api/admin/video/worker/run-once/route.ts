import { NextResponse } from 'next/server';
import path from 'node:path';
import { processOneVideoRenderJob } from '@/core/repositroy/video/video.render.service';

type RunOnceBody = {
  videoJobId?: number;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<RunOnceBody>;
    const videoJobId =
      body.videoJobId == null ? undefined : Number.isInteger(Number(body.videoJobId)) ? Number(body.videoJobId) : undefined;

    const result = await processOneVideoRenderJob(videoJobId);
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        processed: {
          videoJobId: result.videoJobId,
          outputPath: result.outputPath,
          relativePath: path.relative(process.cwd(), result.outputPath).replace(/\\/g, '/'),
          engine: result.engine,
          status: 'done',
        },
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : 'Internal server error.',
      },
      { status: 500 },
    );
  }
}
