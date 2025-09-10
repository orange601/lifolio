export default function EmptyQuizPage() {
    return (
        <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">준비중인 퀴즈입니다.</div>
            <div className="empty-description">
                곧 새로운 퀴즈가 추가될 예정입니다.<br />다른 테마를 선택해보세요!
            </div>
        </div>
    );
}