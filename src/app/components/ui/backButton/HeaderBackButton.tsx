'use client';

import React from "react";

type Props = {
    onBack: () => void;
};

export default function ContainerHeaderBackButton({ onBack }: Props) {
    return (
        <>
            <button
                className="container-header-back-button"
                onClick={onBack}
            >
                ←
            </button>

            <style jsx>{`
                .container-header-back-button {
                    background: rgba(255, 255, 255, 0.2);
                    border: none;
                    border-radius: 12px;
                    padding: 12px;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                }

                .container-header-back-button:hover {
                    background: rgba(255, 255, 255, 0.3);
                    transform: translateX(-2px);
                }
            `}
            </style>
        </>
    );
}