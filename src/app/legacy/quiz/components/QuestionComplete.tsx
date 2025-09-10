// app/quiz/components/QuestionCompletePage.tsx
'use client';

import React from 'react';

interface QuestionCompletePageProps {
    categoryIcon: React.ReactNode;
    categoryName: string;
    score: number;
    total: number;
    difficulty: number;
    difficultyLabel: (d: number) => string;
    onRestart: () => void;
    onBackToSelection: () => void;
}

export default function QuestionCompletePage({
    categoryIcon,
    categoryName,
    score,
    total,
    difficulty,
    difficultyLabel,
    onRestart,
    onBackToSelection,
}: QuestionCompletePageProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
                    <div className="text-6xl mb-6">{categoryIcon}</div>
                    <h1 className="text-2xl font-bold text-blue-900 mb-2">
                        {categoryName} 퀴즈 완료!
                    </h1>
                    <div className="text-4xl font-bold text-blue-700 mb-2">
                        {score}/{total}
                    </div>
                    <p className="text-gray-600 mb-6">
                        정답률: {Math.round((score / total) * 100)}%
                    </p>

                    <div className="bg-gray-100 rounded-lg p-3 mb-6">
                        <p className="text-sm text-gray-600">
                            난이도:{" "}
                            <span className="font-semibold">
                                {difficulty} / 5 ({difficultyLabel(difficulty)})
                            </span>
                        </p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={onRestart}
                            className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold text-lg transition-colors"
                        >
                            다시 도전하기
                        </button>
                        <button
                            onClick={onBackToSelection}
                            className="w-full py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold text-lg transition-colors"
                        >
                            다른 퀴즈 선택
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
