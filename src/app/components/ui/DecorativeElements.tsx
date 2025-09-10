// components/ui/DecorativeElements.tsx
'use client';

import React from 'react';
import styles from './DecorativeElements.module.css';

interface DecorativeElementsProps {
    /** 원의 개수 (기본값: 3) */
    count?: number;
    /** 애니메이션 지속시간 (기본값: 6초) */
    duration?: number;
    /** 원의 투명도 (기본값: 0.1) */
    opacity?: number;
    /** z-index 값 (기본값: -1, 콘텐츠 뒤에 배치) */
    zIndex?: number;
}

export default function DecorativeElements({
    count = 3,
    duration = 6,
    opacity = 0.1,
    zIndex = -1
}: DecorativeElementsProps) {
    return (
        <div
            className={styles.decorativeElements}
            style={{
                '--animation-duration': `${duration}s`,
                '--circle-opacity': opacity,
                '--z-index': zIndex
            } as React.CSSProperties}
        >
            {Array.from({ length: count }, (_, index) => (
                <div
                    key={index}
                    className={styles.circle}
                />
            ))}
        </div>
    );
}