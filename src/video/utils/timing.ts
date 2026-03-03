export function secToFrames(sec: number, fps = 30): number {
  return Math.max(0, Math.round(sec * fps));
}

export function framesToSec(frames: number, fps = 30): number {
  if (fps <= 0) return 0;
  return Math.max(0, frames / fps);
}

