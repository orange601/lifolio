// 현재 사용하지 않고 있는 페이지
// 모달을 이용해서 문제와 정답을 수정하는 페이지
// 모달을 사용하는게 별로라 고민이다.

// admin/question/[id] 아래에 현재 페이지로 변경하던지 EditQuestion.tsx로 변경하든지 선택해야한다.

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { QuizItem } from "@/core/repositroy/questions/question.type";

// 샘플 데이터
const sampleQuizData: QuizItem[] = [
    {
        id: 1 + "",
        question: "JavaScript에서 변수를 선언하는 키워드가 아닌 것은?",
        options: ["var", "let", "const", "int"],
        correctOrderNo: 3,
        explanation: "JavaScript에서는 int 키워드를 사용하지 않습니다. var, let, const만 변수 선언에 사용됩니다."
    },
    {
        id: 2 + "",
        question: "React에서 상태를 관리하는 Hook은?",
        options: ["useEffect", "useState", "useContext", "useReducer"],
        correctOrderNo: 1,
        explanation: "useState는 함수형 컴포넌트에서 상태를 관리하는 가장 기본적인 Hook입니다."
    },
    {
        id: 3 + "",
        question: "CSS에서 flexbox의 기본 축은?",
        options: ["cross axis", "main axis", "vertical axis", "horizontal axis"],
        correctOrderNo: 1,
        explanation: "flexbox에서 main axis(주축)는 flex-direction에 의해 결정되는 기본 축입니다."
    },
    {
        id: 4 + "",
        question: "HTTP 상태 코드 404의 의미는?",
        options: ["서버 오류", "요청 성공", "페이지를 찾을 수 없음", "권한 없음"],
        correctOrderNo: 2,
        explanation: "404 Not Found는 요청한 리소스를 서버에서 찾을 수 없을 때 반환되는 상태 코드입니다."
    },
    {
        id: 5 + "",
        question: "대한민국의 수도는?",
        options: ["부산", "서울", "대구", "인천"],
        correctOrderNo: 1,
        explanation: "대한민국의 수도는 서울특별시입니다."
    },
    {
        id: 6 + "",
        question: "Python에서 리스트를 생성하는 올바른 방법은?",
        options: ["list = {}", "list = []", "list = ()", "list = <>"],
        correctOrderNo: 1,
        explanation: "Python에서 리스트는 대괄호 []를 사용하여 생성합니다."
    }
];

interface QuizManagementPageProps {
    initialQuizData?: QuizItem[];
    onQuizUpdate?: (updatedQuiz: QuizItem) => Promise<void>;
    onQuizDelete?: (quizId: string) => Promise<void>;
}

