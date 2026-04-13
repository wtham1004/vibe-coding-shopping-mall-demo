import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCart,
  notifyCartUpdated,
  removeCartItem,
  updateCartItem,
  type Cart,
  type CartItem,
} from '@/lib/cartApi'
import { isAuthSessionValid } from '@/lib/authApi'
import './CartPage.css'

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function lineTotal(item: CartItem): number {
  const p = item.product
  if (!p || typeof p !== 'object' || typeof p.price !== 'number') return 0
  return p.price * item.quantity
}

function cartSubtotal(cart: Cart): number {
  return cart.items.reduce((s, row) => s + lineTotal(row), 0)
}

export default function CartPage() {
  const loggedIn = isAuthSessionValid()
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(loggedIn)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!isAuthSessionValid()) {
      setCart(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const c = await getCart()
      setCart(c)
    } catch (e) {
      setCart(null)
      setError(e instanceof Error ? e.message : '장바구니를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleQty(itemId: string, next: number) {
    if (next < 1) return
    setBusyId(itemId)
    try {
      const c = await updateCartItem(itemId, { quantity: next })
      setCart(c)
      notifyCartUpdated()
    } catch (e) {
      setError(e instanceof Error ? e.message : '수량 변경에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleRemove(itemId: string) {
    setBusyId(itemId)
    try {
      const c = await removeCartItem(itemId)
      setCart(c)
      notifyCartUpdated()
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제에 실패했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  if (!loggedIn) {
    return (
      <div className="cart-page cart-page--guest">
        <h1 className="cart-page__title">장바구니</h1>
        <p className="cart-page__hint">로그인 후 장바구니를 이용할 수 있습니다.</p>
        <Link className="cart-page__cta" to="/login">
          로그인
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="cart-page">
        <h1 className="cart-page__title">장바구니</h1>
        <p className="cart-page__hint">불러오는 중…</p>
      </div>
    )
  }

  if (error && !cart) {
    return (
      <div className="cart-page">
        <h1 className="cart-page__title">장바구니</h1>
        <p className="cart-page__error">{error}</p>
        <button type="button" className="cart-page__cta cart-page__cta--ghost" onClick={() => void load()}>
          다시 시도
        </button>
      </div>
    )
  }

  const items = cart?.items ?? []
  const empty = items.length === 0

  return (
    <div className="cart-page">
      <h1 className="cart-page__title">장바구니</h1>
      {error && <p className="cart-page__error" role="alert">{error}</p>}

      {empty ? (
        <p className="cart-page__hint">장바구니가 비어 있습니다.</p>
      ) : (
        <>
          <ul className="cart-page__list">
            {items.map((row) => {
              const p = row.product
              const disabled = busyId === row._id
              return (
                <li key={row._id} className="cart-page__row">
                  <Link
                    to={`/product/${p._id}`}
                    className="cart-page__thumb-wrap"
                  >
                    <img src={p.image} alt="" className="cart-page__thumb" />
                  </Link>
                  <div className="cart-page__meta">
                    <Link to={`/product/${p._id}`} className="cart-page__name">
                      {p.name}
                    </Link>
                    <p className="cart-page__sku">{p.sku}</p>
                    {(row.size || row.color) && (
                      <p className="cart-page__opts">
                        {[row.color, row.size].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    <p className="cart-page__unit">{USD.format(p.price)}</p>
                  </div>
                  <div className="cart-page__qty">
                    <button
                      type="button"
                      className="cart-page__qty-btn"
                      disabled={disabled || row.quantity <= 1}
                      aria-label="수량 감소"
                      onClick={() => void handleQty(row._id, row.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="cart-page__qty-val">{row.quantity}</span>
                    <button
                      type="button"
                      className="cart-page__qty-btn"
                      disabled={disabled}
                      aria-label="수량 증가"
                      onClick={() => void handleQty(row._id, row.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <p className="cart-page__line-total">{USD.format(lineTotal(row))}</p>
                  <button
                    type="button"
                    className="cart-page__remove"
                    disabled={disabled}
                    onClick={() => void handleRemove(row._id)}
                  >
                    삭제
                  </button>
                </li>
              )
            })}
          </ul>
          <div className="cart-page__summary">
            <span className="cart-page__summary-label">소계</span>
            <span className="cart-page__summary-val">
              {USD.format(cartSubtotal(cart!))}
            </span>
          </div>
          <div className="cart-page__actions">
            <Link className="cart-page__checkout" to="/checkout">
              결제하기
            </Link>
            <Link className="cart-page__shop-more" to="/">
              쇼핑 계속하기
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
