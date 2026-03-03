import React from 'react';

type Props = {
  index: number;
  text: string;
};

export function OptionCard({ index, text }: Props) {
  return (
    <div
      style={{
        width: '100%',
        boxSizing: 'border-box',
        border: '1px solid rgba(255,255,255,0.24)',
        borderRadius: 20,
        padding: '20px 24px',
        background: 'rgba(255,255,255,0.12)',
        fontSize: 44,
        lineHeight: 1.2,
        boxShadow: '0 10px 28px rgba(0,0,0,0.25)',
      }}
    >
      <strong style={{ marginRight: 6 }}>{index + 1}.</strong> {text}
    </div>
  );
}
