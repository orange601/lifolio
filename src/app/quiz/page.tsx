// quiz/page.tsx

import QuizCascader from "@/app/quiz/components/QuizCascader";
import { findAllQuizItems } from "@/core/repositroy/questions/question.repo";
import type { QuizItem } from "@/core/repositroy/questions/question.type";
import WaitingQuestion from "@/app/quiz/components/WaitingQuestion";

export default async function QuizPage({
    searchParams,
}: {
    searchParams: Promise<{ categoryId?: string; difficulty?: string }>;
}) {
    const params = await searchParams;

    const rawCategoryId = Number(params?.categoryId ?? NaN);
    const safeCategoryId = Number.isFinite(rawCategoryId) ? rawCategoryId : 1;

    // ✅ 난이도: 없으면 undefined
    const rawDifficulty = Number(params?.difficulty ?? NaN);
    const maybeDifficulty = Number.isFinite(rawDifficulty) ? rawDifficulty : undefined;

    let items: QuizItem[] = [];
    try {
        items = await findAllQuizItems(safeCategoryId, maybeDifficulty, { limit: 10, random: true });
    } catch (e) {
        console.error("findAllQuizItems failed:", e);
    }

    if (!items || items.length === 0) {
        return (
            <main style={{ padding: 16 }}>
                <WaitingQuestion />
                <div style={{ marginTop: 16, color: "#fff", textAlign: "center" }}>
                    해당 조건의 공개된 문제를 찾지 못했어요. 카테고리를 바꾸거나 잠시 후 다시 시도해 주세요.
                </div>
            </main>
        );
    }

    return (
        <main style={{ padding: 16 }}>
            {/* difficulty prop이 필요 없다면 제거하거나, QuizCascader에서 optional로 처리 */}
            <QuizCascader quizQuestions={items} />
        </main>
    );
}
