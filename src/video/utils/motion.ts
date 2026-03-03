import { interpolate } from 'remotion';
import { motionTokens } from '../theme/motion';

export function fadeInOut(frame: number, durationInFrames: number): number {
  const fadeInEnd = motionTokens.enterFrames;
  const fadeOutStart = Math.max(0, durationInFrames - motionTokens.exitFrames);

  if (durationInFrames <= fadeInEnd + motionTokens.exitFrames) {
    return interpolate(frame, [0, durationInFrames], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  if (frame <= fadeInEnd) {
    return interpolate(frame, [0, fadeInEnd], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  if (frame >= fadeOutStart) {
    return interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  return 1;
}
