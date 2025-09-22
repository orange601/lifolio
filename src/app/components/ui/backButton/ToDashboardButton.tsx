'use client';

import React from 'react';
import styles from './ToDashboardButton.module.css';

type Props = {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    className?: string; // 필요하면 추가 스타일 덮어쓰기용
};

export default function SecondaryButton({
    children,
    onClick,
    type = 'button',
    className = '',
}: Props) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`${styles.actionButton} ${styles.tertiary} ${className}`}
        >
            <span className={styles.buttonIcon}>🏠</span>
            {children}
        </button>
    );
}
