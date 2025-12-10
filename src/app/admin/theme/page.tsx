'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { saveQuizSet } from './actions';
import Link from "next/link";
import { searchQuestions, CategoryItem, listCategories } from '@/app/admin/actions';

type Question = {
    id: number;
    stem: string | null;
    category_id: number | null;
    difficulty: number | null;
    grade: string | null;
    language: string | null;
    status: string | null;
    type: string | null;
};

type SelectedItem = { question_id: number; order_no: number; points: number };

export default function QuickSetPage() {
    // 검색/페이지
    const [query, setQuery] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 20;

    // 필터 상태 추가
    const [filterType, setFilterType] = useState<string>('');
    const [filterCategory, setFilterCategory] = useState<number | ''>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [categories, setCategories] = useState<CategoryItem[]>([]);

    // 문항 목록
    const [items, setItems] = useState<Question[]>([]);
    const [total, setTotal] = useState(0);
    const [isPending, startTransition] = useTransition();

    // 선택 바구니
    const [selected, setSelected] = useState<SelectedItem[]>([]);

    // 세트 메타
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isRandom, setIsRandom] = useState(false);

    const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);

    // 카테고리 목록 로드
    useEffect(() => {
        startTransition(async () => {
            const rows = await listCategories();
            setCategories(rows.filter(r => r.published !== false));
        });
    }, []);

    // 문항 로드 (서버 액션 직접 호출) - 필터 포함
    useEffect(() => {
        startTransition(async () => {
            const res = await searchQuestions({
                query,
                page,
                pageSize,
                type: filterType || undefined,
                category_id: filterCategory || undefined,
                status: filterStatus || undefined,
            });
            setItems(res.items);
            setTotal(res.total);
        });
    }, [query, page, filterType, filterCategory, filterStatus]);

    const addItem = (q: Question) => {
        if (selected.some(s => s.question_id === q.id)) return;
        setSelected(prev => [
            ...prev,
            { question_id: q.id, order_no: prev.length + 1, points: 1 },
        ]);
    };

    const removeItem = (question_id: number) => {
        setSelected(prev =>
            prev.filter(s => s.question_id !== question_id)
                .map((s, idx) => ({ ...s, order_no: idx + 1 }))
        );
    };

    const move = (question_id: number, dir: -1 | 1) => {
        setSelected(prev => {
            const idx = prev.findIndex(s => s.question_id === question_id);
            if (idx < 0) return prev;
            const nextIdx = idx + dir;
            if (nextIdx < 0 || nextIdx >= prev.length) return prev;
            const copy = [...prev];
            [copy[idx], copy[nextIdx]] = [copy[nextIdx], copy[idx]];
            return copy.map((s, i) => ({ ...s, order_no: i + 1 }));
        });
    };

    const setPoints = (question_id: number, p: number) => {
        setSelected(prev => prev.map(s => s.question_id === question_id ? { ...s, points: p } : s));
    };

    const onSave = async () => {
        if (!title.trim()) {
            alert('세트 제목을 입력하세요.');
            return;
        }
        if (selected.length === 0) {
            alert('최소 1개 이상의 문항을 선택하세요.');
            return;
        }
        startTransition(async () => {
            try {
                const { id } = await saveQuizSet({
                    title: title.trim(),
                    description: description || null,
                    is_random: isRandom,
                    items: selected.map(s => ({
                        question_id: s.question_id,
                        order_no: s.order_no,
                        points: s.points,
                    })),
                });
                alert(`저장 완료! quiz_set.id=${id}`);
                // 초기화
                setSelected([]);
                setTitle('');
                setDescription('');
            } catch (e: any) {
                alert(`저장 실패: ${e?.message ?? 'unknown error'}`);
            }
        });
    };

    return (
        <div className="p-4 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold mb-3">퀵 세트 만들기 (API 없음 / 서버액션)</h1>

            {/* 세트 정보 + 선택 바구니 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="md:col-span-2 border rounded p-3">
                    <label className="text-sm font-medium">세트 제목</label>
                    <input
                        className="mt-1 w-full border rounded p-2"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="예) 중1 지구과학 기초 세트"
                    />
                    <label className="text-sm font-medium mt-3 block">설명(선택)</label>
                    <textarea
                        className="mt-1 w-full border rounded p-2"
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="세트에 대한 간단한 설명"
                    />
                    <div className="mt-3 flex items-center gap-2">
                        <input
                            id="isRandom"
                            type="checkbox"
                            checked={isRandom}
                            onChange={e => setIsRandom(e.target.checked)}
                        />
                        <label htmlFor="isRandom" className="text-sm">
                            문제 순서 무작위(is_random)
                        </label>
                    </div>
                </div>

                <div className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-semibold">선택한 문항 ({selected.length})</h2>
                        <button className="text-sm px-2 py-1 border rounded" onClick={() => setSelected([])}>
                            전체 비우기
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
                        {selected.map(s => (
                            <div key={s.question_id} className="border rounded p-2">
                                <div className="text-sm text-gray-700">QID: {s.question_id}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <button className="px-2 py-1 border rounded" onClick={() => move(s.question_id, -1)}>▲</button>
                                    <button className="px-2 py-1 border rounded" onClick={() => move(s.question_id, 1)}>▼</button>
                                    <div className="text-sm">순서: {s.order_no}</div>
                                    <div className="ml-auto flex items-center gap-2">
                                        <span className="text-sm">배점</span>
                                        <input
                                            type="number"
                                            min={0}
                                            step={0.5}
                                            className="w-20 border rounded p-1 text-right"
                                            value={s.points}
                                            onChange={e => setPoints(s.question_id, Number(e.target.value))}
                                        />
                                        <button className="px-2 py-1 border rounded" onClick={() => removeItem(s.question_id)}>삭제</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {selected.length === 0 && (
                            <div className="text-sm text-gray-500">아직 선택한 문항이 없습니다.</div>
                        )}
                    </div>

                    <button
                        className="mt-3 w-full py-2 rounded bg-black text-white disabled:opacity-60"
                        onClick={onSave}
                        disabled={isPending}
                    >
                        {isPending ? '저장 중…' : '세트 저장'}
                    </button>
                </div>
            </div>

            {/* 문항 검색/목록 */}
            <div className="border rounded p-3">
                <div className="flex items-center gap-2 mb-3">
                    <input
                        className="flex-1 border rounded p-2"
                        value={query}
                        onChange={e => { setPage(1); setQuery(e.target.value); }}
                        placeholder="키워드(문항 지문) 검색"
                    />
                    <button className="px-3 py-2 border rounded" onClick={() => setPage(1)}>
                        검색
                    </button>
                </div>

                {/* 필터 영역 추가 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">문제 유형</label>
                        <select
                            className="w-full border rounded p-2 text-sm"
                            value={filterType}
                            onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
                        >
                            <option value="">전체</option>
                            <option value="MCQ">객관식 (MCQ)</option>
                            <option value="SUBJECTIVE">주관식</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">카테고리</label>
                        <select
                            className="w-full border rounded p-2 text-sm"
                            value={filterCategory}
                            onChange={(e) => {
                                setFilterCategory(e.target.value ? Number(e.target.value) : '');
                                setPage(1);
                            }}
                        >
                            <option value="">전체</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.id}. {c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">상태</label>
                        <select
                            className="w-full border rounded p-2 text-sm"
                            value={filterStatus}
                            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                        >
                            <option value="">전체</option>
                            <option value="published">published (공개)</option>
                            <option value="draft">draft (비공개)</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="text-left p-2">ID</th>
                                <th className="text-left p-2">지문(stem)</th>
                                <th className="text-left p-2">유형</th>
                                <th className="text-left p-2">카테고리</th>
                                <th className="text-left p-2">난이도</th>
                                <th className="text-left p-2">학년</th>
                                <th className="text-left p-2">상태</th>
                                <th className="text-left p-2">수정</th>
                                <th className="text-left p-2">선택</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isPending ? (
                                <tr><td colSpan={8} className="p-4 text-center">불러오는 중…</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={8} className="p-4 text-center">결과 없음</td></tr>
                            ) : (
                                items.map(q => (
                                    <tr key={q.id} className="border-b">
                                        <td className="p-2">{q.id}</td>
                                        <td className="p-2">{q.stem ?? '-'}</td>
                                        <td className="p-2">{q.type ?? '-'}</td>
                                        <td className="p-2">{q.category_id ?? '-'}</td>
                                        <td className="p-2">{q.difficulty ?? '-'}</td>
                                        <td className="p-2">{q.grade ?? '-'}</td>
                                        <td className="p-2">{q.status ?? '-'}</td>
                                        <td className="p-2">
                                            <Link
                                                className="px-2 py-1 border rounded inline-block"
                                                href={`/admin/questions/${q.id}`}
                                            >
                                                수정
                                            </Link>
                                        </td>
                                        <td className="p-2">
                                            <button
                                                className="px-2 py-1 border rounded disabled:opacity-50"
                                                disabled={selected.some(s => s.question_id === q.id)}
                                                onClick={() => addItem(q)}
                                            >
                                                담기
                                            </button>
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
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                        이전
                    </button>
                    <div className="text-sm">{page} / {totalPages}</div>
                    <button
                        className="px-2 py-1 border rounded"
                        disabled={page >= totalPages || isPending}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                        다음
                    </button>
                </div>
            </div>
        </div>
    );
}
