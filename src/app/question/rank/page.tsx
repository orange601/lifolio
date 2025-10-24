// question/rank

import BatchPage from "@/app/question/batch/components/BatchCascader";
import { findQuickStartMcqItems } from "@/core/repositroy/questions/quick.question.repo"
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RankPage() {
    const user = await currentUser();
    if (!user) {
        redirect("/auth");
    }
    const limit = 10; // 문제개수
    // 랜덤 MCQ 4지선다 10문
    const questions = await findQuickStartMcqItems(limit);
    return (
        <main>
            <BatchPage initialQuestions={questions} />
        </main>
    );
}