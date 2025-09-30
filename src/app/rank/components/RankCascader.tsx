'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './RankCascader.module.css';
import type { WeeklyRankItem as BaseWeeklyRankItem } from '@/app/rank/components/Rank.type';

type WeeklyRankItem = BaseWeeklyRankItem & { username?: string | null };

export default function ImprovedRankPage({ ranking }: { ranking: WeeklyRankItem[] }) {
    const [rankingData, setRankingData] = useState<WeeklyRankItem[]>(ranking ?? []);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setRankingData(ranking ?? []);
    }, [ranking]);

    const getInitials = (username?: string | null, fallbackId?: string): string => {
        const u = (username ?? '').trim();
        if (u.length > 0) return u[0].toUpperCase();
        const fid = (fallbackId ?? '').trim();
        return fid ? fid.slice(-2).toUpperCase() : '?';
    };

    const formatAvgTime = (ms: number): string => {
        if (!Number.isFinite(ms) || ms <= 0) return '0ms';
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}초`;
    };

    const loadRankingData = async () => {
        setLoading(true);
        try {
            // 실제 API 호출
            setRankingData(ranking ?? []);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <Link href="/" className={styles.backBtn}>←</Link>
                    <h1>🏆 주간 랭킹</h1>
                    <div className={styles.placeholder}></div>
                </div>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>순위를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    // 상위 3명과 나머지 분리
    const topThree = rankingData.slice(0, 3);
    const restOfRanking = rankingData.slice(3);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <Link href="/" className={styles.backBtn}>←</Link>
                <h1>🏆 주간 랭킹</h1>
                <button className={styles.refreshBtn} onClick={loadRankingData}>
                    🔄
                </button>
            </div>

            {rankingData.length === 0 ? (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🕳️</div>
                    <p className={styles.emptyText}>이번 주 순위가 아직 없습니다.</p>
                </div>
            ) : (
                <>
                    {/* 탑 3 포디움 */}
                    {topThree.length > 0 && (
                        <div className={styles.podium}>
                            <div className={styles.podiumContainer}>
                                {/* 2등 */}
                                {topThree[1] && (
                                    <div className={`${styles.podiumItem} ${styles.second}`}>
                                        <div className={styles.podiumAvatar}>
                                            <div className={styles.crown}>🥈</div>
                                            {getInitials(topThree[1].username, topThree[1].user_id)}
                                        </div>
                                        <div className={styles.podiumName}>
                                            {topThree[1].username ?? '익명'}
                                        </div>
                                        <div className={styles.podiumScore}>{topThree[1].score}</div>
                                        <div className={styles.podiumBase}>2</div>
                                    </div>
                                )}

                                {/* 1등 */}
                                {topThree[0] && (
                                    <div className={`${styles.podiumItem} ${styles.first}`}>
                                        <div className={styles.podiumAvatar}>
                                            <div className={styles.crown}>👑</div>
                                            {getInitials(topThree[0].username, topThree[0].user_id)}
                                        </div>
                                        <div className={styles.podiumName}>
                                            {topThree[0].username ?? '익명'}
                                        </div>
                                        <div className={styles.podiumScore}>{topThree[0].score}</div>
                                        <div className={styles.podiumBase}>1</div>
                                    </div>
                                )}

                                {/* 3등 */}
                                {topThree[2] && (
                                    <div className={`${styles.podiumItem} ${styles.third}`}>
                                        <div className={styles.podiumAvatar}>
                                            <div className={styles.crown}>🥉</div>
                                            {getInitials(topThree[2].username, topThree[2].user_id)}
                                        </div>
                                        <div className={styles.podiumName}>
                                            {topThree[2].username ?? '익명'}
                                        </div>
                                        <div className={styles.podiumScore}>{topThree[2].score}</div>
                                        <div className={styles.podiumBase}>3</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 나머지 순위 */}
                    {restOfRanking.length > 0 && (
                        <div className={styles.rankingList}>
                            {restOfRanking.map((user) => (
                                <div key={user.attempt_id} className={styles.rankingItem}>
                                    <div className={styles.rankNumber}>{user.rank}</div>
                                    <div className={styles.userAvatar}>
                                        {getInitials(user.username, user.user_id)}
                                    </div>
                                    <div className={styles.userInfo}>
                                        <div className={styles.userName}>
                                            {user.username ?? '익명'}
                                        </div>
                                        <div className={styles.userStats}>
                                            <span>정확도 {user.accuracy_pct}%</span>
                                            <span>평균 {formatAvgTime(user.avg_ms_per_q)}</span>
                                        </div>
                                    </div>
                                    <div className={styles.userScore}>
                                        <div className={styles.scoreValue}>{user.score}</div>
                                        <div className={styles.scoreLabel}>점수</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}