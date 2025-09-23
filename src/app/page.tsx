'use client';

import React from 'react';
import Link from 'next/link';
import styles from './home.module.css';

export default function QuizHomepage() {
  return (
    <div className="page-background">
      <div className="container">
        {/* Logo Section */}
        <div className={styles.logo}>
          <h1>퀴즈퀴즈</h1>
          <p>재미있는 퀴즈로 두뇌를 깨워보세요</p>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          <div className={styles.quizCard}>
            {/* Quiz Icon */}
            <div className={styles.quizIcon}>🧠</div>

            <h2>문제 풀기</h2>

            <p>
              다양한 주제의 흥미진진한 퀴즈를 풀어보세요. 당신의 지식을 테스트하고 새로운 것을
              배워보세요!
            </p>

            {/* Quiz Mode Buttons (Link를 버튼처럼 스타일링) */}
            <div className={styles.quizButtons}>
              <Link
                href="/question/quick"
                className={`${styles.quizModeButton} ${styles.quickMode}`}
                aria-label="한 문제씩 풀기로 이동"
              >
                <div className={styles.buttonIcon}>⚡</div>
                <div className={styles.buttonText}>
                  <span className={styles.buttonTitle}>한 문제씩 풀기</span>
                  {/* <span className={styles.buttonDesc}>즉시 정답 확인</span> */}
                </div>
              </Link>

              <Link
                href="/question/batch"
                className={`${styles.quizModeButton} ${styles.batchMode}`}
                aria-label="모든 문제 풀기로 이동"
              >
                <div className={styles.buttonIcon}>📋</div>
                <div className={styles.buttonText}>
                  <span className={styles.buttonTitle}>모든 문제 풀기</span>
                  {/* <span className={styles.buttonDesc}>완료 후 정답 확인</span> */}
                </div>
              </Link>
            </div>

            {/* Features */}
            <div className={styles.features}>
              {/* 테마별 퀴즈 */}
              <Link
                href="/category"
                className={`${styles.featureItem} ${styles.featureLink}`}
                role="button"
                aria-label="주제별 퀴즈로 이동"
              >
                <div className={styles.featureIcon}>🏷️</div>
                <div className={styles.featureText}>주제별 퀴즈</div>
              </Link>

              {/* 경쟁 모드 */}
              <Link
                href="/question/rank"
                className={`${styles.featureItem} ${styles.featureLink}`}
                role="button"
                aria-label="순위별 퀴즈로 이동"
              >
                <div className={styles.featureIcon}>🏆</div>
                <div className={styles.featureText}>경쟁 모드</div>
              </Link>

              {/* 설정 */}
              <Link
                href="/auth/choice"
                className={`${styles.featureItem} ${styles.featureLink}`}
                role="button"
                aria-label="설정으로 이동"
              >
                <div className={styles.featureIcon}>⚙️</div>
                <div className={styles.featureText}>설정</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
