// AnswerPage.tsx
'use client';

import React from 'react';
import styles from './AnswerPage.module.css';
import ContainerHeaderBackButton from "@/app/components/ui/backButton/HeaderBackButton";

interface QuizResultData {
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
    onGoBack,
}: Props) {
    const goBack = () => {
        if (window.confirm('정말로 뒤로 가시겠습니까?')) onGoBack?.();
    };

    const handleNextQuestion = () => onNextQuestion?.();
    const handleGoToDashboard = () => onGoToDashboard?.();

    const progressPercentage = (resultData.questionNumber / resultData.totalQuestions) * 100;
    const isLastQuestion = resultData.questionNumber >= resultData.totalQuestions;

    return (
        <div className="page-background">
            <div className="container">
                {/* Header (전역) */}
                <div className="container-header">
                    <ContainerHeaderBackButton onBack={goBack} />
                    <div className={styles.progressInfo}>
                        문제 {resultData.questionNumber} / {resultData.totalQuestions}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar} style={{ width: `${progressPercentage}%` }} />
                </div>

                {/* Result Container */}
                <div className={styles.resultContainer}>
                    {/* Result Header */}
                    <div className={styles.resultHeader}>
                        <div
                            className={`${styles.resultIcon} ${resultData.isCorrect ? styles.correct : styles.incorrect
                                }`}
                        >
                            {resultData.isCorrect ? '✓' : '✗'}
                        </div>
                        <div className={styles.resultTitle}>
                            {resultData.isCorrect ? '정답입니다!' : '틀렸습니다'}
                        </div>
                        <div className={styles.resultSubtitle}>
                            {resultData.isCorrect ? '축하합니다!' : '다시 한번 도전해보세요!'}
                        </div>
                    </div>

                    {/* Question Review */}
                    <div className={styles.questionReview}>
                        <div className={styles.questionText}>{resultData.question}</div>

                        <div className={styles.answerComparison}>
                            {/* 내 답 표시가 필요하면 아래를 복구하세요
              {!resultData.isCorrect && (
                <div className={`${styles.answerItem} ${styles.incorrect}`}>
                  <div className={styles.answerLabel}>내 답</div>
                  <div>{resultData.selectedAnswer}</div>
                </div>
              )} */}
                            <div className={`${styles.answerItem} ${styles.correct}`}>
                                <div className={styles.answerLabel}>정답</div>
                                <div>{resultData.correctAnswer}</div>
                            </div>
                        </div>

                        {resultData.explanation && (
                            <div className={styles.explanation}>
                                <h4>💡 해설</h4>
                                <p>{resultData.explanation}</p>
                            </div>
                        )}
                    </div>

                    {/* 통계는 필요 시 복구
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{resultData.timeUsed}</div>
              <div className={styles.statLabel}>소요 시간(초)</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{resultData.currentScore}</div>
              <div className={styles.statLabel}>현재 점수</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNumber}>{Math.round(resultData.accuracy)}</div>
              <div className={styles.statLabel}>정답률(%)</div>
            </div>
          </div> */}

                    {/* Action Buttons */}
                    <div className={styles.actionButtons}>
                        <button className={styles.primaryButton} onClick={handleNextQuestion}>
                            {isLastQuestion ? '퀴즈 완료' : '다음 문제'}
                        </button>
                        <button className={styles.secondaryButton} onClick={handleGoToDashboard}>
                            대시보드로
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
