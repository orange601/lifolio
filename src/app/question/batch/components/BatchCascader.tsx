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
import ProgressQuestionNumberPage from '@/app/components/ui/questionNumber/progressQuestionNumber';
import ProgressBar from '@/app/components/ui/progressbar/ProgressBar';
import Loading from '@/app/components/ui/loading/loading'

type Props = {
    initialQuestions: (QuizItem & {
        question: string;
        options: string[];
        correctOrderNo: number; // 1-based
    })[];
};
const DURATION = 30;  // 제한시간(초)
export default function BatchPage({ initialQuestions }: Props) {
    const router = useRouter();
    // 현재 question index 번호 
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    // 로딩
    const [submitting, setSubmitting] = useState(false);
    // 타이머
    const timerRef = useRef<QuizTimerRef>(null);
    // 각 문항 1회 커밋 보장
    const answeredSetRef = useRef<Set<number>>(new Set());
    // store 초기화
    const {
        setQuestions,
        addUserAnswer,
        startTimer,
        finishTimer,
        resetAll,
    } = useQuizResultStore();
    // 문제 사용하기 쉽게 변환
    const normalizedQuestions = initialQuestions.map(q => ({
        ...q,
        correctOrderNo: q.correctOrderNo ?? 0,
    }));
    // 전체 문제 개수
    const totalQuestions = initialQuestions.length;
    const currentQuestionNum = currentQuestionIndex + 1;
    const currentQuestion = normalizedQuestions[currentQuestionIndex];

    // 초기화: 문제세팅 + 타이머 시작
    useEffect(() => {
        resetAll();
        setQuestions(normalizedQuestions);
        startTimer();
    }, []);

    // 한 문항당 단 한번만 커밋
    const commitOnce = (qIdx: number) => {
        if (answeredSetRef.current.has(qIdx)) return false;
        answeredSetRef.current.add(qIdx);
        return true;
    };

    // 타이머
    const handleTimeOver = () => {
        // 이미 제출 중이면 무시
        if (submitting) return;
        const qIdx = currentQuestionIndex;
        if (!commitOnce(qIdx)) return; // ← 추가

        // 안전하게 실행시키기 위해 ( race condition )
        setTimeout(() => {
            setSelectedAnswer(null);
            commitAnswer(null, true);
        }, 0);
    };

    // 보기 선택 이벤트
    const handleOptionClick = (index: number) => {
        if (submitting) return;
        const qIdx = currentQuestionIndex;
        if (!commitOnce(qIdx)) return;

        setSelectedAnswer(index);
        commitAnswer(index, false);
    };

    const commitAnswer = (
        selectedIndex: number | null,
        timeOver = false
    ) => {
        // 문제 푼 정보 store에 저장
        addUserAnswer({
            questionIndex: currentQuestionIndex,
            selectedIndex: timeOver ? null : selectedIndex,
        });

        // 마지막 문제면 종료 → 결과 페이지
        if (currentQuestionIndex >= totalQuestions - 1) {
            // 로딩 시작
            setSubmitting(true);
            finishTimer(); // 총 소요시간 저장 (랭킹과 동일)
            router.push('/answer'); // 확장성을 위한 이동을 해야한다.
            return;
        }

        // 다음 문제로 진행
        setSelectedAnswer(null);
        setCurrentQuestionIndex(i => i + 1);
    };

    const goBack = () => router.push('/');

    return (
        <div className="page-background">
            <div className="container">
                {/* Header */}
                <div className="container-header">
                    <div className={styles.headerLeft}>
                        <ContainerHeaderBackButton
                            onBack={goBack}
                        />
                    </div>

                    <ProgressQuestionNumberPage
                        currentQuestion={currentQuestionNum}
                        totalQuestions={totalQuestions}
                    />

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
                <ProgressBar
                    current={currentQuestionNum}
                    total={totalQuestions}
                />

                {/* Quiz */}
                <QuizContainer
                    questionNumber={currentQuestionNum}
                    questionText={currentQuestion.question}
                    options={currentQuestion.options}
                    selectedIndex={selectedAnswer}
                    onSelect={handleOptionClick}
                />

                {/* 문제 완료 후 로딩 */}
                {submitting && (
                    <Loading />
                )}
            </div>
        </div>
    );
}