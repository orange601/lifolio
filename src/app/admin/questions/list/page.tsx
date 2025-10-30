// app/admin/questions/page.tsx
'use client';
import React, { useEffect, useMemo, useState, useTransition } from 'react';
import Link from "next/link";
import { searchQuestions } from '@/app/admin/actions';

type Question = {
    id: number;
    type: string | null;
    stem: string | null;
    difficulty: number | null;
    grade: string | null;
    language: string | null;
    status: string | null;
    category_id: number | null;
    updated_at: string | null;
};

const PAGE_SIZE = 20;
export default function QuestionsListPage() {
    // 검색/페이지
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    // 데이터
    const [items, setItems] = useState<Question[]>([]);
    const [total, setTotal] = useState(0);
    const [isPending, startTransition] = useTransition();

    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(total / pageSize)),
        [total, pageSize]
    );

    // 목록 로드 (기존 searchQuestions 서버 액션 직접 호출)
    useEffect(() => {
        startTransition(async () => {
            const res = await searchQuestions({ query, page, pageSize });
            setItems(res.items);
            setTotal(res.total);
        });
    }, [query, page]);

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-3">문항 목록</h1>

            {/* 검색 */}
            <div className="flex items-center gap-2 mb-3">
                <input
                    className="flex-1 border rounded p-2"
                    value={query}
                    onChange={(e) => {
                        setPage(1);
                        setQuery(e.target.value);
                    }}
                    placeholder="지문(stem) 키워드 검색"
                />
                <button className="px-3 py-2 border rounded" onClick={() => setPage(1)}>
                    검색
                </button>
            </div>

            {/* 표 */}
            <div className="overflow-auto border rounded">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b bg-gray-50">
                            <th className="text-left p-2">ID</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">지문(stem)</th>
                            <th className="text-left p-2">카테고리</th>
                            <th className="text-left p-2">난이도</th>
                            <th className="text-left p-2">학년</th>
                            <th className="text-left p-2">언어</th>
                            <th className="text-left p-2">상태</th>
                            <th className="text-left p-2">수정</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isPending ? (
                            <tr>
                                <td colSpan={9} className="p-4 text-center">
                                    불러오는 중…
                                </td>
                            </tr>
                        ) : items.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-4 text-center text-gray-500">
                                    결과 없음
                                </td>
                            </tr>
                        ) : (
                            items.map((q) => (
                                <tr key={q.id} className="border-b align-top">
                                    <td className="p-2">{q.id}</td>
                                    <td className="p-2">{q.type ?? '-'}</td>
                                    <td className="p-2">{q.stem ?? '-'}</td>
                                    <td className="p-2">{q.category_id ?? '-'}</td>
                                    <td className="p-2">{q.difficulty ?? '-'}</td>
                                    <td className="p-2">{q.grade ?? '-'}</td>
                                    <td className="p-2">{q.language ?? '-'}</td>
                                    <td className="p-2">{q.status ?? '-'}</td>
                                    <td className="p-2">
                                        <Link
                                            className="px-2 py-1 border rounded inline-block"
                                            href={`/admin/questions/${q.id}`}
                                        >
                                            수정
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* 페이지네이션 */}
            <div className="mt-3 flex items-center justify-center gap-2">
                <button
                    className="px-2 py-1 border rounded"
                    disabled={page <= 1 || isPending}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                    이전
                </button>
                <div className="text-sm">
                    {page} / {totalPages}
                </div>
                <button
                    className="px-2 py-1 border rounded"
                    disabled={page >= totalPages || isPending}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                    다음
                </button>
            </div>
        </div>
    );
}