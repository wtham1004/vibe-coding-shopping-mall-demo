import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '@/lib/userApi'
import { isValidEmail } from '@/lib/validation'
import './RegisterPage.css'

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="register-page__eye"
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

export default function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passwordsMatch =
    password.length > 0 && password === passwordConfirm

  const emailTrimmed = email.trim()
  const emailFormatOk =
    emailTrimmed === '' ? true : isValidEmail(emailTrimmed)

  const canSubmit =
    name.trim() !== '' &&
    emailTrimmed !== '' &&
    isValidEmail(emailTrimmed) &&
    password.length > 0 &&
    passwordsMatch &&
    agreeTerms &&
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
      await registerUser({
        email: email.trim(),
        name: name.trim(),
        password,
        user_type: 'customer',
      })
      navigate('/', { state: { registered: true } })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="register-page">
      <div className="register-page__inner">
        <p className="register-page__brand">N O I R</p>
        <h1 className="register-page__title">회원가입</h1>
        <p className="register-page__subtitle">
          NOIR의 회원이 되어 특별한 혜택을 누려보세요
        </p>

        <form className="register-page__form" onSubmit={handleSubmit} noValidate>
          {error && <p className="register-page__error" role="alert">{error}</p>}

          <label className="register-page__field register-page__field--full">
            <span className="register-page__label">이름</span>
            <input
              className="register-page__input"
              type="text"
              name="name"
              autoComplete="name"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="register-page__field register-page__field--full">
            <span className="register-page__label">이메일</span>
            <input
              className="register-page__input"
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
              aria-invalid={emailTrimmed !== '' && !emailFormatOk}
              aria-describedby={
                emailTrimmed !== '' && !emailFormatOk
                  ? 'register-email-hint'
                  : undefined
              }
            />
          </label>
          {emailTrimmed !== '' && !emailFormatOk && (
            <p id="register-email-hint" className="register-page__hint register-page__hint--warn">
              올바른 이메일 형식이 아닙니다.
            </p>
          )}

          <label className="register-page__field register-page__field--full">
            <span className="register-page__label">비밀번호</span>
            <div className="register-page__input-wrap">
              <input
                className="register-page__input register-page__input--with-icon"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="register-page__toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 표시'}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </label>

          <label className="register-page__field register-page__field--full">
            <span className="register-page__label">비밀번호 확인</span>
            <div className="register-page__input-wrap">
              <input
                className="register-page__input register-page__input--with-icon"
                type={showPasswordConfirm ? 'text' : 'password'}
                name="passwordConfirm"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
              <button
                type="button"
                className="register-page__toggle"
                onClick={() => setShowPasswordConfirm((v) => !v)}
                aria-label={
                  showPasswordConfirm ? '비밀번호 확인 숨기기' : '비밀번호 확인 표시'
                }
              >
                <EyeIcon open={showPasswordConfirm} />
              </button>
            </div>
          </label>

          {passwordConfirm.length > 0 && !passwordsMatch && (
            <p className="register-page__hint register-page__hint--warn">
              비밀번호가 일치하지 않습니다.
            </p>
          )}

          <label className="register-page__check">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <span>
              <a
                href="#"
                className="register-page__inline-link"
                onClick={(e) => e.preventDefault()}
              >
                이용약관 및 개인정보처리방침
              </a>
              에 동의합니다
              <span className="register-page__required"> *</span>
            </span>
          </label>

          <label className="register-page__check">
            <input
              type="checkbox"
              checked={agreeMarketing}
              onChange={(e) => setAgreeMarketing(e.target.checked)}
            />
            <span>마케팅 정보 수신에 동의합니다 (선택)</span>
          </label>

          <button
            type="submit"
            className="register-page__submit"
            disabled={!canSubmit}
          >
            {submitting ? '처리 중…' : '가입하기'}
          </button>
        </form>

        <div className="register-page__divider">
          <span>또는</span>
        </div>

        <div className="register-page__social">
          <button type="button" className="register-page__social-btn" disabled>
            <span className="register-page__social-icon register-page__social-icon--google" />
            Google로 계속하기
          </button>
          <button type="button" className="register-page__social-btn" disabled>
            <span className="register-page__social-icon register-page__social-icon--facebook" />
            Facebook으로 계속하기
          </button>
          <button type="button" className="register-page__social-btn" disabled>
            <span className="register-page__social-icon register-page__social-icon--kakao" />
            Kakao로 계속하기
          </button>
        </div>

        <p className="register-page__footer-text">
          이미 회원이신가요?{' '}
          <Link to="/login" className="register-page__footer-link">
            로그인
          </Link>
        </p>
        <p className="register-page__copyright">© 2026 NOIR. All rights reserved.</p>
      </div>
    </div>
  )
}
