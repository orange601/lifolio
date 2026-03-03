Audio asset guide for video rendering

Place optional BGM files:
- `public/audio/bgm-focus.mp3`
- `public/audio/bgm-bright.mp3`
- `public/audio/bgm-tension.mp3`

Place optional SFX files:
- `public/audio/sfx/question-intro.wav`
- `public/audio/sfx/option-tick.wav`
- `public/audio/sfx/answer-reveal.wav`

Supported extensions: `.wav`, `.mp3`, `.m4a`

Notes:
- If files are missing, renderer falls back to synthesized tones.
- Recommended sample rate: `44100Hz`.
- Keep peak level below `-1dBFS`.
- For consistent loudness, target around `-16 LUFS` for voice-first short-form videos.

