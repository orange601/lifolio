export default function DifficultyHelpPage() {
    return (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-start space-x-3">
                <div className="text-blue-600 text-lg mt-0.5">💡</div>
                <div>
                    <p className="text-blue-800 text-sm font-medium mb-1">추천</p>
                    <p className="text-blue-700 text-xs leading-relaxed">
                        처음이라면 '보통' 난이도를 추천합니다. 언제든지 다른 난이도로 다시 도전할 수 있어요.
                    </p>
                </div>
            </div>
        </div>
    );
}