// scripts/build-joseon-questions.ts
/**
 */

import { saveGeneratedQuestions } from "@/core/repositroy/questions/question.create.repo";

type ChoiceOut = { content: string; is_correct: boolean; order_no: 1 | 2 | 3 | 4 };
type QuestionOut = {
    question: {
        category_id: number;
        type: "MCQ";
        stem: string;
        explanation: string;
        difficulty: number;
        grade: string;
        language: "ko";
        status: "published";
    };
    choices: ChoiceOut[];
};

// ────────────────────────────────────────────────────────────
// 설정
// ────────────────────────────────────────────────────────────
const CATEGORY_ID = 5;               // 📌 "역사" 카테고리로 보이는 ID
const DIFFICULTY_DEFAULT = 2;        // 기본 난이도(중간)
const GRADE_DEFAULT = "middle";      // 중등 수준
const LANGUAGE: "ko" = "ko";

const TARGET_COUNT = Number(process.env.MAX_QUESTIONS ?? 200);

// 안전한 왕 목록 (오답 풀)
const KINGS = [
    "태조", "태종", "세종", "세조", "성종", "연산군", "중종", "명종", "선조", "광해군",
    "인조", "효종", "현종", "숙종", "경종", "영조", "정조", "순조", "헌종", "철종", "고종", "순종"
];

// ────────────────────────────────────────────────────────────
// 데이터 팩트(정답) — 안전한 사실만 선별
// kind=king: “OOO을 한 왕은?” 류 (정답=왕)
// kind=term: “이 정의/설명에 해당하는 것은?” 류 (정답=용어/제도/저서/인물)
// ────────────────────────────────────────────────────────────
type FactKing = {
    kind: "king";
    subject: string;          // 업적/사실 (예: "훈민정음 창제")
    answer: string;           // 왕 이름 (예: "세종")
    explanation: string;      // 해설
    distractors?: string[];   // 선택. 없으면 KINGS에서 자동 샘플
    stems?: string[];         // 선택. 없으면 템플릿 사용
};

type FactTerm = {
    kind: "term";
    question: string;         // 지문 (예: "조선의 최고 교육기관은?")
    answer: string;           // 정답 (예: "성균관")
    explanation: string;      // 해설
    distractors: string[];    // 오답 3~N개에서 3개 샘플
};

