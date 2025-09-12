// /app/store/review/quizResultStore.ts
import { create } from 'zustand';
import type { QuizItem } from "@/core/repositroy/questions/question.type";

type UserAnswer = {
    questionIndex: number;
    selectedIndex: number | null; // 시간초과면 null
};

type State = {
    questions: QuizItem[];
    answers: UserAnswer[];
    totalTimeUsed: number;      // 초 단위
    _startedAt?: number | null; // 내부용 (ms)
};

type Actions = {
    setQuestions: (qs: QuizItem[]) => void;
    addUserAnswer: (ans: UserAnswer) => void;
    userAnswerReset: () => void;

    startTimer: () => void;
    finishTimer: () => void; // _startedAt ~ now => totalTimeUsed

    setTotalTimeUsed: (sec: number) => void;
    resetAll: () => void;
};

export const useQuizResultStore = create<State & Actions>((set, get) => ({
    questions: [],
    answers: [],
    totalTimeUsed: 0,
    _startedAt: null,

    setQuestions: (qs) => set({ questions: qs }),
    addUserAnswer: (ans) => set((s) => ({
        answers: [
            // 같은 questionIndex가 있으면 교체
            ...s.answers.filter(a => a.questionIndex !== ans.questionIndex),
            ans,
        ].sort((a, b) => a.questionIndex - b.questionIndex)
    })),
    userAnswerReset: () => set({ answers: [], totalTimeUsed: 0 }),

    startTimer: () => set({ _startedAt: Date.now(), totalTimeUsed: 0 }),
    finishTimer: () => {
        const started = get()._startedAt;
        if (started) {
            const sec = Math.max(0, Math.round((Date.now() - started) / 1000));
            set({ totalTimeUsed: sec, _startedAt: null });
        }
    },

    setTotalTimeUsed: (sec) => set({ totalTimeUsed: sec }),
    resetAll: () => set({ questions: [], answers: [], totalTimeUsed: 0, _startedAt: null }),
}));
