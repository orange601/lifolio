// app/components/ui/timer/QuizTimer.tsx
'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';

export type QuizTimerRef = {
    getRemaining: () => number;
    reset: () => void;
};

type Props = {
    /** 시작 초(기본 30초) */
    duration?: number;
    /** 일시정지 여부 (결과/완료 화면 등에서 멈춤) */
    paused?: boolean;
    /** 시간 초과 콜백 (부모에서 오답 처리 등) */
    onTimeOver: () => void;
};

const QuizTimer = forwardRef<QuizTimerRef, Props>(function QuizTimer(
    { duration = 30, paused = false, onTimeOver },
    ref
) {
    const [remaining, setRemaining] = useState<number>(duration);
    const intervalRef = useRef<number | null>(null);

    // imperative handle: 부모가 남은 시간 조회/리셋 가능
    useImperativeHandle(ref, () => ({
        getRemaining: () => remaining,
        reset: () => setRemaining(duration),
    }), [remaining, duration]);

    useEffect(() => {
        // 일시정지 시 타이머 정지
        if (paused) {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // 이미 동작 중이면 무시
        if (intervalRef.current) return;

        intervalRef.current = window.setInterval(() => {
            setRemaining(prev => {
                if (prev <= 1) {
                    // 0이 되면 멈추고 알림
                    if (intervalRef.current) {
                        window.clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                    onTimeOver();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) {
                window.clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [paused, onTimeOver]);

    // 간단한 뱃지 UI (필요 없으면 제거해도 됨)
    return (
        <>
            <div className="quiz-timer-badge">{remaining}s</div>
            <style jsx>{`
                .quiz-timer-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    min-width: 48px;
                    height: 32px;
                    padding: 0 8px;
                    border-radius: 9999px;
                    background: rgba(0, 0, 0, 0.5);
                    color: #fff;
                    font-size: 0.9rem;
                    font-weight: 600;
                    backdrop-filter: blur(6px);
                    user-select: none;
                }
      `}</style>
        </>
    );
});

export default QuizTimer;
