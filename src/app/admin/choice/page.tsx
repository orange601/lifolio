'use client'

import React, { useEffect, useMemo, useState, useTransition } from 'react'
import { saveMCQQuestion, type ChoiceCreateInput } from './actions'
import { listQuizSets, addQuestionToQuizSet, type QuizSetItem } from '@/app/admin/today/actions'
import { listCategories, type CategoryItem } from '@/app/admin/actions'

export default function CreateMCQQuestionPage() {
    // 공통 폼 상태
    const [categories, setCategories] = useState<CategoryItem[]>([])
    const [quizSets, setQuizSets] = useState<QuizSetItem[]>([])
    const [quizSetId, setQuizSetId] = useState<number | ''>('')
    const [orderNo, setOrderNo] = useState<number | ''>('')
    const [points, setPoints] = useState<number>(1)

    const [categoryId, setCategoryId] = useState<number | ''>('')
    const [status, setStatus] = useState<'published' | 'draft'>('published')
    const [stem, setStem] = useState('')
    const [explanation, setExplanation] = useState('')
    const [difficulty, setDifficulty] = useState<number | ''>(1)
    const [grade, setGrade] = useState('general')
    const [language, setLanguage] = useState('ko')
    const [singleCorrect, setSingleCorrect] = useState(true) // 기본: 단일정답

    // 보기 상태
    const [choices, setChoices] = useState<ChoiceCreateInput[]>([
        { content: '', is_correct: true, order_no: 1 },
        { content: '', is_correct: false, order_no: 2 },
    ])

    const [isPending, startTransition] = useTransition()

    // 데이터 로드
    useEffect(() => {
        startTransition(async () => {
            const rows = await listCategories()
            setCategories(rows.filter(r => r.published !== false))
        })
    }, [])

    useEffect(() => {
        startTransition(async () => {
            const sets = await listQuizSets()
            setQuizSets(sets.filter(s => s.status !== 'archived'))
        })
    }, [])

    // 검증
    const canSubmit = useMemo(() => {
        if (!stem.trim() || !categoryId || !status) return false
        if (choices.length < 2) return false
        const filled = choices.every(c => c.content.trim().length > 0)
        if (!filled) return false
        const correctCount = choices.filter(c => c.is_correct).length
        if (singleCorrect) return correctCount === 1
        return correctCount >= 1
    }, [stem, categoryId, status, choices, singleCorrect])

    // 보기 조작
    const addChoice = () => {
        setChoices(prev => {
            const nextOrder = (prev[prev.length - 1]?.order_no ?? prev.length) + 1
            return [...prev, { content: '', is_correct: false, order_no: nextOrder }]
        })
    }

    const removeChoice = (idx: number) => {
        setChoices(prev => {
            if (prev.length <= 2) return prev // 최소 2개 유지
            const next = prev.filter((_, i) => i !== idx)
            // 순번 재정렬
            return next.map((c, i) => ({ ...c, order_no: i + 1 }))
        })
    }

    const updateChoiceContent = (idx: number, v: string) => {
        setChoices(prev => prev.map((c, i) => i === idx ? { ...c, content: v } : c))
    }

    const markCorrect = (idx: number, checked: boolean) => {
        setChoices(prev => {
            if (singleCorrect && checked) {
                // 단일정답: 라디오처럼 동작
                return prev.map((c, i) => ({ ...c, is_correct: i === idx }))
            }
            // 복수정답 허용 모드
            return prev.map((c, i) => i === idx ? { ...c, is_correct: checked } : c)
        })
    }

    const moveUp = (idx: number) => {
        if (idx === 0) return
        setChoices(prev => {
            const next = [...prev]
                ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
            return next.map((c, i) => ({ ...c, order_no: i + 1 }))
        })
    }
    const moveDown = (idx: number) => {
        if (idx === choices.length - 1) return
        setChoices(prev => {
            const next = [...prev]
                ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
            return next.map((c, i) => ({ ...c, order_no: i + 1 }))
        })
    }

    const onSubmit = () => {
        if (!canSubmit) return
        startTransition(async () => {
            try {
                const { id, success } = await saveMCQQuestion({
                    stem: stem.trim(),
                    explanation: explanation?.trim() || null,
                    difficulty: typeof difficulty === 'number' ? difficulty : null,
                    grade: grade || 'general',
                    language: language || 'ko',
                    status,
                    category_id: Number(categoryId),
                    choices: choices.map(c => ({
                        content: c.content.trim(),
                        is_correct: !!c.is_correct,
                        order_no: c.order_no ?? null,
                    })),
                    singleCorrect, // 서버에서도 동일 정책 검증
                })

                if (!success || !id) throw new Error('저장 실패')

                if (quizSetId) {
                    await addQuestionToQuizSet({
                        quiz_id: Number(quizSetId),
                        question_id: id,
                        order_no: typeof orderNo === 'number' ? orderNo : null,
                        points: points ?? 1,
                    })
                }

                alert(`문제가 저장되었습니다. (id=${id}${quizSetId ? `, quiz_set=${quizSetId}` : ''})`)

                // 최소 초기화
                setStem('')
                setExplanation('')
                setOrderNo('')
                setPoints(1)
                setChoices([
                    { content: '', is_correct: true, order_no: 1 },
                    { content: '', is_correct: false, order_no: 2 },
                ])
            } catch (e: any) {
                alert(e?.message ?? '저장 실패')
            }
        })
    }

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="max-w-xl">
                <div className="container-header">
                    <div className="text-lg font-semibold">📝 객관식 만들기</div>
                </div>

                <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border border-white/30">
                    {/* 상단 메타 */}
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* 카테고리 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">카테고리</label>
                            <select
                                className="mt-1 w-full border rounded p-2"
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">카테고리 선택</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.id}. {c.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* 퀴즈 세트 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">퀴즈 세트 (선택)</label>
                            <select
                                className="mt-1 w-full border rounded p-2"
                                value={quizSetId}
                                onChange={(e) => setQuizSetId(e.target.value ? Number(e.target.value) : '')}
                            >
                                <option value="">세트 선택 안 함</option>
                                {quizSets.map(s => (
                                    <option key={s.id} value={s.id}>{s.id}. {s.title} [{s.status}]</option>
                                ))}
                            </select>
                        </div>

                        {/* 상태 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">상태 (status)</label>
                            <select
                                className="mt-1 w-full border rounded p-2"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as 'published' | 'draft')}
                            >
                                <option value="published">published (공개)</option>
                                <option value="draft">draft (비공개)</option>
                            </select>
                        </div>

                        {/* 난이도 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">난이도 (옵션)</label>
                            <input
                                type="number"
                                min={1}
                                max={5}
                                className="mt-1 w-full border rounded p-2"
                                value={difficulty}
                                onChange={(e) => {
                                    const v = e.target.value
                                    setDifficulty(v === '' ? '' : Math.max(1, Math.min(5, Number(v))))
                                }}
                                placeholder="1~5"
                            />
                        </div>

                        {/* 학년/레벨 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">학년/레벨 (옵션)</label>
                            <input
                                className="mt-1 w-full border rounded p-2"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                placeholder="예: general, elem3, middle1, ..."
                            />
                        </div>

                        {/* 언어 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">언어 (옵션)</label>
                            <input
                                className="mt-1 w-full border rounded p-2"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                placeholder="ko / en 등"
                            />
                        </div>
                    </div>

                    {/* 지문 */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">문제 (stem)</label>
                        <textarea
                            className="mt-1 w-full border rounded p-2"
                            rows={3}
                            value={stem}
                            onChange={(e) => setStem(e.target.value)}
                            placeholder="문제 지문을 입력하세요"
                        />
                    </div>

                    {/* 보기 리스트 */}
                    <div className="mt-6">
                        <div className="flex items-center justify-between">
                            <label className="block text-sm font-medium text-gray-700">보기</label>
                            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    className="mr-1"
                                    checked={singleCorrect}
                                    onChange={(e) => {
                                        const checked = e.target.checked
                                        setSingleCorrect(checked)
                                        // 단일정답 전환 시, 정답 0개면 1번 보기를 정답으로
                                        if (checked) {
                                            const hasAny = choices.some(c => c.is_correct)
                                            if (!hasAny) {
                                                setChoices(prev => prev.map((c, i) => ({ ...c, is_correct: i === 0 })))
                                            } else {
                                                // 여러개 체크됬다면 첫 번째만 남기기
                                                setChoices(prev => {
                                                    let first = true
                                                    return prev.map(c => {
                                                        if (c.is_correct && first) { first = false; return c }
                                                        return { ...c, is_correct: false }
                                                    })
                                                })
                                            }
                                        }
                                    }}
                                />
                                단일 정답
                            </label>
                        </div>

                        <div className="mt-2 space-y-3">
                            {choices.map((ch, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    {/* 정답 표시 */}
                                    <div className="pt-2">
                                        {singleCorrect ? (
                                            <input
                                                type="radio"
                                                name="correct"
                                                checked={ch.is_correct}
                                                onChange={() => markCorrect(idx, true)}
                                                className="mt-2"
                                                title="정답"
                                            />
                                        ) : (
                                            <input
                                                type="checkbox"
                                                checked={ch.is_correct}
                                                onChange={(e) => markCorrect(idx, e.target.checked)}
                                                className="mt-2"
                                                title="정답"
                                            />
                                        )}
                                    </div>

                                    {/* 내용 */}
                                    <div className="flex-1">
                                        <input
                                            className="w-full border rounded p-2"
                                            value={ch.content}
                                            onChange={(e) => updateChoiceContent(idx, e.target.value)}
                                            placeholder={`보기 ${idx + 1} 내용`}
                                        />
                                        <div className="mt-1 flex gap-2">
                                            <button
                                                type="button"
                                                className="text-xs px-2 py-1 border rounded"
                                                onClick={() => moveUp(idx)}
                                                disabled={idx === 0}
                                                title="위로"
                                            >
                                                ↑
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs px-2 py-1 border rounded"
                                                onClick={() => moveDown(idx)}
                                                disabled={idx === choices.length - 1}
                                                title="아래로"
                                            >
                                                ↓
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs px-2 py-1 border rounded"
                                                onClick={() => removeChoice(idx)}
                                                disabled={choices.length <= 2}
                                                title="삭제"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-3">
                            <button type="button" className="px-3 py-1 border rounded" onClick={addChoice}>
                                + 보기 추가
                            </button>
                        </div>
                    </div>

                    {/* 해설 */}
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">해설 (explanation)</label>
                        <textarea
                            className="mt-1 w-full border rounded p-2"
                            rows={3}
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            placeholder="해설을 입력하세요 (선택)"
                        />
                    </div>

                    {/* 세트 내 배치 옵션 */}
                    {quizSetId && (
                        <div className="mt-4 grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">세트 내 순서 (order_no, 옵션)</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="mt-1 w-full border rounded p-2"
                                    value={orderNo}
                                    onChange={(e) => {
                                        const v = e.target.value
                                        setOrderNo(v === '' ? '' : Math.max(1, Number(v)))
                                    }}
                                    placeholder="예: 1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">배점 (points)</label>
                                <input
                                    type="number"
                                    step={0.5}
                                    min={0}
                                    className="mt-1 w-full border rounded p-2"
                                    value={points}
                                    onChange={(e) => setPoints(Number(e.target.value) || 0)}
                                    placeholder="기본값 1"
                                />
                            </div>
                        </div>
                    )}

                    {/* 저장 버튼 */}
                    <div className="mt-5 flex gap-2">
                        <button
                            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
                            disabled={!canSubmit || isPending}
                            onClick={onSubmit}
                        >
                            {isPending ? '저장 중…' : '문제 저장'}
                        </button>
                        <button
                            className="px-4 py-2 rounded border"
                            onClick={() => {
                                setStem('')
                                setExplanation('')
                                setChoices([
                                    { content: '', is_correct: true, order_no: 1 },
                                    { content: '', is_correct: false, order_no: 2 },
                                ])
                            }}
                        >
                            초기화
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
