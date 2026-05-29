/**
 * WhatsApp wa.me deep link helpers
 */

const DEFAULT_NUMBER = process.env.WHATSAPP_NUMBER || '27711279007';

function buildWhatsAppUrl(phone, message) {
  const num = (phone || DEFAULT_NUMBER).replace(/\D/g, '');
  const text = encodeURIComponent(message || '');
  return `https://wa.me/${num}?text=${text}`;
}

function productEnquiryMessage(product) {
  return `Hi Monise Motor Spares, I'd like to enquire about:\n${product.name}\nPart No: ${product.sku}\nPrice: R${Number(product.sale_price || product.price).toFixed(2)}`;
}

function orderStatusMessage(orderNumber) {
  return `Hi, I'd like to check the status of my order ${orderNumber} from Monise Motor Spares.`;
}

function orderViaWhatsAppMessage(items) {
  let msg = 'Hi Monise Motor Spares, I would like to order:\n';
  items.forEach((item) => {
    msg += `- ${item.name} (${item.sku}) x${item.quantity}\n`;
  });
  msg += '\nPlease confirm availability and total.';
  return msg;
}

module.exports = {
  buildWhatsAppUrl,
  productEnquiryMessage,
  orderStatusMessage,
  orderViaWhatsAppMessage,
  DEFAULT_NUMBER
};
