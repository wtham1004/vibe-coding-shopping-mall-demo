import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { isAuthSessionValid } from '@/lib/authApi'
import { addCartItem, notifyCartUpdated } from '@/lib/cartApi'
import {
  getProduct,
  listPublicProducts,
  type Product,
} from '@/lib/productApi'
import './ProductDetailPage.css'

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const SIZES = ['XS', 'S', 'M', 'L', 'XL'] as const

const COLOR_OPTIONS = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'Brown', hex: '#6b5344' },
  { name: 'Cream', hex: '#e8dfd0' },
] as const

function categoryBreadcrumbLabel(category: string): string {
  const c = category.toLowerCase()
  if (c.includes('vest') || c.includes('jacket') || c.includes('coat'))
    return 'OUTERWEAR'
  if (c.includes('dress') || c.includes('skirt')) return 'DRESSES'
  if (c.includes('knit') || c.includes('sweater') || c.includes('top'))
    return 'KNITS'
  if (c.includes('pant') || c.includes('short') || c.includes('jean'))
    return 'BOTTOMS'
  if (c.includes('accessor')) return 'ACCESSORIES'
  return category.toUpperCase()
}

function buildGalleryUrls(mainImage: string, productId: string): string[] {
  if (mainImage.includes('picsum.photos')) {
    const base = productId.replace(/[^a-z0-9]/gi, '').slice(0, 12) || 'p'
    return [
      mainImage,
      ...[1, 2, 3].map(
        (i) => `https://picsum.photos/seed/${base}${i}/480/640`,
      ),
    ]
  }
  return [mainImage, mainImage, mainImage, mainImage]
}

