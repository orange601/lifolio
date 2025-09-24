'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './RankCascader.module.css';
import type { WeeklyRankItem as BaseWeeklyRankItem } from '@/app/rank/components/Rank.type';

// 이 컴포넌트 안에서만 username(Optional) 확장
type WeeklyRankItem = BaseWeeklyRankItem & { username?: string | null };

export default function RankPage({ ranking }: { ranking: WeeklyRankItem[] }) {
    // 프롭 변화에 동기화 (별도 로딩 없이 바로 반영)
    const [rankingData, setRankingData] = useState<WeeklyRankItem[]>(ranking ?? []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setRankingData(ranking ?? []);
    }, [ranking]);

    const getInitials = (username?: string | null, fallbackId?: string): string => {
        const u = (username ?? '').trim();
        if (u.length > 0) return u[0].toUpperCase();
        // username 없으면 user_id 뒤 2~4자리로 대체(가독용)
        const fid = (fallbackId ?? '').trim();
        return fid ? fid.slice(-2).toUpperCase() : '?';
    };

    const formatTime = (ms: number): string => {
        if (!Number.isFinite(ms) || ms <= 0) return '0:00';
        const totalSec = Math.floor(ms / 1000);
        const m = Math.floor(totalSec / 60);
        const s = totalSec % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const formatAvgTime = (ms: number): string => {
        if (!Number.isFinite(ms) || ms <= 0) return '0ms';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}초`;
    };

    // 필요 시 API로 새로고침 (지금은 프롭만 다시 반영)
    const loadRankingData = async () => {
        setLoading(true);
        try {
            // 실제 사용 시:
            // const res = await fetch('/api/leaderboard/weekly?mode=rank_5s');
            // const data: WeeklyRankItem[] = await res.json();
            // setRankingData(data);

            // 데모: 프롭 재적용
            setRankingData(ranking ?? []);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page-background">
                <div className="container">
                    <div className={styles.header}>
                        <Link href="/" className={styles.backButton} aria-label="홈으로 돌아가기">
                            ←
                        </Link>
                        <h1>🏆 주간 순위</h1>
                        <div className={styles.placeholder}></div>
                    </div>
                    <div className={styles.loadingContainer} aria-busy="true">
                        <div className={styles.loadingSpinner}></div>
                        <p>순위를 불러오는 중...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-background">
            <div className="container">
                <div className={styles.header}>
                    <Link href="/" className={styles.backButton} aria-label="홈으로 돌아가기">
                        ←
                    </Link>
                    <h1>🏆 주간 순위</h1>
                    <button
                        className={styles.refreshButton}
                        onClick={loadRankingData}
                        aria-label="순위 새로고침"
                    >
                        🔄
                    </button>
                </div>

                {/* 빈 상태 */}
                {rankingData.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>🕳️</div>
                        <p>이번 주 순위가 아직 없습니다.</p>
                    </div>
                ) : (
                    <div className={styles.rankingList}>
                        {rankingData.map((user) => (
                            <div
                                key={user.attempt_id} // attempt_id가 유니크
                                className={`${styles.rankingItem} ${user.rank <= 3 ? styles.topThree : ''} ${user.rank === 1 ? styles.rankFirst : ''}`}
                            >
                                <div className={`${styles.rankNumber} ${user.rank === 1 ? styles.crown : ''}`}>
                                    {user.rank}
                                </div>

                                <div className={styles.avatar}>
                                    {getInitials(user.username, user.user_id)}
                                </div>

                                <div className={styles.userInfo}>
                                    <div className={styles.userName}>{user.username ?? '익명'}</div>
                                    <div className={styles.userStats}>
                                        <span>정확도 {user.accuracy_pct}%</span>
                                        <span>•</span>
                                        <span>평균 {formatAvgTime(user.avg_ms_per_q)}</span>
                                    </div>
                                    <div className={styles.weeklyStats}>
                                        <span>주간 {user.weekly_question_cnt}문제</span>
                                        <span>•</span>
                                        <span>{user.weekly_attempt_cnt}회 시도</span>
                                    </div>
                                </div>

                                <div className={styles.scoreInfo}>
                                    <div className={styles.scoreValue}>{user.score}</div>
                                    <div className={styles.scoreLabel}>점수</div>
                                    <div className={styles.totalTime}>{formatTime(user.total_time_ms)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 더보기 (페이지네이션이 필요할 때만 구현) */}
                {/* {rankingData.length > 0 && (
          <button className={styles.loadMoreButton} onClick={...}>
            더 많은 순위 보기
          </button>
        )} */}
            </div>
        </div>
    );
}
