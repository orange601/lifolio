import React from 'react';
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { OptionCard } from '../components/OptionCard';
import { TimerRing } from '../components/TimerRing';
import { motionTokens } from '../theme/motion';
import { fadeInOut } from '../utils/motion';

type Props = {
  questionId: number;
  text: string;
  choices: string[];
};

export function QuestionScene({ questionId, text, choices }: Props) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const containerOpacity = fadeInOut(frame, durationInFrames);
  const containerTranslateY = interpolate(frame, [0, motionTokens.enterFrames], [28, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  const titleProgress = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 130, mass: 0.7 },
    durationInFrames: motionTokens.enterFrames + 8,
  });
  const questionProgress = spring({
    frame: frame - motionTokens.staggerFrames,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.8 },
    durationInFrames: motionTokens.enterFrames + 12,
  });
  const timerProgress = Math.max(0, Math.min(1, (durationInFrames - frame) / durationInFrames));

  return (
    <section
      data-scene="question"
      style={{
        width: '100%',
        height: '100%',
        padding: 56,
        boxSizing: 'border-box',
        display: 'grid',
        alignContent: 'center',
        justifyItems: 'stretch',
        opacity: containerOpacity,
        transform: `translateY(${containerTranslateY}px)`,
      }}
    >
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2
            style={{
              margin: 0,
              fontSize: 56,
              lineHeight: 1.1,
              opacity: titleProgress,
              transform: `translateY(${interpolate(titleProgress, [0, 1], [12, 0])}px)`,
            }}
          >
            Question #{questionId}
          </h2>
          <TimerRing progress={timerProgress} />
        </div>
        <p
          style={{
            fontSize: 64,
            lineHeight: 1.2,
            marginTop: 30,
            marginBottom: 0,
            opacity: questionProgress,
            transform: `translateY(${interpolate(questionProgress, [0, 1], [14, 0])}px)`,
          }}
        >
          {text}
        </p>
        <div style={{ marginTop: 34, display: 'grid', gap: 16 }}>
          {choices.map((choice, index) => {
            const delayed = frame - motionTokens.staggerFrames * (index + 2);
            const optionProgress = spring({
              frame: delayed,
              fps,
              config: { damping: 20, stiffness: 130, mass: 0.8 },
              durationInFrames: motionTokens.enterFrames + 8,
            });
            return (
              <div
                key={`${questionId}-${index}`}
                style={{
                  opacity: optionProgress,
                  transform: `translateY(${interpolate(optionProgress, [0, 1], [18, 0])}px)`,
                }}
              >
                <OptionCard index={index} text={choice} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
