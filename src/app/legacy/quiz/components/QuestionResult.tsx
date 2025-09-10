// app/quiz/components/QuestionResultPage.tsx
'use client';

import React from 'react';

interface QuestionResultPageProps {
    isCorrect: boolean;
    correctText: string;
    explanation?: string | null;
    onContinue: () => void;
    isLastQuestion: boolean;
}

export default function QuestionResultPage({
    isCorrect,
    correctText,
    explanation,
    onContinue,
    isLastQuestion,
}: QuestionResultPageProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex flex-col">
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
                    <div className="text-6xl mb-6">{isCorrect ? "🎉" : "😅"}</div>

                    <h2 className={`text-2xl font-bold mb-4 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? "정답입니다!" : "틀렸습니다!"}
                    </h2>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                        <p className="text-sm text-gray-600 mb-2">정답:</p>
                        <p className="font-semibold text-blue-900">{correctText}</p>
                    </div>

                    {explanation && (
                        <div className="bg-blue-50 rounded-xl p-4 mb-6">
                            <p className="text-sm text-blue-800">{explanation}</p>
                        </div>
                    )}

                    <button
                        onClick={onContinue}
                        className="w-full py-4 bg-blue-700 hover:bg-blue-800 text-white rounded-xl font-semibold text-lg transition-colors"
                    >
                        {isLastQuestion ? "결과 보기" : "다음 문제"}
                    </button>
                </div>
            </div>
        </div>
    );
}
