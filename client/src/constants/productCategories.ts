/** 허용 상품 카테고리 — 서버 `productCategories.js`와 동일한 값 유지 */
export const PRODUCT_CATEGORIES = [
  'Tops & Blouses',
  'Dresses & Skirts',
  'Knits & Sweaters',
  'Pants & Shorts',
  'Jeans',
  'Vests & Jackets',
  'Coats',
  'Suiting Collection',
  'Woman Suit',
  'Resort',
  'Accessories',
  'Gift Card',
] as const

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]
