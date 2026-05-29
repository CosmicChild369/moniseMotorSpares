/**
 * PDF invoice generator using PDFKit
 */
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { formatZAR } = require('./format');

const INVOICE_DIR = path.join(__dirname, '../../uploads/invoices');

function ensureDir() {
  if (!fs.existsSync(INVOICE_DIR)) fs.mkdirSync(INVOICE_DIR, { recursive: true });
}

/**
 * Generate invoice PDF for order or standalone invoice
 */
function generateInvoicePdf(data, filename) {
  ensureDir();
  const filepath = path.join(INVOICE_DIR, filename);
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  // Header
  doc.fontSize(20).fillColor('#1A2A6C').text('Monise Motor Spares', { align: 'left' });
  doc.fontSize(10).fillColor('#333').text('604 Monise Section, Katlehong');
  doc.text('Tel: 011-860-5344 | 071-127-9007');
  doc.moveDown();

  doc.fontSize(16).fillColor('#1A2A6C').text(`Invoice: ${data.invoiceNumber || data.orderNumber}`);
  doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString('en-ZA')}`);
  doc.moveDown();

  doc.text(`Customer: ${data.customerName}`);
  if (data.customerEmail) doc.text(`Email: ${data.customerEmail}`);
  if (data.customerPhone) doc.text(`Phone: ${data.customerPhone}`);
  if (data.customerAddress) doc.text(`Address: ${data.customerAddress}`);
  doc.moveDown();

  // Table header
  const startY = doc.y;
  doc.fontSize(10).fillColor('#1A2A6C');
  doc.text('Description', 50, startY, { width: 250 });
  doc.text('Qty', 300, startY);
  doc.text('Price', 340, startY);
  doc.text('Total', 420, startY);
  doc.moveTo(50, startY + 15).lineTo(550, startY + 15).stroke();
  doc.moveDown(0.5);

  let y = doc.y;
  (data.items || []).forEach((item) => {
    const lineTotal = item.quantity * item.unit_price;
    doc.fillColor('#333').text(item.description || item.product_name, 50, y, { width: 240 });
    doc.text(String(item.quantity), 300, y);
    doc.text(formatZAR(item.unit_price), 340, y);
    doc.text(formatZAR(lineTotal), 420, y);
    y += 20;
    doc.y = y;
  });

  doc.moveDown(2);
  doc.text(`Subtotal: ${formatZAR(data.subtotal)}`, { align: 'right' });
  doc.text(`VAT (15%): ${formatZAR(data.vat)}`, { align: 'right' });
  doc.fontSize(12).fillColor('#1A2A6C').text(`Total: ${formatZAR(data.total)}`, { align: 'right' });

  if (data.notes) {
    doc.moveDown();
    doc.fontSize(9).fillColor('#666').text(`Notes: ${data.notes}`);
  }
  if (data.footer) {
    doc.moveDown(2);
    doc.fontSize(8).text(data.footer);
  }

  doc.end();

  return new Promise((resolve, reject) => {
    stream.on('finish', () => resolve(filepath));
    stream.on('error', reject);
  });
}

module.exports = { generateInvoicePdf, INVOICE_DIR };
