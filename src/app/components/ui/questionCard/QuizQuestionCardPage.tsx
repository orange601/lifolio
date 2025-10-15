// QuizQuestionCard.tsx
import React from 'react';
import styles from './QuizQuestionCard.module.css';

interface QuizQuestion {
    question: string;
    options: string[];
}

interface Props {
    currentQuestionNum: number;
    currentQuestion: QuizQuestion;
    selectedAnswer: number | null;
    onOptionClick: (index: number) => void;
}

export default function QuizQuestionCard({
    currentQuestionNum,
    currentQuestion,
    selectedAnswer,
    onOptionClick
}: Props) {
    const getOptionLetter = (index: number): string => {
        return String.fromCharCode(65 + index); // A, B, C, D...
    };

    return (
        <div className={styles.quizContainer}>
            <div className={styles.questionCard}>
                <div className={styles.questionNumber}>Question {currentQuestionNum}</div>
                <div className={styles.questionText}>{currentQuestion.question}</div>

                <div className={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <div
                            key={index}
                            className={`${styles.option} ${selectedAnswer === index ? styles.selected : ''}`}
                            onClick={() => onOptionClick(index)}
                        >
                            <div className={styles.optionLetter}>{getOptionLetter(index)}</div>
                            <div className={styles.optionText}>{option}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}