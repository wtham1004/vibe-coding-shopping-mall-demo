import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PRODUCT_CATEGORIES } from '@/constants/productCategories'
import { listProducts, type Product } from '@/lib/productApi'
import '@/pages/Admin/AdminPage.css'
import './AdminProductsPage.css'

type SortKey = 'sku' | 'name' | 'category' | 'price' | null
type SortDir = 'asc' | 'desc'

function IconPackage() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05" />
      <path d="M12 22.08V12" />
    </svg>
  )
}

function IconFilter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M22 3H2l8 9.46V19l4 2v-6.54L22 3z" />
    </svg>
  )
}

function IconSort({ dir }: { dir: 'asc' | 'desc' | 'neutral' }) {
  return (
    <span className="admin-products__sort-icon" aria-hidden>
      {dir === 'neutral' ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
          <path d="M7 13l5 5 5-5M7 11l5-5 5 5" />
        </svg>
      ) : dir === 'asc' ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" strokeWidth="2">
          <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e5e5e5" strokeWidth="2">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      )}
    </span>
  )
}

const PAGE_SIZE = 8

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

function truncate(s: string, max: number) {
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

/** 스키마에 사이즈·컬러가 없을 때 목록용 플레이스홀더 */
function placeholderSizes(p: Product): { chips: string[]; more: number } {
  if (p.category === 'Gift Card' || p.category === 'Accessories') {
    return { chips: ['One Size'], more: 0 }
  }
  const n = p._id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const pool = ['XS', 'S', 'M', 'L', 'XL']
  const count = 3 + (n % 2)
  const start = n % 3
  const chips = []
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    chips.push(pool[(start + i) % pool.length])
  }
  const more = n % 3 === 0 ? 2 : 0
  return { chips, more }
}

function placeholderColors(id: string): string[] {
  const hues = [220, 35, 145, 85, 30, 200]
  const base = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return [0, 1, 2].map((i) => {
    const h = hues[(base + i * 47) % hues.length]
    const s = 35 + ((base + i) % 25)
    const l = 42 + ((base + i * 11) % 18)
    return `hsl(${h} ${s}% ${l}%)`
  })
}

export default function AdminProductsPage() {
  const [rows, setRows] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [sortKey, setSortKey] = useState<SortKey>('sku')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(0)

  const load = useCallback(async () => {
    setLoadError(null)
    setLoading(true)
    try {
      const data = await listProducts()
      setRows(data)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : '목록을 불러오지 못했습니다.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filtered = useMemo(() => {
    let list = rows
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter((p) => {
        const desc = (p.description ?? '').toLowerCase()
        return (
          p.sku.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          desc.includes(q)
        )
      })
    }
    if (category !== 'all') {
      list = list.filter((p) => p.category === category)
    }
    if (sortKey) {
      const dir = sortDir === 'asc' ? 1 : -1
      list = [...list].sort((a, b) => {
        if (sortKey === 'price') {
          return (a.price - b.price) * dir
        }
        const va = String(a[sortKey]).toLowerCase()
        const vb = String(b[sortKey]).toLowerCase()
        return va.localeCompare(vb) * dir
      })
    }
    return list
  }, [rows, query, category, sortKey, sortDir])

  const total = filtered.length
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const pageItems = useMemo(() => {
    const start = safePage * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  useEffect(() => {
    setPage(0)
  }, [query, category])

  useEffect(() => {
    if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1))
  }, [page, pageCount])

  function toggleSort(key: SortKey) {
    if (!key) return
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function sortIconFor(key: SortKey) {
    if (sortKey !== key) return <IconSort dir="neutral" />
    return <IconSort dir={sortDir === 'asc' ? 'asc' : 'desc'} />
  }

  return (
    <div className="admin__content admin-products">
      <header className="admin-products__head">
        <div>
          <h1 className="admin-products__title">
            <span className="admin-products__title-icon">
              <IconPackage />
            </span>
            Products
          </h1>
          <p className="admin-products__sub">
            {total} of {rows.length} products
          </p>
        </div>
        <Link to="/admin/products/new" className="admin-products__add">
          + Add Product
        </Link>
      </header>

      {loadError ? (
        <p className="admin-products__banner" role="alert">
          {loadError}
        </p>
      ) : null}

      <div className="admin-products__toolbar">
        <div className="admin-products__search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            type="search"
            className="admin-products__search"
            placeholder="Search by name, SKU, or description..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search products"
          />
        </div>
        <div className="admin-products__filter-wrap">
          <IconFilter />
          <select
            className="admin-products__filter"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="all">All Categories</option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-products__table-outer">
        {loading ? (
          <p className="admin-products__loading">Loading products…</p>
        ) : (
          <table className="admin-products__table">
            <thead>
              <tr>
                <th scope="col">Image</th>
                <th scope="col">
                  <button
                    type="button"
                    className="admin-products__th-btn"
                    onClick={() => toggleSort('sku')}
                  >
                    SKU {sortIconFor('sku')}
                  </button>
                </th>
                <th scope="col">
                  <button
                    type="button"
                    className="admin-products__th-btn"
                    onClick={() => toggleSort('name')}
                  >
                    Name {sortIconFor('name')}
                  </button>
                </th>
                <th scope="col">
                  <button
                    type="button"
                    className="admin-products__th-btn"
                    onClick={() => toggleSort('category')}
                  >
                    Category {sortIconFor('category')}
                  </button>
                </th>
                <th scope="col">
                  <button
                    type="button"
                    className="admin-products__th-btn"
                    onClick={() => toggleSort('price')}
                  >
                    Price {sortIconFor('price')}
                  </button>
                </th>
                <th scope="col">Sizes</th>
                <th scope="col">Colors</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-products__empty">
                    No products match your filters.
                  </td>
                </tr>
              ) : (
                pageItems.map((p) => {
                  const { chips, more } = placeholderSizes(p)
                  const colors = placeholderColors(p._id)
                  return (
                    <tr key={p._id}>
                      <td>
                        <div className="admin-products__thumb-wrap">
                          <img
                            src={p.image}
                            alt=""
                            className="admin-products__thumb"
                          />
                        </div>
                      </td>
                      <td>
                        <code className="admin-products__sku">{p.sku}</code>
                      </td>
                      <td>
                        <span className="admin-products__name">{p.name}</span>
                        <span className="admin-products__desc">
                          {p.description
                            ? truncate(p.description, 56)
                            : '—'}
                        </span>
                      </td>
                      <td>
                        <span className="admin-products__pill">{p.category}</span>
                      </td>
                      <td className="admin-products__price">{USD.format(p.price)}</td>
                      <td>
                        <div className="admin-products__sizes">
                          {chips.map((s) => (
                            <span key={s} className="admin-products__size-chip">
                              {s}
                            </span>
                          ))}
                          {more > 0 ? (
                            <span className="admin-products__size-more">+{more}</span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <div className="admin-products__colors">
                          {colors.map((bg, i) => (
                            <span
                              key={i}
                              className="admin-products__swatch"
                              style={{ background: bg }}
                              title=""
                            />
                          ))}
                        </div>
                      </td>
                      <td>
                        <span className="admin-products__status">Active</span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      <footer className="admin-products__footer">
        <span className="admin-products__footer-count">
          {total === 0
            ? 'Showing 0 of 0 products'
            : `Showing ${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, total)} of ${total} products`}
        </span>
        <div className="admin-products__pager">
          <button
            type="button"
            className="admin-products__page-btn"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </button>
          <button
            type="button"
            className="admin-products__page-btn"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            Next
          </button>
        </div>
      </footer>
    </div>
  )
}

