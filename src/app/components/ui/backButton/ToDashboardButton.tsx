'use client';

import React from 'react';
import styles from './ToDashboardButton.module.css';

type Props = {
    children: React.ReactNode;
    onClick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    icon?: string;
};

export default function SecondaryButton({
    children,
    onClick,
    type = 'button',
    icon = '🏠',
}: Props) {
    return (
        <button
            type={type}
            onClick={onClick}
            className={styles.button}
        >
            <div className={styles.buttonIcon}>{icon}</div>
            <div className={styles.buttonText}>
                <span className={styles.buttonTitle}>{children}</span>
            </div>
        </button>
    );
}
