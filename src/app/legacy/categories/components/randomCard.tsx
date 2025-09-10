import { useRouter } from 'next/navigation';
/**
 * @param selectedPath 현재 선택 경로 상태
 */
export default function RandomCardPage() {
    const router = useRouter();

    const handleRandomQuiz = () => {
        router.push('/quiz');
    };

    return (
        <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="text-center">
                <div className="text-3xl mb-3">🎲</div>
                <h2 className="text-xl font-bold mb-2">랜덤 퀴즈</h2>
                <p className="text-purple-100 text-sm mb-4">
                    모든 카테고리에서 다양한 문제 출제
                </p>
                <button
                    onClick={handleRandomQuiz}
                    className="w-full bg-white text-purple-600 py-3 px-4 rounded-xl font-semibold hover:bg-purple-50 transition-colors"
                >
                    바로 시작하기
                </button>
            </div>
        </div>
    );
}