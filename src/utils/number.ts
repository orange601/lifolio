
/**
 * 문자열/숫자/널을 받아 정상적인 숫자만 돌려주고, 변환 불가능하거나 유효하지 않은 값은 null을 반환
 */
export function toNum(obj: string | number | null | undefined): number | null {
    if (obj === null || obj === undefined) {
        return null;
    }
    const n = typeof obj === "string" ? Number(obj) : obj;
    return Number.isFinite(n) ? n : null;
}