'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuizResultStore } from '@/app/store/review/quizResultStore';
import styles from '../components/ReviewCascader.module.css';

export default function ReviewCascaderPage() {
    const router = useRouter();
    const { questions, answers, resetAll } = useQuizResultStore();

    const handleRestart = () => {
        resetAll();
        router.push('/question/quick');
    };

    const handleGoHome = () => {
        resetAll();
        router.push('/');
    };

    const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

    if (questions.length === 0) {
        return (
            <div className="page-background">
                <div className="container">
                    <div className={styles.noDataMessage}>
                        <h2>결과를 찾을 수 없습니다</h2>
                        <button onClick={handleGoHome} className={styles.primaryButton}>
                            홈으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-background">
            <div className="container">
                {/* Progress Bar */}
                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar} style={{ width: '100%' }} />
                </div>

                {/* Result Summary */}
                <div className={styles.resultContainer}>

                    {/* Question Review */}
                    <div className={styles.questionReview}>
                        <h3 className={styles.reviewTitle}>문제별 결과</h3>

                        {questions.map((question, questionIndex) => {
                            const userAnswer = answers.find(a => a.questionIndex === questionIndex);
                            const selectedIndex = userAnswer?.selectedIndex;
                            const correctIndex = question.correctOrderNo - 1;
                            const isCorrect = selectedIndex === correctIndex;
                            const isAnswered = selectedIndex !== null && selectedIndex !== undefined;

                            return (
                                <div key={questionIndex} className={styles.questionItem}>
                                    <div className={styles.questionHeader}>
                                        <span className={styles.questionNumber}>Q{questionIndex + 1}</span>
                                        <span className={`${styles.resultBadge} ${isCorrect ? styles.correct : styles.incorrect}`}>
                                            {isCorrect ? '정답' : '오답'}
                                        </span>
                                    </div>

                                    <div className={styles.questionText}>
                                        {question.question}
                                    </div>

                                    <div className={styles.answerComparison}>
                                        {question.options.map((option, optionIndex) => {
                                            let className = styles.answerItem;

                                            // 정답 표시
                                            if (optionIndex === correctIndex) {
                                                className += ` ${styles.correctAnswer}`;
                                            }

                                            // 사용자가 선택한 답 (틀린 경우)
                                            if (optionIndex === selectedIndex && !isCorrect && isAnswered) {
                                                className += ` ${styles.wrongAnswer}`;
                                            }

                                            return (
                                                <div key={optionIndex} className={className}>
                                                    <div className={styles.optionLetter}>
                                                        {getOptionLetter(optionIndex)}
                                                    </div>
                                                    <div className={styles.optionText}>
                                                        {option}
                                                    </div>
                                                    {optionIndex === correctIndex && (
                                                        <span className={styles.answerLabel}>정답</span>
                                                    )}
                                                    {optionIndex === selectedIndex && !isCorrect && isAnswered && (
                                                        <span className={styles.answerLabel}>선택</span>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {!isAnswered && (
                                            <div className={styles.noAnswerMessage}>
                                                시간 초과로 답을 선택하지 못했습니다
                                            </div>
                                        )}
                                    </div>

                                    {question.explanation && (
                                        <div className={styles.explanation}>
                                            <h4>💡 해설</h4>
                                            <p>{question.explanation}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Action Buttons */}
                    <div className={styles.actionButtons}>
                        <button onClick={handleRestart} className={styles.primaryButton}>
                            다시 풀기
                        </button>
                        <button onClick={handleGoHome} className={styles.secondaryButton}>
                            홈으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}