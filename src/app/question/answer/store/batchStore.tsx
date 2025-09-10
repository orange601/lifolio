// store/batchStore
'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type QuickQuestion = {
    question: string;
    options: string[];
    correctOrderNo: number; // 1-based
    explanation?: string | null; // ← 변경
};

export type UserAnswer = {
    questionIndex: number;
    selectedIndex: number | null; // 0-based (미선택: null)
    timeUsed: number;             // 초
};

type State = {
    questions: QuickQuestion[];
    answers: UserAnswer[];
    startedAt?: number;
    finishedAt?: number;
    totalTimeUsed: number;
};

type Actions = {
    start: (qs: QuickQuestion[]) => void;
    answerOne: (a: UserAnswer) => void;
    finish: (totalTime: number) => void;
    reset: () => void;
};

export const useQuickQuizStore = create<State & Actions>()(
    persist(
        (set) => ({
            questions: [],
            answers: [],
            startedAt: undefined,
            finishedAt: undefined,
            totalTimeUsed: 0,
            start: (qs) => set({ questions: qs, answers: [], startedAt: Date.now(), finishedAt: undefined, totalTimeUsed: 0 }),
            answerOne: (a) => set((s) => {
                const next = [...s.answers];
                const idx = next.findIndex(x => x.questionIndex === a.questionIndex);
                if (idx >= 0) next[idx] = a; else next.push(a);
                return { answers: next };
            }),
            finish: (totalTime) => set({ finishedAt: Date.now(), totalTimeUsed: totalTime }),
            reset: () => set({ questions: [], answers: [], startedAt: undefined, finishedAt: undefined, totalTimeUsed: 0 }),
        }),
        { name: 'quick-quiz-store' }
    )
);
