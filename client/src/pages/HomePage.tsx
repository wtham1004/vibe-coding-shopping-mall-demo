import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { apiUrl } from '@/lib/api'
import { listPublicProducts, type Product } from '@/lib/productApi'
import './HomePage.css'

const HERO_IMG =
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1600&q=80'
const EDIT_IMG =
  'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=80'
const PICK1 =
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=80'
const PICK2 =
  'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&q=80'
const PICK3 =
  'https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?w=500&q=80'

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function swatchColorsFromId(id: string): string[] {
  const hues = [25, 200, 340, 85, 220]
  const base = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return [0, 1, 2].map((i) => {
    const h = hues[(base + i * 41) % hues.length]
    const s = 28 + ((base + i) % 25)
    const l = 38 + ((base + i * 11) % 22)
    return `hsl(${h} ${s}% ${l}%)`
  })
}

export default function HomePage() {
  const location = useLocation()
  const registered =
    typeof location.state === 'object' &&
    location.state !== null &&
    'registered' in location.state &&
    (location.state as { registered?: boolean }).registered === true

  const orderPlaced =
    typeof location.state === 'object' &&
    location.state !== null &&
    'orderComplete' in location.state &&
    (location.state as { orderComplete?: boolean }).orderComplete === true
  const orderNumber =
    typeof location.state === 'object' &&
    location.state !== null &&
    'orderNumber' in location.state &&
    typeof (location.state as { orderNumber?: unknown }).orderNumber === 'string'
      ? (location.state as { orderNumber: string }).orderNumber
      : null

  const [apiStatus, setApiStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [catalog, setCatalog] = useState<Product[]>([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(apiUrl('/api/health'))
      .then((r) => {
        if (!cancelled) setApiStatus(r.ok ? 'ok' : 'error')
      })
      .catch(() => {
        if (!cancelled) setApiStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const products = await listPublicProducts()
        if (!cancelled) {
          setCatalog(products)
          setCatalogError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setCatalog([])
          setCatalogError(e instanceof Error ? e.message : 'Could not load products.')
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="landing">
      {registered && (
        <p className="landing__toast" role="status">
          Your registration is complete.
        </p>
      )}
      {orderPlaced && orderNumber && (
        <p className="landing__toast" role="status">
          Order confirmed. Order number: {orderNumber}
        </p>
      )}

      <section className="landing__hero">
        <div className="landing__hero-bg">
          <img src={HERO_IMG} alt="" className="landing__hero-img" />
          <div className="landing__hero-overlay" />
        </div>
        <div className="landing__hero-content">
          <h1 className="landing__hero-title">Timeless Essentials</h1>
          <p className="landing__hero-sub">NOIR silhouettes that stay beyond the season</p>
        </div>
      </section>

      <section className="landing__section landing__products" aria-labelledby="new-heading">
        <h2 id="new-heading" className="landing__section-title landing__section-title--script">
          just landed
        </h2>
        <p className="landing__products-meta">
          {catalogLoading
            ? 'Loading products…'
            : catalogError
              ? catalogError
              : `${catalog.length} ${catalog.length === 1 ? 'item' : 'items'}`}
        </p>
        <div className="landing__product-grid">
          {catalogLoading ? (
            <p className="landing__products-empty">Loading…</p>
          ) : catalogError ? (
            <p className="landing__products-empty">{catalogError}</p>
          ) : catalog.length === 0 ? (
            <p className="landing__products-empty">No products available yet.</p>
          ) : (
            catalog.map((p) => (
              <Link
                key={p._id}
                to={`/product/${p._id}`}
                className="landing__product-link"
              >
                <article className="landing__product">
                  <div className="landing__product-img-wrap">
                    <img
                      src={p.image}
                      alt=""
                      className="landing__product-img"
                      loading="lazy"
                    />
                  </div>
                  <p className="landing__product-cat">{p.category}</p>
                  <h3 className="landing__product-name">{p.name}</h3>
                  <p className="landing__product-price">{USD.format(p.price)}</p>
                  <div className="landing__product-swatches" aria-hidden>
                    {swatchColorsFromId(p._id).map((c, i) => (
                      <span
                        key={`${p._id}-sw-${i}`}
                        className="landing__swatch"
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </article>
              </Link>
            ))
          )}
        </div>
      </section>

      <section className="landing__editorial">
        <div className="landing__editorial-img-wrap">
          <img src={EDIT_IMG} alt="" className="landing__editorial-img" />
        </div>
        <div className="landing__editorial-text">
          <h2 className="landing__editorial-title">Effortless Sophistication</h2>
          <p className="landing__editorial-lead">
            Clean lines and refined fabrics come together for quiet luxury you can live in every day.
          </p>
          <Link className="landing__editorial-link" to="/blog">
            DISCOVER MORE
          </Link>
        </div>
      </section>

      <section className="landing__picks" aria-label="Season picks">
        <div className="landing__picks-grid">
          <Link to="/" className="landing__pick">
            <img src={PICK1} alt="" className="landing__pick-img" />
            <span className="landing__pick-label">Season&apos;s Picks</span>
          </Link>
          <Link to="/" className="landing__pick">
            <img src={PICK2} alt="" className="landing__pick-img" />
            <span className="landing__pick-label">Modern Classics</span>
          </Link>
          <Link to="/" className="landing__pick">
            <img src={PICK3} alt="" className="landing__pick-img" />
            <span className="landing__pick-label">Evening Edit</span>
          </Link>
        </div>
      </section>

      <section className="landing__newsletter">
        <h2 className="landing__newsletter-title">Join Our World</h2>
        <p className="landing__newsletter-lead">
          Be the first to hear about new arrivals and editorials.
        </p>
        <form
          className="landing__newsletter-form"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="email"
            className="landing__newsletter-input"
            placeholder="Email address"
            aria-label="Email"
          />
          <button type="submit" className="landing__newsletter-btn">
            SUBSCRIBE
          </button>
        </form>
      </section>

      <footer className="landing__footer">
        <div className="landing__footer-grid">
          <div>
            <h3 className="landing__footer-heading">About Us</h3>
            <p className="landing__footer-about">
              NOIR is an online store where you can discover curated fashion from everyday wear to formal
              pieces in one place. Enjoy simple membership, ordering, and delivery—timeless silhouettes at
              a fair price, season after season.
            </p>
            <ul className="landing__footer-list">
              <li>
                <Link to="/about">Our Story</Link>
              </li>
              <li>
                <Link to="/about#about-values">Sustainability</Link>
              </li>
            </ul>
            <div className="landing__footer-social" aria-label="Social">
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
          <div>
            <h3 className="landing__footer-heading">Help</h3>
            <ul className="landing__footer-list">
              <li>
                <a href="#">FAQ</a>
              </li>
              <li>
                <a href="#">Shipping</a>
              </li>
              <li>
                <a href="#">Returns</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="landing__footer-heading">Company</h3>
            <ul className="landing__footer-list">
              <li>
                <a href="#">Careers</a>
              </li>
              <li>
                <a href="#">Press</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="landing__footer-heading">Links</h3>
            <ul className="landing__footer-list">
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="landing__footer-copy">
          © {new Date().getFullYear()} NOIR. All rights reserved.
        </p>
        <p className="landing__footer-api" data-state={apiStatus}>
          API{' '}
          {apiStatus === 'idle' && '…'}
          {apiStatus === 'ok' && '●'}
          {apiStatus === 'error' && '○'}
        </p>
      </footer>
    </div>
  )
}
