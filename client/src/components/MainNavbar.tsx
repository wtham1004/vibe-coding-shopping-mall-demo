import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  clearStoredAuth,
  getStoredAuth,
  isAuthSessionValid,
  type LoginUser,
} from '@/lib/authApi'
import {
  getCart,
  NOIR_CART_UPDATED_EVENT,
  totalQuantityInCart,
} from '@/lib/cartApi'
import './MainNavbar.css'

const NAV_LINKS = [
  { to: '/', label: 'HOME' },
  { to: '/blog', label: 'BLOG' },
  { to: '/about', label: 'ABOUT' },
] as const

export default function MainNavbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [logoutKey, setLogoutKey] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartQty, setCartQty] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const refreshCartCount = useCallback(async () => {
    if (!isAuthSessionValid()) {
      setCartQty(0)
      return
    }
    try {
      const cart = await getCart()
      setCartQty(totalQuantityInCart(cart))
    } catch {
      setCartQty(0)
    }
  }, [])

  const user: LoginUser | null = isAuthSessionValid()
    ? getStoredAuth()?.user ?? null
    : null

  const isAdmin = user?.user_type === 'admin'

  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current?.contains(e.target as Node)) return
      setMenuOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  useEffect(() => {
    void refreshCartCount()
  }, [location.pathname, logoutKey, refreshCartCount])

  useEffect(() => {
    const onCartUpdated = () => {
      void refreshCartCount()
    }
    window.addEventListener(NOIR_CART_UPDATED_EVENT, onCartUpdated)
    return () => window.removeEventListener(NOIR_CART_UPDATED_EVENT, onCartUpdated)
  }, [refreshCartCount])

  function handleLogout() {
    clearStoredAuth()
    setMenuOpen(false)
    setLogoutKey((k) => k + 1)
    navigate('/', { replace: true })
  }

  return (
    <header className="main-nav" key={`${location.pathname}-${logoutKey}`}>
      <nav className="main-nav__inner" aria-label="주 메뉴">
        <ul className="main-nav__links main-nav__links--left">
          {NAV_LINKS.map(({ to, label }) => {
            const active =
              location.pathname === to ||
              (to === '/blog' && location.pathname.startsWith('/blog'))
            return (
            <li key={to}>
              <Link
                className="main-nav__link"
                to={to}
                data-active={active ? 'true' : undefined}
              >
                {label}
              </Link>
            </li>
            )
          })}
        </ul>

        <Link className="main-nav__logo" to="/">
          NOIR
        </Link>

        <div className="main-nav__right">
          <button type="button" className="main-nav__icon" aria-label="검색">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" strokeLinecap="round" />
            </svg>
          </button>

          <div className="main-nav__user" ref={rootRef}>
            {!user && (
              <Link className="main-nav__login" to="/login">
                로그인
              </Link>
            )}
            {user && (
              <>
                <button
                  type="button"
                  className="main-nav__welcome"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <span className="main-nav__welcome-text">
                    {user.name}님 환영합니다
                  </span>
                  <span className="main-nav__chevron" aria-hidden>
                    {menuOpen ? '▴' : '▾'}
                  </span>
                </button>
                {menuOpen && (
                  <div className="main-nav__dropdown" role="menu">
                    <Link
                      to="/orders"
                      className="main-nav__dropdown-item"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      내 주문 목록
                    </Link>
                    <button
                      type="button"
                      className="main-nav__dropdown-item"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </>
            )}
            {user && isAdmin && (
              <Link className="main-nav__admin" to="/admin">
                Admin
              </Link>
            )}
          </div>

          <Link
            to="/cart"
            className="main-nav__icon main-nav__cart"
            aria-label={
              cartQty > 0 ? `장바구니, 상품 ${cartQty}개` : '장바구니'
            }
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
              <path d="M6 6L5 3H2" strokeLinecap="round" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            <span className="main-nav__cart-badge" data-empty={cartQty === 0 ? 'true' : undefined}>
              {cartQty > 99 ? '99+' : cartQty}
            </span>
          </Link>
        </div>
      </nav>
    </header>
  )
}
