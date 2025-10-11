// ProgressQuestionNumberPage.tsx
import React from 'react';
import styles from './ProgressQuestionNumberPage.module.css';

interface Props {
    currentQuestion: number;
    totalQuestions: number;
}

export default function ProgressQuestionNumberPage({ currentQuestion, totalQuestions }: Props) {
    return (
        <div className={styles.headerCenter}>
            <div className={styles.progressInfo}>
                <span className={styles.currentQuestion}>{currentQuestion}</span>
                <span className={styles.separator}>/</span>
                <span className={styles.totalQuestions}>{totalQuestions}</span>
            </div>
            {/* <div className={styles.progressLabel}>문제</div> */}
        </div>
    );
}