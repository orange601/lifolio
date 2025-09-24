// question/rank

import RankingPage from "./components/RankCascader";
import { findQuickStartMcqItems } from "@/core/repositroy/questions/quick.question.repo"
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function RankPage() {
    const user = await currentUser();

    if (!user) {
        redirect("/auth");
    }

    // 랜덤 MCQ 4지선다 10문
    const questions = await findQuickStartMcqItems(10);
    return (
        <main>
            <RankingPage questions={questions} />
        </main>
    );
}