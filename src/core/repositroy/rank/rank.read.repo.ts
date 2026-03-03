import { prisma } from "@/lib/db/prisma";
import { WeeklyRankItemWithUsername, WeeklyRankItem } from "@/app/rank/components/Rank.type";

type AttemptRow = {
  id: number;
  user_id: string;
  question_cnt: number;
  score: number;
  total_time_ms: number;
  created_at: Date;
};

export type FindWeeklyRankInput = {
  mode?: string;
  topN?: number;
  tz?: string;
};

async function fetchWeeklyAttempts(mode: string, tz: string): Promise<AttemptRow[]> {
  // Prisma doesn't natively support timezone-aware date_trunc,
  // so we use $queryRaw for this specific query
  const rows = await prisma.$queryRaw<AttemptRow[]>`
    WITH w AS (
      SELECT
        date_trunc('week', (now() AT TIME ZONE ${tz}))                     AS week_start_local,
        date_trunc('week', (now() AT TIME ZONE ${tz})) + interval '7 day'  AS next_week_start_local
    )
    SELECT a.id::int, a.user_id, a.question_cnt, a.score, a.total_time_ms, a.created_at
    FROM quiz.attempt a, w
    WHERE a.mode = ${mode}
      AND (a.created_at AT TIME ZONE ${tz}) >= w.week_start_local
      AND (a.created_at AT TIME ZONE ${tz}) <  w.next_week_start_local
  `;
  return rows;
}

async function fetchUsernamesByClerkIds(clerkIds: string[]): Promise<Map<string, string | null>> {
  if (clerkIds.length === 0) return new Map();

  const uniq = Array.from(new Set(clerkIds));

  const rows = await prisma.app_user.findMany({
    where: { clerk_user_id: { in: uniq } },
    select: { clerk_user_id: true, username: true },
  });

  const map = new Map<string, string | null>();
  for (const r of rows) map.set(r.clerk_user_id, r.username);
  return map;
}

export async function findWeeklyTopN(
  params: FindWeeklyRankInput = {},
): Promise<WeeklyRankItem[]> {
  const mode = params.mode ?? "rank_5s";
  const topN = params.topN ?? 100;
  const tz = params.tz ?? "Asia/Seoul";

  const rows = await fetchWeeklyAttempts(mode, tz);

  const weeklyAgg = new Map<string, { qcnt: number; attempts: number; correctSum: number }>();
  for (const r of rows) {
    const cur = weeklyAgg.get(r.user_id) ?? { qcnt: 0, attempts: 0, correctSum: 0 };
    cur.qcnt += r.question_cnt ?? 0;
    cur.attempts += 1;
    cur.correctSum += r.score ?? 0;
    weeklyAgg.set(r.user_id, cur);
  }

  const bestByUser = new Map<string, AttemptRow>();
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

  const bestList = Array.from(bestByUser.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.total_time_ms !== b.total_time_ms) return a.total_time_ms - b.total_time_ms;
    return a.created_at.getTime() - b.created_at.getTime();
  });

  const result: WeeklyRankItem[] = bestList.slice(0, Math.max(0, topN)).map((r, idx) => {
    const attempt_id = r.id;
    const question_cnt = r.question_cnt ?? 0;
    const score = r.score ?? 0;
    const total_time_ms = r.total_time_ms ?? 0;

    const accuracy_pct = question_cnt > 0 ? Math.round((score * 1000) / question_cnt) / 10 : 0;
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
    } as WeeklyRankItem;
  });

  return result;
}

export async function findWeeklyTopNWithUsername(
  params: FindWeeklyRankInput = {},
): Promise<WeeklyRankItemWithUsername[]> {
  const base = await findWeeklyTopN(params);

  const ids = base.map((b) => b.user_id);
  const usernameMap = await fetchUsernamesByClerkIds(ids);

  return base.map((b) => ({
    ...b,
    username: usernameMap.get(b.user_id) ?? null,
  }));
}
