import { Link, Navigate, useParams } from 'react-router-dom'
import { getPostBySlug } from '@/data/blogPosts'
import './BlogPage.css'

const dateFmt = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const post = getPostBySlug(slug)

  if (!post) {
    return <Navigate to="/blog" replace />
  }

  return (
    <article className="blog-post">
      <header className="blog-post__hero">
        <p className="blog-post__eyebrow">
          <Link to="/blog">Blog</Link>
        </p>
        <h1 className="blog-post__title">{post.title}</h1>
        {post.subtitle && <p className="blog-post__subtitle">{post.subtitle}</p>}
        <p className="blog-post__meta">
          <time dateTime={post.date}>{dateFmt.format(new Date(post.date))}</time>
          <span className="blog-post__dot" aria-hidden>
            ·
          </span>
          <span>{post.readTimeMin} min read</span>
        </p>
        {post.tags.length > 0 && (
          <p className="blog-post__tags">
            {post.tags.map((t) => (
              <span key={t} className="blog-post__tag">
                {t}
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="blog-post__cover-wrap">
        <img src={post.image} alt="" className="blog-post__cover" />
      </div>

      <div className="blog-post__shell">
        <div className="blog-post__content">
          {post.body.map((para, i) => (
            <p key={`${post.slug}-p-${i}`} className="blog-post__para">
              {para}
            </p>
          ))}
        </div>

        <p className="blog-post__nav">
          <Link className="blog-page__cta" to="/blog">
            ← All posts
          </Link>
        </p>
      </div>
    </article>
  )
}
