
import RankCascader from './components/RankCascader'
import { findWeeklyTopNWithUsername } from "@/core/repositroy/rank/rank.read.repo";

// 랭킹 샘플 데이터 (WeeklyRankItem 타입)
export const sampleRankingData = [
    {
        attempt_id: "attempt_001",
        user_id: "user_alex123",
        username: "알렉스",
        rank: 1,
        score: 950,
        accuracy_pct: 98,
        avg_ms_per_q: 1100,
        total_time_ms: 132000,
        weekly_question_cnt: 120,
        weekly_attempt_cnt: 8
    },
    {
        attempt_id: "attempt_002",
        user_id: "user_jane456",
        username: "제인",
        rank: 2,
        score: 890,
        accuracy_pct: 95,
        avg_ms_per_q: 1250,
        total_time_ms: 150000,
        weekly_question_cnt: 100,
        weekly_attempt_cnt: 6
    },
    {
        attempt_id: "attempt_003",
        user_id: "user_sam789",
        username: "샘",
        rank: 3,
        score: 785,
        accuracy_pct: 92,
        avg_ms_per_q: 1400,
        total_time_ms: 168000,
        weekly_question_cnt: 85,
        weekly_attempt_cnt: 7
    },
    {
        attempt_id: "attempt_004",
        user_id: "user_mike321",
        username: "마이크",
        rank: 4,
        score: 720,
        accuracy_pct: 89,
        avg_ms_per_q: 1550,
        total_time_ms: 186000,
        weekly_question_cnt: 75,
        weekly_attempt_cnt: 5
    },
    {
        attempt_id: "attempt_005",
        user_id: "user_lisa654",
        username: "리사",
        rank: 5,
        score: 680,
        accuracy_pct: 87,
        avg_ms_per_q: 1650,
        total_time_ms: 198000,
        weekly_question_cnt: 70,
        weekly_attempt_cnt: 6
    },
    {
        attempt_id: "attempt_006",
        user_id: "user_tom987",
        username: "톰",
        rank: 6,
        score: 640,
        accuracy_pct: 84,
        avg_ms_per_q: 1750,
        total_time_ms: 210000,
        weekly_question_cnt: 65,
        weekly_attempt_cnt: 4
    },
    {
        attempt_id: "attempt_007",
        user_id: "user_kate159",
        username: "케이트",
        rank: 7,
        score: 590,
        accuracy_pct: 82,
        avg_ms_per_q: 1850,
        total_time_ms: 222000,
        weekly_question_cnt: 60,
        weekly_attempt_cnt: 5
    },
    {
        attempt_id: "attempt_008",
        user_id: "user_david753",
        username: "데이비드",
        rank: 8,
        score: 545,
        accuracy_pct: 79,
        avg_ms_per_q: 1950,
        total_time_ms: 234000,
        weekly_question_cnt: 55,
        weekly_attempt_cnt: 4
    },
    {
        attempt_id: "attempt_009",
        user_id: "user_emma852",
        username: "엠마",
        rank: 9,
        score: 500,
        accuracy_pct: 76,
        avg_ms_per_q: 2100,
        total_time_ms: 252000,
        weekly_question_cnt: 50,
        weekly_attempt_cnt: 3
    },
    {
        attempt_id: "attempt_010",
        user_id: "user_james741",
        username: "제임스",
        rank: 10,
        score: 460,
        accuracy_pct: 73,
        avg_ms_per_q: 2250,
        total_time_ms: 270000,
        weekly_question_cnt: 45,
        weekly_attempt_cnt: 4
    }
];

export default async function RankPage() {
    // 기본(모드: 'rank_5s', 상위 100, Asia/Seoul)
    //const ranks = await findWeeklyTopN();
    // 커스터마이즈
    const ranks = await findWeeklyTopNWithUsername({ mode: 'rank_5s', topN: 10, tz: 'Asia/Seoul' });
    console.log("ranks :", ranks)
    //const ranks = sampleRankingData;
    return (
        <main>
            <RankCascader ranking={ranks} />
        </main>
    );
}
