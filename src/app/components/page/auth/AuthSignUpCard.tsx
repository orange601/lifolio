'use client';

import { SignUp } from '@clerk/nextjs';

type Props = {
    onBack: () => void;            // "선택 화면으로" 돌아가기
    onSwitchToSignIn: () => void;  // 로그인 화면으로 전환
};

export default function AuthSignUpCard({ onBack, onSwitchToSignIn }: Props) {
    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">회원가입</h3>
                <button
                    className="text-sm text-indigo-600 underline"
                    onClick={onSwitchToSignIn}
                >
                    로그인으로 전환
                </button>
            </div>

            <SignUp
                routing="hash"  // 모달 내부 해시 라우팅
                fallbackRedirectUrl="/user" // 기본 리다이렉트 URL
                appearance={{
                    elements: {
                        formButtonPrimary:
                            'bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg',
                        card: 'bg-white/0 shadow-none p-0',
                    },
                }}
            />
            <button
                className="mt-2 text-sm text-gray-500 underline"
                onClick={onBack}
            >
                선택 화면으로
            </button>
        </div>
    );
}
