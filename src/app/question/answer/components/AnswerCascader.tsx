'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuickQuizStore } from '../store/batchStore';
import styles from '../components/AnswerCascader.module.css';

export default function ReviewPage() {
    const router = useRouter();
    const { questions, answers, totalTimeUsed, reset } = useQuickQuizStore();

    // 결과 계산
    const totalQuestions = questions.length;
    const correctCount = answers.filter((answer, index) => {
        if (answer.selectedIndex === null) return false;
        return answer.selectedIndex === (questions[index].correctOrderNo - 1);
    }).length;
    const incorrectCount = totalQuestions - correctCount;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // 시간 포맷팅
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRestart = () => {
        reset();
        router.push('/question/quick');
    };

    const handleGoHome = () => {
        reset();
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
                    <div className={styles.resultHeader}>
                        <div className={`${styles.resultIcon} ${correctCount >= totalQuestions * 0.7 ? styles.correct : styles.incorrect}`}>
                            {correctCount >= totalQuestions * 0.7 ? '🎉' : '📚'}
                        </div>
                        <div className={styles.resultTitle}>
                            퀴즈 완료!
                        </div>
                        <div className={styles.resultSubtitle}>
                            {totalQuestions}문제 중 {correctCount}문제 정답
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>{correctCount}</div>
                            <div className={styles.statLabel}>정답</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>{accuracy}%</div>
                            <div className={styles.statLabel}>정답률</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>{formatTime(totalTimeUsed)}</div>
                            <div className={styles.statLabel}>소요시간</div>
                        </div>
                    </div>

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