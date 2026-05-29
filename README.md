# Monise Motor Spares

Full-stack e-commerce website for **Monise Motor Spares**, an automotive spares shop in Katlehong, South Africa.

## Features

- **Customer storefront**: Product catalog, vehicle fitment filter, cart, checkout (PayFast + pay in store), order tracking, account, wishlist, WhatsApp ordering
- **Admin dashboard**: Products, orders, customers, categories, vehicles, promotions, invoices, reports, settings
- **South Africa specific**: ZAR pricing, 15% VAT, PayFast payments, collect in store (free), Toyota Quantum parts section

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript (mobile-first)
- Backend: Node.js + Express
- Database: SQLite (better-sqlite3)
- Auth: JWT in httpOnly cookies
- Payments: PayFast (sandbox)
- Email: Nodemailer
- PDF: PDFKit

## Quick Start

```bash
cd monise-spares
cp .env.example .env
npm install
npm run seed
npm start
```

- **Store**: http://localhost:3000
- **Admin**: http://localhost:3000/admin/

### Default logins (after seed)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@monisespares.co.za | admin123 |
| Staff | staff@monisespares.co.za | staff123 |
| Customer | john@example.com | customer123 |

## Project Structure

```
monise-spares/
├── server.js
├── backend/
│   ├── database/     # schema.sql, db.js, seed.js
│   ├── routes/       # API routes
│   ├── middleware/   # auth, upload
│   ├── models/
│   └── utils/        # PDF, email, PayFast, WhatsApp
├── frontend/
│   ├── css/
│   ├── js/
│   ├── pages/        # Customer pages
│   └── admin/        # Admin dashboard
├── uploads/
└── data/             # SQLite database (created on first run)
```

## Environment Variables

See `.env.example` for PayFast keys, JWT secret, SMTP settings, and site URL.

## Promo Codes (seeded)

- `KATLEHONG10` — 10% off
- `FREESHIP` — R89 delivery discount

## License

Private — Monise Motor Spares
