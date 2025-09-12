'use client';
import React, { useEffect, useRef, useState } from 'react';
import styles from './RankCascader.module.css';
import { useRouter } from 'next/navigation';
import type { QuizItem } from "@/core/repositroy/questions/question.type";
import QuizContainerHeaderBackButton from "@/app/components/ui/backButton/QuizContainerHeaderBackButton";
import QuizTimer, { QuizTimerRef } from '@/app/components/ui/quizTimer/timer';
import QuizContainer from '@/app/components/page/quiz/QuizContainer';
import { useQuizResultStore } from '@/app/store/review/quizResultStore'
import RankContainerHeader from './RankContainerHeader';

type Props = {
    questions: QuizItem[];
};

/**
 * 랭킹전, 시간제한 5초, 뒤로가기 없음, 종료시 패널티
 */
export default function RankPage({ questions }: Props) {
    const router = useRouter();
    const extendedQuestions = questions.map(q => ({
        ...q,
        question: q.question,
        options: q.options,
        correctOrderNo: q.correctOrderNo ?? 0,
    }));

    // 스토어
    const { addUserAnswer, userAnswerReset } = useQuizResultStore();

    const DURATION = 5;
    // 문제 index 기본 0
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    // 현재 문제 번호
    const currentQuestionNum = currentQuestionIndex + 1;
    // 선택된 번호
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    // 현재 문항
    const currentQuestion = extendedQuestions[currentQuestionIndex];
    const timerRef = useRef<QuizTimerRef>(null);
    const totalQuestions = questions.length;

    // 초기화
    useEffect(() => {
        userAnswerReset();
    }, [userAnswerReset]);

    // [1] 문제 인덱스 바뀔 때 선택 초기화
    useEffect(() => {
        setSelectedAnswer(null);
    }, [currentQuestionIndex]);

    // 뒤로가기 핸들러
    const goBack = () => {
        const shouldLeave = window.confirm(
            '랭킹 문제에서는 뒤로가기를 하실 수 없습니다. \n 퀴즈를 그만두시겠습니까?'
        );
        if (!shouldLeave) return;
        router.push('/');
    };

    // [2] 시간 초과 이벤트 시 선택 초기화 포함
    const handleTimeOver = () => {
        setSelectedAnswer(null);
        commitAnswer(null, true);
    };

    // 보기 선택 이벤트
    const handleOptionClick = (index: number) => {
        setSelectedAnswer(index);
        commitAnswer(index, false);
    };

    // [3] 정답 선택 이벤트: 다음 문제로 가기 전 선택 초기화
    const commitAnswer = (selectedIndex: number | null, timeOver = false) => {
        addUserAnswer({
            questionIndex: currentQuestionIndex,
            selectedIndex: timeOver ? null : selectedIndex,
        });

        // 다음 문제 or 종료
        if (currentQuestionIndex >= totalQuestions - 1) {
            router.push('/question/answer'); // 별도 페이지 이동
            return;
        }

        // 다음 문제로 이동하기 전에 선택 초기화
        setSelectedAnswer(null);
        setCurrentQuestionIndex(i => i + 1);
    };

    const progressPercentage = (currentQuestionNum / totalQuestions) * 100;

    return (
        <div className="page-background">
            <div className="container">
                {/* Header (분리된 컴포넌트 사용) */}
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

                {/* Quiz Container */}
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
