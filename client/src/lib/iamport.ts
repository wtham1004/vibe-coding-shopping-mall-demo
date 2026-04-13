/** KG이니시스 등 PG 결제창 (아임포트 v1 JS SDK). index.html 에 iamport.js 로 로드됩니다. */

export type IamportPayResponse = {
  success: boolean
  error_msg?: string
  imp_uid?: string
  merchant_uid?: string
  pay_method?: string
  paid_amount?: number
  [key: string]: unknown
}

declare global {
  interface Window {
    IMP?: {
      init: (impUserCode: string) => void
      request_pay: (
        params: Record<string, unknown>,
        callback: (rsp: IamportPayResponse) => void,
      ) => void
    }
  }
}

export function isIamportLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.IMP?.request_pay === 'function'
}

/** USD 총액을 PG용 원화 정수로 변환 (데모용 고정 환율). */
export function usdTotalToKrwForPg(usd: number): number {
  const n = Number(usd)
  if (!Number.isFinite(n) || n <= 0) return 1000
  return Math.max(1000, Math.round(n * 1350))
}

export function generateMerchantUid(): string {
  return `NOIR-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * 아임포트 카드 결제창을 띄우고, 창이 닫힌 뒤 결과를 Promise로 반환합니다.
 * 고객사 식별코드는 `VITE_IAMPORT_IMP_CODE` 또는 기본값(imp68362372)을 사용합니다.
 */
export function requestIamportCardPayment(opts: {
  amountKrw: number
  merchantUid: string
  orderName: string
  buyerEmail: string
  buyerName: string
  buyerTel: string
  buyerAddr: string
  buyerPostcode: string
}): Promise<IamportPayResponse> {
  return new Promise((resolve, reject) => {
    const IMP = window.IMP
    if (!IMP?.request_pay) {
      reject(new Error('결제 모듈(아임포트)을 불러오지 못했습니다.'))
      return
    }

    const impCode =
      (import.meta.env.VITE_IAMPORT_IMP_CODE as string | undefined)?.trim() || 'imp68362372'

    IMP.init(impCode)
    IMP.request_pay(
      {
        pg: 'html5_inicis',
        pay_method: 'card',
        merchant_uid: opts.merchantUid,
        name: opts.orderName,
        amount: opts.amountKrw,
        buyer_email: opts.buyerEmail,
        buyer_name: opts.buyerName,
        buyer_tel: opts.buyerTel,
        buyer_addr: opts.buyerAddr,
        buyer_postcode: opts.buyerPostcode,
      },
      (rsp) => resolve(rsp),
    )
  })
}
