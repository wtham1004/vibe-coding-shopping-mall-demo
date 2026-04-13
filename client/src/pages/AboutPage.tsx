import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './AboutPage.css'

export default function AboutPage() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = hash.replace('#', '')
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [hash])

  return (
    <div className="about-page">
      <div className="about-page__shell about-page__shell--hero">
        <header className="about-page__header">
          <p className="about-page__eyebrow">NOIR</p>
          <h1 className="about-page__title">About Us</h1>
          <p className="about-page__lead">
            NOIR is an online store where you can discover curated fashion—from everyday wear to formal
            pieces—in one place. We focus on simple membership, ordering, and delivery, so you can shop
            timeless silhouettes at a fair price, season after season.
          </p>
        </header>
      </div>

      <div className="about-page__band" aria-labelledby="about-story">
        <div className="about-page__band-inner">
          <section className="about-page__section about-page__section--flush">
            <h2 id="about-story" className="about-page__h2">
              Our story
            </h2>
            <p className="about-page__body">
              NOIR was built around the idea that good design should feel effortless. We bring together
              clean lines, thoughtful materials, and a calm shopping experience—whether you are building
              a capsule wardrobe or looking for a single standout piece.
            </p>
          </section>
        </div>
      </div>

      <div className="about-page__shell">
        <section
          className="about-page__section about-page__section--values"
          aria-labelledby="about-values"
        >
          <h2 id="about-values" className="about-page__h2">
            What we care about
          </h2>
          <ul className="about-page__list">
            <li>
              <strong>Curated selection</strong> — fewer, better pieces instead of endless noise.
            </li>
            <li>
              <strong>Transparent experience</strong> — clear product information and straightforward
              checkout.
            </li>
            <li>
              <strong>Sustainability</strong> — we are committed to improving how we source and ship;
              details evolve as we grow, and we share updates here when we have news to tell.
            </li>
          </ul>
        </section>

        <p className="about-page__back">
          <Link className="about-page__cta" to="/">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
