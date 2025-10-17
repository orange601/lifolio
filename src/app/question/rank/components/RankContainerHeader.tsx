'use client';
import React, { forwardRef } from 'react';
import styles from './RankContainerHeader.module.css';
import QuizContainerHeaderBackButton from "@/app/components/ui/backButton/QuizContainerHeaderBackButton";
import QuizTimer, { QuizTimerRef } from '@/app/components/ui/quizTimer/timer';

type RankContainerHeaderProps = {
    currentQuestionNum: number;
    onBack: () => void;
    duration: number;
    paused?: boolean;
    onTimeOver: () => void;
    /** 문제 변경 시 타이머 리셋을 위한 key */
    timerKey: number;
};

const RankContainerHeader = forwardRef<QuizTimerRef, RankContainerHeaderProps>(
    ({
        currentQuestionNum,
        onBack,
        duration,
        paused = false,
        onTimeOver,
        timerKey
    }, ref) => {
        return (
            <div className="container-header">
                <div className={styles.headerLeft}>
                    <QuizContainerHeaderBackButton
                        onBack={onBack}
                    />
                </div>

                <div className={styles.headerCenter}>
                    <div className={styles.progressInfo}>
                        <span className={styles.currentQuestion}>{currentQuestionNum}</span>
                        <span className={styles.totalQuestions}>번 문제</span>
                    </div>
                </div>

                <div className={styles.headerRight}>
                    <QuizTimer
                        key={timerKey}
                        ref={ref}
                        duration={duration}
                        paused={paused}
                        onTimeOver={onTimeOver}
                    />
                </div>
            </div>
        );
    }
);

RankContainerHeader.displayName = 'RankContainerHeader';
export default RankContainerHeader;
