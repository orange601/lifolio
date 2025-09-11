// app/compnents/page/Quiz/QuizContainer.tsx
/**
 * 문제 푸는 화면에서 보기 4개 고르는 container
 */
'use client';

import styles from './QuizContainer.module.css';
import React from 'react';

type QuizContainerProps = {
    questionNumber: number;           // 현재 문제 번호(1-based)
    questionText: string;             // 문제 텍스트
    options: string[];                // 보기 목록
    selectedIndex: number | null;     // 선택된 보기 인덱스 (없으면 null)
    onSelect: (index: number) => void; // 보기 선택 핸들러
};

// A, B, C, D 
function getOptionLetter(index: number) {
    return String.fromCharCode(65 + index); // 0->A, 1->B ...
}

export default function QuizContainer({
    questionNumber,
    questionText,
    options,
    selectedIndex,
    onSelect,
}: QuizContainerProps) {
    return (
        <div className={styles.quizContainer}>
            <div className={styles.questionCard}>
                <div className={styles.questionNumber}>Question {questionNumber}</div>
                <div className={styles.questionText}>{questionText}</div>

                <div className={styles.optionsContainer}>
                    {options.map((option, index) => (
                        <div
                            key={index}
                            className={`${styles.option} ${selectedIndex === index ? styles.selected : ''}`}
                            onClick={() => onSelect(index)}
                        >
                            <div className={styles.optionLetter}>{getOptionLetter(index)}</div>
                            <div className={styles.optionText}>{option}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
