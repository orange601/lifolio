"use client";

import React, { useState } from 'react';
import { useRouter } from "next/navigation";

interface MenuItem {
    label: string;
    href: string;
    icon?: React.ReactNode;
}

interface HeaderProps {
    title?: string;
    logo?: React.ReactNode;
    menuItems?: MenuItem[];
    showNotifications?: boolean;
    showProfile?: boolean;
    className?: string;
    onMenuClick?: (item: MenuItem) => void;
    onNotificationClick?: () => void;
    onProfileClick?: () => void;
}

export default function Header({
    title = "TITLE",
    logo = <div className="text-2xl">✨</div>,
    menuItems = [
        { label: "홈", href: "/" },
        { label: "솔라나", href: "#" },
        { label: "블록체인", href: "#" },
        { label: "퀴즈", href: "#" },
        { label: "관리자", href: "/admin" }
    ],
    showNotifications = true,
    showProfile = true,
    className = "",
    onMenuClick,
    onNotificationClick,
    onProfileClick
}: HeaderProps) {
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleMenuItemClick = (item: MenuItem) => {
        setIsMenuOpen(false);
        onMenuClick?.(item);
        // ✅ 메뉴 이동 (홈은 "/" 이므로 홈으로 이동)
        if (item.href && item.href !== "#") {
            router.push(item.href);
        }
    };

    return (
        <nav className={`sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-blue-200 shadow-sm ${className}`}>
            <div className="max-w-5xl mx-auto px-4 py-3">
                {/* 데스크톱 레이아웃 */}
                <div className="hidden md:flex items-center">
                    {/* 로고 (원래 로고 클릭 시 categories로 이동하도록 되어 있었음) */}
                    <div
                        className="flex items-center space-x-2 cursor-pointer"
                        onClick={() => router.push("/categories")}
                    >
                        {logo}
                        <span className="text-xl font-bold text-blue-900">{title}</span>
                    </div>

                    {/* 중앙 메뉴 */}
                    <div className="flex-1 flex items-center justify-center space-x-8">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => handleMenuItemClick(item)}
                                className="text-gray-600 hover:text-blue-900 transition-colors flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-blue-50"
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* 우측 아이콘 영역 */}
                    <div className="flex items-center space-x-2 w-24 justify-end">
                        {showNotifications && (
                            <button
                                type="button"
                                onClick={onNotificationClick}
                                className="p-2 rounded-lg hover:bg-blue-50 transition-colors relative"
                                aria-label="알림"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6a4 4 0 114 4v.5" />
                                </svg>
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                            </button>
                        )}
                        {showProfile && (
                            <button
                                type="button"
                                onClick={onProfileClick}
                                className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                aria-label="프로필"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* 모바일 레이아웃 */}
                <div className="md:hidden flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        aria-label="메뉴 열기"
                    >
                        <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex items-center space-x-2">
                        {logo}
                        <span className="text-xl font-bold text-blue-900">{title}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                        {!showNotifications && !showProfile && <div className="w-10 h-10" />}
                    </div>
                </div>

                {/* 모바일 메뉴 드롭다운 */}
                {isMenuOpen && (
                    <div className="md:hidden mt-3 pt-3 border-t border-blue-200 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-col space-y-3">
                            {menuItems.map((item, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleMenuItemClick(item)}
                                    className="text-gray-600 hover:text-blue-900 transition-colors py-2 text-left flex items-center space-x-2 hover:bg-blue-50 rounded-lg px-2"
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
