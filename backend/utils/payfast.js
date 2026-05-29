/**
 * PayFast payment gateway integration (South Africa)
 * https://developers.payfast.co.za/docs
 */
const crypto = require('crypto');
const querystring = require('querystring');

const SANDBOX_URL = 'https://sandbox.payfast.co.za/eng/process';
const LIVE_URL = 'https://www.payfast.co.za/eng/process';

function getPayfastConfig(settings) {
  const sandbox = settings?.payfast_sandbox !== 'false' && process.env.PAYFAST_SANDBOX !== 'false';
  return {
    merchant_id: settings?.payfast_merchant_id || process.env.PAYFAST_MERCHANT_ID,
    merchant_key: settings?.payfast_merchant_key || process.env.PAYFAST_MERCHANT_KEY,
    passphrase: settings?.payfast_passphrase || process.env.PAYFAST_PASSPHRASE,
    sandbox,
    url: sandbox ? SANDBOX_URL : LIVE_URL
  };
}

/** Build MD5 signature per PayFast spec */
function generateSignature(data, passphrase) {
  let pfOutput = '';
  const keys = Object.keys(data).sort();
  keys.forEach((key) => {
    const val = data[key];
    if (val !== '' && val !== undefined && val !== null) {
      pfOutput += `${key}=${encodeURIComponent(String(val).trim()).replace(/%20/g, '+')}&`;
    }
  });
  let getString = pfOutput.slice(0, -1);
  if (passphrase) {
    getString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }
  return crypto.createHash('md5').update(getString).digest('hex');
}

/**
 * Build PayFast payment form data for checkout
 */
function buildPaymentData(order, siteUrl, settings) {
  const config = getPayfastConfig(settings);
  const itemName = `Order ${order.order_number}`;
  const data = {
    merchant_id: config.merchant_id,
    merchant_key: config.merchant_key,
    return_url: `${siteUrl}/api/payments/payfast/return`,
    cancel_url: `${siteUrl}/pages/checkout.html?cancelled=1`,
    notify_url: `${siteUrl}/api/payments/payfast/notify`,
    name_first: (order.guest_name || 'Customer').split(' ')[0],
    name_last: (order.guest_name || 'Customer').split(' ').slice(1).join(' ') || 'Customer',
    email_address: order.guest_email || 'customer@example.com',
    m_payment_id: order.order_number,
    amount: Number(order.total).toFixed(2),
    item_name: itemName.substring(0, 100),
    item_description: `Monise Motor Spares order ${order.order_number}`
  };
  data.signature = generateSignature(data, config.passphrase);
  return { ...data, action: config.url };
}

/** Verify ITN notification from PayFast */
function verifyNotification(postData, passphrase) {
  const receivedSignature = postData.signature;
  const data = { ...postData };
  delete data.signature;
  const calculated = generateSignature(data, passphrase);
  return receivedSignature === calculated;
}

module.exports = { buildPaymentData, verifyNotification, getPayfastConfig, generateSignature };
