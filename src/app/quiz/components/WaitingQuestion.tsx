// quiz/components/WaitingQuestion.tsx
export default function WaitingQuestionPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center">
            <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-gray-600">퀴즈를 불러오는 중...</p>
            </div>
        </div>
    );
}