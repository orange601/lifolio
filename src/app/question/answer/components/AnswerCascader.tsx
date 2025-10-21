'use client';

import React from 'react';
import styles from './AnswerCascader.module.css';
import { useRouter } from 'next/navigation';
import ToDashboardButton from '@/app/components/ui/backButton/ToDashboardButton';

type Attempt = {
    id: number;
    user_id: string;
    mode: string;
    question_cnt: number;
    score: number;
    total_time_ms: number; // ms
    created_at: string;
};

type Props = { attempt: Attempt };

export default function AnswerCascader({ attempt }: Props) {
    const router = useRouter();
    const attemptId = attempt.id;
    const { question_cnt, score, total_time_ms, id } = attempt;
    const accuracy = question_cnt ? Math.round((score / question_cnt) * 100) : 0;

    const formatTime = (ms: number) => {
        const sec = Math.floor(ms / 1000);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleReview = () => router.push(`/question/review?attemptId=${attemptId}`);
    const handleRetry = () => router.push('/');

    return (
        <div className="page-background">
            <div className="container">
                {/* 상단 진행바 */}
                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar} style={{ width: '100%' }} />
                </div>

                {/* 결과 요약 (DB 값 표시) */}
                <div className={styles.resultContainer}>
                    <div className={styles.resultHeader}>
                        <div className={`${styles.resultIcon} ${score >= question_cnt * 0.7 ? styles.correct : styles.incorrect}`}>
                            {score >= question_cnt * 0.7 ? '🎉' : '📚'}
                        </div>
                        <div className={styles.resultTitle}>퀴즈 완료!</div>
                        <div className={styles.resultSubtitle}>
                            {question_cnt}문제 중 {score}문제 정답
                            <span style={{ marginLeft: 8, fontSize: 12, opacity: .7 }}> (ID: {id})</span>
                        </div>
                    </div>

                    {/* 통계 */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>{score}</div>
                            <div className={styles.statLabel}>정답</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>{accuracy}%</div>
                            <div className={styles.statLabel}>정답률</div>
                        </div>
                        <div className={styles.statCard}>
                            <div className={styles.statNumber}>{formatTime(total_time_ms)}</div>
                            <div className={styles.statLabel}>소요시간</div>
                        </div>
                    </div>

                    {/* 액션 */}
                    <div className={styles.actionButtons}>
                        <button onClick={handleReview} className={styles.primaryButton}>리뷰 보러가기</button>
                        <button onClick={handleRetry} className={styles.secondaryButton}>다시 풀기</button>
                        <ToDashboardButton
                            onClick={() => router.push('/')}>
                            대시보드로
                        </ToDashboardButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
