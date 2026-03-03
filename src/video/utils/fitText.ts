type FitTextOptions = {
  maxCharsPerLine: number;
  maxLines: number;
};

export function fitText(text: string, options: FitTextOptions): { ok: boolean; lines: string[] } {
  const normalized = (text ?? '').trim().replace(/\s+/g, ' ');
  if (!normalized) return { ok: false, lines: [] };

  const words = normalized.split(' ');
  const lines: string[] = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= options.maxCharsPerLine) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }

  if (line) lines.push(line);
  return { ok: lines.length <= options.maxLines, lines };
}

