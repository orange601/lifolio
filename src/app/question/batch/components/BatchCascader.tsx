// /app/question/batch/BatchCascader.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './BatchCascader.module.css'; // 기존 스타일 재사용
import ContainerHeaderBackButton from "@/app/components/ui/backButton/HeaderBackButton";
import QuizTimer, { QuizTimerRef } from '@/app/components/ui/quizTimer/timer';
import { useQuickQuizStore, QuickQuestion } from '../../answer/store/batchStore';
import type { QuizItem } from "@/core/repositroy/questions/question.type";

type Props = {
    initialQuestions: (QuizItem & {
        question: string;
        options: string[];
        correctOrderNo: number; // 1-based
    })[];
};

export default function QuickSolve({ initialQuestions }: Props) {
    const router = useRouter();
    const { start, answerOne, finish, reset } = useQuickQuizStore();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [totalTimeUsed, setTotalTimeUsed] = useState(0);
    const timerRef = useRef<QuizTimerRef>(null);
    const DURATION = 30;

    const totalQuestions = initialQuestions.length;
    const currentQuestionNum = currentQuestionIndex + 1;
    const currentQuestion = initialQuestions[currentQuestionIndex];

    useEffect(() => {
        // 새 세션 시작
        reset();
        start(initialQuestions);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

    const commitAnswer = (selectedIndex: number | null, timeOver = false) => {
        const remaining = timerRef.current?.getRemaining() ?? 0;
        const timeUsedThis = DURATION - remaining;
        setTotalTimeUsed(t => t + timeUsedThis);

        // 저장만! (정답/오답 화면 X)
        answerOne({
            questionIndex: currentQuestionIndex,
            selectedIndex: timeOver ? null : selectedIndex,
            timeUsed: timeUsedThis
        });

        // 다음 문제 or 종료
        if (currentQuestionIndex >= totalQuestions - 1) {
            finish(totalTimeUsed + timeUsedThis);
            router.push('/question/answer'); // 별도 페이지 이동
            return;
        }

        setCurrentQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
    };

    const handleOptionClick = (index: number) => {
        setSelectedAnswer(index);
        commitAnswer(index, false);
    };

    const handleTimeOver = () => commitAnswer(null, true);
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

                {/* Quiz Container */}
                <div className={styles.quizContainer}>
                    <div className={styles.questionCard}>
                        <div className={styles.questionNumber}>Question {currentQuestionNum}</div>
                        <div className={styles.questionText}>{currentQuestion.question}</div>

                        <div className={styles.optionsContainer}>
                            {currentQuestion.options.map((option, index) => (
                                <div
                                    key={index}
                                    className={`${styles.option} ${selectedAnswer === index ? styles.selected : ''}`}
                                    onClick={() => handleOptionClick(index)}
                                >
                                    <div className={styles.optionLetter}>{getOptionLetter(index)}</div>
                                    <div className={styles.optionText}>{option}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
