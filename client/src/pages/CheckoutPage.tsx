import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStoredAuth, isAuthSessionValid } from '@/lib/authApi'
import { getCart, notifyCartUpdated, type Cart, type CartItem } from '@/lib/cartApi'
import {
  generateMerchantUid,
  isIamportLoaded,
  requestIamportCardPayment,
  usdTotalToKrwForPg,
} from '@/lib/iamport'
import { createOrder } from '@/lib/orderApi'
import './CheckoutPage.css'

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const TAX_RATE = 0.1

const COUNTRIES = [
  { value: 'KR', label: 'South Korea' },
  { value: 'US', label: 'United States' },
  { value: 'JP', label: 'Japan' },
  { value: 'GB', label: 'United Kingdom' },
] as const

type Step = 'info' | 'shipping' | 'payment'

function lineTotal(item: CartItem): number {
  const p = item.product
  if (!p || typeof p !== 'object' || typeof p.price !== 'number') return 0
  return p.price * item.quantity
}

function cartSubtotal(cart: Cart): number {
  return cart.items.reduce((s, row) => s + lineTotal(row), 0)
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('info')
  const [submitting, setSubmitting] = useState(false)

  const [email, setEmail] = useState('')
  const [emailNews, setEmailNews] = useState(false)
  const [country, setCountry] = useState('KR')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [address, setAddress] = useState('')
  const [apartment, setApartment] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [phone, setPhone] = useState('')
  const [discountInput, setDiscountInput] = useState('')
  const [discountTotal, setDiscountTotal] = useState(0)

  const load = useCallback(async () => {
    if (!isAuthSessionValid()) {
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    setLoading(true)
    setError(null)
    try {
      const c = await getCart()
      if (!c.items.length) {
        navigate('/cart', { replace: true })
        return
      }
      setCart(c)
      const auth = getStoredAuth()
      if (auth?.user?.email) setEmail(auth.user.email)
    } catch (e) {
      setError(e instanceof Error ? e.message : '장바구니를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void load()
  }, [load])

  const subtotal = useMemo(
    () => (cart ? cartSubtotal(cart) : 0),
    [cart],
  )
  const tax = useMemo(
    () => Math.round(subtotal * TAX_RATE * 100) / 100,
    [subtotal],
  )
  const shippingFee = 0
  const total = Math.max(
    0,
    Math.round((subtotal + shippingFee + tax - discountTotal) * 100) / 100,
  )

  function validateInfo(): boolean {
    if (!email.trim()) {
      setError('이메일을 입력해 주세요.')
      return false
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('이름을 입력해 주세요.')
      return false
    }
    if (!address.trim() || !city.trim() || !postalCode.trim()) {
      setError('주소를 모두 입력해 주세요.')
      return false
    }
    if (!phone.trim()) {
      setError('전화번호를 입력해 주세요.')
      return false
    }
    setError(null)
    return true
  }

  function handleContinueToShipping() {
    if (!validateInfo()) return
    setStep('shipping')
  }

  function handleApplyDiscount() {
    const code = discountInput.trim().toUpperCase()
    if (code === 'NOIR10') {
      setDiscountTotal(Math.min(subtotal * 0.1, subtotal))
      setError(null)
    } else if (code) {
      setDiscountTotal(0)
      setError('유효하지 않은 할인 코드입니다.')
    }
  }

  async function submitPaidOrder(payment?: {
    providerPaymentId?: string
    paymentMethod?: string
    paymentProvider?: string
  }) {
    if (!cart) return
    const order = await createOrder({
      shippingAddress: {
        recipientName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        phone: phone.trim(),
        line1: address.trim(),
        line2: apartment.trim() || undefined,
        city: city.trim(),
        state: '',
        postalCode: postalCode.trim(),
        country,
      },
      customerEmail: email.trim(),
      customerName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      customerPhone: phone.trim(),
      shippingFee,
      discountTotal,
      tax,
      markPaid: true,
      paymentMethod: payment?.paymentMethod ?? 'mock',
      paymentProvider: payment?.paymentProvider ?? 'demo',
      providerPaymentId: payment?.providerPaymentId,
    })
    notifyCartUpdated()
    try {
      sessionStorage.setItem('NOIR_LAST_ORDER_NUMBER', order.orderNumber)
      sessionStorage.setItem(
        'NOIR_LAST_ORDER',
        JSON.stringify({
          _id: order._id,
          orderNumber: order.orderNumber,
          status: order.status,
          currency: order.currency,
          subtotal: order.subtotal,
          shippingFee: order.shippingFee,
          discountTotal: order.discountTotal,
          tax: order.tax,
          total: order.total,
          items: order.items,
          createdAt: order.createdAt,
        }),
      )
    } catch {
      // ignore
    }
    navigate('/order/success', {
      replace: true,
      state: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        order,
      },
    })
  }

  /** PG(아임포트) 카드 결제창 → 성공 시 주문 생성 */
  async function handleCardPayment() {
    if (!cart) return
    if (!isIamportLoaded()) {
      setError(
        '결제 모듈을 불러오지 못했습니다. 페이지를 새로고침하거나 아래 데모 완료를 이용해 주세요.',
      )
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const amountKrw = usdTotalToKrwForPg(total)
      const rsp = await requestIamportCardPayment({
        amountKrw,
        merchantUid: generateMerchantUid(),
        orderName: 'NOIR 주문',
        buyerEmail: email.trim(),
        buyerName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        buyerTel: phone.trim().replace(/\s/g, '-'),
        buyerAddr: [address.trim(), apartment.trim()].filter(Boolean).join(', '),
        buyerPostcode: postalCode.trim(),
      })
      if (rsp.success && rsp.imp_uid) {
        await submitPaidOrder({
          providerPaymentId: rsp.imp_uid,
          paymentMethod: typeof rsp.pay_method === 'string' ? rsp.pay_method : 'card',
          paymentProvider: 'iamport',
        })
        return
      }
      setError(
        (typeof rsp.error_msg === 'string' && rsp.error_msg.trim()) ||
          '결제가 완료되지 않았습니다.',
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : '결제에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  /** PG 없이 데모 스토어 주문 완료 */
  async function handleDemoCompleteOrder() {
    if (!cart) return
    setSubmitting(true)
    setError(null)
    try {
      await submitPaidOrder({
        paymentMethod: 'mock',
        paymentProvider: 'demo',
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : '주문에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !cart) {
    return (
      <div className="checkout">
        <p className="checkout__loading">불러오는 중…</p>
      </div>
    )
  }

  return (
    <div className="checkout">
      <header className="checkout__topbar">
        <Link to="/cart" className="checkout__back">
          ← Return to cart
        </Link>
        <Link to="/" className="checkout__brand">
          NOIR
        </Link>
        <div className="checkout__secure">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 2L4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <span>Secure checkout</span>
        </div>
      </header>

      <div className="checkout__progress" aria-label="Checkout steps">
        {(['info', 'shipping', 'payment'] as const).map((s, i) => (
          <span key={s} className="checkout__progress-item">
            {i > 0 && <span className="checkout__progress-sep">/</span>}
            <span data-active={step === s ? 'true' : undefined}>
              {s === 'info' && 'Information'}
              {s === 'shipping' && 'Shipping'}
              {s === 'payment' && 'Payment'}
            </span>
          </span>
        ))}
      </div>

      {error && (
        <p className="checkout__error" role="alert">
          {error}
        </p>
      )}

      <div className="checkout__grid">
        <div className="checkout__main">
          {step === 'info' && (
            <>
              <section className="checkout__section">
                <h2 className="checkout__heading">Contact</h2>
                <label className="checkout__label" htmlFor="checkout-email">
                  Email address
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  className="checkout__input"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <label className="checkout__check">
                  <input
                    type="checkbox"
                    checked={emailNews}
                    onChange={(e) => setEmailNews(e.target.checked)}
                  />
                  <span>Email me with news and offers</span>
                </label>
              </section>

              <section className="checkout__section">
                <h2 className="checkout__heading">Shipping Address</h2>
                <label className="checkout__label" htmlFor="checkout-country">
                  Country/Region
                </label>
                <select
                  id="checkout-country"
                  className="checkout__select"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <div className="checkout__row2">
                  <div>
                    <label className="checkout__label" htmlFor="checkout-fn">
                      First name
                    </label>
                    <input
                      id="checkout-fn"
                      className="checkout__input"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="checkout__label" htmlFor="checkout-ln">
                      Last name
                    </label>
                    <input
                      id="checkout-ln"
                      className="checkout__input"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <label className="checkout__label" htmlFor="checkout-addr">
                  Address
                </label>
                <input
                  id="checkout-addr"
                  className="checkout__input"
                  autoComplete="street-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />

                <label className="checkout__label" htmlFor="checkout-apt">
                  Apartment, suite, etc. (optional)
                </label>
                <input
                  id="checkout-apt"
                  className="checkout__input"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                />

                <div className="checkout__row2">
                  <div>
                    <label className="checkout__label" htmlFor="checkout-city">
                      City
                    </label>
                    <input
                      id="checkout-city"
                      className="checkout__input"
                      autoComplete="address-level2"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="checkout__label" htmlFor="checkout-zip">
                      Postal code
                    </label>
                    <input
                      id="checkout-zip"
                      className="checkout__input"
                      autoComplete="postal-code"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>

                <label className="checkout__label" htmlFor="checkout-phone">
                  Phone
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  className="checkout__input"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </section>

              <button
                type="button"
                className="checkout__primary"
                onClick={handleContinueToShipping}
              >
                CONTINUE TO SHIPPING
              </button>
            </>
          )}

          {step === 'shipping' && (
            <section className="checkout__section">
              <h2 className="checkout__heading">Shipping method</h2>
              <label className="checkout__ship-option">
                <input type="radio" name="ship" defaultChecked readOnly />
                <span>
                  <strong>Standard</strong>
                  <span className="checkout__ship-meta">Free · 5–7 business days</span>
                </span>
                <span className="checkout__ship-price">Free</span>
              </label>
              <button
                type="button"
                className="checkout__primary"
                onClick={() => setStep('payment')}
              >
                CONTINUE TO PAYMENT
              </button>
              <button
                type="button"
                className="checkout__text-btn"
                onClick={() => setStep('info')}
              >
                ← Back to information
              </button>
            </section>
          )}

          {step === 'payment' && (
            <section className="checkout__section">
              <h2 className="checkout__heading">결제</h2>
              <p className="checkout__payment-note">
                <strong>카드 결제하기</strong>를 누르면 PG(이니시스) 결제창이 열립니다. 테스트
                고객사 식별코드(<code>imp68362372</code>) 기준으로 동작하며, 실제 과금은 되지 않을 수
                있습니다. 결제창이 뜨지 않거나 로컬 테스트만 할 때는{' '}
                <strong>데모로 주문 완료</strong>를 사용하세요.
              </p>
              <button
                type="button"
                className="checkout__primary"
                disabled={submitting}
                onClick={() => void handleCardPayment()}
              >
                {submitting ? '처리 중…' : '카드 결제하기'}
              </button>
              <button
                type="button"
                className="checkout__text-btn"
                disabled={submitting}
                onClick={() => void handleDemoCompleteOrder()}
              >
                데모로 주문 완료 (PG 없이)
              </button>
              <button
                type="button"
                className="checkout__text-btn"
                onClick={() => setStep('shipping')}
              >
                ← 배송으로 돌아가기
              </button>
            </section>
          )}
        </div>

        <aside className="checkout__summary" aria-label="Order summary">
          <ul className="checkout__lines">
            {cart.items.map((row) => {
              const p = row.product
              const variant = [row.color, row.size].filter(Boolean).join(' / ')
              return (
                <li key={row._id} className="checkout__line">
                  <div className="checkout__line-img-wrap">
                    <img src={p.image} alt="" className="checkout__line-img" />
                    <span className="checkout__line-badge">{row.quantity}</span>
                  </div>
                  <div className="checkout__line-meta">
                    <p className="checkout__line-name">{p.name}</p>
                    {variant && <p className="checkout__line-variant">{variant}</p>}
                  </div>
                  <p className="checkout__line-price">{USD.format(lineTotal(row))}</p>
                </li>
              )
            })}
          </ul>

          <div className="checkout__discount">
            <input
              type="text"
              className="checkout__discount-input"
              placeholder="Discount code"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              aria-label="Discount code"
            />
            <button type="button" className="checkout__discount-btn" onClick={handleApplyDiscount}>
              Apply
            </button>
          </div>

          <dl className="checkout__totals">
            <div className="checkout__total-row">
              <dt>Subtotal</dt>
              <dd>{USD.format(subtotal)}</dd>
            </div>
            <div className="checkout__total-row">
              <dt>Shipping</dt>
              <dd>Free</dd>
            </div>
            <div className="checkout__total-row">
              <dt>Tax</dt>
              <dd>{USD.format(tax)}</dd>
            </div>
            {discountTotal > 0 && (
              <div className="checkout__total-row checkout__total-row--discount">
                <dt>Discount</dt>
                <dd>−{USD.format(discountTotal)}</dd>
              </div>
            )}
          </dl>
          <div className="checkout__total-final">
            <span>Total</span>
            <span className="checkout__total-final-val">{USD.format(total)}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
