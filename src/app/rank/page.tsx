
import RankCascader from './components/RankCascader'
import { findWeeklyTopNWithUsername } from "@/core/repositroy/rank/rank.read.repo";

export default async function RankPage() {
    // 기본(모드: 'rank_5s', 상위 100, Asia/Seoul)
    //const ranks = await findWeeklyTopN();
    // 커스터마이즈
    const ranks = await findWeeklyTopNWithUsername({ mode: 'rank_5s', topN: 10, tz: 'Asia/Seoul' });
    return (
        <main>
            <RankCascader ranking={ranks} />
        </main>
    );
}
