/**
 * Seed database with sample data for Monise Motor Spares
 * Run: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { getDb } = require('./db');

const db = getDb();

function seed() {
  console.log('Seeding Monise Motor Spares database...');

  // Clear existing data (development seed)
  const tables = [
    'invoice_items', 'invoices', 'order_items', 'orders', 'wishlist', 'reviews',
    'product_vehicles', 'product_images', 'products', 'user_vehicles', 'vehicles',
    'promo_codes', 'banners', 'newsletter', 'categories', 'users', 'settings'
  ];
  db.exec('PRAGMA foreign_keys = OFF');
  tables.forEach((t) => db.exec(`DELETE FROM ${t}`));
  db.exec('PRAGMA foreign_keys = ON');

  // Default settings
  const settings = {
    business_name: 'Monise Motor Spares',
    business_address: '604 Monise Section, Katlehong',
    business_phone: '011-860-5344',
    business_phone2: '071-127-9007',
    whatsapp_number: '27711279007',
    vat_number: '4123456789',
    invoice_footer: 'Thank you for shopping at Monise Motor Spares. E&OE.',
    delivery_standard_fee: '89.00',
    delivery_express_fee: '149.00',
    payfast_sandbox: 'true',
    payfast_merchant_id: process.env.PAYFAST_MERCHANT_ID || '',
    payfast_merchant_key: process.env.PAYFAST_MERCHANT_KEY || '',
    payfast_passphrase: process.env.PAYFAST_PASSPHRASE || ''
  };
  const insertSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  Object.entries(settings).forEach(([k, v]) => insertSetting.run(k, String(v)));

  // Admin users
  const hash = bcrypt.hashSync('admin123', 10);
  const hashStaff = bcrypt.hashSync('staff123', 10);
  const hashCustomer = bcrypt.hashSync('customer123', 10);

  db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Super Admin', 'admin@monisespares.co.za', '0118605344', hash, 'super_admin', '604 Monise Section, Katlehong');

  db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('Staff User', 'staff@monisespares.co.za', '0711279007', hashStaff, 'staff', '604 Monise Section, Katlehong');

  db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role, address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('John Mokoena', 'john@example.com', '0821234567', hashCustomer, 'customer', '12 Main Rd, Katlehong');

  // Categories
  const categories = [
    { name: 'Engine Parts', slug: 'engine-parts', icon: 'engine', banner: '/uploads/categories/engine-parts.png', order: 1 },
    { name: 'Brakes', slug: 'brakes', icon: 'brake', banner: '/uploads/categories/brakes.png', order: 2 },
    { name: 'Suspension', slug: 'suspension', icon: 'suspension', banner: '/uploads/categories/suspension.png', order: 3 },
    { name: 'Electrical', slug: 'electrical', icon: 'electrical', banner: '/uploads/categories/electrical.png', order: 4 },
    { name: 'Oils & Fluids', slug: 'oils-fluids', icon: 'oil', banner: '/uploads/categories/oils-fluids.png', order: 5 },
    { name: 'Filters', slug: 'filters', icon: 'filter', banner: '/uploads/categories/filters.png', order: 6 },
    { name: 'Batteries', slug: 'batteries', icon: 'battery', banner: '/uploads/categories/batteries.png', order: 7 },
    { name: 'Tyres & Wheels', slug: 'tyres-wheels', icon: 'tyre', banner: '/uploads/categories/tyres-wheels.png', order: 8 },
    { name: 'Toyota Quantum', slug: 'toyota-quantum', icon: 'quantum', banner: '/uploads/categories/toyota-quantum.png', order: 9 }
  ];
  const catStmt = db.prepare('INSERT INTO categories (name, slug, icon, banner_image, display_order) VALUES (?, ?, ?, ?, ?)');
  const catIds = {};
  categories.forEach((c) => {
    const r = catStmt.run(c.name, c.slug, c.icon, c.banner, c.order);
    catIds[c.slug] = r.lastInsertRowid;
  });

  // Vehicles (popular SA models + Quantum)
  const vehicles = [
    [2018, 'Toyota', 'Quantum', '2.7 Petrol'],
    [2019, 'Toyota', 'Quantum', '2.7 Petrol'],
    [2020, 'Toyota', 'Quantum', '2.7 Petrol'],
    [2015, 'Toyota', 'Hilux', '2.4 D-4D'],
    [2018, 'Toyota', 'Hilux', '2.8 GD-6'],
    [2016, 'Volkswagen', 'Polo Vivo', '1.4'],
    [2019, 'Volkswagen', 'Polo', '1.0 TSI'],
    [2017, 'Ford', 'Ranger', '2.2 TDCi'],
    [2020, 'Hyundai', 'i20', '1.2'],
    [2014, 'Nissan', 'NP200', '1.6']
  ];
  const vehStmt = db.prepare('INSERT INTO vehicles (year, make, model, engine) VALUES (?, ?, ?, ?)');
  const vehIds = [];
  vehicles.forEach((v) => {
    const r = vehStmt.run(...v);
    vehIds.push(r.lastInsertRowid);
  });

  // Products
  const products = [
    { name: 'Castrol GTX 5W-30 4L', brand: 'Castrol', sku: 'CAS-GTX-5W30-4L', cat: 'oils-fluids', price: 449.99, sale: 399.99, stock: 45, brand2: 'Castrol' },
    { name: 'Shell Helix HX7 10W-40 5L', brand: 'Shell Helix', sku: 'SHL-HX7-10W40-5L', cat: 'oils-fluids', price: 529.99, sale: null, stock: 30 },
    { name: 'Willard 652 Car Battery', brand: 'Willard', sku: 'WIL-652', cat: 'batteries', price: 1899.00, sale: 1749.00, stock: 12, battery: 1 },
    { name: 'Safeline Front Brake Pads', brand: 'Safeline', sku: 'SFL-FBP-HILUX', cat: 'brakes', price: 389.00, sale: null, stock: 25 },
    { name: 'LUK Clutch Kit Toyota Quantum', brand: 'LUK', sku: 'LUK-CK-QUANTUM', cat: 'toyota-quantum', price: 2899.00, sale: 2699.00, stock: 8, quantum: 1 },
    { name: 'Girlock Brake Disc Front Quantum', brand: 'Girlock', sku: 'GIR-BD-Q-F', cat: 'toyota-quantum', price: 649.00, sale: null, stock: 15, quantum: 1 },
    { name: 'Holts Radiator Stop Leak', brand: 'Holts', sku: 'HOL-RSL-500', cat: 'oils-fluids', price: 89.99, sale: null, stock: 60 },
    { name: 'Shield Oil Filter Universal', brand: 'Shield', sku: 'SHD-OF-UNI', cat: 'filters', price: 79.99, sale: 69.99, stock: 100 },
    { name: 'Victor Reinz Head Gasket Set', brand: 'Victor Reinz', sku: 'VR-HG-HILUX', cat: 'engine-parts', price: 1249.00, sale: null, stock: 6 },
    { name: 'Sabat Alternator 90A Quantum', brand: 'Sabat', sku: 'SAB-ALT-Q90', cat: 'toyota-quantum', price: 2199.00, sale: null, stock: 4, quantum: 1 },
    { name: 'Castrol Brake Fluid DOT 4 500ml', brand: 'Castrol', sku: 'CAS-BF-DOT4', cat: 'oils-fluids', price: 119.99, sale: null, stock: 40 },
    { name: 'Air Filter Toyota Hilux 2.4', brand: 'Shield', sku: 'SHD-AF-HILUX24', cat: 'filters', price: 199.00, sale: null, stock: 35 },
    { name: 'Front Shock Absorber Pair Hilux', brand: 'Safeline', sku: 'SFL-SA-HILUX-F', cat: 'suspension', price: 899.00, sale: 799.00, stock: 10 },
    { name: 'Spark Plug Set 4 Cyl', brand: 'Shield', sku: 'SHD-SP-4CYL', cat: 'electrical', price: 249.00, sale: null, stock: 50 },
    { name: 'Willard 646 Battery', brand: 'Willard', sku: 'WIL-646', cat: 'batteries', price: 1599.00, sale: null, stock: 8, battery: 1 },
    { name: 'Quantum Wiper Blade Set', brand: 'Safeline', sku: 'SFL-WB-Q-SET', cat: 'toyota-quantum', price: 299.00, sale: 249.00, stock: 20, quantum: 1, special: 1 }
  ];

  const prodStmt = db.prepare(`
    INSERT INTO products (name, brand, sku, category_id, description, specifications, price, sale_price,
      stock_qty, low_stock_threshold, old_battery_required, quantum_part, is_daily_special, special_ends_at, rating_avg, rating_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 5, ?, ?, ?, datetime('now', '+1 day'), ?, ?)
  `);

  const pvStmt = db.prepare('INSERT INTO product_vehicles (product_id, vehicle_id) VALUES (?, ?)');
  const imgStmt = db.prepare('INSERT INTO product_images (product_id, image_url, is_primary) VALUES (?, ?, 1)');

  products.forEach((p, i) => {
    const desc = `Quality ${p.brand} ${p.name} available at Monise Motor Spares, Katlehong.`;
    const specs = JSON.stringify({ weight: 'N/A', origin: 'OEM/Aftermarket', warranty: '12 months' });
    const r = prodStmt.run(
      p.name, p.brand, p.sku, catIds[p.cat], desc, specs, p.price, p.sale || null,
      p.stock, p.battery ? 1 : 0, p.quantum ? 1 : 0, p.special ? 1 : 0,
      4 + (i % 10) / 10, 10 + i
    );
    const pid = r.lastInsertRowid;
    imgStmt.run(pid, `/uploads/placeholder-product.svg`);
    // Link Quantum products to Quantum vehicles
    if (p.quantum) {
      vehIds.slice(0, 3).forEach((vid) => pvStmt.run(pid, vid));
    } else if (i % 3 === 0) {
      pvStmt.run(pid, vehIds[i % vehIds.length]);
    }
  });

  // Banners
  const bannerStmt = db.prepare('INSERT INTO banners (image_url, link, title, display_order) VALUES (?, ?, ?, ?)');
  bannerStmt.run('/uploads/banner-oils.png', '/pages/products.html?category=oils-fluids', 'Castrol Oil Special', 1);
  bannerStmt.run('/uploads/banner-quantum.png', '/pages/products.html?category=toyota-quantum', 'Toyota Quantum Parts', 2);
  bannerStmt.run('/uploads/banner-batteries.png', '/pages/products.html?category=batteries', 'Battery Month Sale', 3);

  // Promo codes
  db.prepare(`INSERT INTO promo_codes (code, type, value, usage_limit, expires_at) VALUES ('KATLEHONG10', 'percentage', 10, 100, datetime('now', '+90 days'))`).run();
  db.prepare(`INSERT INTO promo_codes (code, type, value, usage_limit, expires_at) VALUES ('FREESHIP', 'fixed', 89, 50, datetime('now', '+30 days'))`).run();

  // Sample reviews
  db.prepare(`INSERT INTO reviews (product_id, author_name, rating, comment) VALUES (1, 'Thabo K.', 5, 'Great oil, fast service from Monise!')`).run();
  db.prepare(`INSERT INTO reviews (product_id, author_name, rating, comment) VALUES (5, 'Sipho M.', 5, 'Perfect fit for my Quantum.')`).run();

  console.log('Seed complete!');
  console.log('Admin: admin@monisespares.co.za / admin123');
  console.log('Staff: staff@monisespares.co.za / staff123');
  console.log('Customer: john@example.com / customer123');
}

seed();
