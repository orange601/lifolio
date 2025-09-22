// /app/question/answer/components/AnswerCascader.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuizResultStore } from '@/app/store/review/quizResultStore';
import styles from './AnswerCascader.module.css';
import ToDashboardButton from '@/app/components/ui/backButton/ToDashboardButton';

export default function AnswerCascader() {
    const router = useRouter();
    const { questions, answers, totalTimeUsed, resetAll } = useQuizResultStore();

    const totalQuestions = questions.length;

    // 정답 계산
    const correctCount = answers.reduce((acc, ans) => {
        const q = questions[ans.questionIndex];
        if (!q) return acc;
        const correctIndex = (q.correctOrderNo ?? 1) - 1; // 1-based → 0-based
        return acc + (ans.selectedIndex === correctIndex ? 1 : 0);
    }, 0);

    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleGoToDashboard = () => {
        resetAll();
        router.push('/');
    };

    const handleReview = () => {
        // 리뷰 상세 페이지(추후 구현)로 이동만
        router.push('/question/review');
    };

    const handleRetry = () => {
        // 필요시 재도전 플로우로 이동 (임시로 홈)
        resetAll();
        router.push('/');
    };

    if (totalQuestions === 0) {
        return (
            <div className="page-background">
                <div className="container">
                    <div className={styles.noDataMessage}>
                        <h2>결과를 찾을 수 없습니다</h2>
                        <button onClick={handleGoToDashboard} className={styles.primaryButton}>
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
                {/* 상단 진행바 */}
                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar} style={{ width: '100%' }} />
                </div>

                {/* 결과 요약 */}
                <div className={styles.resultContainer}>
                    <div className={styles.resultHeader}>
                        <div className={`${styles.resultIcon} ${correctCount >= totalQuestions * 0.7 ? styles.correct : styles.incorrect}`}>
                            {correctCount >= totalQuestions * 0.7 ? '🎉' : '📚'}
                        </div>
                        <div className={styles.resultTitle}>퀴즈 완료!</div>
                        <div className={styles.resultSubtitle}>
                            {totalQuestions}문제 중 {correctCount}문제 정답
                        </div>
                    </div>

                    {/* 통계 */}
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

                    {/* 액션 버튼들 */}
                    <div className={styles.actionButtons}>
                        <button onClick={handleReview} className={styles.primaryButton}>
                            리뷰 보러가기
                        </button>
                        <button onClick={handleRetry} className={styles.secondaryButton}>
                            다시 풀기
                        </button>
                        <ToDashboardButton
                            onClick={handleGoToDashboard}
                        >
                            대시보드로
                        </ToDashboardButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
