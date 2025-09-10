// quiz/components/QuestionComplete.tsx
'use client';

import React from 'react';
import styles from '@/app/components/page/ResultQuizPage.module.css';

interface Props {
    correctAnswers: number;
    totalQuestions: number;
    totalTime: number;
    bonusScore?: number;
    onRetryQuiz?: () => void;
    onSelectDifferentQuiz?: () => void;
    onGoToDashboard?: () => void;
}

export default function QuizCompletion({
    correctAnswers,
    totalQuestions,
    totalTime,
    bonusScore = 0,
    onRetryQuiz,
    onSelectDifferentQuiz,
    onGoToDashboard,
}: Props) {
    const score = correctAnswers + bonusScore;
    const percentage = Math.round((correctAnswers / Math.max(totalQuestions, 1)) * 100);
    const wrongAnswers = Math.max(totalQuestions - correctAnswers, 0);

    const avgTimePerQuestion = totalQuestions > 0
        ? Math.round(totalTime / totalQuestions)
        : 0;

    const formatTime = (seconds: number): string => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // 성과에 따른 메시지와 아이콘 결정
    const getPerformanceData = (percentage: number) => {
        if (percentage >= 90) return {
            level: 'excellent',
            icon: '🏆',
            title: '완벽해요!',
            message: '정말 대단한 실력이에요!',
            color: '#FFD700'
        };
        if (percentage >= 80) return {
            level: 'good',
            icon: '🎉',
            title: '잘했어요!',
            message: '훌륭한 성과입니다!',
            color: '#4CAF50'
        };
        if (percentage >= 60) return {
            level: 'average',
            icon: '👍',
            title: '좋아요!',
            message: '괜찮은 결과네요!',
            color: '#2196F3'
        };
        if (percentage >= 40) return {
            level: 'poor',
            icon: '💪',
            title: '조금 더!',
            message: '다음엔 더 잘할 수 있어요!',
            color: '#FF9800'
        };
        return {
            level: 'bad',
            icon: '📚',
            title: '다시 도전!',
            message: '연습하면 늘어요!',
            color: '#f44336'
        };
    };

    const performance = getPerformanceData(percentage);

    const handleRetryQuiz = () => onRetryQuiz?.();
    const handleSelectDifferentQuiz = () => onSelectDifferentQuiz?.();
    const handleGoToDashboard = () => onGoToDashboard?.();

    return (
        <div className="page-background">
            <div className="container">
                {/* Celebration Section */}
                <div className={styles.celebrationSection}>
                    <div className={`${styles.celebrationIcon} ${styles[performance.level]}`}>
                        {performance.icon}
                    </div>
                    <div className={styles.celebrationText}>
                        <h1 className={styles.resultTitle}>{performance.title}</h1>
                        <p className={styles.resultSubtitle}>{performance.message}</p>
                    </div>
                </div>

                {/* Main Score Card */}
                <div className={styles.scoreCard}>
                    <div className={styles.scoreCircle}>
                        <div className={styles.scorePercentage}>
                            {percentage}<span className={styles.percentSymbol}>%</span>
                        </div>
                        <div className={styles.scoreDescription}>정확도</div>
                    </div>

                    <div className={styles.scoreDetails}>
                        <div className={styles.scoreRow}>
                            <span className={styles.scoreLabel}>맞춘 문제</span>
                            <span className={`${styles.scoreValue} ${styles.correct}`}>
                                {correctAnswers}/{totalQuestions}
                            </span>
                        </div>
                        <div className={styles.scoreRow}>
                            <span className={styles.scoreLabel}>획득 점수</span>
                            <span className={styles.scoreValue}>{score.toLocaleString()}점</span>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className={styles.statsContainer}>
                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>⏱️</div>
                        <div className={styles.statValue}>{formatTime(totalTime)}</div>
                        <div className={styles.statLabel}>총 시간</div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>⚡</div>
                        <div className={styles.statValue}>{avgTimePerQuestion}초</div>
                        <div className={styles.statLabel}>평균 시간</div>
                    </div>

                    <div className={styles.statCard}>
                        <div className={styles.statIcon}>❌</div>
                        <div className={styles.statValue}>{wrongAnswers}개</div>
                        <div className={styles.statLabel}>오답</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={styles.actionButtons}>
                    <button
                        className={`${styles.actionButton} ${styles.primary}`}
                        onClick={handleRetryQuiz}
                    >
                        <span className={styles.buttonIcon}>🔄</span>
                        다시 도전하기
                    </button>

                    <button
                        className={`${styles.actionButton} ${styles.secondary}`}
                        onClick={handleSelectDifferentQuiz}
                    >
                        <span className={styles.buttonIcon}>🎯</span>
                        다른 퀴즈 선택
                    </button>

                    <button
                        className={`${styles.actionButton} ${styles.tertiary}`}
                        onClick={handleGoToDashboard}
                    >
                        <span className={styles.buttonIcon}>🏠</span>
                        대시보드로 가기
                    </button>
                </div>

                {/* Motivational Footer */}
                <div className={styles.motivationalFooter}>
                    {percentage >= 80 ? (
                        <p>🌟 계속해서 이런 멋진 성과를 내세요!</p>
                    ) : (
                        <p>💡 연습하면 더 좋은 결과를 얻을 수 있어요!</p>
                    )}
                </div>
            </div>
        </div>
    );
}