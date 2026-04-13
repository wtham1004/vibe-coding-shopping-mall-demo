import { getStoredAuth } from '@/lib/authApi'
import '@/pages/Admin/AdminPage.css'
import './AdminHeader.css'

type AdminHeaderProps = {
  /** 왼쪽 영역 (제목·설명 등) */
  heading: React.ReactNode
  /** 검색창 왼쪽에 올 액션 (예: 버튼) */
  actionsBeforeSearch?: React.ReactNode
}

export default function AdminHeader({
  heading,
  actionsBeforeSearch,
}: AdminHeaderProps) {
  const user = getStoredAuth()?.user
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'A'

  return (
    <header className="admin__top">
      <div className="admin__header-heading">{heading}</div>
      <div className="admin__top-actions">
        {actionsBeforeSearch}
        <div className="admin__search-wrap">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>
          <input
            type="search"
            className="admin__search"
            placeholder="Search..."
            aria-label="Search"
          />
        </div>
        <button type="button" className="admin__icon-btn" aria-label="알림">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="admin__notif-dot" />
        </button>
        <div className="admin__avatar" aria-hidden>
          {initial}
        </div>
      </div>
    </header>
  )
}
