/**
 * 기존 SKU 중 `SKU` + 숫자 형식(대소문자 무시)의 최댓값 다음 번호를 만듭니다.
 * 예: SKU0005가 있으면 SKU0006. 없으면 SKU0001.
 * 자릿수는 기존 SKU 중 가장 긴 숫자 부분에 맞춥니다.
 */
export function suggestNextSku(existingSkus: string[]): string {
  const re = /^SKU(\d+)$/i
  let max = 0
  let maxDigits = 4
  for (const raw of existingSkus) {
    const m = String(raw).trim().match(re)
    if (m) {
      const n = parseInt(m[1], 10)
      if (!Number.isNaN(n) && n > max) max = n
      maxDigits = Math.max(maxDigits, m[1].length)
    }
  }
  const next = max + 1
  return `SKU${String(next).padStart(maxDigits, '0')}`
}