const FACTS: Array<FactKing | FactTerm> = [
    // ── 왕 업적/사건 (정답=왕) ──
    { kind: "king", subject: "조선을 건국", answer: "태조", explanation: "이성계(태조)가 고려를 멸하고 1392년에 조선을 세웠습니다." },
    { kind: "king", subject: "한양(한성)으로 천도", answer: "태조", explanation: "태조가 도읍을 한양으로 옮기고 경복궁을 창건했습니다." },
    { kind: "king", subject: "경복궁을 창건", answer: "태조", explanation: "태조 때 1395년에 경복궁이 지어졌습니다." },
    { kind: "king", subject: "집현전을 설치", answer: "세종", explanation: "세종은 학문 진흥을 위해 집현전을 설치하고 인재를 양성했습니다." },
    { kind: "king", subject: "훈민정음을 창제", answer: "세종", explanation: "세종은 서민도 쉽게 읽고 쓸 수 있도록 훈민정음을 창제했습니다." },
    { kind: "king", subject: "4군 6진을 개척", answer: "세종", explanation: "세종 때 최윤덕·김종서 등이 북방 영토를 넓혔습니다." },
    { kind: "king", subject: "측우기 제작을 주도", answer: "세종", explanation: "세종은 장영실 등을 등용해 과학 기술을 발전시켰고 측우기 제작을 추진했습니다." },
    { kind: "king", subject: "자격루(물시계) 제작을 후원", answer: "세종", explanation: "세종과 장영실이 협력해 자동 물시계 자격루를 제작했습니다." },
    { kind: "king", subject: "앙부일구(해시계)를 설치", answer: "세종", explanation: "세종 때 해시계 ‘앙부일구’가 제작·설치되었습니다." },
    { kind: "king", subject: "농사직설 편찬을 명", answer: "세종", explanation: "세종은 백성들의 농사에 도움을 주기 위해 『농사직설』 편찬을 명했습니다." },
    { kind: "king", subject: "계유정난으로 단종을 폐위", answer: "세조", explanation: "수양대군(세조)이 정변을 일으켜 단종을 몰아내고 즉위했습니다." },
    { kind: "king", subject: "경국대전을 완성·반포", answer: "성종", explanation: "성종 때 『경국대전』이 완성되어 조선의 기본 법전이 되었습니다." },
    { kind: "king", subject: "임진왜란 당시 재위", answer: "선조", explanation: "1592년 임진왜란 발발 당시 조선의 왕은 선조였습니다." },
    { kind: "king", subject: "훈련도감을 설치", answer: "선조", explanation: "임진왜란 중 상비군 조직인 훈련도감이 설치되었습니다." },
    { kind: "king", subject: "병자호란 당시 재위", answer: "인조", explanation: "1636년 청의 침입(병자호란) 당시 조선의 왕은 인조였습니다." },
    { kind: "king", subject: "북벌론을 추진", answer: "효종", explanation: "효종은 청에 대한 북벌 의지를 보이며 군사력 강화를 도모했습니다." },
    { kind: "king", subject: "상평통보의 전국 유통을 본격화", answer: "숙종", explanation: "숙종 때 상평통보가 널리 유통되었습니다." },
    { kind: "king", subject: "탕평책을 추진", answer: "영조", explanation: "영조는 붕당 갈등을 완화하려 탕평책을 시행했습니다." },
    { kind: "king", subject: "균역법을 시행", answer: "영조", explanation: "영조 때 군포 부담을 줄이는 균역법이 시행되었습니다." },
    { kind: "king", subject: "수원 화성을 축조", answer: "정조", explanation: "정조는 효의 상징과 개혁 거점으로 수원 화성을 축조했습니다." },
    { kind: "king", subject: "규장각을 설치", answer: "정조", explanation: "정조는 학술·정치 자문 기구로 규장각을 설치했습니다." },
    { kind: "king", subject: "경복궁을 중건하고 개혁을 추진", answer: "고종", explanation: "고종 때 흥선대원군 주도로 경복궁 중건과 대대적 개혁이 이루어졌습니다." },

    // ── 용어/제도/저서/인물 (정답=용어/인물/저서) ──
    { kind: "term", question: "조선의 최고 교육기관은 무엇인가요?", answer: "성균관", explanation: "성균관은 조선의 최고 교육기관이었습니다.", distractors: ["향교", "서원", "서당", "규장각"] },
    { kind: "term", question: "조선의 지방 교육기관으로 옳은 것은?", answer: "향교", explanation: "향교는 지방의 공립 교육기관이었습니다.", distractors: ["성균관", "서원", "서당", "교서관"] },
    { kind: "term", question: "사림의 교육과 교화 중심 사립 교육기관은?", answer: "서원", explanation: "서원은 사림이 운영한 사립 교육기관입니다.", distractors: ["성균관", "향교", "서당", "훈련도감"] },
    { kind: "term", question: "임진왜란 중 설치된 상비군 조직은?", answer: "훈련도감", explanation: "훈련도감은 임진왜란 중 설치된 상비군 기구입니다.", distractors: ["의금부", "의정부", "사헌부", "사간원"] },
    { kind: "term", question: "다산 정약용의 저서로 옳은 것은?", answer: "목민심서", explanation: "정약용의 대표 저서 중 하나입니다.", distractors: ["용비어천가", "삼국유사", "제왕운기", "동국통감"] },
    { kind: "term", question: "연암 박지원의 기행문으로 옳은 것은?", answer: "열하일기", explanation: "박지원이 청을 다녀와 기록한 기행문입니다.", distractors: ["성호사설", "경세유표", "반계수록", "목민심서"] },
    { kind: "term", question: "실학자 유형원의 저서로 옳은 것은?", answer: "반계수록", explanation: "유형원의 개혁 구상을 담은 저서입니다.", distractors: ["경세유표", "목민심서", "열하일기", "훈민정음"] },
    { kind: "term", question: "성호 이익의 학문과 견문을 모은 책은?", answer: "성호사설", explanation: "이익의 백과사전적 저술입니다.", distractors: ["목민심서", "경세유표", "반계수록", "증보문헌비고"] },
    { kind: "term", question: "백성의 납세 부담을 줄이려 시행된 법으로 옳은 것은?", answer: "균역법", explanation: "영조 때 군포 부담을 경감하기 위해 시행되었습니다.", distractors: ["대동법", "공법", "직전법", "광해법"] },
    { kind: "term", question: "토산물 대신 쌀로 바치게 한 세법은?", answer: "대동법", explanation: "처음 경기도에서 시행되어 점차 확대되었습니다.", distractors: ["균역법", "공법", "삼정이정청", "연분9등법"] },
    { kind: "term", question: "조선의 언론 3사에 속하지 않는 기관은?", answer: "의정부", explanation: "언론 3사는 사헌부·사간원·홍문관입니다.", distractors: ["사헌부", "사간원", "홍문관", "교서관"] },
    { kind: "term", question: "조선 후기 화폐로 널리 유통된 동전은?", answer: "상평통보", explanation: "숙종 때 본격 유통되었습니다.", distractors: ["해동통보", "건원중보", "화폐삼한통보", "은병"] },
    { kind: "term", question: "조선의 수도로 옳은 것은?", answer: "한양(한성)", explanation: "초기부터 한양이 수도였습니다.", distractors: ["개경", "평양", "경주", "의주"] },
    { kind: "term", question: "훈민정음 창제에 기여한 과학자로 옳은 인물은?", answer: "장영실", explanation: "세종의 명으로 과학기술 발달에 크게 기여했습니다.", distractors: ["허준", "정약용", "이순신", "유성룡"] },
    { kind: "term", question: "『경국대전』의 성격으로 옳은 것은?", answer: "조선의 기본 법전", explanation: "성종 때 완성·반포되어 통치의 기준이 되었습니다.", distractors: ["중국의 병서", "고려의 역사서", "지도집", "서민 소설"] },
    { kind: "term", question: "수원 화성을 축조한 목적과 가장 가까운 것은?", answer: "왕권 강화와 개혁 추진의 거점", explanation: "정조는 개혁의 상징으로 수원 화성을 축조했습니다.", distractors: ["청과의 통상 거점", "서양과학 연구소", "불교 포교 중심", "궁중 악학 양성소"] },
    { kind: "term", question: "세도정치로 가장 잘 설명되는 시기는?", answer: "왕권 약화와 외척 중심의 권력 운영", explanation: "순조~철종 사이 외척 세력 중심의 정치가 전개되었습니다.", distractors: ["북벌 추진의 강화", "신분제 폐지와 민주화", "지방자치 전면 시행", "군주 부재의 공화정"] },
    { kind: "term", question: "동학을 창시한 인물은?", answer: "최제우", explanation: "수운 최제우가 1860년 동학을 창시했습니다.", distractors: ["최시형", "정약용", "박지원", "정약전"] },
    { kind: "term", question: "『목민심서』의 저자로 옳은 인물은?", answer: "정약용", explanation: "백성을 위한 지방 행정의 도리를 담았습니다.", distractors: ["정약전", "이익", "박제가", "박지원"] },
    { kind: "term", question: "대한제국을 선포한 군주는?", answer: "고종", explanation: "1897년 대한제국을 선포했습니다.", distractors: ["순종", "영조", "정조", "헌종"] },
];

