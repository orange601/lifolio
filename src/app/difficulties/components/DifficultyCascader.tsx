'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HelpPage from '@/app/difficulties/components/Help';
import { DifficultyLevel, DifficultyOptions } from '@/app/difficulties/types/difficulty.type';

export default function QuizDifficultySelection() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // 선택된 난이도 레벨 ( 1 ~ 5 )
    const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // URL 파라미터에서 정보 가져오기
    const categoryId = searchParams.get('categoryId'); // 최종적으로 선택된 카테고리 ID

    // 뒤로가기
    const handleBack = () => {
        router.push('/categories');
    };

    // 난이도 선택 (숫자)
    const handleDifficultySelect = (difficulty: DifficultyLevel) => {
        setSelectedDifficulty(difficulty);
    };

    // 퀴즈 시작
    const handleStartQuiz = async () => {
        // 선택된 난이도가 없다면 리턴
        if (!selectedDifficulty) {
            return;
        };

        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 500)); // 로딩 연출
            router.push(`/quiz?categoryId=${categoryId}&difficulty=${selectedDifficulty}`);
        } catch (error) {
            console.error('퀴즈 시작 오류:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const selectedOption = selectedDifficulty
        ? DifficultyOptions.find((opt) => opt.value === selectedDifficulty)
        : null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleBack}
                            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="text-center flex-1">
                            <h1 className="text-lg font-semibold text-gray-900">난이도 선택</h1>
                            <p className="text-xs text-gray-500">마지막 단계</p>
                        </div>

                        <div className="w-10"></div>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* 난이도 옵션들 */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">난이도를 선택하세요</h3>

                    <div className="space-y-3">
                        {DifficultyOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleDifficultySelect(option.value)}
                                className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 shadow-sm active:scale-[0.98] ${selectedDifficulty === option.value
                                    ? `${option.color.border} ${option.color.bg} shadow-md`
                                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-start space-x-4">
                                    <div className="text-2xl mt-1">{option.icon}</div>

                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4
                                                className={`font-semibold text-lg ${selectedDifficulty === option.value ? option.color.text : 'text-gray-900'
                                                    }`}
                                            >
                                                {option.name}
                                            </h4>

                                            {selectedDifficulty === option.value && (
                                                <div
                                                    className={`w-5 h-5 ${option.color.accent} rounded-full flex items-center justify-center`}
                                                >
                                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>

                                        <p
                                            className={`text-sm mb-3 ${selectedDifficulty === option.value ? option.color.text : 'text-gray-600'
                                                }`}
                                        >
                                            {option.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 시작 버튼 */}
                <div className="pt-4">
                    <button
                        onClick={handleStartQuiz}
                        disabled={!selectedDifficulty || isLoading}
                        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${selectedDifficulty && !isLoading
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center space-x-2">
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                <span>퀴즈 준비 중...</span>
                            </div>
                        ) : selectedOption ? (
                            `${selectedOption.name} 퀴즈 시작`
                        ) : (
                            '난이도를 선택하세요'
                        )}
                    </button>
                </div>

                {/* 도움말 */}
                <HelpPage />
            </div>

            {/* 하단 여백 */}
            <div className="h-8"></div>
        </div>
    );
}
