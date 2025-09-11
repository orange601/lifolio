'use client';

/**
 * 뒤로가기 버튼 new 버전
 */

import React from "react";

type Props = {
    onBack: () => void;
};

export default function QuizContainerHeaderBackButton({ onBack }: Props) {
    return (
        <>
            <button
                onClick={onBack}
                className="customBackButton"
                aria-label="뒤로가기"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="backIcon"
                >
                    <path
                        d="M15 18L9 12L15 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </button>

            <style jsx>{`
                        .customBackButton {
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 44px;
                            height: 44px;
                            border: none;
                            border-radius: 12px;
                            background: rgba(255, 255, 255, 0.15);
                            backdrop-filter: blur(10px);
                            cursor: pointer;
                            transition: all 0.2s ease;
                            color: white;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                        }

                        .customBackButton:hover {
                            background: rgba(255, 255, 255, 0.25);
                            transform: translateY(-1px);
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        }

                        .customBackButton:active {
                            transform: translateY(0);
                            background: rgba(255, 255, 255, 0.2);
                        }

                        .backIcon {
                            width: 20px;
                            height: 20px;
                            transition: transform 0.2s ease;
                        }

                        .customBackButton:hover .backIcon {
                            transform: translateX(-2px);
                        }

                        /* 반응형 */
                        @media (max-width: 480px) {
                            .customBackButton {
                                width: 40px;
                                height: 40px;
                            }
                            
                            .backIcon {
                                width: 18px;
                                height: 18px;
                            }
                        }

                        @media (max-width: 360px) {
                            .customBackButton {
                                width: 36px;
                                height: 36px;
                            }
                            
                            .backIcon {
                                width: 16px;
                                height: 16px;
                            }
                        }
            `}
            </style>
        </>
    );
}