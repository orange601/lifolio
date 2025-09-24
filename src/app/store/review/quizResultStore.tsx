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
    totalTimeUsed: number;      // ✅ ms 단위 (총 소요시간)
    _startedAt: number | null;  // 내부용 (ms)
};

type Actions = {
    setQuestions: (qs: QuizItem[]) => void;
    addUserAnswer: (ans: UserAnswer) => void;
    userAnswerReset: () => void;

    startTimer: () => void;
    finishTimer: () => void; // _startedAt ~ now => totalTimeUsed(ms)

    setTotalTimeUsed: (ms: number) => void; // ✅ ms로 통일
    resetAll: () => void;
};

export const useQuizResultStore = create<State & Actions>((set, get) => ({
    questions: [],
    answers: [],
    totalTimeUsed: 0, // ms
    _startedAt: null,

    setQuestions: (qs) => set({ questions: qs }),

    addUserAnswer: (ans) =>
        set((s) => ({
            answers: [
                // 같은 questionIndex가 있으면 교체
                ...s.answers.filter((a) => a.questionIndex !== ans.questionIndex),
                ans,
            ].sort((a, b) => a.questionIndex - b.questionIndex),
        })),

    // 답변/타이머만 초기화 (랭킹 재시작 시 Rank 페이지에서 호출)
    userAnswerReset: () => set({ answers: [], totalTimeUsed: 0 }),

    // ms 기준으로 시작/종료
    startTimer: () => set({ _startedAt: Date.now(), totalTimeUsed: 0 }),
    finishTimer: () => {
        const started = get()._startedAt;
        if (started != null) {
            const ms = Math.max(0, Date.now() - started);
            set({ totalTimeUsed: ms, _startedAt: null });
        }
    },

    setTotalTimeUsed: (ms) => set({ totalTimeUsed: Math.max(0, Math.floor(ms)) }),

    // 전체 초기화(Answer에서 재도전/홈 이동 시 사용)
    resetAll: () =>
        set({ questions: [], answers: [], totalTimeUsed: 0, _startedAt: null }),
}));
