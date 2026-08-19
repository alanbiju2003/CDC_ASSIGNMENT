# KickVault — B2B Vendor Consignment Portal

> **Full-Stack B2B Consignment Platform for Sneaker & Streetwear Retailers**  
> Built with Node.js, Express, React 18, Vite, SQLite, and PDFKit.

---

## 📌 Executive Overview

**KickVault** is a B2B consignment platform designed for high-value sneaker and streetwear inventory management. It bridges external consignment vendors (self-service) and internal KickVault administrators (pricing & operations).

### Key Workflows Included
- **Auth & Role Guards**: JWT authentication with `admin` and `vendor` route guards + `express-rate-limit` on login routes.
- **Vendor Onboarding & Mock KYC**: Form onboarding with PAN regex check (`^[A-Z]{5}[0-9]{4}[A-Z]$`). Instant transition from `pending_kyc` to `active`.
- **Consignment Inventory**: Full CRUD for sneaker listings, CSV/JSON bulk upload dropzone, and admin review & pricing workflow (`submitted` → `priced` → `live` → `sold` / `returned`).
- **Material Receiving Notes (MRN)**: Admin issues MRNs; Vendors sign electronically via interactive checkbox + name + timestamp; Instant high-fidelity PDF document downloads.
- **Invoices & Settlement**: Admin invoice creation for sold items, lifecycle transitions (`draft` → `sent` → `cancelled`), and PDF downloads with net payout formula.
- **Price-Change Requests**: Vendor requests new price → Admin approves/rejects → Price updates automatically upon approval.
- **Bonus Workflows**:
  - 💬 **Live Vendor ↔ Admin Chat**: Two-way messaging thread per vendor.
  - 🔄 **Return Requests Workflow**: Vendor raises recall → Admin approves/rejects.
  - 🔔 **In-App Notifications**: Real-time per-user alerts with unread badge counter.
  - ⏰ **Scheduled Stock Sync (Cron)**: Protected endpoint `POST /api/cron/sync` (Header `x-cron-secret`) reading `stock_sync.csv` and updating live stock & sold quantities.
  - 💰 **Payment Summary Breakdown**: Net payout calculator (`Gross Sales - Commission %`).

---

## 🚀 Quick Start Guide

### 1. Requirements
- **Node.js**: v18.x or v20.x
- **NPM**: v9.x or v10.x

### 2. Installation
Clone the repository and install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Environment Setup
Copy `.env.example` to `backend/.env`:
```bash
cp .env.example backend/.env
```

### 4. Seed Dummy Data
Run the database seed script to populate test accounts, sneakers, MRNs, invoices, and price requests:
```bash
cd backend
npm run seed
```

### 5. Running the Application
Start the backend server (runs on `http://localhost:5001`):
```bash
cd backend
node server.js
```

Start the React frontend (runs on `http://localhost:3000` with API proxying):
```bash
cd frontend
npm run dev
```

---

## 🔑 Test Credentials (All Passwords: `Passw0rd!`)

The seed script loads the exact dummy fixtures required by the assignment brief:

| Role | Email | Name / Business | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@kickvault.test` | Admin User (KickVault HQ) | Full operational control, admin pricing, MRN issue, invoice generation, sync trigger |
| **Vendor 1** | `vendor1@example.test` | Vendor One (Alpha Kicks Co) | Status: `active`, PAN: `AAAAA0000A`. Has initial shoes (`SHOE-1001`, `SHOE-1002`), MRN-2001, INV-3001 |
| **Vendor 2** | `vendor2@example.test` | Vendor Two (Beta Soles Co) | Status: `pending_kyc`, PAN: `ZZZZZ9999Z`. Has `SHOE-1003` & pending price request `PR-4001` |

> 💡 **Reviewer Tip**: Use the **"Switch Test User"** quick bar in the top navigation header to switch between accounts with 1-click!

---

## 🛠️ API Surface Overview

| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/vendor/register` | `POST` | Public | Vendor onboarding registration |
| `/api/auth/vendor/login` | `POST` | Public | Rate-limited vendor sign-in |
| `/api/auth/admin/login` | `POST` | Public | Rate-limited admin sign-in |
| `/api/me` | `GET` | Authenticated | Fetch current user session details |
| `/api/kyc/verify` | `POST` | Authenticated | PAN regex check `^[A-Z]{5}[0-9]{4}[A-Z]$` |
| `/api/shoes` | `GET` / `POST` | Vendor/Admin | List or submit sneaker listings |
| `/api/shoes/bulk` | `POST` | Vendor | Import CSV or JSON sneaker listings |
| `/api/shoes/:id` | `PATCH` | Vendor/Admin | Edit shoe asking price/qty |
| `/api/admin/shoes/:id/price` | `POST` | Admin | Set approved admin price & status |
| `/api/mrn` | `GET` / `POST` | Vendor/Admin | List MRNs or issue new MRN |
| `/api/mrn/:id/sign` | `POST` | Vendor | E-sign MRN note |
| `/api/mrn/:id/pdf` | `GET` | Authenticated | Download PDF of signed MRN document |
| `/api/invoices` | `GET` / `POST` | Vendor/Admin | List invoices or generate new invoice |
| `/api/invoices/:id/send` | `POST` | Admin | Transition invoice state to SENT |
| `/api/invoices/:id/cancel` | `POST` | Admin | Transition invoice state to CANCELLED |
| `/api/invoices/:id/pdf` | `GET` | Authenticated | Download PDF of invoice settlement |
| `/api/payments/summary` | `GET` | Authenticated | Compute vendor gross sales & net payout |
| `/api/price-requests` | `GET` / `POST` | Vendor/Admin | Submit or view price change requests |
| `/api/admin/price-requests/:id/respond` | `POST` | Admin | Approve or reject price request |
| `/api/return-requests` | `GET` / `POST` | Vendor/Admin | Submit or view return requests |
| `/api/admin/return-requests/:id/respond` | `POST` | Admin | Approve or reject return request |
| `/api/chat/:vendorId/messages` | `GET` / `POST` | Vendor/Admin | 2-way live chat thread per vendor |
| `/api/notifications` | `GET` / `PATCH` | Authenticated | Read/manage user alerts |
| `/api/cron/sync` | `POST` | Secret Header | Scheduled sync reading `stock_sync.csv` (`x-cron-secret`) |

---

## 📄 Scheduled Cron Stock Sync

To trigger the scheduled stock sync manually via cURL:
```bash
curl -X POST http://localhost:5001/api/cron/sync \
  -H "x-cron-secret: kickvault_cron_secret_2026"
```
Or click the **"Run Stock Sync (Cron)"** button directly on the Admin Dashboard interface!

---

## 🎨 Architectural Decisions & Design Rationale

1. **SQLite Database Engine (`better-sqlite3`)**:
   - Zero external setup required for reviewers.
   - Synchronous WAL-mode operation providing high reliability, performance, and transactional safety.
2. **Server-Side PDF Generation (`pdfkit`)**:
   - Guarantees pixel-perfect PDF output for MRNs and Invoices directly from the API.
3. **Cyber-Vault UI Theme**:
   - Designed with dark obsidian panels, neon emerald accents, glassmorphic headers, and status pill indicators for a luxury streetwear consignment aesthetic.
# CDC_ASSIGNMENT
