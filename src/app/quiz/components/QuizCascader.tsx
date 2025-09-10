// quiz/components/QuizCascader.tsx
'use client';

import React, { useState, useRef } from 'react';
import type { QuizItem } from "@/core/repositroy/questions/question.type";
import AnswerPage from './AnswerPage';
import ResultQuizPage from '@/app/components/page/ResultQuizPage';
import styles from './QuizCascader.module.css';
import { useRouter } from 'next/navigation';
import ContainerHeaderBackButton from "@/app/components/ui/backButton/HeaderBackButton";
import QuizTimer, { QuizTimerRef } from '@/app/components/ui/quizTimer/timer';

type Props = {
    quizQuestions: (QuizItem & {
        question: string;
        options: string[];
        correctOrderNo: number; // 1-based
    })[];
    difficulty: number;
    theme?: string;
};

type QuizResultData = {
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeUsed: number;
    questionNumber: number;
    totalQuestions: number;
    explanation?: string;
    currentScore: number;
    accuracy: number;
};

export default function QuizPlayPage({ quizQuestions }: Props) {
    const router = useRouter();
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [lastResult, setLastResult] = useState<QuizResultData | null>(null);

    const [showCompletion, setShowCompletion] = useState(false);
    const [totalTimeUsed, setTotalTimeUsed] = useState(0);

    const timerRef = useRef<QuizTimerRef>(null);
    const DURATION = 30;

    const totalQuestions = quizQuestions.length;
    const currentQuestionNum = currentQuestionIndex + 1;

    const currentQuestion = quizQuestions[currentQuestionIndex];

    const selectOption = (index: number) => setSelectedAnswer(index);

    const handleCheckAnswer = (timeOver = false) => {
        if (!timeOver && selectedAnswer === null) return;

        const remaining = timerRef.current?.getRemaining() ?? 0;
        const timeUsedThisQuestion = DURATION - remaining;

        const selectedIndex = selectedAnswer ?? -1;
        const correctOrderNo = currentQuestion.correctOrderNo; // 1-based
        const correctIndex = Math.max(0, correctOrderNo - 1);
        const isCorrect = selectedIndex >= 0 && (selectedIndex + 1) === correctOrderNo;

        setTotalTimeUsed(prev => prev + timeUsedThisQuestion);

        const newCorrectCount = isCorrect ? (correctCount + 1) : correctCount;
        const newAccuracy = (newCorrectCount / currentQuestionNum) * 100;

        const resultData: QuizResultData = {
            question: currentQuestion.question,
            selectedAnswer: selectedIndex >= 0 ? currentQuestion.options[selectedIndex] : '(미선택)',
            correctAnswer: currentQuestion.options[correctIndex],
            isCorrect,
            timeUsed: timeUsedThisQuestion,
            questionNumber: currentQuestionNum,
            totalQuestions,
            explanation: currentQuestion.explanation ?? '',
            currentScore: newCorrectCount,
            accuracy: newAccuracy,
        };

        if (isCorrect) setCorrectCount(c => c + 1);
        setLastResult(resultData);
        setShowResult(true);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex >= totalQuestions - 1) {
            setShowResult(false);
            setShowCompletion(true);
            return;
        }

        setCurrentQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
        setShowResult(false);
    };

    const handleGoToDashboard = () => router.push('/');

    const handleGoBackFromResult = () => setShowResult(false);

    const goBack = () => router.push("/");

    const progressPercentage = (currentQuestionNum / totalQuestions) * 100;
    const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

    if (showCompletion) {
        return (
            <ResultQuizPage
                correctAnswers={correctCount}
                totalQuestions={totalQuestions}
                totalTime={totalTimeUsed}
                onRetryQuiz={() => {
                    setSelectedAnswer(null);
                    setCurrentQuestionIndex(0);
                    setCorrectCount(0);
                    setShowResult(false);
                    setLastResult(null);
                    setShowCompletion(false);
                    setTotalTimeUsed(0);
                }}
                onSelectDifferentQuiz={() => router.push('/category')}
                onGoToDashboard={handleGoToDashboard}
            />
        );
    }

    if (showResult && lastResult) {
        return (
            <AnswerPage
                resultData={lastResult}
                onNextQuestion={handleNextQuestion}
                onGoToDashboard={handleGoToDashboard}
                onGoBack={handleGoBackFromResult}
            />
        );
    }

    return (
        // 전역 클래스(공통) 유지
        <div className="page-background">
            <div className="container">
                {/* Header */}
                <div className="container-header">
                    <ContainerHeaderBackButton onBack={goBack} />
                    <div className={styles.progressInfo}>
                        문제 {currentQuestionNum} / {totalQuestions}
                    </div>

                    <div className={styles.headerSpacer}>
                        <QuizTimer
                            key={currentQuestionIndex}
                            ref={timerRef}
                            duration={DURATION}
                            paused={showResult || showCompletion}
                            onTimeOver={() => handleCheckAnswer(true)}
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
                                    onClick={() => selectOption(index)}
                                >
                                    <div className={styles.optionLetter}>{getOptionLetter(index)}</div>
                                    <div className={styles.optionText}>{option}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className={styles.bottomSection}>
                    <button
                        className={`${styles.checkButton} ${selectedAnswer !== null ? styles.enabled : ''}`}
                        onClick={() => handleCheckAnswer(false)}
                        disabled={selectedAnswer === null}
                    >
                        정답 확인
                    </button>
                </div>
            </div>
        </div>
    );
}
