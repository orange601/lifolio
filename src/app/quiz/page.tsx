// quiz/page.tsx

import QuizCascader from "@/app/quiz/components/QuizCascader";
import { findAllQuizItems } from "@/core/repositroy/questions/question.repo"; // ⬅️ 교체
import type { QuizItem } from "@/core/repositroy/questions/question.type";
import WaitingQuestion from "@/app/quiz/components/WaitingQuestion";

export default async function QuizPage({
    searchParams,
}: {
    searchParams: Promise<{ categoryId?: string; difficulty?: string }>;
}) {
    const params = await searchParams;
    const categoryId = Number(params?.categoryId ?? NaN);
    const difficulty = Number(params?.difficulty ?? NaN);

    const safeCategoryId = Number.isFinite(categoryId) ? categoryId : 1; // 기본 카테고리 보정
    const safeDifficulty = normalizeDifficulty(difficulty);

    let items: QuizItem[] = [];
    try {
        items = await findAllQuizItems(safeCategoryId, safeDifficulty, { limit: 10, random: true });
    } catch (e) {
        console.error("findAllQuizItems failed:", e);
    }

    // 빈 결과 가드
    if (!items || items.length === 0) {
        return (
            <main style={{ padding: 16 }}>
                <WaitingQuestion />
                <div style={{ marginTop: 16, color: "#fff", textAlign: "center" }}>
                    해당 조건의 공개된 문제를 찾지 못했어요. 카테고리/난이도를 바꿔 시도해 주세요.
                </div>
            </main>
        );
    }

    return (
        <main style={{ padding: 16 }}>
            <QuizCascader quizQuestions={items} difficulty={safeDifficulty} />
        </main>
    );
}

/**
 * 유효성 검사 난이도 1 ~ 5 까지
 */
function normalizeDifficulty(value: unknown, fallback: number = 3): number {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    if (n < 1) return 1;
    if (n > 5) return 5;
    return n;
}