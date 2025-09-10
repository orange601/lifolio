'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './DifficultyCascader.module.css';
import { DifficultyOptions } from '@/app/difficulty/types/difficulty.type';
import ContainerHeaderBackButton from "@/app/components/ui/backButton/HeaderBackButton";

export default function DifficultySelection() {
    const [selectedDifficulty, setSelectedDifficulty] = useState<number | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedCategoryId = searchParams.get('categoryId');

    const selectDifficulty = (level: number) => setSelectedDifficulty(level);

    const startQuiz = () => {
        if (!selectedDifficulty) return;
        router.push(`/quiz?categoryId=${selectedCategoryId}&difficulty=${selectedDifficulty}`);
    };

    const goBack = () => router.push("/category");

    const renderStars = (level: number) => (
        Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={`${styles.star} ${i < level ? styles.filled : ''}`}>★</span>
        ))
    );

    return (
        <div className="page-background">
            <div className="container">
                {/* Header (전역 컨테이너만 유지) */}
                <div className="container-header">
                    <ContainerHeaderBackButton onBack={goBack} />
                    <div className={styles.headerTitle}>난이도 선택</div>
                    <div className={styles.headerSpacer} />
                </div>

                {/* Content */}
                <div className={styles.contentSection}>
                    {/* 난이도 카드 */}
                    <div className={styles.difficultyGrid}>
                        {DifficultyOptions.map((option) => {
                            const levelNum = option.value;
                            const isSelected = selectedDifficulty === levelNum;

                            return (
                                <div
                                    key={levelNum}
                                    className={`${styles.difficultyCard} ${isSelected ? styles.selected : ''}`}
                                    onClick={() => selectDifficulty(levelNum)}
                                >
                                    <div className={styles.selectionIndicator}>{isSelected ? '✓' : ''}</div>

                                    <div className={styles.difficultyHeader}>
                                        {/* level 클래스는 모듈에서 level1..5 로 매칭 */}
                                        <div className={`${styles.difficultyLevel} ${styles[`level${levelNum}`]}`}>
                                            {levelNum}
                                        </div>

                                        <div className={styles.difficultyInfo}>
                                            <h3>
                                                {option.name}
                                                <div className={styles.difficultyStars}>{renderStars(levelNum)}</div>
                                            </h3>
                                            <p>{option.description}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Start Section */}
                    <div className={styles.startSection}>
                        <button
                            className={`${styles.startButton} ${selectedDifficulty ? styles.enabled : ''}`}
                            onClick={startQuiz}
                            disabled={!selectedDifficulty}
                        >
                            퀴즈 시작하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
