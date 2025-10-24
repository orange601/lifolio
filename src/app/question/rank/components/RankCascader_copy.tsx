// /app/question/rank/components/RankCascader.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './RankCascader.module.css';
import { useRouter } from 'next/navigation';
import type { QuizItem } from "@/core/repositroy/questions/question.type";
import { QuizTimerRef } from '@/app/components/ui/quizTimer/timer';
import QuizContainer from '@/app/components/page/quiz/QuizContainer';
import RankContainerHeader from './RankContainerHeader';
import Loading from '@/app/components/ui/loading/loading'

type Props = {
    questions: QuizItem[];
};

type AnswerState = { questionIndex: number; selectedIndex: number | null };

export default function RankPage({ questions }: Props) {
    const router = useRouter();

    // 질문 구조 보정(정답 인덱스 1-based 보장, id 존재 시 유지)
    const extendedQuestions = questions.map((q) => ({
        ...q,
        question: q.question,
        options: q.options,
        correctOrderNo: q.correctOrderNo ?? 1,
        id: (q as any).id ?? null,
    }));

    const DURATION = 10;

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answers, setAnswers] = useState<AnswerState[]>([]);
    const [submitting, setSubmitting] = useState(false);

    const submittedRef = useRef(false);                   // 전체 결과 저장 중복 방지
    const answeredSetRef = useRef<Set<number>>(new Set()); // 각 문항 1회 커밋 보장(타임오버/클릭 레이스 방어)
    const timerRef = useRef<QuizTimerRef>(null);
    const startedAtRef = useRef<number | null>(null);

    const totalQuestions = extendedQuestions.length;
    const currentQuestionNum = currentQuestionIndex + 1;
    const currentQuestion = extendedQuestions[currentQuestionIndex];

    // 시작 시간 기록
    useEffect(() => {
        startedAtRef.current = Date.now();
        return () => { startedAtRef.current = null; };
    }, []);

    // 문제 이동 시 선택 초기화
    useEffect(() => { setSelectedAnswer(null); }, [currentQuestionIndex]);

    const goBack = () => {
        const shouldLeave = window.confirm('랭킹 문제에서는 뒤로가기를 하실 수 없습니다.\n퀴즈를 그만두시겠습니까?');
        if (!shouldLeave) return;
        router.push('/');
    };

    // 한 문항당 단 한번만 커밋
    const commitOnce = (qIdx: number) => {
        if (answeredSetRef.current.has(qIdx)) return false;
        answeredSetRef.current.add(qIdx);
        return true;
    };

    const handleTimeOver = () => {
        const qIdx = currentQuestionIndex;
        if (!commitOnce(qIdx)) return;

        // setTimeout으로 다음 이벤트 루프에서 실행
        setTimeout(() => {
            setSelectedAnswer(null);
            commitAnswer(null, true);
        }, 0);
    };

    const handleOptionClick = (index: number) => {
        if (submitting) return;
        const qIdx = currentQuestionIndex;
        if (!commitOnce(qIdx)) return;
        setSelectedAnswer(index);
        commitAnswer(index, false);
    };

    // 서버 규격에 맞춘 items 생성 (answers 배열을 인자로 받도록 변경)
    const buildItemsFrom = (answersArray: AnswerState[]) => {
        return extendedQuestions.map((q, i) => {
            const ans = answersArray.find(a => a.questionIndex === i);
            const selected = ans?.selectedIndex ?? null;
            const correctIdx = (q.correctOrderNo ?? 1) - 1; // 0-based
            return {
                order_no: i + 1,
                question_id: q.id ?? null,
                correct_idx: correctIdx,
                selected_idx: selected, // null이면 미응답
            };
        });
    };

    // 최종 저장 (answers를 인자로 받아 최신 상태를 보장)
    const saveResult = async (finalAnswers: AnswerState[]) => {
        if (submittedRef.current || submitting) return;
        submittedRef.current = true;
        setSubmitting(true);

        try {
            const endedAt = Date.now();
            const totalTimeMs = Math.max(0, (startedAtRef.current ? endedAt - startedAtRef.current : 0));
            if (totalQuestions <= 0) throw new Error('NO_QUESTIONS');

            const payload = {
                mode: 'rank_5s',
                questionCnt: totalQuestions,
                totalTimeMs,
                items: buildItemsFrom(finalAnswers),
            };

            const res = await fetch('/api/attempt-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                try { console.error('attempt 저장 실패:', await res.json()); } catch { /* noop */ }
                throw new Error(`REQUEST_FAILED_${res.status}`);
            }

            const data = await res.json();
            const attemptId = data?.attempt?.id;
            router.push(attemptId ? `/question/answer?attemptId=${attemptId}` : '/question/answer');
        } catch (e) {
            console.error(e);
            router.push('/question/answer');
        } finally {
            setSubmitting(false);
        }
    };

    // 보기 선택/시간초과 → 답 저장 → 마지막이면 즉시 saveResult(nextAnswers)
    const commitAnswer = async (selectedIndex: number | null, timeOver = false) => {
        // 최신 상태를 즉시 반영한 nextAnswers 계산 (setState 비동기 문제 해결)
        const nextAnswers: AnswerState[] = (() => {
            const filtered = answers.filter(a => a.questionIndex !== currentQuestionIndex);
            filtered.push({ questionIndex: currentQuestionIndex, selectedIndex: timeOver ? null : selectedIndex });
            filtered.sort((a, b) => a.questionIndex - b.questionIndex);
            return filtered;
        })();

        // 마지막 문항이면 nextAnswers로 바로 저장 (상태 업데이트 기다리지 않음)
        if (currentQuestionIndex >= totalQuestions - 1) {
            await saveResult(nextAnswers);
            return;
        }

        // 다음 문항으로 이동
        setAnswers(nextAnswers);
        setSelectedAnswer(null);
        setCurrentQuestionIndex(i => i + 1);
    };

    const progressPercentage = totalQuestions > 0 ? (currentQuestionNum / totalQuestions) * 100 : 0;

    return (
        <div className="page-background">
            <div className="container">
                <RankContainerHeader
                    ref={timerRef}
                    currentQuestionNum={currentQuestionNum}
                    onBack={goBack}
                    duration={DURATION}
                    paused={false}
                    onTimeOver={handleTimeOver}
                    timerKey={currentQuestionIndex} // 문항 바뀔 때 타이머 리셋
                />

                <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar} style={{ width: `${progressPercentage}%` }} />
                </div>

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
