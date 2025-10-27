// scripts/import-questions-from-json.ts
/**
 * 사용법
 *  - npx tsx scripts/import-questions-from-json.ts
 *  - npx tsx scripts/import-questions-from-json.ts ./questions_earth.json
 *  - npx tsx scripts/import-questions-from-json.ts ./questions_earth.json --replace
 *  - 환경변수: VALIDATE=0 (검증 끄기)
 *
 * 입력 JSON 형식: QuestionInput[] (question + choices 4지)
 *   └ 예시: 사용자 메시지의 지구과학 MCQ 배열
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import {
    saveGeneratedQuestions,
    type QuestionInput,
    type SaveOptions,
} from "@/core/repositroy/questions/questions.create.repo"; // ← 사용자가 제공한 저장 유틸

// ──────────────────────────────────────────────
// 작은 유틸
// ──────────────────────────────────────────────
function parseArgs() {
    const argv = process.argv.slice(2);
    const args = {
        file: "src/app/admin/questions/earth-science/questions.json", // 기본값: 스크립트와 같은 폴더의 questions.json
        onDuplicate: "skip" as SaveOptions["onDuplicate"],
        validate: process.env.VALIDATE !== "0",
    };

    for (const a of argv) {
        if (a === "--replace") args.onDuplicate = "replace";
        else if (a === "--skip") args.onDuplicate = "skip";
        else if (a === "--no-validate") args.validate = false;
        else if (!a.startsWith("--")) args.file = a; // 첫 번째 위치 인자: 파일 경로
    }
    return args;
}

function assertQuestionShape(items: any[]): asserts items is QuestionInput[] {
    if (!Array.isArray(items)) {
        throw new Error("루트가 배열이 아닙니다. QuestionInput[] 형식이어야 합니다.");
    }
    for (const [i, it] of items.entries()) {
        if (!it?.question || !Array.isArray(it?.choices)) {
            throw new Error(`index ${i}: question/choices 누락`);
        }
        if (it.choices.length !== 4) {
            throw new Error(`index ${i}: choices는 반드시 4개여야 합니다.`);
        }
    }
}

// ──────────────────────────────────────────────
// 메인
// ──────────────────────────────────────────────
async function main() {
    const args = parseArgs();

    // 입력 경로 해석: 상대경로면 현재 작업 디렉토리 기준
    const filePath = path.isAbsolute(args.file)
        ? args.file
        : path.resolve(process.cwd(), args.file);

    console.log(`[import] file: ${filePath}`);
    console.log(
        `[import] options: onDuplicate=${args.onDuplicate}, validate=${args.validate}`
    );

    // JSON 읽기 + 파싱
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);

    // 최소 형태 검증(빠른 피드백)
    assertQuestionShape(parsed);

    // 저장
    // const res = await saveGeneratedQuestions(parsed, {
    //     onDuplicate: args.onDuplicate,
    //     validate: args.validate,
    // });

    // console.log(
    //     JSON.stringify(
    //         {
    //             summary: {
    //                 inserted: res.inserted,
    //                 replaced: res.replaced,
    //                 skipped: res.skipped,
    //                 failed: res.failed,
    //             },
    //             errors: res.errors,
    //         },
    //         null,
    //         2
    //     )
    // );
}

main().catch((err) => {
    console.error("[import] FAILED:", err?.message ?? err);
    process.exit(1);
});


export default function QuizEditPageDemo() {
    return <>지구과학 - 지구계</>;
}