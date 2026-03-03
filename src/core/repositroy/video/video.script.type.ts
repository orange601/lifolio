export type VideoScriptQuizSet = {
  id: number;
  title: string;
  status: string;
};

export type VideoQuestionItem = {
  order: number;
  questionId: number;
  question: string;
  choices: string[];
  correctIndex: number;
  explanation: string | null;
};

export type VideoScene =
  | {
      sceneNo: number;
      type: 'question';
      durationSec: number;
      questionId: number;
      text: string;
      choices: string[];
    }
  | {
      sceneNo: number;
      type: 'answer';
      durationSec: number;
      questionId: number;
      correctIndex: number;
      correctChoice: string;
      explanation: string | null;
    };

export type VideoScript = {
  version: '1.0';
  generatedAt: string;
  audio?: {
    ttsProvider?: 'local' | 'openclaw' | string;
    voiceTone?: 'calm' | 'bright' | 'serious' | string;
    questionRatePct?: number;
    answerRatePct?: number;
    questionPauseMs?: number;
    answerPauseMs?: number;
    narrationEnabled?: boolean;
    bgmPreset?: 'focus' | 'bright' | 'tension' | string;
    sfxEnabled?: boolean;
    narrationVolume?: number;
    bgmVolume?: number;
    sfxVolume?: number;
    masteringPreset?: 'voice_focus' | 'balanced' | 'impact' | string;
    targetLufs?: number;
  };
  quizSet: VideoScriptQuizSet;
  totalQuestions: number;
  totalDurationSec: number;
  questions: VideoQuestionItem[];
  scenes: VideoScene[];
};
