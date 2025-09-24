// src/core/repositroy/leaderboard/weekly.rank.repo.ts
import { pool } from "@/lib/db/pool";
import { toNum } from "@/utils/number";
import { WeeklyRankItemWithUsername, WeeklyRankItem } from '@/app/rank/components/Rank.type';

/** DB에서 가져오는 원시 행 */
type AttemptRowRaw = {
    id: string;            // BIGSERIAL → string
    user_id: string;
    question_cnt: number;
    score: number;
    total_time_ms: number;
    created_at: Date;      // timestamptz → Date
};

export type FindWeeklyRankInput = {
    mode?: string;        // 기본 'rank_5s'
    topN?: number;        // 기본 100
    tz?: string;          // 기본 'Asia/Seoul'
};

/** 내부 유틸: 이번 주 주간창에서 해당 모드의 attempt 전부 조회 (쿼리 단순화) */
async function fetchWeeklyAttempts(mode: string, tz: string) {
    const SQL = `
    WITH w AS (
      SELECT
        date_trunc('week', (now() AT TIME ZONE $2))                     AS week_start_local,
        date_trunc('week', (now() AT TIME ZONE $2)) + interval '7 day'  AS next_week_start_local
    )
    SELECT a.id, a.user_id, a.question_cnt, a.score, a.total_time_ms, a.created_at
    FROM quiz.attempt a, w
    WHERE a.mode = $1
      AND (a.created_at AT TIME ZONE $2) >= w.week_start_local
      AND (a.created_at AT TIME ZONE $2) <  w.next_week_start_local
  `;
    const { rows } = await pool.query<AttemptRowRaw>(SQL, [mode, tz]);
    return rows;
}

/** 내부 유틸: username 배치 조회(Map 반환) */
async function fetchUsernamesByClerkIds(clerkIds: string[]): Promise<Map<string, string | null>> {
    if (clerkIds.length === 0) return new Map();

    // 중복 제거
    const uniq = Array.from(new Set(clerkIds));

    // app_user: id | clerk_user_id | username
    // clerk_user_id와 attempt.user_id가 동일
    const SQL = `
    SELECT clerk_user_id, username
    FROM quiz.app_user
    WHERE clerk_user_id = ANY($1::text[])
  `;
    const { rows } = await pool.query<{ clerk_user_id: string; username: string | null }>(SQL, [uniq]);

    const map = new Map<string, string | null>();
    for (const r of rows) map.set(r.clerk_user_id, r.username);
    // 존재하지 않는 사용자는 map에 없음 → 사용 시 null 처리
    return map;
}

/**
 * 이번 주(월~일, tz 기준) TopN (username 미포함, 기존과 동일)
 */
export async function findWeeklyTopN(
    params: FindWeeklyRankInput = {}
): Promise<WeeklyRankItem[]> {
    const mode = params.mode ?? "rank_5s";
    const topN = params.topN ?? 100;
    const tz = params.tz ?? "Asia/Seoul";

    const rows = await fetchWeeklyAttempts(mode, tz);

    // A) 주간 누적치 집계 (유저별)
    const weeklyAgg = new Map<string, { qcnt: number; attempts: number; correctSum: number }>();
    for (const r of rows) {
        const cur = weeklyAgg.get(r.user_id) ?? { qcnt: 0, attempts: 0, correctSum: 0 };
        cur.qcnt += r.question_cnt ?? 0;
        cur.attempts += 1;
        cur.correctSum += r.score ?? 0;
        weeklyAgg.set(r.user_id, cur);
    }

    // B) 유저별 베스트 1건 선별
    const bestByUser = new Map<string, AttemptRowRaw>();
    for (const r of rows) {
        const cur = bestByUser.get(r.user_id);
        if (!cur) {
            bestByUser.set(r.user_id, r);
            continue;
        }
        const better =
            r.score > cur.score ||
            (r.score === cur.score && r.total_time_ms < cur.total_time_ms) ||
            (r.score === cur.score && r.total_time_ms === cur.total_time_ms && r.created_at < cur.created_at);
        if (better) bestByUser.set(r.user_id, r);
    }

    // C) 정렬(랭킹)
    const bestList = Array.from(bestByUser.values()).sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.total_time_ms !== b.total_time_ms) return a.total_time_ms - b.total_time_ms;
        return a.created_at.getTime() - b.created_at.getTime();
    });

    // D) 지표 계산 + rank 부여 + 상위 N
    const result: WeeklyRankItem[] = bestList.slice(0, Math.max(0, topN)).map((r, idx) => {
        const attempt_id = toNum(r.id)!;
        const question_cnt = r.question_cnt ?? 0;
        const score = r.score ?? 0;
        const total_time_ms = r.total_time_ms ?? 0;

        const accuracy_pct = question_cnt > 0 ? Math.round((score * 1000) / question_cnt) / 10 : 0; // .1f
        const avg_ms_per_q = question_cnt > 0 ? Math.floor(total_time_ms / question_cnt) : 0;

        const agg = weeklyAgg.get(r.user_id);
        const weekly_question_cnt = agg?.qcnt ?? 0;
        const weekly_attempt_cnt = agg?.attempts ?? 0;

        return {
            rank: idx + 1,
            attempt_id,
            user_id: r.user_id,
            score,
            question_cnt,
            accuracy_pct,
            total_time_ms,
            avg_ms_per_q,
            created_at: r.created_at,

            weekly_question_cnt,
            weekly_attempt_cnt,
        } as WeeklyRankItem; // WeeklyRankItem 타입에 두 필드가 정의되어 있어야 함
    });

    return result;
}


/**
 * 이번 주 TopN + username 포함 버전 (쿼리는 동일, 후처리로 username 배치 조회)
 */
export async function findWeeklyTopNWithUsername(
    params: FindWeeklyRankInput = {}
): Promise<WeeklyRankItemWithUsername[]> {
    const base = await findWeeklyTopN(params);

    // TopN의 user_id만 대상으로 username 배치 조회
    const ids = base.map(b => b.user_id);
    const usernameMap = await fetchUsernamesByClerkIds(ids);

    // merge
    return base.map((b) => ({
        ...b,
        username: usernameMap.get(b.user_id) ?? null,
    }));
}
