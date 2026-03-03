import React from 'react';

type Props = {
  progress: number;
};

export function TimerRing({ progress }: Props) {
  const pct = Math.max(0, Math.min(1, progress));
  return (
    <div
      aria-label={`timer-${Math.round(pct * 100)}`}
      style={{
        width: 78,
        height: 78,
        borderRadius: '50%',
        border: '4px solid rgba(255,255,255,0.45)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 18,
        fontWeight: 700,
      }}
    >
      {Math.round(pct * 100)}%
    </div>
  );
}
