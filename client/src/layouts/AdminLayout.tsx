import { Link, NavLink, Outlet } from 'react-router-dom'
import { getStoredAuth, isAuthSessionValid } from '@/lib/authApi'
import '@/pages/Admin/AdminPage.css'

function IconLayout() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function IconPackage() {
  return (
    <svg
      width="18"
      height="18"
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

function IconCart() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

export default function AdminLayout() {
  const ok =
    isAuthSessionValid() && getStoredAuth()?.user?.user_type === 'admin'

  if (!ok) {
    return (
      <div className="admin-denied">
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>접근 불가</h1>
        <p style={{ color: '#9ca3af', margin: '0.5rem 0 0' }}>
          관리자 권한이 필요합니다.
        </p>
        <Link to="/login">로그인</Link>
      </div>
    )
  }

  return (
    <div className="admin">
      <aside className="admin__sidebar" aria-label="관리자 메뉴">
        <Link className="admin__brand" to="/admin">
          <span className="admin__brand-icon">N</span>
          NOIR Admin
        </Link>

        <p className="admin__nav-label">Main</p>
        <ul className="admin__nav-list">
          <li className="admin__nav-item">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `admin__nav-link${isActive ? ' admin__nav-link--active' : ''}`
              }
            >
              <IconLayout />
              Overview
            </NavLink>
          </li>
          <li className="admin__nav-item">
            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `admin__nav-link${isActive ? ' admin__nav-link--active' : ''}`
              }
            >
              <IconPackage />
              Products
            </NavLink>
          </li>
          <li className="admin__nav-item">
            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `admin__nav-link${isActive ? ' admin__nav-link--active' : ''}`
              }
            >
              <IconCart />
              Orders
            </NavLink>
          </li>
          <li className="admin__nav-item">
            <a className="admin__nav-link" href="#">
              <IconUsers />
              Customers
            </a>
          </li>
          <li className="admin__nav-item">
            <a className="admin__nav-link" href="#">
              <IconChart />
              Analytics
            </a>
          </li>
        </ul>

        <p className="admin__nav-label">Settings</p>
        <ul className="admin__nav-list">
          <li className="admin__nav-item">
            <a className="admin__nav-link" href="#">
              <IconSettings />
              Settings
            </a>
          </li>
        </ul>

        <div className="admin__sidebar-spacer" />

        <Link className="admin__back" to="/">
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
          Back to Store
        </Link>
      </aside>

      <div className="admin__main">
        <Outlet />
      </div>
    </div>
  )
}
