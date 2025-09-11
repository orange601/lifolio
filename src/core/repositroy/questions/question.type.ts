export interface Choice {
    id: string;                // uuid
    content: string;
    is_correct: boolean;
    order_no: number | null;
}

export interface QuestionWithChoices {
    id: string;                // DB가 number면 string | number로 바꿔도 OK
    category_id: number;
    type: 'MCQ' | string;
    stem: string;
    explanation: string | null;
    difficulty: number;
    grade: string;
    language: string | null;
    status: string;
    created_by: string | null;
    created_at: string;        // Date를 문자열로 받는 경우
    updated_at: string | null;
    choices: Choice[];
}

/** ✅ UI에서 바로 쓰는 형태 (정답 인덱스 포함 + 해설 포함) */
export interface QuizItem {
    id: string;
    question: string;
    options: string[];
    correctOrderNo: number;      // 없으면 0으로 보정
    explanation: string | null;
}


