// app/admin/question/[id]/page.tsx
'use client';
import { use, useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateQuestion, getQuestion } from '@/app/admin/actions';

export default function QuestionEditPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id: idString } = use(params);  // React.use()로 unwrap
    const id = Number(idString);

    const [q, setQ] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        // ID 유효성 검사
        if (!Number.isFinite(id) || id <= 0) {
            setError(true);
            setLoading(false);
            return;
        }

        // 데이터 가져오기
        async function fetchQuestion() {
            try {
                const question = await getQuestion(id);
                if (!question) {
                    setError(true);
                } else {
                    setQ(question);
                }
            } catch (err) {
                console.error('Failed to fetch question:', err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        fetchQuestion();
    }, [id]);

    // 로딩 중
    if (loading) {
        return (
            <div className="p-4 max-w-3xl mx-auto">
                <div className="text-center py-8">로딩 중...</div>
            </div>
        );
    }

    // 에러 또는 데이터 없음
    if (error || !q) {
        notFound();
    }

    return (
        <div className="p-4 max-w-3xl mx-auto">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold">문항 수정 #{q.id}</h1>
                <Link href="/admin/questions" className="px-3 py-2 border rounded">
                    목록으로
                </Link>
            </div>

            {/* 서버 액션 반환 타입은 void 형태가 적합 */}
            <form action={updateQuestion} className="space-y-6">
                <input type="hidden" name="id" value={q.id} />

                <div>
                    <label className="block text-sm font-medium mb-1">문제 유형(type)</label>
                    <input
                        name="type"
                        className="w-full border rounded p-2"
                        placeholder="예: MCQ / TF / SA"
                        defaultValue={q.type ?? ''}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">문제 본문(stem)</label>
                    <textarea
                        name="stem"
                        className="w-full border rounded p-3"
                        rows={4}
                        defaultValue={q.stem ?? ''}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">해설(explanation)</label>
                    <textarea
                        name="explanation"
                        className="w-full border rounded p-3"
                        rows={3}
                        defaultValue={q.explanation ?? ''}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">난이도(difficulty)</label>
                        <input
                            name="difficulty"
                            type="number"
                            step={1}
                            min={0}
                            className="w-full border rounded p-2"
                            defaultValue={q.difficulty ?? ''}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">학년(grade)</label>
                        <input
                            name="grade"
                            className="w-full border rounded p-2"
                            placeholder="예: general / elem / mid / high ..."
                            defaultValue={q.grade ?? ''}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">언어(language)</label>
                        <input
                            name="language"
                            className="w-full border rounded p-2"
                            placeholder="ko / en ..."
                            defaultValue={q.language ?? 'ko'}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">상태(status)</label>
                        <select
                            name="status"
                            className="w-full border rounded p-2"
                            defaultValue={q.status ?? 'draft'}
                        >
                            <option value="draft">draft</option>
                            <option value="published">published</option>
                            <option value="archived">archived</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">카테고리 ID(category_id)</label>
                        <input
                            name="category_id"
                            type="number"
                            step={1}
                            min={1}
                            className="w-full border rounded p-2"
                            placeholder="비워두면 NULL"
                            defaultValue={q.category_id ?? ''}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">수정일(updated_at)</label>
                        <input
                            disabled
                            className="w-full border rounded p-2 bg-gray-50 text-gray-600"
                            defaultValue={q.updated_at ?? '-'}
                        />
                    </div>
                </div>

                {/* <div>
                    <label className="block text-sm font-medium mb-1">주관식 정답(subjective_answer)</label>
                    <textarea
                        name="subjective_answer"
                        className="w-full border rounded p-2"
                        rows={2}
                        defaultValue={q.subjective_answer ?? ''}
                    />
                </div> */}

                <div className="flex gap-3">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                        저장
                    </button>
                    <Link href="/admin/questions" className="px-4 py-2 bg-gray-200 rounded">
                        취소
                    </Link>
                </div>
            </form>
        </div>
    );
}
