// /app/question/batch/BatchCascader.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './BatchCascader.module.css'; // 기존 스타일 재사용
import ContainerHeaderBackButton from "@/app/components/ui/backButton/HeaderBackButton";
import QuizTimer, { QuizTimerRef } from '@/app/components/ui/quizTimer/timer';
import { useQuizResultStore } from '@/app/store/review/quizResultStore';
import type { QuizItem } from "@/core/repositroy/questions/question.type";
import QuizContainer from '@/app/components/page/quiz/QuizContainer';

type Props = {
    initialQuestions: (QuizItem & {
        question: string;
        options: string[];
        correctOrderNo: number; // 1-based
    })[];
};

export default function BatchPage({ initialQuestions }: Props) {
    const router = useRouter();

    // ✅ 랭킹과 동일 API 사용
    const {
        setQuestions,
        addUserAnswer,
        startTimer,
        finishTimer,
        resetAll,
    } = useQuizResultStore();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const timerRef = useRef<QuizTimerRef>(null);

    const DURATION = 30;
    const totalQuestions = initialQuestions.length;

    // 정규화(랭킹과 동일 필드 보장: correctOrderNo가 없으면 0으로 폴백)
    const normalized = initialQuestions.map(q => ({
        ...q,
        correctOrderNo: q.correctOrderNo ?? 0,
    }));

    const currentQuestionNum = currentQuestionIndex + 1;
    const currentQuestion = normalized[currentQuestionIndex];

    // 초기화: 문제세팅 + 타이머 시작
    useEffect(() => {
        resetAll();
        setQuestions(normalized);
        startTimer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const commitAnswer = (selectedIndex: number | null, timeOver = false) => {
        // 저장만(즉시 해설 X) — 랭킹과 동일하게 answers에만 누적
        addUserAnswer({
            questionIndex: currentQuestionIndex,
            selectedIndex: timeOver ? null : selectedIndex,
        });

        // 마지막 문제면 종료 → 결과 페이지
        if (currentQuestionIndex >= totalQuestions - 1) {
            finishTimer();                 // 총 소요시간 저장 (랭킹과 동일)
            router.push('/answer');
            return;
        }

        // 다음 문제로 진행
        setSelectedAnswer(null);
        setCurrentQuestionIndex(i => i + 1);
    };

    // 보기 선택
    const handleOptionClick = (index: number) => {
        setSelectedAnswer(index);
        commitAnswer(index, false);
    };

    // 시간 초과
    const handleTimeOver = () => {
        setSelectedAnswer(null);
        commitAnswer(null, true);
    };

    const goBack = () => router.push('/');

    const progressPercentage = (currentQuestionNum / totalQuestions) * 100;

    return (
        <div className="page-background">
            <div className="container">
                {/* Header */}
                <div className="container-header">
                    <div className={styles.headerLeft}>
                        <ContainerHeaderBackButton onBack={goBack} />
                    </div>

                    <div className={styles.headerCenter}>
                        <div className={styles.progressInfo}>
                            <span className={styles.currentQuestion}>{currentQuestionNum}</span>
                            <span className={styles.separator}>/</span>
                            <span className={styles.totalQuestions}>{totalQuestions}</span>
                        </div>
                        <div className={styles.progressLabel}>문제</div>
                    </div>

                    <div className={styles.headerRight}>
                        <QuizTimer
                            key={currentQuestionIndex}
                            ref={timerRef}
                            duration={DURATION}
                            paused={false}
                            onTimeOver={handleTimeOver}
                        />
                    </div>
                </div>

                {/* Progress Bar */}
                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar} style={{ width: `${progressPercentage}%` }} />
                </div>

                {/* Quiz */}
                <QuizContainer
                    questionNumber={currentQuestionNum}
                    questionText={currentQuestion.question}
                    options={currentQuestion.options}
                    selectedIndex={selectedAnswer}
                    onSelect={handleOptionClick}
                />
            </div>
        </div>
    );
}