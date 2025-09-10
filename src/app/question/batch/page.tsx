// question/batch

import BatchCascader from "./components/BatchCascader";
import { findQuickStartMcqItems } from "@/core/repositroy/questions/quick.question.repo"
import type { QuizItem } from "@/core/repositroy/questions/question.type";

export default async function DifficultyPage() {
    const limit = 10; // 문제개수 테스트시 1개
    // 랜덤 MCQ 4지선다 N문
    const quickQuestions: QuizItem[] = await findQuickStartMcqItems(limit);
    return (
        <main>
            <BatchCascader initialQuestions={quickQuestions} />
        </main>
    );
}
