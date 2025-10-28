'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuizResultStore } from '@/app/store/review/quizResultStore';
import styles from '../components/ReviewCascader.module.css';
import ToDashboardButton from '@/app/components/ui/backButton/ToDashboardButton';
import Loading from '@/app/components/ui/loading/loading'
import EmptyContainer from '@/app/components/page/empty/EmptyContainer';

type FilterMode = 'all' | 'incorrect' | 'unanswered';
type Question = {
    question: string;
    options: string[];
    correctOrderNo: number;
    explanation?: string;
};

type Answer = {
    questionIndex: number;
    selectedIndex: number | null;
};

type Derived = {
    idx: number;
    question: string;
    options: string[];
    correctIndex: number;
    selectedIndex: number | null;
    isAnswered: boolean;
    isCorrect: boolean;
    explanation?: string;
    summaryText: string;
};

function getOptionLetter(i: number) {
    return String.fromCharCode(65 + i);
}

export default function ReviewPage() {
    const router = useRouter();
    const { questions, answers, resetAll } = useQuizResultStore();
    // 이동하는 중일때
    const [isLeaving, setIsLeaving] = useState(false);

    // Guard clause
    const isEmpty = !questions || questions.length === 0;

    // Derived data calculation
    const answersByIdx = useMemo(() => {
        const m = new Map<number, number | null>();
        (answers as Answer[]).forEach(a => m.set(a.questionIndex, a.selectedIndex));
        return m;
    }, [answers]);

    const derivedAll: Derived[] = useMemo(() => {
        return (questions as Question[]).map((q, idx) => {
            const correctIndex = (q.correctOrderNo ?? 1) - 1;
            const selectedIndex = answersByIdx.has(idx) ? (answersByIdx.get(idx) ?? null) : null;
            const isAnswered = selectedIndex !== null && selectedIndex !== undefined;
            const isCorrect = isAnswered ? selectedIndex === correctIndex : false;

            const chosen = isAnswered && selectedIndex !== null ?
                `${getOptionLetter(selectedIndex)}. ${q.options[selectedIndex]}` : '답안 없음';
            const correct = `${getOptionLetter(correctIndex)}. ${q.options[correctIndex]}`;
            const summaryText = `선택: ${chosen} | 정답: ${correct}`;

            return {
                idx,
                question: q.question,
                options: q.options,
                correctIndex,
                selectedIndex,
                isAnswered: !!isAnswered,
                isCorrect,
                explanation: q.explanation,
                summaryText,
            };
        });
    }, [questions, answersByIdx]);

    // States
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const filtered: Derived[] = useMemo(() => {
        switch (filterMode) {
            case 'incorrect':
                return derivedAll.filter(d => d.isAnswered && !d.isCorrect);
            case 'unanswered':
                return derivedAll.filter(d => !d.isAnswered);
            default:
                return derivedAll;
        }
    }, [derivedAll, filterMode]);

    const totals = useMemo(() => {
        const total = derivedAll.length;
        const correct = derivedAll.filter(d => d.isCorrect).length;
        const unanswered = derivedAll.filter(d => !d.isAnswered).length;
        const incorrect = total - correct - unanswered;
        const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { total, correct, incorrect, unanswered, rate };
    }, [derivedAll]);

    const incorrectIdxs = useMemo(
        () => derivedAll.filter(d => d.isAnswered && !d.isCorrect).map(d => d.idx),
        [derivedAll]
    );

    const [currentFocusIdx, setCurrentFocusIdx] = useState<number | null>(incorrectIdxs[0] ?? null);

    // Event handlers
    const toggleExpand = (idx: number) => {
        setExpanded(prev => {
            const next = new Set(prev);
            next.has(idx) ? next.delete(idx) : next.add(idx);
            return next;
        });
    };

    const expandAll = () => setExpanded(new Set(derivedAll.map(d => d.idx)));
    const collapseAll = () => setExpanded(new Set());

    const scrollToIdx = (idx: number) => {
        const el = cardRefs.current.get(idx);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setCurrentFocusIdx(idx);
            setExpanded(prev => {
                const next = new Set(prev);
                next.add(idx);
                return next;
            });
        }
    };

    const goPrevIncorrect = () => {
        if (incorrectIdxs.length === 0) return;
        if (currentFocusIdx === null) return scrollToIdx(incorrectIdxs[0]);

        const curPos = incorrectIdxs.findIndex(i => i === currentFocusIdx);
        const prevIdx = curPos > 0 ? incorrectIdxs[curPos - 1] : incorrectIdxs[incorrectIdxs.length - 1];
        scrollToIdx(prevIdx);
    };

    const goNextIncorrect = () => {
        if (incorrectIdxs.length === 0) return;
        if (currentFocusIdx === null) return scrollToIdx(incorrectIdxs[0]);

        const curPos = incorrectIdxs.findIndex(i => i === currentFocusIdx);
        const nextIdx = curPos >= 0 && curPos < incorrectIdxs.length - 1 ?
            incorrectIdxs[curPos + 1] : incorrectIdxs[0];
        scrollToIdx(nextIdx);
    };

    const handleGoHome = () => {
        setIsLeaving(true);
        resetAll();
        router.push('/');
    };

    return (
        <div className="page-background">
            <div className="container">
                {/* [변경] 렌더 분기 - 짧은 회로 평가 */}

                {isLeaving && (
                    // 이동 중
                    <Loading />
                )}

                {!isLeaving && isEmpty && (
                    <EmptyContainer
                        onGoHome={handleGoHome}
                    />
                )}

                {!isLeaving && !isEmpty && (
                    // 평상시 정상 렌더링
                    <>
                        {/* Header Section */}
                        <div className={styles.header}>
                            <div className={styles.resultIcon}>
                                {totals.rate >= 70 ? '🎉' : '📚'}
                            </div>
                            <h1 className={styles.pageTitle}>퀴즈 결과 리뷰</h1>

                            {/* Score Summary */}
                            <div className={styles.scoreCard}>
                                <div className={styles.mainScore}>
                                    <span className={styles.scoreNumber}>{totals.rate}%</span>
                                    <span className={styles.scoreLabel}>정답률</span>
                                </div>
                                <div className={styles.scoreDetails}>
                                    <div className={styles.scoreItem}>
                                        <span className={styles.scoreIcon}>✅</span>
                                        <span>정답 {totals.correct}개</span>
                                    </div>
                                    <div className={styles.scoreItem}>
                                        <span className={styles.scoreIcon}>❌</span>
                                        <span>오답 {totals.incorrect}개</span>
                                    </div>
                                    <div className={styles.scoreItem}>
                                        <span className={styles.scoreIcon}>⏸️</span>
                                        <span>미응답 {totals.unanswered}개</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Control Panel */}
                        <div className={styles.controlPanel}>
                            <div className={styles.filterSection}>
                                <label className={styles.filterLabel}>
                                    <span className={styles.filterLabelText}>필터</span>
                                    <select
                                        value={filterMode}
                                        onChange={e => setFilterMode(e.target.value as FilterMode)}
                                        className={styles.filterSelect}
                                    >
                                        <option value="all">전체 문제 ({derivedAll.length})</option>
                                        <option value="incorrect">오답만 ({totals.incorrect})</option>
                                        <option value="unanswered">미응답만 ({totals.unanswered})</option>
                                    </select>
                                </label>
                            </div>

                            <div className={styles.actionSection}>
                                <div className={styles.expandControls}>
                                    <button className={styles.controlButton} onClick={collapseAll}>
                                        모두 접기
                                    </button>
                                    <button className={styles.controlButton} onClick={expandAll}>
                                        모두 펼치기
                                    </button>
                                </div>

                                <div className={styles.navigationControls}>
                                    <button
                                        className={styles.navButton}
                                        onClick={goPrevIncorrect}
                                        disabled={incorrectIdxs.length === 0}
                                    >
                                        ← 이전 오답
                                    </button>
                                    <span className={styles.navInfo}>
                                        {incorrectIdxs.length > 0 ? `${incorrectIdxs.length}개 오답` : '오답 없음'}
                                    </span>
                                    <button
                                        className={styles.navButton}
                                        onClick={goNextIncorrect}
                                        disabled={incorrectIdxs.length === 0}
                                    >
                                        다음 오답 →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className={styles.questionsContainer}>
                            {filtered.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>🔍</div>
                                    <p>선택한 조건에 해당하는 문제가 없습니다.</p>
                                </div>
                            ) : (
                                <div className={styles.questionsList}>
                                    {filtered.map((data) => (
                                        <QuestionCard
                                            key={data.idx}
                                            data={data}
                                            isOpen={expanded.has(data.idx)}
                                            onToggle={() => toggleExpand(data.idx)}
                                            isFocused={currentFocusIdx === data.idx}
                                            registerRef={(el) => {
                                                const map = cardRefs.current;
                                                if (el) map.set(data.idx, el);
                                                else map.delete(data.idx);
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className={styles.actionButtons}>
                            <ToDashboardButton onClick={handleGoHome} icon="🏠">
                                홈으로
                            </ToDashboardButton>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Question Card Component
function QuestionCard({
    data,
    isOpen,
    onToggle,
    isFocused,
    registerRef,
}: {
    data: Derived;
    isOpen: boolean;
    onToggle: () => void;
    isFocused: boolean;
    registerRef: (el: HTMLDivElement | null) => void;
}) {
    const {
        idx, question, options, correctIndex, selectedIndex,
        isAnswered, isCorrect, explanation
    } = data;

    const getStatusIcon = () => {
        if (!isAnswered) return '⏸️';
        return isCorrect ? '✅' : '❌';
    };

    const getStatusText = () => {
        if (!isAnswered) return '미응답';
        return isCorrect ? '정답' : '오답';
    };

    const getStatusClass = () => {
        if (!isAnswered) return styles.statusUnanswered;
        return isCorrect ? styles.statusCorrect : styles.statusIncorrect;
    };

    return (
        <div
            className={`${styles.questionCard} ${isFocused ? styles.focused : ''}`}
            ref={registerRef}
        >
            {/* Card Header */}
            <div className={styles.cardHeader}>
                <div className={styles.questionInfo}>
                    <span className={styles.questionNumber}>Q{idx + 1}</span>
                    <div className={`${styles.statusBadge} ${getStatusClass()}`}>
                        <span className={styles.statusIcon}>{getStatusIcon()}</span>
                        <span className={styles.statusText}>{getStatusText()}</span>
                    </div>
                </div>
                <button
                    className={`${styles.toggleButton} ${isOpen ? styles.active : ''}`}
                    onClick={onToggle}
                    aria-expanded={isOpen}
                >
                    {isOpen ? '해설 닫기' : '해설 보기'}
                </button>
            </div>

            {/* Question Preview */}
            <div className={styles.questionPreview}>
                <p className={styles.questionText}>{question}</p>
                <div className={styles.answerSummary}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>내 선택:</span>
                        <span className={`${styles.summaryValue} ${!isAnswered ? styles.noAnswer : (isCorrect ? styles.correct : styles.incorrect)}`}>
                            {!isAnswered ? '답안 없음' :
                                selectedIndex !== null ? `${getOptionLetter(selectedIndex)}. ${options[selectedIndex]}` : '답안 없음'}
                        </span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>정답:</span>
                        <span className={`${styles.summaryValue} ${styles.correctAnswer}`}>
                            {getOptionLetter(correctIndex)}. {options[correctIndex]}
                        </span>
                    </div>
                </div>
            </div>

            {/* Expandable Content */}
            {isOpen && (
                <div className={styles.expandedContent}>
                    <div className={styles.optionsList}>
                        <h4 className={styles.sectionTitle}>선택지</h4>
                        {options.map((option, i) => {
                            const isSelectedOption = i === selectedIndex;
                            const isCorrectOption = i === correctIndex;

                            let optionClass = styles.option;
                            if (isCorrectOption) optionClass += ` ${styles.correctOption}`;
                            if (isSelectedOption && !isCorrectOption) optionClass += ` ${styles.wrongOption}`;
                            if (isSelectedOption && isCorrectOption) optionClass += ` ${styles.correctSelectedOption}`;

                            return (
                                <div key={i} className={optionClass}>
                                    <div className={styles.optionHeader}>
                                        <span className={styles.optionLetter}>{getOptionLetter(i)}</span>
                                        <div className={styles.optionIndicators}>
                                            {isCorrectOption && <span className={styles.correctIndicator}>정답</span>}
                                            {isSelectedOption && <span className={styles.selectedIndicator}>선택함</span>}
                                        </div>
                                    </div>
                                    <p className={styles.optionText}>{option}</p>
                                </div>
                            );
                        })}
                    </div>

                    {!isAnswered && (
                        <div className={styles.noAnswerNotice}>
                            <span className={styles.noticeIcon}>⏰</span>
                            <p>시간 초과로 답을 선택하지 못했습니다.</p>
                        </div>
                    )}

                    {explanation && (
                        <div className={styles.explanationSection}>
                            <h4 className={styles.sectionTitle}>💡 해설</h4>
                            <div className={styles.explanationContent}>
                                <p>{explanation}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}