/**
 * Shopping cart - localStorage based (works for guests)
 */
const CART_KEY = 'mms_cart';

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
  window.dispatchEvent(new Event('cart-updated'));
}

function addToCart(product, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((i) => i.product_id === product.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      product_id: product.id,
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      price: product.sale_price || product.price,
      image: product.primary_image || product.images?.[0]?.image_url || '/uploads/placeholder-product.svg',
      quantity
    });
  }
  saveCart(cart);
}

function updateQuantity(productId, quantity) {
  const cart = getCart();
  const item = cart.find((i) => i.product_id === productId);
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveCart(cart.filter((i) => i.quantity > 0));
  }
}

function removeFromCart(productId) {
  saveCart(getCart().filter((i) => i.product_id !== productId));
}

function clearCart() {
  saveCart([]);
}

function getCartCount() {
  return getCart().reduce((s, i) => s + i.quantity, 0);
}

function getCartSubtotal() {
  return getCart().reduce((s, i) => s + i.price * i.quantity, 0);
}

function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  const count = getCartCount();
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

// Delivery fees (match backend defaults)
const DELIVERY_FEES = { standard: 89, express: 149, collection: 0 };
const VAT_RATE = 0.15;

function calcTotals(deliveryType = 'standard', discount = 0) {
  const subtotal = getCartSubtotal();
  const afterDiscount = Math.max(0, subtotal - discount);
  const deliveryFee = DELIVERY_FEES[deliveryType] ?? 89;
  const vat = Math.round((afterDiscount + deliveryFee) * VAT_RATE * 100) / 100;
  const total = Math.round((afterDiscount + deliveryFee + vat) * 100) / 100;
  return { subtotal, discount, deliveryFee, vat, total, afterDiscount };
}
