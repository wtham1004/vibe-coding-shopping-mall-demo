import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { isAuthSessionValid, loginRequest, saveAuth } from '@/lib/authApi'
import { isValidEmail } from '@/lib/validation'
import './LoginPage.css'

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="login-page__eye"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      aria-hidden
    >
      {open ? (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  )
}

function safeReturnPath(state: unknown): string {
  if (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof (state as { from: unknown }).from === 'string'
  ) {
    const from = (state as { from: string }).from
    if (from.startsWith('/') && !from.startsWith('//')) return from
  }
  return '/'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const returnTo = safeReturnPath(location.state)

  useEffect(() => {
    if (isAuthSessionValid()) {
      navigate(returnTo, { replace: true })
    }
  }, [navigate, returnTo])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const emailTrimmed = email.trim()
  const emailOk = emailTrimmed === '' || isValidEmail(emailTrimmed)

  const canSubmit =
    emailTrimmed !== '' &&
    isValidEmail(emailTrimmed) &&
    password.length > 0 &&
    !submitting

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!isValidEmail(email.trim())) {
      setError('올바른 이메일 형식이 아닙니다.')
      return
    }
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const data = await loginRequest(email.trim(), password)
      saveAuth(data, remember)
      navigate(returnTo, { replace: true })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__inner">
        <p className="login-page__brand">N O I R</p>
        <h1 className="login-page__title">로그인</h1>
        <p className="login-page__subtitle">NOIR에 오신 것을 환영합니다</p>

        <form className="login-page__form" onSubmit={handleSubmit} noValidate>
          {error && (
            <p className="login-page__error" role="alert">
              {error}
            </p>
          )}

          <label className="login-page__field">
            <span className="login-page__label">이메일</span>
            <input
              className="login-page__input"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setError(null)
              }}
              aria-invalid={emailTrimmed !== '' && !emailOk}
            />
          </label>
          {emailTrimmed !== '' && !emailOk && (
            <p className="login-page__hint login-page__hint--warn">
              올바른 이메일 형식이 아닙니다.
            </p>
          )}

          <label className="login-page__field">
            <span className="login-page__label">비밀번호</span>
            <div className="login-page__input-wrap">
              <input
                className="login-page__input login-page__input--with-icon"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-page__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </label>

          <div className="login-page__row">
            <label className="login-page__remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>로그인 유지</span>
            </label>
            <button
              type="button"
              className="login-page__forgot"
              onClick={() => {
                /* TODO: 비밀번호 찾기 */
              }}
            >
              비밀번호 찾기
            </button>
          </div>

          <button
            type="submit"
            className="login-page__submit"
            disabled={!canSubmit}
          >
            {submitting ? '처리 중…' : '로그인'}
          </button>
        </form>

        <div className="login-page__divider">
          <span>또는</span>
        </div>

        <div className="login-page__social">
          <button type="button" className="login-page__social-btn" disabled>
            <span className="login-page__social-icon login-page__social-icon--google" />
            Google로 로그인
          </button>
          <button type="button" className="login-page__social-btn" disabled>
            <span className="login-page__social-icon login-page__social-icon--facebook" />
            Facebook으로 로그인
          </button>
          <button type="button" className="login-page__social-btn" disabled>
            <span className="login-page__social-icon login-page__social-icon--kakao" />
            Kakao로 로그인
          </button>
        </div>

        <p className="login-page__footer-text">
          아직 회원이 아니신가요?{' '}
          <Link to="/register" className="login-page__footer-link">
            회원가입
          </Link>
        </p>

        <section className="login-page__benefits" aria-labelledby="login-benefits-heading">
          <h2 id="login-benefits-heading" className="login-page__benefits-title">
            회원 혜택
          </h2>
          <div className="login-page__benefits-grid">
            <div className="login-page__benefit">
              <svg
                className="login-page__benefit-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <p className="login-page__benefit-text">위시리스트 저장</p>
            </div>
            <div className="login-page__benefit">
              <svg
                className="login-page__benefit-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M10 17h4M5 17H4a1 1 0 0 1-1-1v-5l2-4h11l2 4v5a1 1 0 0 1-1 1h-1" />
                <circle cx="7.5" cy="17.5" r="1.5" />
                <circle cx="17.5" cy="17.5" r="1.5" />
                <path d="M3 11h15" />
              </svg>
              <p className="login-page__benefit-text">무료 배송 &amp; 반품</p>
            </div>
            <div className="login-page__benefit">
              <svg
                className="login-page__benefit-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <p className="login-page__benefit-text">멤버 전용 할인</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
