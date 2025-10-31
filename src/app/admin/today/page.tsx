'use client'

import React, { useEffect, useMemo, useState, useTransition } from 'react'
import { listQuizSets, addQuestionToQuizSet, saveQuestion, type QuizSetItem } from './actions'
import { listCategories, type CategoryItem } from '@/app/admin/actions';

export default function CreateQuestionPage() {
    // form states
    const [categories, setCategories] = useState<CategoryItem[]>([])
    const [quizSets, setQuizSets] = useState<QuizSetItem[]>([])
    const [quizSetId, setQuizSetId] = useState<number | ''>('')
    const [orderNo, setOrderNo] = useState<number | ''>('')
    const [points, setPoints] = useState<number>(1)
    const [categoryId, setCategoryId] = useState<number | ''>('')
    const [type, setType] = useState<'MCQ' | 'SUBJECTIVE'>('SUBJECTIVE')
    const [status, setStatus] = useState<'published' | 'draft'>('published')
    const [stem, setStem] = useState('')
    const [explanation, setExplanation] = useState('')
    const [subjectiveAnswer, setSubjectiveAnswer] = useState('')
    const [difficulty, setDifficulty] = useState<number | ''>(1)
    const [grade, setGrade] = useState('general')
    const [language, setLanguage] = useState('ko')

    const [isPending, startTransition] = useTransition()

    // load categories
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

    const canSubmit = useMemo(() => {
        if (!stem.trim() || !categoryId || !status) return false
        if (type === 'SUBJECTIVE' && !subjectiveAnswer.trim()) return false
        return true
    }, [stem, categoryId, status, type, subjectiveAnswer])

    const onSubmit = () => {
        if (!canSubmit) return
        startTransition(async () => {
            try {
                const { id } = await saveQuestion({
                    type,
                    stem: stem.trim(),
                    explanation: explanation?.trim() || null,
                    difficulty: typeof difficulty === 'number' ? difficulty : null,
                    grade: grade || 'general',
                    language: language || 'ko',
                    status,
                    category_id: Number(categoryId),
                    subjective_answer: type === 'SUBJECTIVE' ? subjectiveAnswer.trim() : null,
                })

                if (quizSetId) {
                    await addQuestionToQuizSet({
                        quiz_id: Number(quizSetId),
                        question_id: id,
                        order_no: typeof orderNo === 'number' ? orderNo : null,
                        points: points ?? 1,
                    })
                }

                alert(`문제가 저장되었습니다. (id=${id}${quizSetId ? `, quiz_set=${quizSetId}` : ''})`)
                // reset minimal
                setStem('')
                setExplanation('')
                setSubjectiveAnswer('')
                setOrderNo('')
                setPoints(1)
            } catch (e: any) {
                alert(e?.message ?? '저장 실패')
            }
        })
    }

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <div className="max-w-xl">
                <div className="container-header">
                    <div className="text-lg font-semibold">✍️ 만들기</div>
                </div>

                <div className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border border-white/30">
                    {/* Category */}
                    <div className="grid md:grid-cols-2 gap-4">
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700">문제 유형</label>
                            <select
                                className="mt-1 w-full border rounded p-2"
                                value={type}
                                onChange={(e) => setType(e.target.value as 'MCQ' | 'SUBJECTIVE')}
                            >
                                <option value="MCQ">객관식 (MCQ)</option>
                                <option value="SUBJECTIVE">주관식</option>
                            </select>
                        </div>

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

                        {quizSetId && (
                            <>
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
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700">학년/레벨 (옵션)</label>
                            <input
                                className="mt-1 w-full border rounded p-2"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                placeholder="예: general, elem3, middle1, ..."
                            />
                        </div>
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

                    {/* Stem */}
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

                    {/* Subjective Answer (only when SUBJECTIVE) */}
                    {type === 'SUBJECTIVE' && (
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">주관식 정답 (subjective_answer)</label>
                            <input
                                className="mt-1 w-full border rounded p-2"
                                value={subjectiveAnswer}
                                onChange={(e) => setSubjectiveAnswer(e.target.value)}
                                placeholder="정답 텍스트"
                            />
                        </div>
                    )}

                    {/* Explanation */}
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
                                setStem(''); setExplanation(''); setSubjectiveAnswer('')
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