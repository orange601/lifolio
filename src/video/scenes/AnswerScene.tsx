import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { motionTokens } from '../theme/motion';
import { fadeInOut } from '../utils/motion';

type Props = {
  questionId: number;
  correctIndex: number;
  correctChoice: string;
  explanation: string | null;
};

export function AnswerScene({
  questionId,
  correctIndex,
  correctChoice,
  explanation,
}: Props) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const containerOpacity = fadeInOut(frame, durationInFrames);
  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.8 },
    durationInFrames: motionTokens.enterFrames + 8,
  });
  const explanationEnter = spring({
    frame: frame - motionTokens.staggerFrames * 2,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.9 },
    durationInFrames: motionTokens.enterFrames + 12,
  });
  const pulseBase = spring({
    frame: frame - motionTokens.staggerFrames * 3,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.7 },
    durationInFrames: motionTokens.pulseFrames,
  });
  const pulseScale = interpolate(pulseBase, [0, 0.6, 1], [1, 1.05, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });

  return (
    <section
      data-scene="answer"
      style={{
        width: '100%',
        height: '100%',
        padding: 56,
        boxSizing: 'border-box',
        display: 'grid',
        alignContent: 'center',
        justifyItems: 'stretch',
        opacity: containerOpacity,
        background: 'linear-gradient(180deg, rgba(20,83,45,0.55) 0%, rgba(6,78,59,0.2) 100%)',
      }}
    >
      <div style={{ width: '100%', textAlign: 'center' }}>
        <h2
          style={{
            margin: 0,
            fontSize: 56,
            lineHeight: 1.1,
            opacity: enter,
            transform: `translateY(${interpolate(enter, [0, 1], [10, 0])}px)`,
          }}
        >
          Answer #{questionId}
        </h2>
        <p
          style={{
            marginTop: 26,
            fontSize: 72,
            lineHeight: 1.15,
            color: '#86efac',
            opacity: enter,
            transform: `scale(${pulseScale})`,
          }}
        >
          {correctIndex + 1}. {correctChoice}
        </p>
        {explanation ? (
          <p
            style={{
              marginTop: 22,
              fontSize: 42,
              lineHeight: 1.3,
              opacity: interpolate(explanationEnter, [0, 1], [0, 0.95], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
              whiteSpace: 'pre-wrap',
              transform: `translateY(${interpolate(explanationEnter, [0, 1], [12, 0])}px)`,
            }}
          >
            {explanation}
          </p>
        ) : null}
      </div>
    </section>
  );
}