export default function ProductDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<(typeof SIZES)[number] | null>(
    null,
  )
  const [selectedColor, setSelectedColor] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [openAccordion, setOpenAccordion] = useState<'details' | 'care' | 'ship' | null>(
    'details',
  )
  const [addBagLoading, setAddBagLoading] = useState(false)
  const [addBagError, setAddBagError] = useState<string | null>(null)
  const [addBagOk, setAddBagOk] = useState(false)

  const gallery = useMemo(() => {
    if (!product) return []
    return buildGalleryUrls(product.image, product._id)
  }, [product])

  useEffect(() => {
    if (!id) {
      setError('상품을 찾을 수 없습니다.')
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void (async () => {
      try {
        const [p, all] = await Promise.all([
          getProduct(id),
          listPublicProducts(),
        ])
        if (cancelled) return
        setProduct(p)
        setActiveImageIndex(0)
        setRelated(
          all.filter((x) => x._id !== p._id).slice(0, 4),
        )
      } catch (e) {
        if (!cancelled) {
          setProduct(null)
          setError(e instanceof Error ? e.message : '상품을 불러오지 못했습니다.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const activeImage = gallery[activeImageIndex] ?? ''

  const description =
    product?.description?.trim() ||
    'A refined silhouette crafted from premium materials. Designed for ease of movement and lasting comfort—an essential layer for the modern wardrobe.'

  const detailBullets = [
    'Premium fabric blend selected for drape and durability',
    'Relaxed, intentional fit',
    'Finished with considered construction details',
  ]

  if (loading) {
    return (
      <div className="pdp pdp--state">
        <p className="pdp__state-msg">상품 정보를 불러오는 중…</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="pdp pdp--state">
        <p className="pdp__state-msg">{error ?? '상품을 찾을 수 없습니다.'}</p>
        <Link className="pdp__back" to="/">
          홈으로 돌아가기
        </Link>
      </div>
    )
  }

  const crumbCat = categoryBreadcrumbLabel(product.category)
  const crumbName = product.name.toUpperCase()

  async function handleAddToBag() {
    if (!product) return
    setAddBagError(null)
    setAddBagOk(false)
    if (!isAuthSessionValid()) {
      navigate('/login', { state: { from: `/product/${product._id}` } })
      return
    }
    if (!selectedSize) {
      setAddBagError('사이즈를 선택해 주세요.')
      return
    }
    setAddBagLoading(true)
    try {
      await addCartItem({
        product: product._id,
        quantity,
        size: selectedSize,
        color: COLOR_OPTIONS[selectedColor].name,
      })
      notifyCartUpdated()
      setAddBagOk(true)
      window.setTimeout(() => setAddBagOk(false), 2400)
    } catch (e) {
      setAddBagError(e instanceof Error ? e.message : '장바구니에 담지 못했습니다.')
    } finally {
      setAddBagLoading(false)
    }
  }

  return (
    <div className="pdp">
      <nav className="pdp__crumbs" aria-label="Breadcrumb">
        <Link to="/">HOME</Link>
        <span className="pdp__crumbs-sep">/</span>
        <span>{crumbCat}</span>
        <span className="pdp__crumbs-sep">/</span>
        <span className="pdp__crumbs-current">{crumbName}</span>
      </nav>

      <div className="pdp__grid">
        <div className="pdp__gallery">
          <div className="pdp__main-img-wrap">
            <img
              src={activeImage}
              alt=""
              className="pdp__main-img"
              width={480}
              height={640}
            />
          </div>
          <ul className="pdp__thumbs" aria-label="제품 이미지">
            {gallery.map((src, i) => (
              <li key={`${src}-${i}`}>
                <button
                  type="button"
                  className="pdp__thumb"
                  data-active={i === activeImageIndex ? 'true' : undefined}
                  onClick={() => setActiveImageIndex(i)}
                  aria-label={`이미지 ${i + 1}`}
                >
                  <img src={src} alt="" width={96} height={120} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="pdp__info">
          <p className="pdp__cat">{crumbCat}</p>
          <h1 className="pdp__title">{product.name}</h1>
          <p className="pdp__price">{USD.format(product.price)}</p>
          <p className="pdp__lead">{description}</p>

          <div className="pdp__field">
            <div className="pdp__field-head">
              <span className="pdp__field-label">
                COLOR: {COLOR_OPTIONS[selectedColor].name.toUpperCase()}
              </span>
            </div>
            <div className="pdp__colors" role="group" aria-label="색상">
              {COLOR_OPTIONS.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  className="pdp__color-btn"
                  data-active={i === selectedColor ? 'true' : undefined}
                  style={{ backgroundColor: c.hex }}
                  onClick={() => setSelectedColor(i)}
                  aria-label={c.name}
                  aria-pressed={i === selectedColor}
                />
              ))}
            </div>
          </div>

          <div className="pdp__field">
            <div className="pdp__field-head pdp__field-head--split">
              <span className="pdp__field-label">
                SIZE: {selectedSize ?? 'SELECT SIZE'}
              </span>
              <button type="button" className="pdp__link-quiet">
                SIZE GUIDE
              </button>
            </div>
            <div className="pdp__sizes" role="group" aria-label="사이즈">
              {SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="pdp__size-btn"
                  data-active={s === selectedSize ? 'true' : undefined}
                  onClick={() => setSelectedSize(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="pdp__field">
            <span className="pdp__field-label">QUANTITY</span>
            <div className="pdp__qty">
              <button
                type="button"
                className="pdp__qty-btn"
                aria-label="수량 감소"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                −
              </button>
              <span className="pdp__qty-val">{quantity}</span>
              <button
                type="button"
                className="pdp__qty-btn"
                aria-label="수량 증가"
                onClick={() => setQuantity((q) => q + 1)}
              >
                +
              </button>
            </div>
          </div>

          {(addBagError || addBagOk) && (
            <p
              className="pdp__bag-msg"
              role="status"
              data-variant={addBagOk ? 'ok' : 'error'}
            >
              {addBagOk ? '장바구니에 담았습니다.' : addBagError}
            </p>
          )}
          <div className="pdp__actions">
            <button
              type="button"
              className="pdp__add-bag"
              disabled={addBagLoading}
              onClick={() => void handleAddToBag()}
            >
              {addBagLoading ? 'ADDING…' : 'ADD TO BAG'}
            </button>
            <button
              type="button"
              className="pdp__wishlist"
              aria-label="위시리스트"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 21s-7-4.35-10-9c-2.5-4 1-7 5-4 1.5 1 2.5 2 3 2.5.5-.5 1.5-1.5 3-2.5 4-3 7.5 0 5 4-3 4.65-10 9-10 9z"
                  stroke="currentColor"
                  strokeWidth="1.25"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="pdp__accordions">
            <div className="pdp__acc">
              <button
                type="button"
                className="pdp__acc-trigger"
                aria-expanded={openAccordion === 'details'}
                onClick={() =>
                  setOpenAccordion((v) => (v === 'details' ? null : 'details'))
                }
              >
                DETAILS
                <span className="pdp__acc-icon" aria-hidden>
                  {openAccordion === 'details' ? '−' : '+'}
                </span>
              </button>
              {openAccordion === 'details' && (
                <ul className="pdp__acc-body">
                  {detailBullets.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="pdp__acc">
              <button
                type="button"
                className="pdp__acc-trigger"
                aria-expanded={openAccordion === 'care'}
                onClick={() =>
                  setOpenAccordion((v) => (v === 'care' ? null : 'care'))
                }
              >
                CARE
                <span className="pdp__acc-icon" aria-hidden>
                  {openAccordion === 'care' ? '−' : '+'}
                </span>
              </button>
              {openAccordion === 'care' && (
                <p className="pdp__acc-body pdp__acc-text">
                  Dry clean recommended. Cool iron on reverse. Do not bleach.
                </p>
              )}
            </div>
            <div className="pdp__acc">
              <button
                type="button"
                className="pdp__acc-trigger"
                aria-expanded={openAccordion === 'ship'}
                onClick={() =>
                  setOpenAccordion((v) => (v === 'ship' ? null : 'ship'))
                }
              >
                SHIPPING &amp; RETURNS
                <span className="pdp__acc-icon" aria-hidden>
                  {openAccordion === 'ship' ? '−' : '+'}
                </span>
              </button>
              {openAccordion === 'ship' && (
                <p className="pdp__acc-body pdp__acc-text">
                  Complimentary standard shipping on qualifying orders. Returns accepted
                  within 14 days of delivery in original condition.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="pdp__related" aria-labelledby="pdp-related-heading">
          <h2 id="pdp-related-heading" className="pdp__related-title">
            You May Also Like
          </h2>
          <div className="pdp__related-grid">
            {related.map((r) => (
              <Link
                key={r._id}
                to={`/product/${r._id}`}
                className="pdp__related-card"
              >
                <div className="pdp__related-img-wrap">
                  <img src={r.image} alt="" className="pdp__related-img" loading="lazy" />
                </div>
                <p className="pdp__related-name">{r.name}</p>
                <p className="pdp__related-price">{USD.format(r.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <footer className="pdp__footer">
        <div className="pdp__footer-top">
          <div className="pdp__footer-brand">
            <span className="pdp__footer-logo">NOIR</span>
            <p className="pdp__footer-tag">
              Timeless silhouettes and refined materials for everyday elegance.
            </p>
            <div className="pdp__footer-social" aria-label="소셜">
              <a href="#" aria-label="Instagram">
                IG
              </a>
              <a href="#" aria-label="Facebook">
                FB
              </a>
              <a href="#" aria-label="Twitter">
                X
              </a>
            </div>
          </div>
          <div className="pdp__footer-cols">
            <div>
              <h3 className="pdp__footer-heading">HELP</h3>
              <ul>
                <li>
                  <a href="#">Customer Service</a>
                </li>
                <li>
                  <a href="#">Shipping &amp; Returns</a>
                </li>
                <li>
                  <a href="#">Size Guide</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="pdp__footer-heading">COMPANY</h3>
              <ul>
                <li>
                  <Link to="/about">About Us</Link>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="#">Sustainability</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="pdp__footer-heading">LEGAL</h3>
              <ul>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
                <li>
                  <a href="#">Terms of Service</a>
                </li>
                <li>
                  <a href="#">Cookie Policy</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="pdp__footer-bottom">
          <p>© {new Date().getFullYear()} NOIR. All rights reserved.</p>
          <div className="pdp__footer-locale">
            <label className="pdp__sr-only" htmlFor="pdp-currency">
              Currency
            </label>
            <select id="pdp-currency" className="pdp__select" defaultValue="usd">
              <option value="usd">USD $</option>
            </select>
            <label className="pdp__sr-only" htmlFor="pdp-lang">
              Language
            </label>
            <select id="pdp-lang" className="pdp__select" defaultValue="en">
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </footer>
    </div>
  )
}
