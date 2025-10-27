import type {
    SelectedAnswers,
    QuizItem,
    UserAnswer
} from "@/core/repositroy/questions/question.type";

const convertToSelectedAnswers = (
    questions: QuizItem[],
    answers: {
        questionIndex: number;
        selectedIndex: number | null
    }[]
): SelectedAnswers[] => {
    return questions.map((question, index) => {
        const userAnswer = answers.find(a => a.questionIndex === index);
        return {
            order_no: index + 1, // 1부터 시작
            question_id: question.id ? Number(question.id) : null, // string을 number로 변환
            selected_idx: userAnswer?.selectedIndex ?? null,
            correct_idx: question.correctOrderNo ?? 1,
        };
    });
};

/**
 * 
 * @param questionCnt 문제개수
 * @param totalTimeMs 소요시간
 * @param questions 문제들
 * @param answers 사용자가 선택한 문제와 정답 정보들
 * @returns 
 */
export const saveAttepmtAnswer = async (
    questionCnt: number,
    totalTimeMs: number,
    questions: QuizItem[],
    answers: UserAnswer[],
    mode: string = 'rank',
) => {
    try {
        const selectedItems = convertToSelectedAnswers(questions, answers);
        const payload = {
            mode: mode,
            questionCnt: questionCnt,
            totalTimeMs,
            items: selectedItems,
        };
        return await fetch('/api/attempt-answer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        throw new Error(`Save attempt answer Failed`);
    }
};


