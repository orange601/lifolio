// ProgressBar.tsx
import React from 'react';
import styles from './ProgressBar.module.css';

interface Props {
    current: number;
    total: number;
}

export default function ProgressBar({ current, total }: Props) {
    const progressPercentage = (current / total) * 100;

    return (
        <div className={styles.progressBarContainer}>
            <div
                className={styles.progressBar}
                style={{ width: `${progressPercentage}%` }}
            />
        </div>
    );
}