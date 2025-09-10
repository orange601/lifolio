'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { FindAllCategories } from '@/core/repositroy/categories/category.type';
import HelpPage from '@/app/categories/components/help';
import RandomCard from '@/app/categories/components/randomCard';
import StatusBar from '@/app/categories/components/statusBar';

export default function QuizCategorySelection({ quizCategories }: { quizCategories: FindAllCategories[] }) {
    console.log("quizCategories :", quizCategories)
    const router = useRouter();

    // 현재 선택 경로 상태
    const [selectedPath, setSelectedPath] = useState<number[]>([]);

    // 현재 레벨에서 보여줄 카테고리들 계산
    const currentLevelCategories = useMemo(() => {
        if (selectedPath.length === 0) {
            // 1레벨: parent_id가 null인 카테고리들
            return quizCategories.filter((category) => category.parent_id === null);
        }
        // 현재 선택된 마지막 카테고리의 자식들
        const parentId = selectedPath[selectedPath.length - 1];
        return quizCategories.filter((category) => category.parent_id === parentId);
    }, [quizCategories, selectedPath]);

    // 현재 선택된 카테고리의 경로 텍스트
    const getPathText = () => {
        return selectedPath
            .map((id) => {
                const category = quizCategories.find((c) => c.id === id);
                return category?.name || '';
            })
            .join(' → ');
    };

    // 카테고리 선택 처리
    const handleCategorySelect = (categoryId: number) => {

        const newPath = [...selectedPath, categoryId];
        setSelectedPath(newPath);

        // 선택된 카테고리에 자식이 있는지 확인
        const hasChildren = quizCategories.some((cat) => cat.parent_id === categoryId);

        if (!hasChildren) {
            // 자식이 없으면 난이도 선택 페이지로 이동
            const selectedCategory = quizCategories.find((c) => c.id === categoryId);
            if (selectedCategory) {
                const selectedCategoryId = selectedCategory.id; // 최종적으로 선택된 카테고리 ID
                // 난이도 선택 페이지로 이동
                router.push(`/difficulty?categoryId=${selectedCategoryId}`);
            }
        }
    };

    // 뒤로가기 처리
    const handleBackStep = () => {
        if (selectedPath.length > 0) {
            setSelectedPath(selectedPath.slice(0, -1));
        }
    };

    // 현재 레벨 정보
    const currentLevel = selectedPath.length + 1;
    const maxLevel = 3;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 분리된 상태바 컴포넌트 */}
            <StatusBar
                currentLevel={currentLevel}
                maxLevel={maxLevel}
                canGoBack={selectedPath.length > 0}
                onBack={handleBackStep}
            />

            <div className="p-4 space-y-6">
                {/* 선택된 경로 표시 */}
                {selectedPath.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-xs text-blue-600 font-medium mb-1">선택된 경로</p>
                        <p className="text-blue-900 font-semibold">{getPathText()}</p>
                    </div>
                )}

                {/* 랜덤 퀴즈 카드 (첫 번째 레벨에서만 표시) */}
                {selectedPath.length === 0 && <RandomCard />}

                {/* 카테고리 선택 섹션 */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {selectedPath.length === 0 ? '주제를 선택하세요' : '세부 주제를 선택하세요'}
                    </h2>

                    {currentLevelCategories.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">📚</div>
                            <p className="text-gray-500">하위 카테고리가 없습니다</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {currentLevelCategories.map((category) => {
                                const hasChildren = quizCategories.some((cat) => cat.parent_id === category.id);

                                return (
                                    <button
                                        key={category.id}
                                        onClick={() => handleCategorySelect(category.id)}
                                        className="bg-white rounded-xl p-4 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left shadow-sm active:scale-[0.98]"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900 mb-1">{category.name}</h3>
                                                <p className="text-xs text-gray-500">
                                                    {hasChildren ? '하위 카테고리 있음' : '퀴즈 시작 가능'}
                                                </p>
                                            </div>

                                            <div className="ml-3 flex items-center">
                                                {hasChildren ? (
                                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                ) : (
                                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 도움말 */}
                <HelpPage selectedPath={selectedPath} />
            </div>

            {/* 하단 여백 */}
            <div className="h-8" />
        </div>
    );
}
