// app/admin/questions/[id]/page.tsx
import { notFound } from 'next/navigation';
import { updateQuestionAction } from '@/app/admin/actions';

// 샘플 데이터: /admin/questions/1 테스트용
async function getQuestionWithChoices(id: string) {
    if (id === '1') {
        return {
            id: '1',
            stem: '대한민국의 수도는 어디일까요?',
            difficulty: 2,
            language: 'ko',
            status: 'published',
            explanation: '대한민국의 수도는 서울입니다.',
            type: 'MCQ',
            choices: [
                { content: '서울', is_correct: true, order_no: 1 },
                { content: '부산', is_correct: false, order_no: 2 },
                { content: '인천', is_correct: false, order_no: 3 },
                { content: '대전', is_correct: false, order_no: 4 },
            ],
        };
    }
    return null;
}

export default async function QuestionEditPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params; // ✅ 반드시 await
    const question = await getQuestionWithChoices(id);
    if (!question) return notFound();

    const initialChoices = JSON.stringify(question.choices, null, 2);

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-bold mb-6">문제 수정</h1>

            {/* 서버 액션 반환타입은 void여야 함 */}
            <form action={updateQuestionAction} className="space-y-6">
                <input type="hidden" name="id" defaultValue={question.id} />

                <div>
                    <label className="block text-sm font-medium mb-1">문제 본문(stem)</label>
                    <textarea
                        name="stem"
                        className="w-full border rounded p-3"
                        rows={4}
                        defaultValue={question.stem}
                    />
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">난이도(1~5)</label>
                        <input
                            name="difficulty"
                            type="number"
                            min={1}
                            max={5}
                            className="w-full border rounded p-2"
                            defaultValue={question.difficulty ?? 3}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">언어</label>
                        <input
                            name="language"
                            className="w-full border rounded p-2"
                            defaultValue={question.language ?? 'ko'}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">상태</label>
                        <select
                            name="status"
                            className="w-full border rounded p-2"
                            defaultValue={question.status}
                        >
                            <option value="draft">draft</option>
                            <option value="published">published</option>
                            <option value="archived">archived</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">해설(explanation)</label>
                    <textarea
                        name="explanation"
                        className="w-full border rounded p-3"
                        rows={3}
                        defaultValue={question.explanation ?? ''}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">문제 유형(type)</label>
                    <select name="type" className="w-full border rounded p-2" defaultValue={question.type}>
                        <option value="MCQ">MCQ(객관식)</option>
                        <option value="TF">TF(참/거짓)</option>
                        <option value="SA">SA(주관식)</option>
                    </select>
                </div>

                {/* ✅ onClick/hidden 없이 바로 전송 */}
                <div>
                    <label className="block text-sm font-medium mb-1">선택지(choices) JSON</label>
                    <p className="text-xs text-gray-500 mb-2">
                        예: [{'{'}` "content": "서울", "is_correct": true, "order_no": 1 {'}'}]
                    </p>
                    <textarea
                        name="choices"                          // ← ✅ name으로 바로 전송
                        className="w-full border rounded p-3 font-mono text-sm"
                        rows={8}
                        defaultValue={initialChoices}
                    />
                </div>

                <div className="flex gap-3">
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                        저장
                    </button>
                    <a href="/admin" className="px-4 py-2 bg-gray-200 rounded">취소</a>
                </div>
            </form>
        </div>
    );
}
