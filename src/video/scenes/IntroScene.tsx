import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { motionTokens } from '../theme/motion';
import { fadeInOut } from '../utils/motion';

type Props = {
  title: string;
};

export function IntroScene({ title }: Props) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const opacity = fadeInOut(frame, durationInFrames);
  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
    durationInFrames: motionTokens.enterFrames + 6,
  });

  return (
    <section
      data-scene="intro"
      style={{
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: 48,
        textAlign: 'center',
        opacity,
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          transform: `translateY(${interpolate(enter, [0, 1], [16, 0])}px) scale(${interpolate(
            enter,
            [0, 1],
            [0.98, 1],
          )})`,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 92, lineHeight: 1.05, letterSpacing: -1 }}>Quiz</h1>
        <p style={{ marginTop: 22, opacity: 0.95, fontSize: 46, lineHeight: 1.25 }}>{title}</p>
      </div>
    </section>
  );
}
