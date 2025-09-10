// 현재 사용하지 않고 있는 페이지 모달없이 페이지에서 수정하는 페이지
// 이러면 데이터를 미리 전달받아야 된다는 단점이 있다.
// admin/question/[id] 아래에 현재 페이지로 변경하던지 EditWithModal.tsx로 변경하든지 선택해야한다.

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// 샘플 퀴즈 데이터
const sampleQuizItem = {
    id: 1,
    question: "JavaScript에서 변수를 선언하는 키워드가 아닌 것은?",
    options: ["var", "let", "const", "int"],
    correctIndex: 3,
    explanation: "JavaScript에서는 int 키워드를 사용하지 않습니다. var, let, const만 변수 선언에 사용됩니다."
};

export default function QuizEditPageDemo() {
    const router = useRouter();

    // 편집 상태
    const [question, setQuestion] = useState(sampleQuizItem.question || '');
    const [options, setOptions] = useState(sampleQuizItem.options || ['', '', '', '']);
    const [correctIndex, setCorrectIndex] = useState(sampleQuizItem.correctIndex || 0);
    const [explanation, setExplanation] = useState(sampleQuizItem.explanation || '');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // 유효성 검사
    const isValid = () => {
        return (
            question.trim() !== '' &&
            options.every(option => option.trim() !== '') &&
            correctIndex >= 0 && correctIndex < options.length &&
            explanation.trim() !== ''
        );
    };

    // 선택지 변경 핸들러
    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    // 저장 핸들러 (시뮬레이션)
    const handleSave = async () => {
        if (!isValid()) {
            alert('모든 필드를 올바르게 입력해주세요.');
            return;
        }

        setIsSaving(true);
        try {
            // API 호출 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 1500));

            const updatedQuiz = {
                ...sampleQuizItem,
                question: question.trim(),
                options: options.map(opt => opt.trim()),
                correctIndex,
                explanation: explanation.trim()
            };

            console.log('저장된 퀴즈:', updatedQuiz);
            alert('퀴즈가 성공적으로 저장되었습니다!');
        } catch (error) {
            console.error('저장 오류:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    // 삭제 핸들러 (시뮬레이션)
    const handleDelete = async () => {
        setIsLoading(true);
        try {
            // API 호출 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('삭제된 퀴즈 ID:', sampleQuizItem.id);
            alert('퀴즈가 성공적으로 삭제되었습니다!');
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('삭제 오류:', error);
            alert('삭제 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 뒤로가기
    const handleBack = () => {
        if (confirm('변경사항이 저장되지 않을 수 있습니다. 정말 나가시겠습니까?')) {
            // router.back(); // 실제 환경에서는 이 코드 사용
            alert('뒤로가기 버튼이 클릭되었습니다.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handleBack}
                            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="text-center flex-1">
                            <h1 className="text-lg font-semibold text-gray-900">문제 수정</h1>
                            <p className="text-xs text-gray-500">ID: {sampleQuizItem.id}</p>
                        </div>

                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-2 -mr-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6">
                {/* 문제 입력 */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                        문제 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="문제를 입력하세요"
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                    />
                </div>

                {/* 선택지 입력 */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                        선택지 <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center space-x-3">
                                <button
                                    onClick={() => setCorrectIndex(index)}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${correctIndex === index
                                        ? 'border-green-500 bg-green-500'
                                        : 'border-gray-300 hover:border-green-400'
                                        }`}
                                >
                                    {correctIndex === index && (
                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </button>
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`선택지 ${index + 1}`}
                                    className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                        체크 버튼을 눌러 정답을 선택하세요
                    </p>
                </div>

                {/* 해설 입력 */}
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                        해설 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={explanation}
                        onChange={(e) => setExplanation(e.target.value)}
                        placeholder="정답에 대한 해설을 입력하세요"
                        className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                    />
                </div>

                {/* 미리보기 */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-3">미리보기</h3>
                    <div className="bg-white rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">{question || '문제를 입력하세요'}</h4>
                        <div className="space-y-2">
                            {options.map((option, index) => (
                                <div
                                    key={index}
                                    className={`p-2 rounded border text-sm ${correctIndex === index
                                        ? 'border-green-400 bg-green-50 text-green-800'
                                        : 'border-gray-200 bg-gray-50'
                                        }`}
                                >
                                    {option || `선택지 ${index + 1}`}
                                    {correctIndex === index && (
                                        <span className="ml-2 text-xs font-medium">(정답)</span>
                                    )}
                                </div>
                            ))}
                        </div>
                        {explanation && (
                            <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-700">
                                <strong>해설:</strong> {explanation}
                            </div>
                        )}
                    </div>
                </div>

                {/* 저장 버튼 */}
                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        disabled={!isValid() || isSaving}
                        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 ${isValid() && !isSaving
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl active:scale-[0.98]'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {isSaving ? (
                            <div className="flex items-center justify-center space-x-2">
                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>저장 중...</span>
                            </div>
                        ) : (
                            '변경사항 저장'
                        )}
                    </button>
                </div>

                {/* 도움말 */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <div className="flex items-start space-x-3">
                        <div className="text-amber-600 text-lg mt-0.5">💡</div>
                        <div>
                            <p className="text-amber-800 text-sm font-medium mb-1">수정 가이드</p>
                            <ul className="text-amber-700 text-xs leading-relaxed space-y-1">
                                <li>• 문제는 명확하고 이해하기 쉽게 작성하세요</li>
                                <li>• 선택지는 비슷한 길이로 맞춰주세요</li>
                                <li>• 정답 해설은 상세하게 설명해주세요</li>
                                <li>• 저장 전 미리보기를 확인하세요</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* 테스트용 버튼들 */}
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <h3 className="text-sm font-semibold text-purple-900 mb-3">테스트 기능</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => {
                                setQuestion("React에서 상태를 관리하는 Hook은?");
                                setOptions(["useEffect", "useState", "useContext", "useReducer"]);
                                setCorrectIndex(1);
                                setExplanation("useState는 함수형 컴포넌트에서 상태를 관리하는 가장 기본적인 Hook입니다.");
                            }}
                            className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-xs font-medium transition-colors"
                        >
                            샘플 2 로드
                        </button>
                        <button
                            onClick={() => {
                                setQuestion("");
                                setOptions(["", "", "", ""]);
                                setCorrectIndex(0);
                                setExplanation("");
                            }}
                            className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                        >
                            초기화
                        </button>
                    </div>
                </div>
            </div>

            {/* 삭제 확인 모달 */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <div className="text-center mb-6">
                            <div className="text-4xl mb-3">⚠️</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                문제 삭제
                            </h3>
                            <p className="text-gray-600 text-sm">
                                이 문제를 정말 삭제하시겠습니까?<br />
                                삭제된 문제는 복구할 수 없습니다.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleDelete}
                                disabled={isLoading}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                            >
                                {isLoading ? '삭제 중...' : '삭제하기'}
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 하단 여백 */}
            <div className="h-8"></div>
        </div>
    );
}