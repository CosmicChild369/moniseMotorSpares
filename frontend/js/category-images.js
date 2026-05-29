/**
 * Category image paths (slug → image) — replaces emoji icons
 */
const CATEGORY_IMAGES = {
  'engine-parts': '/uploads/categories/engine-parts.png',
  brakes: '/uploads/categories/brakes.png',
  suspension: '/uploads/categories/suspension.png',
  electrical: '/uploads/categories/electrical.png',
  'oils-fluids': '/uploads/categories/oils-fluids.png',
  filters: '/uploads/categories/filters.png',
  batteries: '/uploads/categories/batteries.png',
  'tyres-wheels': '/uploads/categories/tyres-wheels.png',
  'toyota-quantum': '/uploads/categories/toyota-quantum.png'
};

/** Resolve category thumbnail URL */
function getCategoryImage(slug, bannerImage) {
  if (bannerImage && bannerImage.startsWith('/')) return bannerImage;
  return CATEGORY_IMAGES[slug] || '/uploads/placeholder-product.svg';
}

/** Category card HTML for homepage grid */
function renderCategoryCard(category) {
  const img = getCategoryImage(category.slug, category.banner_image);
  return `
  <a href="/pages/products.html?category=${category.slug}" class="cat-item">
    <div class="cat-img">
      <img src="${img}" alt="${category.name}" loading="lazy">
    </div>
    <span class="cat-name">${category.name}</span>
  </a>`;
}
