/**
 * 카테고리 선택 후 레벨 고르는 단계가 있는 화면. 
 * 나중에 필요할것 같아 백업해뒀음
 */


'use client';

import React, { useState } from 'react';
import styles from './CategoryCascader.module.css'; // 모듈 임포트
import { FindAllCategories } from '@/core/repositroy/categories/category.type';
import { useRouter } from 'next/navigation';
import EmptyQuizPage from '@/app/category/components/emptyQuiz'
import BreadcrumbPage from '@/app/category/components/breadcrumbPage';
import ContainerHeaderBackButton from "@/app/components/ui/backButton/HeaderBackButton";

export default function CategorySelection({ quizCategories }: { quizCategories: FindAllCategories[] }) {
    const [currentPath, setCurrentPath] = useState<FindAllCategories[]>([]);
    const [currentParentId, setCurrentParentId] = useState<number | null>(null);
    const router = useRouter();

    const themeData = quizCategories;

    const getChildrenByParentId = (parentId: number | null): FindAllCategories[] =>
        themeData.filter(theme => theme.parent_id === parentId);

    const getThemeById = (id: number): FindAllCategories | undefined =>
        themeData.find(theme => theme.id === id);

    const hasChildren = (themeId: number): boolean =>
        themeData.some(theme => theme.parent_id === themeId);

    const getThemeLevel = (theme: FindAllCategories): 'category' | 'subcategory' | 'quiz' => {
        if (theme.parent_id === null) return 'category';
        const parent = getThemeById(theme.parent_id);
        if (parent && parent.parent_id === null) return 'subcategory';
        return 'quiz';
    };

    const handleThemeClick = (themeId: number) => {
        const theme = getThemeById(themeId);
        const hasChild = hasChildren(themeId);
        if (hasChild) {
            navigateToTheme(themeId);
        } else if (theme) {
            startQuiz(theme);
        }
    };

    const navigateToTheme = (themeId: number) => {
        const theme = getThemeById(themeId);
        if (!theme) return;

        const themeIndex = currentPath.findIndex(p => p.id === themeId);
        if (themeIndex !== -1) {
            setCurrentPath(currentPath.slice(0, themeIndex + 1));
        } else {
            setCurrentPath([...currentPath, theme]);
        }
        setCurrentParentId(themeId);
    };

    const navigateToRoot = () => {
        setCurrentPath([]);
        setCurrentParentId(null);
    };

    const goBack = () => {
        if (currentPath.length > 0) {
            const newPath = [...currentPath];
            newPath.pop();
            setCurrentPath(newPath);
            setCurrentParentId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
        } else {
            router.push('/');
        }
    };

    const startQuiz = (category: FindAllCategories) => {
        const categoryId = category.id;
        router.push(`/difficulty?categoryId=${categoryId}`);
    };

    const getHeaderTitle = () =>
        currentPath.length === 0 ? '테마 선택' : currentPath[currentPath.length - 1].name;

    const getSectionTitle = () =>
        currentPath.length === 0
            ? '🎯 퀴즈 테마를 선택하세요'
            : `🧠 ${currentPath[currentPath.length - 1].name} 하위 항목`;

    return (
        <div className="page-background">
            <div className="container">
                {/* Header (전역) */}
                <div className="container-header">
                    <ContainerHeaderBackButton onBack={goBack} />
                    <div className={styles.headerTitle}>{getHeaderTitle()}</div>
                    <div className={styles.headerSpacer} />
                </div>

                {/* Breadcrumb (별도 컴포넌트) */}
                <BreadcrumbPage
                    path={currentPath}
                    onRootClick={navigateToRoot}
                    onItemClick={navigateToTheme}
                />

                {/* Content */}
                <div className={styles.contentSection}>
                    <div className={styles.sectionTitle}>{getSectionTitle()}</div>

                    {(() => {
                        const children = getChildrenByParentId(currentParentId);
                        if (children.length === 0) return <EmptyQuizPage />;

                        return (
                            <div className={styles.themeGrid}>
                                {children.map(theme => {
                                    const level = getThemeLevel(theme);
                                    const description = theme.description || '다양한 퀴즈 문제';

                                    // (샘플) 실제에선 서버값
                                    const questionCount = 1;
                                    const playCount = 2;

                                    const cardClass =
                                        level === 'quiz'
                                            ? `${styles.themeCard} ${styles.finalLevel}`
                                            : `${styles.themeCard} ${styles.hasChildren}`;

                                    const badgeClass =
                                        level === 'category'
                                            ? `${styles.themeBadge} ${styles.badgeCategory}`
                                            : level === 'subcategory'
                                                ? `${styles.themeBadge} ${styles.badgeSubcategory}`
                                                : `${styles.themeBadge} ${styles.badgeQuiz}`;

                                    const arrow = level === 'quiz' ? '▶' : '→';

                                    return (
                                        <div
                                            key={theme.id}
                                            className={cardClass}
                                            onClick={() => handleThemeClick(theme.id)}
                                        >
                                            <div className={styles.themeHeader}>
                                                <div className={styles.themeInfo}>
                                                    <div className={styles.themeIcon}>🧠</div>
                                                    <div className={styles.themeDetails}>
                                                        <h3>{theme.name}</h3>
                                                        <p>{description}</p>
                                                    </div>
                                                </div>
                                                <div className={styles.themeArrow}>{arrow}</div>
                                            </div>

                                            <div className={styles.themeMeta}>
                                                <div className={styles.themeStats}>
                                                    <div className={styles.themeStat}>
                                                        <div className={styles.statNumber}>{questionCount}</div>
                                                        <div className={styles.statLabel}>문제 수</div>
                                                    </div>
                                                    <div className={styles.themeStat}>
                                                        <div className={styles.statNumber}>{playCount}</div>
                                                        <div className={styles.statLabel}>플레이</div>
                                                    </div>
                                                </div>

                                                <div className={badgeClass}>
                                                    {level === 'category' ? '카테고리' : level === 'subcategory' ? '세부분류' : '퀴즈'}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
