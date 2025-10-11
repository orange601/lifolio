// AnswerPage.tsx
'use client';

import React from 'react';
import styles from './AnswerPage.module.css';
import ContainerHeaderBackButton from "@/app/components/ui/backButton/HeaderBackButton";
import ToDashboardButton from '@/app/components/ui/backButton/ToDashboardButton';
import ProgressQuestionNumberPage from '@/app/components/ui/questionNumber/progressQuestionNumber';
import ProgressBar from '@/app/components/ui/progressbar/ProgressBar';

interface QuizResultData {
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeUsed?: number;
    questionNumber: number;
    totalQuestions: number;
    explanation?: string;
    currentScore?: number;
    accuracy?: number;
}

interface Props {
    resultData: QuizResultData;
    onNextQuestion?: () => void;
    onGoToDashboard?: () => void;
    onGoBack?: () => void;
}

export default function AnswerPage({
    resultData,
    onNextQuestion,
    onGoToDashboard,
    onGoBack
}: Props) {
    const goBack = () => {
        if (window.confirm('뒤로 가시겠습니까?')) onGoBack?.();
    };
    const handleNextQuestion = () => {
        onNextQuestion?.();
    };

    const handleGoToDashboard = () => {
        onGoToDashboard?.();
    };

    const isLastQuestion = resultData.questionNumber >= resultData.totalQuestions;
    return (
        <div className="page-background">
            <div className="container">
                {/* Header (전역) */}
                <div className="container-header">
                    <ContainerHeaderBackButton onBack={goBack} />
                    <ProgressQuestionNumberPage
                        currentQuestion={resultData.questionNumber}
                        totalQuestions={resultData.totalQuestions}
                    />
                </div>

                {/* Progress Bar */}
                <ProgressBar
                    current={resultData.questionNumber}
                    total={resultData.totalQuestions}
                />

                <div className={styles.contentCard}>
                    {/* 정답/오답 헤더 - 카드 최상단 */}
                    <div className={`${styles.resultHeader} ${resultData.isCorrect ? styles.correct : styles.incorrect}`}>
                        <div className={styles.resultIcon}>
                            {resultData.isCorrect ? '✓' : '✗'}
                        </div>
                        <div className={styles.resultText}>
                            {resultData.isCorrect ? '정답입니다' : '틀렸습니다'}
                        </div>
                    </div>

                    {/* 카드 콘텐츠 */}
                    <div className={styles.content}>
                        {/* 문제 */}
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>문제</div>
                            <div className={styles.question}>
                                {resultData.question}
                            </div>
                        </div>

                        {/* 정답 */}
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>정답</div>
                            <div className={styles.answer}>
                                {resultData.correctAnswer}
                            </div>
                        </div>

                        {/* 해설 */}
                        {resultData.explanation && (
                            <div className={styles.section}>
                                <div className={styles.sectionTitle}>해설</div>
                                <div className={styles.explanation}>
                                    {resultData.explanation}
                                </div>
                            </div>
                        )}

                        {/* 버튼 그룹 */}
                        <div className={styles.buttonGroup}>
                            <ToDashboardButton
                                onClick={handleGoToDashboard}
                            >
                                홈으로
                            </ToDashboardButton>

                            <button
                                className={`${styles.btn} ${styles.btnPrimary}`}
                                onClick={handleNextQuestion}
                            >
                                {isLastQuestion ? '퀴즈 완료' : '다음 문제 →'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}