// 순위 데이터 타입 정의
export interface RankingUser {
    rank: number;
    attempt_id: number;
    user_id: string;
    score: number;
    question_cnt: number;
    accuracy_pct: number;
    total_time_ms: number;
    avg_ms_per_q: number;
    created_at: Date;
    weekly_question_cnt: number;
    weekly_attempt_cnt: number;
    username: string;
}

export type WeeklyRankItem = {
    rank: number;               // 1..N
    attempt_id: number;
    user_id: string;
    score: number;
    question_cnt: number;
    accuracy_pct: number;       // (score / question_cnt * 100).1f
    total_time_ms: number;
    avg_ms_per_q: number;       // floor(total_time_ms / question_cnt)
    created_at: Date;

    // ▼ 추가 메타: 이번 주 누적치(참여도)
    weekly_question_cnt: number;  // 이번 주 총 푼 문제 수(= Σ question_cnt)
    weekly_attempt_cnt: number;   // 이번 주 시도 횟수(옵션)
    // weekly_correct_cnt?: number; // 원하면 활성화 가능(= Σ score)
};


/** username까지 포함한 확장 타입 */
export type WeeklyRankItemWithUsername = WeeklyRankItem & {
    username: string | null;
};