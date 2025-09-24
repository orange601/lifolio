export type AttemptPayload = {
    mode: string;
    questionCnt: number;
    score: number;   // correctCount
    timeMs: number;  // ms
};

export type AttemptAnswerDetail = {
    order_no: number;            // 1-based
    question_id: number | null;  // 있으면 사용
    selected_idx: number | null; // 0-based, 미선택 null
    correct_idx: number;         // 0-based
    is_correct: boolean;
};