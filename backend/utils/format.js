/**
 * South African formatting helpers
 */

/** Format price as R123.45 */
function formatZAR(amount) {
  const n = Number(amount) || 0;
  return `R${n.toFixed(2)}`;
}

/** Calculate VAT at 15% */
function calcVAT(subtotal) {
  return Math.round(subtotal * 0.15 * 100) / 100;
}

/** Generate order number MMS-YYYYMMDD-XXXX */
function generateOrderNumber() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MMS-${date}-${rand}`;
}

/** Generate invoice number INV-YYYYMMDD-XXXX */
function generateInvoiceNumber() {
  const d = new Date();
  const date = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${date}-${rand}`;
}

module.exports = { formatZAR, calcVAT, generateOrderNumber, generateInvoiceNumber };
