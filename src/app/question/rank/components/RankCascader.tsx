// /app/question/rank/components/RankCascader.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './RankCascader.module.css';
import ContainerHeaderBackButton from "@/app/components/ui/backButton/HeaderBackButton";
import type { QuizItem } from "@/core/repositroy/questions/question.type";
import QuizContainer from '@/app/components/page/quiz/QuizContainer';
import { useQuizResultStore } from '@/app/store/review/quizResultStore';
import Loading from '@/app/components/ui/loading/loading'
import ProgressQuestionNumberPage from '@/app/components/ui/questionNumber/progressQuestionNumber';
import QuizTimer, { QuizTimerRef } from '@/app/components/ui/quizTimer/timer';
import ProgressBar from '@/app/components/ui/progressbar/ProgressBar';
import { saveAttepmtAnswer } from '@/app/question/rank/components/RankAttemptAnswerSave';

type Props = {
    initialQuestions: QuizItem[];
};
type AnswerState = { questionIndex: number; selectedIndex: number | null };

const DURATION = 10; // 제한시간(초)
export default function RankPage({ initialQuestions }: Props) {
    const router = useRouter();
    const [answers, setAnswers] = useState<AnswerState[]>([]);
    // 현재 question index 번호 
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    // 정답 보기 중 선택한 번호
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    // 마지막 문제 풀고 전달시
    const [submitting, setSubmitting] = useState(false);
    // 전체 결과 저장 중복 방지
    const submittedRef = useRef(false);
    // 각 문항 1회 커밋 보장(타임오버/클릭 레이스 방어)
    const answeredSetRef = useRef<Set<number>>(new Set());
    // 타이머
    const timerRef = useRef<QuizTimerRef>(null);
    // 시작 시간
    const startedAtRef = useRef<number | null>(null);
    // 문제 사용하기 쉽게 변환
    const normalizedQuestions = initialQuestions.map((q) => ({
        ...q,
        question: q.question,
        options: q.options,
        correctOrderNo: q.correctOrderNo ?? 1,
        id: (q as any).id ?? null,
    }));
    // 전체 문제 개수
    const totalQuestions = normalizedQuestions.length;
    const currentQuestionNum = currentQuestionIndex + 1;
    const currentQuestion = normalizedQuestions[currentQuestionIndex];
    // store 초기화
    const {
        setQuestions,
        addUserAnswer,
        startTimer,
        finishTimer,
        resetAll,
    } = useQuizResultStore();

    // 시작 시간 기록
    useEffect(() => {
        resetAll();
        setQuestions(normalizedQuestions);
        startTimer();
    }, []);

    // 문제 이동 시 선택 초기화
    useEffect(() => { setSelectedAnswer(null); }, [currentQuestionIndex]);

    // 한 문항당 단 한번만 커밋
    const commitOnce = (qIdx: number) => {
        if (answeredSetRef.current.has(qIdx)) return false;
        answeredSetRef.current.add(qIdx);
        return true;
    };

    // 타이머
    const handleTimeOver = () => {
        if (submitting) return;
        const qIdx = currentQuestionIndex;
        if (!commitOnce(qIdx)) return;

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

    const commitAnswer = async (
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
            // 제출 시작
            setSubmitting(true);
            finishTimer(); // 총 소요시간 저장 (랭킹과 동일)

            try {
                // store에서 최신 상태 가져오기
                const storeState = useQuizResultStore.getState();
                const { questions, answers, totalTimeUsed } = storeState;
                const attemptResult = await saveAttepmtAnswer(
                    totalQuestions,
                    totalTimeUsed,
                    questions,
                    answers
                );
                if (!attemptResult.ok) {
                    const errorData = await attemptResult.json();
                    console.error('답안 저장 실패:', errorData);
                }
            } catch (error) {
                throw new Error(`Save attempt answer Failed`);

            } finally {
                setSubmitting(false);
                router.push('/answer'); // 확장성을 위한 이동을 해야한다.
            }
            return;
        }

        // 다음 문제로 진행
        setSelectedAnswer(null);
        setCurrentQuestionIndex(i => i + 1);
    };

    const goBack = () => {
        const shouldLeave = window.confirm('랭킹 문제에서는 뒤로가기를 하실 수 없습니다.\n퀴즈를 그만두시겠습니까?');
        if (!shouldLeave) return;
        router.push('/');
    };

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

                {/* 전체 화면 로딩 오버레이 */}
                {submitting && (
                    <Loading />
                )}
            </div>
        </div>
    );
}

