// /app/answer/components/AnswerCascader.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuizResultStore } from '@/app/store/review/quizResultStore';
import styles from './AnswerCascader.module.css';
import ToDashboardButton from '@/app/components/ui/backButton/ToDashboardButton';
import LoadingComponent from '@/app/components/ui/loading/loading';

export default function AnswerCascaderPage() {
    const router = useRouter();
    const { questions, answers, totalTimeUsed, resetAll } = useQuizResultStore();
    // 로딩
    const [isNavigating, setIsNavigating] = React.useState(false);

    // 로딩 중일 때 LoadingComponent 표시
    if (isNavigating) {
        return <LoadingComponent />;
    }

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
        setIsNavigating(true);
        resetAll();
        router.push('/');
    };

    const handleReview = () => {
        setIsNavigating(true);
        router.push('/review');
    };

    // 다시 풀기
    // const handleRetry = () => {
    //     setIsNavigating(true);
    //     resetAll();
    //     router.push('/');
    // };

    if (totalQuestions === 0) {
        return (
            <div className="page-background">
                <div className="container">
                    <div className={styles.resultCard}>
                        <h2 className={styles.noDataTitle}>결과를 찾을 수 없습니다</h2>
                        <ToDashboardButton onClick={handleGoToDashboard}>
                            홈으로 돌아가기
                        </ToDashboardButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-background">
            <div className="container">
                <div className={styles.resultCard}>
                    {/* 아이콘 */}
                    <div className={styles.resultIcon}>
                        {correctCount >= totalQuestions * 0.7 ? '🎉' : '📚'}
                    </div>

                    {/* 타이틀 */}
                    <h2 className={styles.resultTitle}>퀴즈 완료!</h2>
                    <p className={styles.resultSubtitle}>수고하셨습니다</p>

                    {/* 통계 */}
                    <div className={styles.statsContainer}>
                        <div className={styles.statItem}>
                            <div className={styles.statLabel}>정답률</div>
                            <div className={styles.statValue}>{accuracy}%</div>
                        </div>
                        <div className={styles.statDivider}></div>
                        <div className={styles.statItem}>
                            <div className={styles.statLabel}>정답</div>
                            <div className={styles.statValue}>
                                {correctCount}/{totalQuestions}
                            </div>
                        </div>
                        <div className={styles.statDivider}></div>
                        <div className={styles.statItem}>
                            <div className={styles.statLabel}>시간</div>
                            <div className={styles.statValue}>{formatTime(totalTimeUsed)}</div>
                        </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className={styles.actionButtons}>
                        <ToDashboardButton onClick={handleReview} icon="📝">
                            리뷰 보기
                        </ToDashboardButton>
                        {/* <ToDashboardButton onClick={handleRetry} icon="🔄">
                            다시 풀기
                        </ToDashboardButton> */}
                        <ToDashboardButton
                            onClick={handleGoToDashboard}
                            icon="🏠"
                        >
                            홈으로
                        </ToDashboardButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
