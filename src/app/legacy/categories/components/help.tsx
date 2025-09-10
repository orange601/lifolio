/**
 * 
 * @param selectedPath 현재 선택 경로 상태
 */
export default function CategoriesHelpPage({ selectedPath }: { selectedPath: number[] }) {
    return (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-start space-x-3">
                <div className="text-amber-600 text-lg mt-0.5">💡</div>
                <div>
                    <p className="text-amber-800 text-sm font-medium mb-1">사용 방법</p>
                    <p className="text-amber-700 text-xs leading-relaxed">
                        {selectedPath.length === 0
                            ? "원하는 주제를 선택하세요. 하위 카테고리가 있으면 더 구체적으로 선택할 수 있습니다."
                            : "더 세부적인 주제를 선택하거나, 현재 주제로 퀴즈를 시작할 수 있습니다."
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}