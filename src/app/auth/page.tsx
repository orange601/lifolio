'use client';

import { SignedIn, SignedOut, useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import AuthSignInCard from './components/AuthSignInCard';
import AuthSignUpCard from './components/AuthSignUpCard';
import { useRouter } from 'next/navigation';

export default function RankAuthGate() {
    const [view, setView] = useState<'choice' | 'signin' | 'signup'>('choice');
    const { isSignedIn, isLoaded } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.push('/question/rank');
        }
    }, [isLoaded, isSignedIn, router]);

    return (
        <>
            {/* 로그아웃 상태면 모달 오버레이 */}
            <SignedOut>
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white/90 p-4 shadow-2xl">
                        {view === 'choice' && (
                            <div className="flex flex-col gap-3">
                                <h3 className="text-xl font-bold">랭킹전은 로그인 후 이용 가능해요</h3>
                                <p className="text-sm text-gray-600">
                                    기존 계정이 있으면 로그인, 처음이면 회원가입을 선택하세요.
                                </p>

                                <div className="mt-2 grid grid-cols-2 gap-3">
                                    <button
                                        className="rounded-xl border border-gray-300 px-4 py-3 font-semibold hover:bg-gray-50"
                                        onClick={() => setView('signin')}
                                    >
                                        🔑 로그인
                                    </button>
                                    <button
                                        className="rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700"
                                        onClick={() => setView('signup')}
                                    >
                                        📝 회원가입
                                    </button>
                                </div>

                                <button
                                    className="mt-3 text-sm text-gray-500 underline"
                                    onClick={() => (window.location.href = '/')}
                                >
                                    홈으로 돌아가기
                                </button>
                            </div>
                        )}

                        {/* 로그인 페이지 */}
                        {view === 'signin' && (
                            <AuthSignInCard
                                onBack={() => setView('choice')}
                                onSwitchToSignUp={() => setView('signup')}
                            />
                        )}

                        {/* 회원가입 페이지 */}
                        {view === 'signup' && (
                            <AuthSignUpCard
                                onBack={() => setView('choice')}
                                onSwitchToSignIn={() => setView('signin')}
                            />
                        )}
                    </div>
                </div>
            </SignedOut>
        </>
    );
}
