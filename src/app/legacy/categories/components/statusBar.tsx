type StatusBarProps = {
    currentLevel: number;
    maxLevel: number;
    canGoBack?: boolean;
    onBack?: () => void;
};

export default function StatusBar({
    currentLevel,
    maxLevel,
    canGoBack = false,
    onBack,
}: StatusBarProps) {
    return (
        <div className={`bg-white border-b border-gray-200 sticky top-0 z-10`}>
            <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                    {canGoBack ? (
                        <button
                            onClick={onBack}
                            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                            aria-label="뒤로가기"
                        >
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    ) : (
                        <div className="w-10" />
                    )}

                    <div className="text-center flex-1">
                        <h1 className="text-lg font-semibold text-gray-900">퀴즈 선택</h1>
                        <p className="text-xs text-gray-500">
                            {currentLevel}단계 / 최대 {maxLevel}단계
                        </p>
                    </div>

                    <div className="w-10" />
                </div>

                {/* 진행률 바 */}
                <div className="mt-3">
                    <div className="flex space-x-1">
                        {Array.from({ length: maxLevel }, (_, i) => (
                            <div
                                key={i}
                                className={`h-1 flex-1 rounded-full ${i < currentLevel ? 'bg-blue-500' : 'bg-gray-200'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}