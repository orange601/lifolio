import React from 'react';
import { Composition } from 'remotion';
import { QuizVideo } from './compositions/QuizVideo';
import type { VideoScript } from '../core/repositroy/video/video.script.type';

const defaultScript: VideoScript = {
  version: '1.0',
  generatedAt: new Date(0).toISOString(),
  quizSet: { id: 0, title: 'Preview', status: 'draft' },
  totalQuestions: 1,
  totalDurationSec: 4,
  questions: [
    {
      order: 1,
      questionId: 1,
      question: 'Sample question',
      choices: ['A', 'B', 'C', 'D'],
      correctIndex: 0,
      explanation: 'Sample explanation',
    },
  ],
  scenes: [
    {
      sceneNo: 1,
      type: 'question',
      durationSec: 2,
      questionId: 1,
      text: 'Sample question',
      choices: ['A', 'B', 'C', 'D'],
    },
    {
      sceneNo: 2,
      type: 'answer',
      durationSec: 2,
      questionId: 1,
      correctIndex: 0,
      correctChoice: 'A',
      explanation: 'Sample explanation',
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="QuizVideo"
      component={QuizVideo}
      width={1920}
      height={1080}
      fps={30}
      durationInFrames={Math.max(1, Math.round(defaultScript.totalDurationSec * 30))}
      calculateMetadata={({ props }) => {
        const input = (props as { script?: VideoScript } | null)?.script;
        const sceneSec = Array.isArray(input?.scenes)
          ? input.scenes.reduce((acc, scene) => acc + Number(scene.durationSec ?? 0), 0)
          : Number(input?.totalDurationSec ?? 0);
        const introOutroSec = 3;
        const durationInFrames = Math.max(30, Math.round((sceneSec + introOutroSec) * 30));
        return {
          durationInFrames,
          fps: 30,
          width: 1920,
          height: 1080,
        };
      }}
      defaultProps={{ script: defaultScript }}
    />
  );
};
