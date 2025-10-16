// question/quick/QuickCascader
'use client';

import type { QuizItem } from "@/core/repositroy/questions/question.type";
import React, { useState, useRef, useEffect } from 'react';
import AnswerPage from '@/app/components/page/answer/AnswerPage';
import ResultQuizPage from '@/app/components/page/ResultQuizPage';
import styles from './QuickCascader.module.css';
import { useRouter } from 'next/navigation';
import ContainerHeaderBackButton from "@/app/components/ui/backButton/HeaderBackButton";
import QuizTimer, { QuizTimerRef } from '@/app/components/ui/quizTimer/timer';
import ProgressBar from '@/app/components/ui/progressbar/ProgressBar';
import ProgressQuestionNumberPage from '@/app/components/ui/questionNumber/progressQuestionNumber';
import QuizContainer from '@/app/components/page/quiz/QuizContainer';

type Props = {
    quickQuestions: (QuizItem & {
        question: string;
        options: string[];
        correctOrderNo: number; // 1-based
    })[];
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

export default function QuickQuestionPage({ quickQuestions }: Props) {
    const router = useRouter();

    // 사용자가 마지막으로 클릭한 보기 인덱스(하이라이트용)
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    // 현재 문제 인덱스/맞힌 개수/화면 상태
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [correctCount, setCorrectCount] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [lastResult, setLastResult] = useState<QuizResultData | null>(null);
    const [showCompletion, setShowCompletion] = useState(false);
    const [totalTimeUsed, setTotalTimeUsed] = useState(0);

    // 타이머 제어 레퍼런스
    const timerRef = useRef<QuizTimerRef>(null);

    // 각 문제 제한시간(초)
    const DURATION = 20;

    // 현재 문제/번호/총 개수
    const totalQuestions = quickQuestions.length;
    const currentQuestionNum = currentQuestionIndex + 1;
    const currentQuestion = quickQuestions[currentQuestionIndex];

    // 보기 라벨(A/B/C/D ...)
    const getOptionLetter = (index: number) => String.fromCharCode(65 + index);

    // ------------------------------------------------------------
    // 채점 로직: 보기 클릭 또는 시간 초과 시 호출
    // selectedIndex: 사용자가 클릭한 보기 인덱스(없으면 null)
    // timeOver: 시간 초과 여부
    // ------------------------------------------------------------
    const evaluateAnswer = (selectedIndex: number | null, timeOver = false) => {
        // 남은 시간 → 사용 시간 계산
        const remaining = timerRef.current?.getRemaining() ?? 0;
        const timeUsedThisQuestion = DURATION - remaining;

        // 정답 인덱스(0-based로 변환)
        const correctOrderNo = currentQuestion.correctOrderNo; // 1-based
        const correctIndex = Math.max(0, correctOrderNo - 1);

        // 시간 초과면 오답 처리, 클릭이면 선택값 기준으로 정답 여부 판단
        const isCorrect = !timeOver && selectedIndex !== null && (selectedIndex + 1) === correctOrderNo;

        // 총 소요 시간 누적
        setTotalTimeUsed(prev => prev + timeUsedThisQuestion);

        // 새 정답 수/정확도 계산(현재 문제까지 반영)
        const newCorrectCount = isCorrect ? (correctCount + 1) : correctCount;
        const newAccuracy = (newCorrectCount / currentQuestionNum) * 100;

        // 결과 데이터 구성
        const resultData: QuizResultData = {
            question: currentQuestion.question,
            selectedAnswer: selectedIndex !== null ? currentQuestion.options[selectedIndex] : '(미선택)',
            correctAnswer: currentQuestion.options[correctIndex],
            isCorrect,
            timeUsed: timeUsedThisQuestion,
            questionNumber: currentQuestionNum,
            totalQuestions,
            explanation: currentQuestion.explanation ?? '',
            currentScore: newCorrectCount,
            accuracy: newAccuracy,
        };

        // 상태 반영 및 결과 화면 전환
        if (isCorrect) setCorrectCount(c => c + 1);
        setLastResult(resultData);
        setShowResult(true);
    };

    // 보기 클릭 시 즉시 채점
    const handleOptionClick = (index: number) => {
        // 하이라이트용으로 상태 갱신
        setSelectedAnswer(index);
        // 비동기 상태 갱신과 무관하게 인자로 바로 채점
        evaluateAnswer(index, false);
    };

    // 시간 초과 시(타이머 콜백) - useEffect로 비동기 처리
    const handleTimeOver = () => {
        // setTimeout으로 렌더링 사이클 밖으로 이동
        setTimeout(() => {
            evaluateAnswer(null, true);
        }, 0);
    };

    // 다음 문제로 이동(마지막 문제면 완료 화면)
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

    // 대시보드로 이동
    const handleGoToDashboard = () => router.push('/');

    // 결과 화면에서 돌아가기(필요 시 유지)
    const handleGoBackFromResult = () => setShowResult(false);

    // 상단 뒤로가기
    const goBack = () => router.push("/");

    // 진행률(퍼센트)
    const progressPercentage = (currentQuestionNum / totalQuestions) * 100;

    // 완료 화면
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

    // 채점 결과 화면
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

    // 문제 풀이 화면
    return (
        // 전역 클래스(공통) 유지
        <div className="page-background">
            <div className="container">

                {/* Header */}
                <div className="container-header">
                    <div className={styles.headerLeft}>
                        <ContainerHeaderBackButton onBack={goBack} />
                    </div>

                    <ProgressQuestionNumberPage
                        currentQuestion={currentQuestionNum}
                        totalQuestions={totalQuestions}
                    />

                    <div className={styles.headerRight}>
                        <QuizTimer
                            key={currentQuestionIndex}          // 문제 전환 시 타이머 리셋
                            ref={timerRef}
                            duration={DURATION}
                            paused={showResult || showCompletion}
                            onTimeOver={handleTimeOver}         // 시간 초과 시 즉시 채점
                        />
                    </div>
                </div>

                {/* Progress Bar */}
                <ProgressBar
                    current={currentQuestionNum}
                    total={totalQuestions}
                />

                {/* Quiz Container */}
                <QuizContainer
                    questionNumber={currentQuestionNum}
                    questionText={currentQuestion.question}
                    options={currentQuestion.options}
                    selectedIndex={selectedAnswer}
                    onSelect={(idx) => handleOptionClick(idx)}
                />
            </div>
        </div>
    );
}