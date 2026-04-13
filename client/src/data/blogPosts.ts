export type BlogPost = {
  slug: string
  title: string
  subtitle?: string
  date: string
  readTimeMin: number
  excerpt: string
  image: string
  tags: string[]
  /** Plain-text paragraphs */
  body: string[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'quiet-luxury-wardrobe',
    title: 'Building a Quiet Luxury Wardrobe',
    subtitle: 'Fewer pieces, more intention',
    date: '2026-03-18',
    readTimeMin: 6,
    excerpt:
      'How to invest in silhouettes and fabrics that feel elevated without chasing every trend.',
    image:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80',
    tags: ['Style', 'Editorial'],
    body: [
      'Quiet luxury is not about logos—it is about proportion, hand-feel, and the confidence of knowing your clothes work together. Start with a neutral palette that flatters your skin tone and build outward with one accent per look.',
      'We recommend anchoring the week with three outer layers, five tops, two bottoms, and shoes that can dress up or down. When everything mixes, getting dressed stops feeling like a chore.',
      'At NOIR, we design around that idea: pieces that sit comfortably next to each other on a rail and in real life.',
    ],
  },
  {
    slug: 'fabric-notes-linen-silk',
    title: 'Fabric Notes: Linen & Silk',
    subtitle: 'What to expect from natural fibers season to season',
    date: '2026-02-26',
    readTimeMin: 5,
    excerpt:
      'Breathability, drape, and care tips—so your favorite pieces last beyond a single summer.',
    image:
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&q=80',
    tags: ['Materials', 'Care'],
    body: [
      'Linen softens with wear and wrinkles in a way that reads intentional, not sloppy. Silk reflects light and elevates even simple cuts—think bias slips and fluid blouses.',
      'Wash cold, reshape while damp, and avoid harsh detergents. A steamer is your best friend for both fibers.',
      'When shopping online, zoom in on weave density: open weaves feel breezy; tighter weaves hold structure for tailoring.',
    ],
  },
  {
    slug: 'from-studio-to-street',
    title: 'From Studio to Street',
    subtitle: 'Behind a NOIR lookbook day',
    date: '2026-01-12',
    readTimeMin: 4,
    excerpt:
      'A short diary from our last shoot—mood boards, light, and the shots we kept.',
    image:
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&q=80',
    tags: ['Behind the scenes'],
    body: [
      'We shot on an overcast morning so shadows stayed soft and colors stayed true to the garments. The team worked in three looks per hour—fast, but never rushed.',
      'Favorite moment: the wind picked up during the coat sequence and we leaned into it instead of fighting it. Sometimes the best frame is the unplanned one.',
      'Thank you to everyone who joined on set. More frames from this series land in the shop and on journal soon.',
    ],
  },
]

export function getPostBySlug(slug: string | undefined): BlogPost | undefined {
  if (!slug) return undefined
  return blogPosts.find((p) => p.slug === slug)
}
