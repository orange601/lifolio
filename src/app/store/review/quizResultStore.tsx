'use client';
import { create } from 'zustand';

type QuizState = {
    userAnswers: UserAnswer[];
};

type QuizActions = {
    addUserAnswer: (answer: UserAnswer) => void;
    userAnswerReset: () => void;
};

export type UserAnswer = {
    questionIndex: number;
    selectedIndex: number | null; // 0-based (미선택: null)
};

export const useQuizResultStore = create<QuizState & QuizActions>((set) => ({
    userAnswers: [],
    addUserAnswer: (answer) =>
        set((s) => ({
            userAnswers: [...s.userAnswers, answer],
        })),
    userAnswerReset: () => set({ userAnswers: [] }),
}));