// ────────────────────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
function sampleN<T>(arr: T[], n: number): T[] {
    if (arr.length <= n) return shuffle(arr).slice(0, n);
    const used = new Set<number>();
    const out: T[] = [];
    while (out.length < n && used.size < arr.length) {
        const i = Math.floor(Math.random() * arr.length);
        if (!used.has(i)) {
            used.add(i);
            out.push(arr[i]);
        }
    }
    return out;
}

// ────────────────────────────────────────────────────────────
function buildChoices(correct: string, wrongsPool: string[], needWrong = 3): ChoiceOut[] {
    const wrongs = sampleN(
        wrongsPool.filter((x) => x !== correct),
        needWrong
    );
    const four = shuffle([{ content: correct, is_correct: true }, ...wrongs.map((w) => ({ content: w, is_correct: false }))]);
    return four.map((c, idx) => ({
        content: c.content,
        is_correct: c.is_correct,
        order_no: (idx + 1) as 1 | 2 | 3 | 4,
    }));
}

// ────────────────────────────────────────────────────────────
function toQuestionKing(f: FactKing, variant: number): QuestionOut {
    const templates = f.stems ?? [
        `다음 중 ${f.subject} 왕은 누구인가요?`,
        `${f.subject} 업적을 남긴 조선의 왕은?`,
        `${f.subject} 사실과 가장 가까운 왕을 고르세요.`,
        `${f.subject}을(를) 한 왕을 고르세요.`,
    ];
    const stem = templates[variant % templates.length];
    const pool = f.distractors && f.distractors.length > 0 ? f.distractors : KINGS;
    const choices = buildChoices(f.answer, pool);
    return {
        question: {
            category_id: CATEGORY_ID,
            type: "MCQ",
            stem,
            explanation: f.explanation,
            difficulty: DIFFICULTY_DEFAULT,
            grade: GRADE_DEFAULT,
            language: LANGUAGE,
            status: "published",
        },
        choices,
    };
}

