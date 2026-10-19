# Setup Guide — Healing Horizon

Follow these steps to run the full project locally.

## Prerequisites

- **PHP 8.0+** with `pdo_mysql` extension enabled
- **Composer** (PHP package manager)
- **MySQL 8.0.16+** (required for CHECK constraints in the schema)
- **Node.js 18+** and **npm**

---

## 1. Database

```bash
# Import the schema (creates the healinghorizon database + all tables)
mysql -u root -p < database/schema.sql

# Import the seed data (sample patients, consultants, admins, appointments, etc.)
mysql -u root -p < database/seed.sql
```

The schema creates a database named `healinghorizon` with all 28 tables. The seed script populates enough data for every frontend page to render against immediately.

---

## 2. Backend (PHP API)

```bash
cd api

# Install PHP dependencies (firebase/php-jwt)
composer install

# Create your environment configuration
cp .env.example .env
```

Edit `api/.env` with your values:

```env
DB_HOST=127.0.0.1
DB_NAME=healinghorizon
DB_USER=root
DB_PASS=your-database-password

JWT_SECRET=generate-a-long-random-string-here
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=604800

FRONTEND_ORIGIN=http://localhost:5173

# 8x8 JaaS (Jitsi-as-a-Service) video rooms — required for video calls
JAAS_APP_ID=vpaas-magic-cookie-your-app-id
JAAS_KEY_ID=vpaas-magic-cookie-your-app-id/your-key-id
# Path to the downloaded JaaS RSA private key (.pk). Never commit the key.
JAAS_PRIVATE_KEY_PATH=jaas-private-key.pk

# Optional: LLM API for the AI Chatbot (OpenAI-compatible endpoint)
# Leave blank to use canned replies
# LLM_API_KEY=sk-your-key-here
# LLM_API_URL=https://api.openai.com/v1/chat/completions
# LLM_MODEL=gpt-3.5-turbo
```

Start the PHP development server:

```bash
cd api
php -S localhost:8000 index.php
```

The API will be available at `http://localhost:8000/api/`.

---

## 3. Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend runs at `http://localhost:5173`. During development, Vite proxies `/api` requests to `http://localhost:8000` (see `vite.config.js`), so no CORS configuration is needed.

---

## 4. Build for Production / Submission

```bash
cd frontend
npm run build
```

The build output goes to `../public/` (the top-level `public/` directory in the repo root). This folder contains:

- `public/index.html` — the SPA entry point
- `public/assets/` — bundled CSS and JavaScript

To serve the built app alongside the API in production, configure your web server (Apache/Nginx) to:
- Route `/api/*` requests to PHP (`api/index.php` as the front controller)
- Serve all other requests from the `public/` directory (with fallback to `public/index.html` for client-side routing)

---

## 5. Test Accounts

The seed script creates these accounts. All passwords are `password123`.

| Role | Name | Email | Notes |
|---|---|---|---|
| Patient | Sarah Johnson | `sarah.johnson@university.edu` | Active, has appointments + progress logs |
| Patient | James Okonkwo | `j.okonkwo@university.edu` | Active |
| Patient | Emily Tran | `e.tran@university.edu` | Active |
| Patient | Noor Hassan | `n.hassan@university.edu` | Active |
| Patient | Chloe Zheng | `c.zheng@university.edu` | Active |
| Patient | Liam O'Brien | `l.obrien@university.edu` | **Banned** (cannot log in) |
| Consultant | Dr. Michael Chen | `dr.michael.chen@healinghorizon.org` | Verified, rated 4.80 |
| Consultant | Dr. Sarah Okafor | `s.okafor@healinghorizon.org` | Verified, rated 4.90 |
| Consultant | Dr. Priya Kapoor | `p.kapoor@healinghorizon.org` | Verified, rated 4.90 |
| Consultant | Dr. James Whitfield | `j.whitfield@healinghorizon.org` | **Unverified** (pending admin approval) |
| Consultant | Dr. Amara Nwosu | `a.nwosu@healinghorizon.org` | Verified, rated 5.00 |
| Admin | Admin One | `admin@healinghorizon.org` | Full admin access |
| Admin | Admin Two | `admin2@healinghorizon.org` | Full admin access |

All tokens are JWT-based (15-minute access, 7-day refresh). Logging out clears tokens client-side.

---

## Troubleshooting

- **"Database connection failed"** — verify `DB_HOST`, `DB_USER`, `DB_PASS`, and `DB_NAME` in `api/.env`. Ensure MySQL is running.
- **CORS errors in the browser** — the Vite dev server proxies `/api` automatically. If running the built frontend, set `FRONTEND_ORIGIN` to match your frontend URL.
- **JWT "Invalid or expired token"** — your access token may have expired. Delete the `healing_horizon_refresh_token` key from `localStorage` and log in again.
- **CHECK constraints not enforced** — requires MySQL 8.0.16+. The schema still works on older versions but CHECK clauses are silently ignored.
