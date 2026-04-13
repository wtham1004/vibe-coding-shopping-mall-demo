import { Link } from 'react-router-dom'
import { blogPosts } from '@/data/blogPosts'
import './BlogPage.css'

const dateFmt = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export default function BlogPage() {
  return (
    <div className="blog-page">
      <header className="blog-page__hero">
        <p className="blog-page__eyebrow">NOIR</p>
        <h1 className="blog-page__title">Blog</h1>
        <p className="blog-page__lead">
          Stories on style, materials, and the people behind the collections—updated when we have
          something worth reading.
        </p>
      </header>

      <div className="blog-page__shell">
        <ul className="blog-page__grid">
          {blogPosts.map((post) => (
            <li key={post.slug} className="blog-page__card-wrap">
              <article className="blog-card">
                <Link to={`/blog/${post.slug}`} className="blog-card__media-link">
                  <div className="blog-card__img-wrap">
                    <img src={post.image} alt="" className="blog-card__img" loading="lazy" />
                  </div>
                </Link>
                <div className="blog-card__body">
                  <p className="blog-card__meta">
                    <time dateTime={post.date}>{dateFmt.format(new Date(post.date))}</time>
                    <span className="blog-card__dot" aria-hidden>
                      ·
                    </span>
                    <span>{post.readTimeMin} min read</span>
                  </p>
                  {post.tags.length > 0 && (
                    <p className="blog-card__tags">
                      {post.tags.map((t) => (
                        <span key={t} className="blog-card__tag">
                          {t}
                        </span>
                      ))}
                    </p>
                  )}
                  <h2 className="blog-card__title">
                    <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                  </h2>
                  {post.subtitle && <p className="blog-card__subtitle">{post.subtitle}</p>}
                  <p className="blog-card__excerpt">{post.excerpt}</p>
                  <Link className="blog-card__read" to={`/blog/${post.slug}`}>
                    Read article
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <p className="blog-page__back">
          <Link className="blog-page__cta" to="/">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
