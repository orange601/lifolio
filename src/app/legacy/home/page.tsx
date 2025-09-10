'use client';

import React from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
    const router = useRouter();

    const handleQuizClick = () => {
        router.push('/categories'); // 퀴즈 선택 페이지로 이동
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white text-gray-800">
            {/* 메인 콘텐츠 */}
            <main className="max-w-5xl mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">

                {/* 퀴즈 카드 */}
                <section
                    onClick={handleQuizClick}
                    className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center text-center cursor-pointer
                     transform transition duration-300 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-2xl"
                >
                    <div className="text-blue-700 text-6xl mb-4">📚</div>
                    <h2 className="text-lg font-semibold text-blue-900 mb-2">
                        Quiz
                    </h2>
                    <p className="text-sm text-gray-600">
                        재미있는 퀴즈를 풀고 지식을 테스트해보세요!
                    </p>
                    <button
                        onClick={handleQuizClick}
                        className="mt-6 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        퀴즈 시작
                    </button>
                </section>

            </main>
        </div>
    );
}