export default function QuizManagementPage({
    initialQuizData,
    onQuizUpdate,
    onQuizDelete
}: QuizManagementPageProps) {
    const router = useRouter();

    const [quizData, setQuizData] = useState<QuizItem[]>(initialQuizData || sampleQuizData);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<QuizItem | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // 검색 필터링
    const filteredQuizData = quizData.filter(quiz =>
        quiz.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.options.some(option => option.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // 퀴즈 편집 모달 열기
    const handleEditQuiz = (quiz: QuizItem) => {
        setSelectedQuiz(quiz);
        setShowEditModal(true);
    };

    // 퀴즈 업데이트
    const handleSaveQuiz = async (updatedQuiz: QuizItem) => {
        try {
            setIsLoading(true);

            // API 호출 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 500));

            // 로컬 상태 업데이트
            setQuizData(prevData =>
                prevData.map(quiz =>
                    quiz.id === updatedQuiz.id ? updatedQuiz : quiz
                )
            );

            // 외부 핸들러 호출
            if (onQuizUpdate) {
                await onQuizUpdate(updatedQuiz);
            }

            setShowEditModal(false);
            setSelectedQuiz(null);
        } catch (error) {
            console.error('퀴즈 업데이트 오류:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 퀴즈 삭제
    const handleDeleteQuiz = async (quizId: string) => {
        try {
            setIsLoading(true);

            // API 호출 시뮬레이션
            await new Promise(resolve => setTimeout(resolve, 500));

            // 로컬 상태 업데이트
            setQuizData(prevData => prevData.filter(quiz => quiz.id !== quizId));

            // 외부 핸들러 호출
            if (onQuizDelete) {
                await onQuizDelete(quizId);
            }

            setShowEditModal(false);
            setSelectedQuiz(null);
        } catch (error) {
            console.error('퀴즈 삭제 오류:', error);
            alert('삭제 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 정답 표시 스타일
    const getAnswerStyle = (option: string, index: number, correctIndex: number) => {
        if (index === correctIndex) {
            return 'text-green-700 font-semibold';
        }
        return 'text-gray-600';
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* 헤더 */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="text-center flex-1">
                            <h1 className="text-lg font-semibold text-gray-900">퀴즈 관리</h1>
                            <p className="text-xs text-gray-500">총 {quizData.length}개 문제</p>
                        </div>

                        <div className="w-10"></div>
                    </div>

                    {/* 검색바 */}
                    <div className="mt-3">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="문제 또는 선택지로 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4">
                {/* 퀴즈 목록 */}
                <div className="space-y-4">
                    {filteredQuizData.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">🔍</div>
                            <p className="text-gray-500">
                                {searchTerm ? '검색 결과가 없습니다' : '등록된 퀴즈가 없습니다'}
                            </p>
                        </div>
                    ) : (
                        filteredQuizData.map((quiz) => (
                            <div
                                key={quiz.id}
                                className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                                ID: {quiz.id}
                                            </span>
                                        </div>
                                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                            {quiz.question}
                                        </h3>
                                    </div>

                                    <button
                                        onClick={() => handleEditQuiz(quiz)}
                                        className="ml-3 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* 선택지 미리보기 */}
                                <div className="grid grid-cols-1 gap-2 mb-3">
                                    {quiz.options.map((option, index) => (
                                        <div
                                            key={index}
                                            className={`p-2 rounded border text-sm ${index === quiz.correctOrderNo
                                                ? 'border-green-300 bg-green-50'
                                                : 'border-gray-200 bg-gray-50'
                                                }`}
                                        >
                                            <span className={getAnswerStyle(option, index, quiz.correctOrderNo)}>
                                                {index + 1}. {option}
                                                {index === quiz.correctOrderNo && (
                                                    <span className="ml-2 text-green-600 font-medium">(정답)</span>
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* 해설 미리보기 */}
                                {quiz.explanation && (
                                    <div className="p-2 bg-gray-100 rounded text-xs text-gray-700">
                                        <strong>해설:</strong> {quiz.explanation.slice(0, 100)}
                                        {quiz.explanation.length > 100 && '...'}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 편집 모달 */}
            {showEditModal && selectedQuiz && (
                <QuizEditModal
                    quizItem={selectedQuiz}
                    onSave={handleSaveQuiz}
                    // onDelete={handleDeleteQuiz}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedQuiz(null);
                    }}
                    isLoading={isLoading}
                />
            )}

            {/* 하단 여백 */}
            <div className="h-8"></div>
        </div>
    );
}

// 편집 모달 컴포넌트
interface QuizEditModalProps {
    quizItem: QuizItem;
    onSave: (updatedQuiz: QuizItem) => Promise<void>;
    //onDelete: (quizId: number) => Promise<void>;
    onClose: () => void;
    isLoading: boolean;
}

function QuizEditModal({ quizItem, onSave, onClose, isLoading }: QuizEditModalProps) {
    const [question, setQuestion] = useState(quizItem.question || '');
    const [options, setOptions] = useState(quizItem.options || ['', '', '', '']);
    const [correctIndex, setCorrectIndex] = useState(quizItem.correctOrderNo || 0);
    const [explanation, setExplanation] = useState(quizItem.explanation || '');
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

    // 저장 핸들러
    const handleSave = async () => {
        if (!isValid()) {
            alert('모든 필드를 올바르게 입력해주세요.');
            return;
        }

        const updatedQuiz: QuizItem = {
            ...quizItem,
            question: question.trim(),
            options: options.map(opt => opt.trim()),
            explanation: explanation.trim()
        };

        await onSave(updatedQuiz);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 sm:items-center sm:p-4">
            <div className="bg-white w-full max-h-[90vh] overflow-y-auto sm:rounded-2xl sm:max-w-2xl">
                {/* 모달 헤더 */}
                <div className="bg-white border-b border-gray-200 sticky top-0 px-4 py-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">문제 수정</h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {/* 문제 입력 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            문제 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder="문제를 입력하세요"
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                        />
                    </div>

                    {/* 선택지 입력 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            선택지 <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {options.map((option, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setCorrectIndex(index)}
                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${correctIndex === index
                                            ? 'border-green-500 bg-green-500'
                                            : 'border-gray-300 hover:border-green-400'
                                            }`}
                                    >
                                        {correctIndex === index && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        placeholder={`선택지 ${index + 1}`}
                                        className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 해설 입력 */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                            해설 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            placeholder="정답에 대한 해설을 입력하세요"
                            className="w-full p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                        />
                    </div>

                    {/* 버튼들 */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
                        >
                            취소
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!isValid() || isLoading}
                            className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${isValid() && !isLoading
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </div>

                {/* 삭제 확인 모달 */}
                {showDeleteConfirm && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl p-6 max-w-sm w-full">
                            <div className="text-center mb-4">
                                <div className="text-3xl mb-2">⚠️</div>
                                <h3 className="text-lg font-bold text-gray-800 mb-1">문제 삭제</h3>
                                <p className="text-gray-600 text-sm">
                                    정말 삭제하시겠습니까?
                                </p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                                >
                                    취소
                                </button>
                                <button
                                    // onClick={() => onDelete(quizItem.id)}
                                    disabled={isLoading}
                                    className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? '삭제 중...' : '삭제'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}