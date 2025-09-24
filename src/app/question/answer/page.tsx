// /app/question/answer/page.tsx
import AnswerCascader from "./components/AnswerCascader";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type PageProps = {
    searchParams: Promise<{ attemptId?: string }>;
};

// ✅ baseUrl 만들 때 await 필요
async function getBaseUrl() {
    const h = await headers();
    const proto = h.get("x-forwarded-proto") ?? "http";
    const host = h.get("x-forwarded-host") ?? h.get("host");
    return `${proto}://${host}`;
}

export default async function AnswerPage({ searchParams }: PageProps) {
    const sp = await searchParams;
    const attemptIdStr = sp.attemptId;
    const id = Number(attemptIdStr);
    const baseUrl = await getBaseUrl();
    const res = await fetch(`${baseUrl}/api/attempt/${id}`, { cache: "no-store" });
    const { attempt } = await res.json();
    return (
        <main>
            <AnswerCascader attempt={attempt} />
        </main>
    );
}