function toQuestionTerm(f: FactTerm, _variant: number): QuestionOut {
    const choices = buildChoices(f.answer, f.distractors);
    return {
        question: {
            category_id: CATEGORY_ID,
            type: "MCQ",
            stem: f.question,
            explanation: f.explanation,
            difficulty: DIFFICULTY_DEFAULT,
            grade: GRADE_DEFAULT,
            language: LANGUAGE,
            status: "published",
        },
        choices,
    };
}

// ────────────────────────────────────────────────────────────
// 메인 생성: FACTS를 바탕으로 변형 문항을 만들어 200문 확보
// ────────────────────────────────────────────────────────────
function buildAll(): QuestionOut[] {
    const out: QuestionOut[] = [];
    // 1) 1차 생성 (각 팩트 1문 기본)
    for (const f of FACTS) {
        if (f.kind === "king") out.push(toQuestionKing(f, 0));
        else out.push(toQuestionTerm(f, 0));
    }
    // 2) 변형 반복 생성 (왕 팩트는 문구 변형을 더 뽑아 수량 확대)
    let v = 1;
    while (out.length < TARGET_COUNT) {
        for (const f of FACTS) {
            if (out.length >= TARGET_COUNT) break;
            if (f.kind === "king") {
                out.push(toQuestionKing(f, v++));
            } else {
                // term은 변형 문구가 적어 2배수까지만 반복
                if (v % 3 === 0) out.push(toQuestionTerm(f, v));
            }
        }
    }
    return out.slice(0, TARGET_COUNT);
}

// ────────────────────────────────────────────────────────────
async function main() {
    const items = buildAll();

    const shouldSave = process.env.SAVE_TO_DB === "1" || process.argv.includes("--save");
    const onDuplicate: "skip" | "replace" = process.argv.includes("--replace") ? "replace" : "skip";

    if (true) {
        const res = await saveGeneratedQuestions(items as any, {
            onDuplicate,
            validate: true,
        });
        console.log(JSON.stringify(res, null, 2));
    } else {
        console.log(JSON.stringify(items, null, 2));
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});


export default function QuizEditPageDemo() {
    return <>조선</>;
}