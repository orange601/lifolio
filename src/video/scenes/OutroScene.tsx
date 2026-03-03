import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { motionTokens } from '../theme/motion';
import { fadeInOut } from '../utils/motion';

type Props = {
  totalQuestions: number;
};

export function OutroScene({ totalQuestions }: Props) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const opacity = fadeInOut(frame, durationInFrames);
  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
    durationInFrames: motionTokens.enterFrames + 8,
  });

  return (
    <section
      data-scene="outro"
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
          transform: `translateY(${interpolate(enter, [0, 1], [16, 0])}px)`,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 82, lineHeight: 1.05 }}>Completed</h2>
        <p style={{ marginTop: 20, fontSize: 44, lineHeight: 1.25 }}>
          Total questions: {totalQuestions}
        </p>
      </div>
    </section>
  );
}
