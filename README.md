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

## Run entirely on GitHub (recommended if you only use GitHub)

GitHub **cannot** run Node.js + SQLite on Pages alone. This repo is set up to use **GitHub only** via:

| What | Where |
|------|--------|
| Code | This repository |
| Landing page | **GitHub Pages** (auto-deploys from `docs/`) |
| Full store + admin | **GitHub Codespaces** (Node app in the cloud) |

### 1. Turn on GitHub Pages (one time)

1. Repo → **Settings** → **Pages**
2. **Build and deployment** → Source: **GitHub Actions**
3. Push to `main` — workflow `.github/workflows/github-pages.yml` publishes `docs/`
4. Your landing page: `https://cosmicchild369.github.io/moniseMotorSpares/`

### 2. Open the live store (Codespaces)

1. Repo → green **Code** → **Codespaces** → **Create codespace on main**
2. Wait ~2 min (install + seed runs automatically)
3. Browser opens **port 3000** — that is your store
4. **Ports** tab → set port `3000` to **Public** → copy URL to share

- **Store:** `/` on that URL  
- **Admin:** `/admin/`  
- Default logins below (change after first login)

Codespaces pauses when idle; open the codespace again from GitHub to wake it.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://github.com/codespaces/new?hide_repo_select=true&ref=main&repo=CosmicChild369/moniseMotorSpares)

---

## Quick Start (local)

```bash
git clone https://github.com/CosmicChild369/moniseMotorSpares.git
cd moniseMotorSpares
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
