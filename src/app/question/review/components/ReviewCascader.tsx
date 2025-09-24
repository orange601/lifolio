'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../components/ReviewCascader.module.css';
import type { AttemptHeader, AttemptReview, AttemptReviewItem } from "@/core/repositroy/attempt_answer/attempt.review.repo";

type FilterMode = 'all' | 'incorrect' | 'unanswered';

type Derived = {
    idx: number;                 // 0-based
    question: string;
    options: string[];
    correctIndex: number;
    selectedIndex: number | null;
    isAnswered: boolean;
    isCorrect: boolean;
    explanation?: string | null;
};

function getOptionLetter(i: number) {
    return String.fromCharCode(65 + i);
}

export default function ReviewCascaderPage({ review }: { review: AttemptReview }) {
    const router = useRouter();
    const { attempt, items } = review;

    // items → Derived 변환 (문항 텍스트/옵션이 없는 경우 안전 처리)
    const derivedAll: Derived[] = useMemo(() => {
        return items.map((it: AttemptReviewItem, idx) => {
            const options = Array.isArray(it.options) ? it.options : [];
            const q = it.question ?? '(문항 텍스트 없음)';
            const correctIndex = it.correct_idx ?? 0;
            const selectedIndex = it.selected_idx;
            const isAnswered = selectedIndex !== null && selectedIndex !== undefined;
            const isCorrect = isAnswered ? selectedIndex === correctIndex : false;

            return {
                idx,
                question: q,
                options,
                correctIndex,
                selectedIndex,
                isAnswered: !!isAnswered,
                isCorrect,
                explanation: it.explanation ?? null,
            };
        });
    }, [items]);

    // 통계
    const totals = useMemo(() => {
        const total = derivedAll.length;
        const correct = derivedAll.filter(d => d.isCorrect).length;
        const unanswered = derivedAll.filter(d => !d.isAnswered).length;
        const incorrect = total - correct - unanswered;
        const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
        return { total, correct, incorrect, unanswered, rate };
    }, [derivedAll]);

    // 필터/펼침/포커스 상태
    const [filterMode, setFilterMode] = useState<FilterMode>('all');
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    const filtered = useMemo(() => {
        switch (filterMode) {
            case 'incorrect': return derivedAll.filter(d => d.isAnswered && !d.isCorrect);
            case 'unanswered': return derivedAll.filter(d => !d.isAnswered);
            default: return derivedAll;
        }
    }, [derivedAll, filterMode]);

    const incorrectIdxs = useMemo(
        () => derivedAll.filter(d => d.isAnswered && !d.isCorrect).map(d => d.idx),
        [derivedAll]
    );
    const [currentFocusIdx, setCurrentFocusIdx] = useState<number | null>(incorrectIdxs[0] ?? null);

    // UI 핸들러
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
        const nextIdx = curPos >= 0 && curPos < incorrectIdxs.length - 1 ? incorrectIdxs[curPos + 1] : incorrectIdxs[0];
        scrollToIdx(nextIdx);
    };

    const handleRestart = () => router.push('/question/quick');
    const handleGoHome = () => router.push('/');

    // 가드: 빈 데이터
    if (!items || items.length === 0) {
        return (
            <div className="page-background">
                <div className="container">
                    <div className={styles.noDataMessage}>
                        <div className={styles.noDataIcon}>📝</div>
                        <h2>리뷰 데이터를 찾을 수 없습니다</h2>
                        <button onClick={handleGoHome} className={styles.primaryButton}>
                            홈으로 돌아가기
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-background">
            <div className="container">
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.resultIcon}>
                        {totals.rate >= 70 ? '🎉' : '📚'}
                    </div>
                    <h1 className={styles.pageTitle}>퀴즈 결과 리뷰</h1>

                    {/* Score Summary (서버 attempt 값도 함께 사용 가능) */}
                    <div className={styles.scoreCard}>
                        <div className={styles.mainScore}>
                            <span className={styles.scoreNumber}>{totals.rate}%</span>
                            <span className={styles.scoreLabel}>정답률</span>
                        </div>
                        <div className={styles.scoreDetails}>
                            <div className={styles.scoreItem}><span className={styles.scoreIcon}>✅</span><span>정답 {totals.correct}개</span></div>
                            <div className={styles.scoreItem}><span className={styles.scoreIcon}>❌</span><span>오답 {totals.total - totals.correct - totals.unanswered}개</span></div>
                            <div className={styles.scoreItem}><span className={styles.scoreIcon}>⏸️</span><span>미응답 {totals.unanswered}개</span></div>
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
                                <option value="incorrect">오답만 ({totals.total - totals.correct - totals.unanswered})</option>
                                <option value="unanswered">미응답만 ({totals.unanswered})</option>
                            </select>
                        </label>
                    </div>

                    <div className={styles.actionSection}>
                        <div className={styles.expandControls}>
                            <button className={styles.controlButton} onClick={collapseAll}>모두 접기</button>
                            <button className={styles.controlButton} onClick={expandAll}>모두 펼치기</button>
                        </div>
                        <div className={styles.navigationControls}>
                            <button className={styles.navButton} onClick={goPrevIncorrect} disabled={incorrectIdxs.length === 0}>← 이전 오답</button>
                            <span className={styles.navInfo}>
                                {incorrectIdxs.length > 0 ? `${incorrectIdxs.length}개 오답` : '오답 없음'}
                            </span>
                            <button className={styles.navButton} onClick={goNextIncorrect} disabled={incorrectIdxs.length === 0}>다음 오답 →</button>
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
                            {filtered.map((d) => (
                                <QuestionCard
                                    key={d.idx}
                                    data={d}
                                    isOpen={expanded.has(d.idx)}
                                    onToggle={() => toggleExpand(d.idx)}
                                    isFocused={currentFocusIdx === d.idx}
                                    registerRef={(el) => {
                                        const map = cardRefs.current;
                                        if (el) map.set(d.idx, el); else map.delete(d.idx);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className={styles.actionButtons}>
                    <button onClick={handleRestart} className={styles.primaryButton}>다시 풀기</button>
                    <button onClick={handleGoHome} className={styles.secondaryButton}>홈으로 돌아가기</button>
                </div>
            </div>
        </div>
    );
}

function QuestionCard({
    data, isOpen, onToggle, isFocused, registerRef,
}: {
    data: Derived;
    isOpen: boolean;
    onToggle: () => void;
    isFocused: boolean;
    registerRef: (el: HTMLDivElement | null) => void;
}) {
    const { idx, question, options, correctIndex, selectedIndex, isAnswered, isCorrect, explanation } = data;

    const getStatusIcon = () => (!isAnswered ? '⏸️' : isCorrect ? '✅' : '❌');
    const getStatusText = () => (!isAnswered ? '미응답' : isCorrect ? '정답' : '오답');

    return (
        <div className={`${styles.questionCard} ${isFocused ? styles.focused : ''}`} ref={registerRef}>
            <div className={styles.cardHeader}>
                <div className={styles.questionInfo}>
                    <span className={styles.questionNumber}>Q{idx + 1}</span>
                    <div className={`${styles.statusBadge} ${!isAnswered ? styles.statusUnanswered : isCorrect ? styles.statusCorrect : styles.statusIncorrect}`}>
                        <span className={styles.statusIcon}>{getStatusIcon()}</span>
                        <span className={styles.statusText}>{getStatusText()}</span>
                    </div>
                </div>
                <button className={`${styles.toggleButton} ${isOpen ? styles.active : ''}`} onClick={onToggle} aria-expanded={isOpen}>
                    {isOpen ? '해설 닫기' : '해설 보기'}
                </button>
            </div>

            <div className={styles.questionPreview}>
                <p className={styles.questionText}>{question}</p>
                <div className={styles.answerSummary}>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>내 선택:</span>
                        <span className={`${styles.summaryValue} ${!isAnswered ? styles.noAnswer : (isCorrect ? styles.correct : styles.incorrect)}`}>
                            {!isAnswered
                                ? '답안 없음'
                                : (selectedIndex !== null && options[selectedIndex] !== undefined)
                                    ? `${getOptionLetter(selectedIndex)}. ${options[selectedIndex]}`
                                    : '답안 없음'}
                        </span>
                    </div>
                    <div className={styles.summaryItem}>
                        <span className={styles.summaryLabel}>정답:</span>
                        <span className={`${styles.summaryValue} ${styles.correctAnswer}`}>
                            {options[correctIndex] !== undefined
                                ? `${getOptionLetter(correctIndex)}. ${options[correctIndex]}`
                                : `${getOptionLetter(correctIndex)}. (옵션 누락)`}
                        </span>
                    </div>
                </div>
            </div>

            {isOpen && (
                <div className={styles.expandedContent}>
                    <div className={styles.optionsList}>
                        <h4 className={styles.sectionTitle}>선택지</h4>
                        {options.length === 0 ? (
                            <div className={styles.emptyOption}>옵션 데이터가 없습니다.</div>
                        ) : (
                            options.map((option, i) => {
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
                            })
                        )}
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
