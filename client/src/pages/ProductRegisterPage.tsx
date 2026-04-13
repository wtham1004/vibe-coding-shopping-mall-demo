import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AdminHeader from '@/components/admin/AdminHeader'
import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
} from '@/constants/productCategories'
import { getStoredAuth, isAuthSessionValid } from '@/lib/authApi'
import { openCloudinaryUploadWidget } from '@/lib/cloudinaryWidget'
import { createProduct, listProducts } from '@/lib/productApi'
import { suggestNextSku } from '@/lib/suggestNextSku'
import '@/pages/Admin/AdminPage.css'
import './ProductRegisterPage.css'

export default function ProductRegisterPage() {
  const navigate = useNavigate()
  const [sku, setSku] = useState('')
  const [skuLoading, setSkuLoading] = useState(true)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [image, setImage] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [widgetPreparing, setWidgetPreparing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const products = await listProducts()
        if (cancelled) return
        setSku(suggestNextSku(products.map((p) => p.sku)))
      } catch {
        if (!cancelled) setSku('SKU0001')
      } finally {
        if (!cancelled) setSkuLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleOpenCloudinaryWidget() {
    setError(null)
    setWidgetPreparing(true)
    try {
      await openCloudinaryUploadWidget(
        (secureUrl) => setImage(secureUrl),
        (msg) => setError(msg),
      )
    } finally {
      setWidgetPreparing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (skuLoading) {
      setError('SKU 번호를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    if (!sku.trim()) {
      setError('SKU를 입력해 주세요.')
      return
    }
    const priceNum = Number(price)
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError('올바른 가격을 입력해 주세요.')
      return
    }
    if (!category) {
      setError('카테고리를 선택해 주세요.')
      return
    }
    if (!image.trim()) {
      setError('대표 이미지를 Cloudinary에서 업로드해 주세요.')
      return
    }
    if (!isAuthSessionValid() || getStoredAuth()?.user?.user_type !== 'admin') {
      setError('관리자 로그인 세션이 없거나 만료되었습니다. 다시 로그인해 주세요.')
      navigate('/login')
      return
    }
    setSubmitting(true)
    try {
      await createProduct({
        sku: sku.trim(),
        name: name.trim(),
        price: priceNum,
        category,
        image: image.trim(),
        description: description.trim() || undefined,
      })
      navigate('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <AdminHeader
        heading={
          <div>
            <h1 className="admin-reg__title">상품 등록</h1>
            <p className="admin-reg__subtitle">
              SKU·이름·가격·카테고리·이미지는 필수입니다. 설명은 선택입니다.
            </p>
          </div>
        }
        actionsBeforeSearch={
          <Link to="/admin" className="admin-reg__back-link">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            대시보드
          </Link>
        }
      />

      <div className="admin__content admin-reg">
        <div className="admin-reg__grid">
          <section className="admin-reg__preview" aria-label="이미지 미리보기">
            <div className="admin-reg__preview-frame">
              {image.trim() ? (
                <img
                  key={image.trim()}
                  src={image.trim()}
                  alt=""
                  className="admin-reg__preview-img"
                  onError={(ev) => {
                    ev.currentTarget.style.opacity = '0.35'
                  }}
                />
              ) : (
                <div className="admin-reg__preview-placeholder">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.25"
                    aria-hidden
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                  <span>이미지 업로드 후 미리보기가 표시됩니다</span>
                </div>
              )}
            </div>
            <p className="admin-reg__preview-hint">
              대표 이미지는 상품 카드·상세에 노출됩니다.
            </p>
          </section>

          <section className="admin-reg__form-wrap">
            <form className="admin-reg__form" onSubmit={handleSubmit}>
              {error ? (
                <p className="admin-reg__error" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="admin-reg__fields">
                <label className="admin-reg__label">
                  <span className="admin-reg__label-text">
                    SKU <span className="admin-reg__req">*</span>
                  </span>
                  <input
                    className="admin-reg__input"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder={
                      skuLoading ? '기존 상품 기준으로 채우는 중…' : '예: SKU0006'
                    }
                    required
                    autoComplete="off"
                    disabled={skuLoading}
                    aria-busy={skuLoading}
                  />
                </label>

                <label className="admin-reg__label">
                  <span className="admin-reg__label-text">
                    상품 이름 <span className="admin-reg__req">*</span>
                  </span>
                  <input
                    className="admin-reg__input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="상품명"
                    required
                  />
                </label>

                <label className="admin-reg__label">
                  <span className="admin-reg__label-text">
                    가격 <span className="admin-reg__req">*</span>
                  </span>
                  <input
                    className="admin-reg__input"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    required
                  />
                </label>

                <label className="admin-reg__label">
                  <span className="admin-reg__label-text">
                    카테고리 <span className="admin-reg__req">*</span>
                  </span>
                  <select
                    className="admin-reg__input admin-reg__select"
                    value={category}
                    onChange={(e) =>
                      setCategory(e.target.value as ProductCategory | '')
                    }
                    required
                  >
                    <option value="" disabled>
                      카테고리 선택
                    </option>
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="admin-reg__label admin-reg__label--full">
                  <span className="admin-reg__label-text">
                    대표 이미지 <span className="admin-reg__req">*</span>
                  </span>
                  <div className="admin-reg__upload-row">
                    <input
                      className="admin-reg__input admin-reg__input--readonly"
                      readOnly
                      value={image}
                      placeholder="이미지 업로드 버튼으로 추가하세요"
                      aria-label="업로드된 이미지 URL"
                    />
                    <button
                      type="button"
                      className="admin-reg__upload-btn"
                      onClick={() => void handleOpenCloudinaryWidget()}
                      disabled={widgetPreparing}
                    >
                      {widgetPreparing ? '준비 중…' : '이미지 업로드'}
                    </button>
                  </div>
                  <p className="admin-reg__upload-hint">
                    Cloudinary 위젯에서 파일을 선택하면 URL이 채워지고 왼쪽 미리보기가
                    갱신됩니다.
                  </p>
                </div>

                <label className="admin-reg__label admin-reg__label--full">
                  <span className="admin-reg__label-text">설명</span>
                  <textarea
                    className="admin-reg__textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="소재, 핏, 케어 방법 등 (선택)"
                    rows={4}
                  />
                </label>
              </div>

              <div className="admin-reg__actions">
                <Link to="/admin" className="admin-reg__btn admin-reg__btn--ghost">
                  취소
                </Link>
                <button
                  type="submit"
                  className="admin-reg__btn admin-reg__btn--primary"
                  disabled={submitting || skuLoading}
                >
                  {submitting ? '등록 중…' : '상품 등록'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  )
}
