import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import type { VideoScript } from '../../core/repositroy/video/video.script.type';
import { IntroScene } from '../scenes/IntroScene';
import { QuestionScene } from '../scenes/QuestionScene';
import { AnswerScene } from '../scenes/AnswerScene';
import { OutroScene } from '../scenes/OutroScene';

type Props = {
  script: VideoScript;
};

export function QuizVideo({ script }: Props) {
  const introFrames = 45;
  const outroFrames = 45;
  let cursor = introFrames;

  return (
    <AbsoluteFill style={{ background: '#0b1220', color: '#fff' }}>
      <Sequence from={0} durationInFrames={introFrames}>
        <IntroScene title={script.quizSet.title} />
      </Sequence>

      {script.scenes.map((scene) => {
        const durationInFrames = Math.max(1, Math.round(scene.durationSec * 30));
        const from = cursor;
        cursor += durationInFrames;
        return (
          <Sequence key={`scene-${scene.sceneNo}`} from={from} durationInFrames={durationInFrames}>
            {scene.type === 'question' ? (
              <QuestionScene
                questionId={scene.questionId}
                text={scene.text}
                choices={scene.choices}
              />
            ) : (
              <AnswerScene
                questionId={scene.questionId}
                correctIndex={scene.correctIndex}
                correctChoice={scene.correctChoice}
                explanation={scene.explanation}
              />
            )}
          </Sequence>
        );
      })}

      <Sequence from={cursor} durationInFrames={outroFrames}>
        <OutroScene totalQuestions={script.totalQuestions} />
      </Sequence>
    </AbsoluteFill>
  );
}
