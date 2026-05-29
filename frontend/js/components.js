/**
 * Shared header, footer, WhatsApp button
 */

const SHOP = {
  name: 'Monise Motor Spares',
  address: '604 Monise Section, Katlehong',
  phone: '011-860-5344',
  phone2: '071-127-9007',
  whatsapp: '27711279007'
};

const BRANDS = ['Castrol', 'Shell Helix', 'Holts', 'Safeline', 'Willard', 'LUK', 'Shield', 'Girlock', 'Sabat', 'Victor Reinz'];

function renderHeader() {
  return `
  <header class="site-header">
    <div class="header-inner">
      <a href="/" class="logo">Monise <span>Motor Spares</span></a>
      <form class="search-bar" action="/pages/products.html" method="get">
        <input type="search" name="search" placeholder="Search parts, SKU, brand..." aria-label="Search">
        <button type="submit">Search</button>
      </form>
      <div class="header-actions">
        <a href="/pages/cart.html" class="header-icon" title="Cart" aria-label="Shopping cart">
          <svg class="icon-cart" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM7.2 14h9.7c.8 0 1.5-.5 1.8-1.2l2.3-6.5H6.2L7.2 14zM6 6h14l-1-4H5L6 6z"/></svg>
          <span class="cart-badge">0</span>
        </a>
        <a href="/pages/account.html" class="header-icon" title="Account" aria-label="My account">
          <svg class="icon-user" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-2.7 0-8 1.3-8 4v2h16v-2c0-2.7-5.3-4-8-4z"/></svg>
        </a>
      </div>
    </div>
  </header>
  <div class="vehicle-bar" id="vehicle-bar">
    <div class="container">
      <label>Find parts for your vehicle:</label>
      <select id="veh-year" aria-label="Year"><option value="">Year</option></select>
      <select id="veh-make" disabled aria-label="Make"><option value="">Make</option></select>
      <select id="veh-model" disabled aria-label="Model"><option value="">Model</option></select>
      <select id="veh-engine" disabled aria-label="Engine"><option value="">Engine</option></select>
      <button type="button" class="btn btn-sm btn-outline btn-clear" id="veh-clear">Clear</button>
    </div>
  </div>`;
}

function renderFooter() {
  return `
  <footer class="site-footer">
    <div class="container footer-grid">
      <div>
        <h4>${SHOP.name}</h4>
        <p>${SHOP.address}</p>
        <p>Tel: ${SHOP.phone}<br>${SHOP.phone2}</p>
        <p><a href="${whatsappUrl('Hi Monise Motor Spares!')}" target="_blank" rel="noopener">WhatsApp Us</a></p>
      </div>
      <div>
        <h4>Quick Links</h4>
        <ul>
          <li><a href="/pages/products.html">All Parts</a></li>
          <li><a href="/pages/products.html?category=toyota-quantum">Toyota Quantum Parts</a></li>
          <li><a href="/pages/track-order.html">Track Order</a></li>
          <li><a href="/pages/account.html">My Account</a></li>
        </ul>
      </div>
      <div>
        <h4>Categories</h4>
        <ul>
          <li><a href="/pages/products.html?category=engine-parts">Engine Parts</a></li>
          <li><a href="/pages/products.html?category=brakes">Brakes</a></li>
          <li><a href="/pages/products.html?category=batteries">Batteries</a></li>
          <li><a href="/pages/products.html?category=oils-fluids">Oils & Fluids</a></li>
        </ul>
      </div>
      <div>
        <h4>Newsletter</h4>
        <p>Get specials & Quantum part alerts</p>
        <form id="newsletter-form" class="form-group">
          <input type="email" name="email" placeholder="Your email" required>
          <button type="submit" class="btn btn-accent btn-block" style="margin-top:8px">Subscribe</button>
        </form>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>&copy; ${new Date().getFullYear()} Monise Motor Spares. All prices include VAT where applicable. E&OE.</p>
    </div>
  </footer>
  <a href="${whatsappUrl('Hi Monise Motor Spares, I need help with parts.')}" class="whatsapp-float" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.881 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  </a>`;
}

function initLayout() {
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');
  if (headerEl) headerEl.innerHTML = renderHeader();
  if (footerEl) footerEl.innerHTML = renderFooter();
  updateCartBadge();
  initVehicleSelector();
  initNewsletter();
}

function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await NewsletterAPI.subscribe(form.email.value);
      alert('Thank you for subscribing!');
      form.reset();
    } catch (err) {
      alert(err.message);
    }
  });
}

/** Product card HTML */
function productCardHTML(p, options = {}) {
  const price = p.sale_price || p.price;
  const onSale = p.sale_price && p.sale_price < p.price;
  const vehicle = getSelectedVehicle();
  const fits = vehicle && p.vehicles?.some((v) => v.id === vehicle.id);
  const stock = stockStatus(p.stock_qty, p.low_stock_threshold);
  const img = p.primary_image || p.images?.[0]?.image_url || '/uploads/placeholder-product.svg';
  const waMsg = `Hi, I'd like to enquire about: ${p.name} (${p.sku}) - ${formatZAR(price)}`;

  return `
  <article class="card product-card">
    <a href="/pages/product-detail.html?id=${p.id}" class="img-wrap">
      <img src="${img}" alt="${p.name}" loading="lazy">
    </a>
    <div class="body">
      <span class="brand">${p.brand}</span>
      <a href="/pages/product-detail.html?id=${p.id}" class="name">${p.name}</a>
      ${fits ? '<span class="badge badge-fit">Fits your vehicle</span>' : ''}
      ${p.old_battery_required ? '<span class="badge badge-sale">Old battery required</span>' : ''}
      <div class="rating">${stars(p.rating_avg)} (${p.rating_count || 0})</div>
      <div class="price">
        ${onSale ? `<span class="was">${formatZAR(p.price)}</span>` : ''}
        ${formatZAR(price)}
      </div>
      <span class="badge ${stock.class}">${stock.label}</span>
      <div class="actions">
        <button class="btn btn-primary btn-sm btn-add-cart" data-id="${p.id}" ${p.stock_qty <= 0 ? 'disabled' : ''}>Add to Cart</button>
        <a href="${whatsappUrl(waMsg)}" class="btn btn-whatsapp btn-sm" target="_blank" rel="noopener">Enquire on WhatsApp</a>
      </div>
    </div>
  </article>`;
}

/** Bind add-to-cart buttons (needs product data fetch or data attributes) */
function bindAddToCart(container, products) {
  container.querySelectorAll('.btn-add-cart').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = products.find((x) => x.id === Number(btn.dataset.id));
      if (p) {
        addToCart({ ...p, primary_image: p.primary_image || p.images?.[0]?.image_url });
        btn.textContent = 'Added!';
        setTimeout(() => { btn.textContent = 'Add to Cart'; }, 1500);
      }
    });
  });
}
