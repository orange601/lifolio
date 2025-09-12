'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './RankCascader.module.css';
import { useRouter } from 'next/navigation';
import type { QuizItem } from "@/core/repositroy/questions/question.type";
import { QuizTimerRef } from '@/app/components/ui/quizTimer/timer';
import QuizContainer from '@/app/components/page/quiz/QuizContainer';
import { useQuizResultStore } from '@/app/store/review/quizResultStore';
import RankContainerHeader from './RankContainerHeader';

type Props = { questions: QuizItem[]; };

/** 랭킹전, 시간제한 5초, 뒤로가기 없음, 종료시 패널티 */
export default function RankPage({ questions }: Props) {
    const router = useRouter();
    const extendedQuestions = questions.map(q => ({
        ...q,
        question: q.question,
        options: q.options,
        correctOrderNo: q.correctOrderNo ?? 0,
    }));

    const {
        addUserAnswer,
        userAnswerReset,
        setQuestions,
        startTimer,
        finishTimer,
    } = useQuizResultStore();

    const DURATION = 5;
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const currentQuestionNum = currentQuestionIndex + 1;
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const currentQuestion = extendedQuestions[currentQuestionIndex];
    const timerRef = useRef<QuizTimerRef>(null);
    const totalQuestions = questions.length;

    // 초기화
    useEffect(() => {
        userAnswerReset();
        setQuestions(extendedQuestions);
        startTimer();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 문제 인덱스 바뀔 때 선택 초기화
    useEffect(() => {
        setSelectedAnswer(null);
    }, [currentQuestionIndex]);

    const goBack = () => {
        const shouldLeave = window.confirm(
            '랭킹 문제에서는 뒤로가기를 하실 수 없습니다. \n 퀴즈를 그만두시겠습니까?'
        );
        if (!shouldLeave) return;
        router.push('/');
    };

    // 시간 초과
    const handleTimeOver = () => {
        setSelectedAnswer(null);
        commitAnswer(null, true);
    };

    // 보기 선택
    const handleOptionClick = (index: number) => {
        setSelectedAnswer(index);
        commitAnswer(index, false);
    };

    // 답안 확정
    const commitAnswer = (selectedIndex: number | null, timeOver = false) => {
        addUserAnswer({
            questionIndex: currentQuestionIndex,
            selectedIndex: timeOver ? null : selectedIndex,
        });

        // 마지막 문제면 종료 처리 후 결과 페이지로
        if (currentQuestionIndex >= totalQuestions - 1) {
            finishTimer();                 // 총 소요시간 계산 저장
            router.push('/question/answer'); // 결과 페이지 이동
            return;
        }

        setSelectedAnswer(null);
        setCurrentQuestionIndex(i => i + 1);
    };

    const progressPercentage = (currentQuestionNum / totalQuestions) * 100;

    return (
        <div className="page-background">
            <div className="container">
                {/* Header */}
                <RankContainerHeader
                    ref={timerRef}
                    currentQuestionNum={currentQuestionNum}
                    onBack={goBack}
                    duration={DURATION}
                    paused={false}
                    onTimeOver={handleTimeOver}
                    timerKey={currentQuestionIndex}
                />

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
