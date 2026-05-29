/**
 * Utility functions - ZAR formatting, etc.
 */

/** Format as R123.45 */
function formatZAR(amount) {
  return `R${(Number(amount) || 0).toFixed(2)}`;
}

/** Star rating HTML */
function stars(rating) {
  const r = Math.round(Number(rating) || 0);
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

/** Stock status label */
function stockStatus(qty, threshold = 5) {
  if (qty <= 0) return { label: 'Out of Stock', class: 'badge-out' };
  if (qty <= threshold) return { label: 'Low Stock', class: 'badge-low' };
  return { label: 'In Stock', class: 'badge-fit' };
}

/** Get selected vehicle from localStorage */
function getSelectedVehicle() {
  try {
    return JSON.parse(localStorage.getItem('mms_vehicle') || 'null');
  } catch { return null; }
}

function setSelectedVehicle(vehicle) {
  if (vehicle) localStorage.setItem('mms_vehicle', JSON.stringify(vehicle));
  else localStorage.removeItem('mms_vehicle');
}

/** WhatsApp URL */
function whatsappUrl(message) {
  const num = '27711279007';
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`;
}

/** Query params */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Show alert in container */
function showAlert(container, message, type = 'error') {
  container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

/** Debounce */
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Midnight countdown for daily specials */
function getMidnightCountdown() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  return {
    hours: Math.floor(diff / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000)
  };
}
