import AnswerCascaderPage from "./components/AnswerCascader";
import { currentUser } from "@clerk/nextjs/server";
import { useQuizResultStore } from '@/app/store/review/quizResultStore';

export default async function AnswerPage() {
    const user = await currentUser();
    if (user) {
        // 로그인 했다면 문제푼 정보 저장
        const { questions, answers, totalTimeUsed, resetAll } = useQuizResultStore();
        // 문제 개수
        const totalQuestions = questions.length;
        // questions 전체 문제 및 보기들
        if (totalQuestions <= 0) throw new Error('NO_QUESTIONS');

        async function saveResult() {
            const payload = {
                mode: `rank`, // or batch,
                questionCnt: totalQuestions,
                totalTimeUsed,
                items: null //buildItemsFrom(finalAnswers), // 여기!
            };
        }
    }

    return (
        <main>
            <AnswerCascaderPage />
        </main>
    );
}

