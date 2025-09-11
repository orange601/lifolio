/**
 * 랭킹전 컨테이너 헤더, 시간제한 5초, 뒤로가기 없음
 */
import styles from '../components/RankContainerHeader.module.css';
export default function RankContainerHeader() {
    return (
        <div className="container-header">
            <div className={styles.headerLeft}>

            </div>

            <div className={styles.headerCenter}>
                <div className={styles.progressLabel}>랭킹 전</div>
            </div>

            <div className={styles.headerRight}>
            </div>
        </div>
    )
}