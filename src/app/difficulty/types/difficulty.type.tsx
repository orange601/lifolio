export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export interface DifficultyOption {
    value: DifficultyLevel; // DB/URL에 들어갈 숫자 값
    name: string;           // 화면 표기용 텍스트
    description: string;
    icon: string;
    color: {
        bg: string;
        border: string;
        text: string;
        accent: string;
    };
}

export const DifficultyOptions: DifficultyOption[] = [
    {
        value: 1, // beginner
        name: '입문',
        description: '완전 초보도 가능한 기초 연습',
        icon: '🐣',
        color: {
            bg: 'bg-lime-50',
            border: 'border-lime-200',
            text: 'text-lime-700',
            accent: 'bg-lime-500'
        },
    },
    {
        value: 2, // easy
        name: '쉬움',
        description: '기초적인 문제로 부담 없이 시작',
        icon: '😊',
        color: {
            bg: 'bg-green-50',
            border: 'border-green-200',
            text: 'text-green-700',
            accent: 'bg-green-500'
        },
    },
    {
        value: 3, // normal
        name: '보통',
        description: '적당한 도전으로 실력 향상',
        icon: '🤔',
        color: {
            bg: 'bg-blue-50',
            border: 'border-blue-200',
            text: 'text-blue-700',
            accent: 'bg-blue-500'
        },
    },
    {
        value: 4, // hard
        name: '어려움',
        description: '고수를 위한 도전적인 문제',
        icon: '😤',
        color: {
            bg: 'bg-orange-50',
            border: 'border-orange-200',
            text: 'text-orange-700',
            accent: 'bg-orange-500'
        },
    },
    {
        value: 5, // expert
        name: '마스터',
        description: '전문가 수준의 심화 난이도',
        icon: '🔥',
        color: {
            bg: 'bg-red-50',
            border: 'border-red-200',
            text: 'text-red-700',
            accent: 'bg-red-500'
        },
    }
];