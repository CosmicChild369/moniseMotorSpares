/**
 * Nodemailer email sender for order confirmations
 */
const nodemailer = require('nodemailer');
const { formatZAR } = require('./format');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  return transporter;
}

async function sendOrderConfirmation(order, items) {
  const transport = getTransporter();
  const to = order.guest_email || order.user_email;
  if (!transport || !to) {
    console.log('[Email] Skipped (no SMTP or email):', order.order_number);
    return { sent: false };
  }

  const itemLines = items
    .map((i) => `  - ${i.product_name} x${i.quantity} @ ${formatZAR(i.unit_price)}`)
    .join('\n');

  const html = `
    <h2>Thank you for your order!</h2>
    <p>Hi ${order.guest_name || order.user_name || 'Customer'},</p>
    <p>Your order <strong>${order.order_number}</strong> has been received.</p>
    <h3>Items</h3>
    <pre>${itemLines}</pre>
    <p><strong>Subtotal:</strong> ${formatZAR(order.subtotal)}<br>
    <strong>Delivery:</strong> ${formatZAR(order.delivery_fee)}<br>
    <strong>VAT (15%):</strong> ${formatZAR(order.vat)}<br>
    <strong>Total:</strong> ${formatZAR(order.total)}</p>
    <p>Track your order at ${process.env.SITE_URL}/pages/track-order.html</p>
    <p>Monise Motor Spares<br>604 Monise Section, Katlehong<br>011-860-5344</p>
  `;

  await transport.sendMail({
    from: process.env.EMAIL_FROM || 'Monise Motor Spares <orders@monisespares.co.za>',
    to,
    subject: `Order Confirmation ${order.order_number} - Monise Motor Spares`,
    html
  });
  return { sent: true };
}

async function sendPasswordReset(email, resetLink) {
  const transport = getTransporter();
  if (!transport) {
    console.log('[Email] Reset link (dev):', resetLink);
    return { sent: false, resetLink };
  }
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Password Reset - Monise Motor Spares',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. Link expires in 1 hour.</p>`
  });
  return { sent: true };
}

async function sendInvoiceEmail(to, invoiceNumber, pdfPath) {
  const transport = getTransporter();
  if (!transport || !to) return { sent: false };
  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Invoice ${invoiceNumber} - Monise Motor Spares`,
    text: `Please find attached invoice ${invoiceNumber}.`,
    attachments: pdfPath ? [{ path: pdfPath }] : []
  });
  return { sent: true };
}

module.exports = { sendOrderConfirmation, sendPasswordReset, sendInvoiceEmail };
