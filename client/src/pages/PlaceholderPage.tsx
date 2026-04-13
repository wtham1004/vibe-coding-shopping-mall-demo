import { Link } from 'react-router-dom'
import './PlaceholderPage.css'

type Props = { title: string }

export default function PlaceholderPage({ title }: Props) {
  return (
    <div className="placeholder-page">
      <p className="placeholder-page__brand">NOIR</p>
      <h1 className="placeholder-page__title">{title}</h1>
      <p className="placeholder-page__lead">페이지 준비 중입니다.</p>
      <Link className="placeholder-page__link" to="/">
        홈으로
      </Link>
    </div>
  )
}
