import styles from '@/app/components/page/empty/EmptyContainer.module.css';
import ToDashboardButton from '@/app/components/ui/backButton/ToDashboardButton';
export default function EmptyContainer(
    { onGoHome }: { onGoHome: () => void }
) {
    return (
        <div className={styles.noDataMessage}>
            <div className={styles.noDataIcon}>📝</div>
            <h2>페이지를 찾을 수 없습니다.</h2>
            <p>홈으로 돌아가서 새로운 퀴즈를 시작해보세요.</p>
            <ToDashboardButton
                onClick={onGoHome}
                icon="🏠"
            >
                홈으로
            </ToDashboardButton>
        </div>
    )
}