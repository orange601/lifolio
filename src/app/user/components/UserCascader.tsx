// app/user/components/UserCascader.tsx
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserCascaderPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace("/question/rank");
    }, [router]);

    return <p>🚀 이동 중입니다...</p>;
}
