// question/review/page.tsx (Server Component)
import ReviewCascaderPage from "./components/ReviewCascader";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { findAttemptReview } from "@/core/repositroy/attempt_answer/attempt.review.repo";

export default async function ReviewPage({
    searchParams,
}: {
    searchParams?: { attemptId?: string };
}) {
    const user = await currentUser();
    if (!user) redirect("/");

    const attemptId = Number(searchParams?.attemptId ?? NaN);
    if (!Number.isFinite(attemptId) || attemptId <= 0) {
        // attemptId 없으면 홈으로
        redirect("/");
    }

    const review = await findAttemptReview(attemptId, user.id);
    if (!review) {
        // 없는 시도거나 남의 시도면 홈
        redirect("/");
    }

    return (
        <main>
            <ReviewCascaderPage review={review} />
        </main>
    );
}
