import type { VideoScript } from '../../core/repositroy/video/video.script.type';

export type VideoScriptValidation = {
  valid: boolean;
  errors: string[];
};

export function validateVideoScript(script: unknown): VideoScriptValidation {
  const errors: string[] = [];
  const s = script as Partial<VideoScript> | null;

  if (!s || typeof s !== 'object') {
    return { valid: false, errors: ['script must be an object'] };
  }
  if (!s.quizSet || typeof s.quizSet.id !== 'number') {
    errors.push('quizSet.id is required');
  }
  if (!Array.isArray(s.scenes) || s.scenes.length === 0) {
    errors.push('scenes must be non-empty');
  }
  if (!Array.isArray(s.questions) || s.questions.length === 0) {
    errors.push('questions must be non-empty');
  }
  return { valid: errors.length === 0, errors };
}
