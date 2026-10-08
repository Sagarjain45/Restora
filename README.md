# RESTORA — Multi-Tenant SaaS Restaurant Management System

> Modern, cloud-native MERN platform engineered for restaurant floor operations, table management, live ordering, digital billing, waiting queue, table reservations, and platform administration with strict multi-tenant data isolation.

---

## 🌟 Key Features

### 🏛️ 1. Platform Administration
- **Global Overview:** System health, tenant count, platform-wide volume, and restaurant activity roster.
- **Restaurant Onboarding & Approval:** Review inbound applications, approve or reject restaurant onboardings.
- **Tenant Management:** Suspend, activate, or update restaurant operational status.

### 🏢 2. Restaurant Tenant Operations
- **Tenant Workspace:** Customized dashboard with real-time dining operational toggles (Open / Closed).
- **Profile & Hours:** Customizable opening hours per day, cuisine tags, tax rates (GST/VAT), and service charges.
- **End-to-End Quick Service Flow:** 1-click modal workflow bridging Walk-in $\to$ Table Seating $\to$ Order Taking $\to$ Bill Settlement $\to$ Customer Loyalty update $\to$ Table Freeing.

### 🪑 3. Floor & Table Management
- **Floor Visualizer:** Filter by section (Main Dining, Patio, Rooftop, Private Dining) and seating capacity.
- **State Machine Enforcement:** Strict transition controls: `AVAILABLE` $\leftrightarrow$ `OCCUPIED` $\to$ `BILLING` $\to$ `CLEANING` $\to$ `AVAILABLE`.
- **Live Occupancy Status:** Real-time occupancy indicators, current order badges, and capacity validation.

### 🍽️ 4. Menu Catalog Management
- **Dish Catalog:** Categorized items (Starters, Mains, Desserts, Beverages) with dietary flags (Veg / Non-Veg).
- **Instant Availability Toggle:** One-click toggle between `In Stock` and `Sold Out`.
- **Pricing & Currency:** Support for dynamic pricing, tax calculations, and item descriptions.

### 📋 5. Live Orders & Kitchen Workflow
- **Table-Scoped Ordering:** Multi-item orders attached strictly to active floor tables.
- **Order Lifecycle:** `NEW` $\to$ `PLACED` $\to$ `PREPARING` $\to$ `READY` $\to$ `SERVED` $\to$ `COMPLETED`.
- **Dynamic Calculation:** Automated subtotal, tax %, promotional discount deductions, and grand totals.

### 💳 6. Billing, Invoices & Payment
- **Instant Invoice Generation:** Automated billing from active orders with customizable discount codes.
- **Payment Recording:** Multi-method settlements (`CASH`, `UPI`, `CARD`).
- **Automated Table Release:** Recording payment instantly frees the table back to `AVAILABLE`.
- **Customer Loyalty Sync:** Automatically updates customer visit count and total spend.

### ⏳ 7. Waiting Queue Management
- **Strict FIFO Ordering:** Monotonic position tracking based on party arrival time.
- **Table Capacity Matching:** Automated matching suggesting waiting parties that fit newly freed tables.
- **Seating & SMS Notifications:** Status progression: `WAITING` $\to$ `NOTIFIED` $\to$ `SEATED`.

### 📅 8. Table Reservation Management
- **Date & Interval Booking:** Time slots with automated 90-minute dining duration calculation.
- **Conflict Prevention Algorithm:** Strict interval overlap detection prevents double-booking the same table.
- **Lifecycle Transitions:** `PENDING` $\to$ `CONFIRMED` $\to$ `ARRIVED` $\to$ `SEATED` $\to$ `COMPLETED` / `CANCELLED` / `NO_SHOW`.

### 👥 9. Customer Relationship Management (CRM)
- **Customer Profiles:** Tracks phone numbers, emails, visit frequency, and lifetime spend.
- **VIP & Regular Segmentation:** Automated tiering (New, Returning, VIP Diner).
- **Order History:** Direct access to past orders per customer.

### 👔 10. Staff Management & Access Control
- **Staff Roster:** Manage floor staff, managers, chefs, and cashiers with designated roles.
- **Role Permissions:** Restricted to `RESTAURANT_OWNER` only; staff members are blocked from administrative routes.
- **Account Status Guard:** Toggle `ACTIVE` / `INACTIVE` accounts with self-deactivation protection.

### 📈 11. Reports & Analytics
- **Order History Explorer:** Filter historical orders by date range, table, payment method, and search queries.
- **Restaurant Performance:** Total revenue, Average Order Value (AOV), top-selling items, payment method breakdowns, and table utilization.
- **Platform Analytics:** Multi-tenant volume, active restaurant ratios, and daily order trends.

### 🛡️ 12. Security & Multi-Tenant Data Isolation
- **Tenant Anti-Spoofing:** Every restaurant query scoped to `req.tenantId`; cross-tenant requests return `403 Forbidden`.
- **NoSQL Injection Defense:** Recursive sanitization strips `$` operators and dot-notation paths from all payloads.
- **Rate Limiting:** Protects against API flooding and brute-force authentication attempts.
- **Sensitive Data Shielding:** Bcrypt password hashing (10 salt rounds); password hashes are strictly excluded from all JSON serializations.

---

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js (ES Modules), Mongoose, MongoDB, JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `helmet`, `express-rate-limit`, `morgan`, `cors`.
- **Frontend:** React 19, Vite, React Router v7, Vanilla CSS design system, Lucide React icons.
- **Testing:** Native Node.js Test Runner (`node:test`, `node:assert/strict`).

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally at `mongodb://127.0.0.1:27017` (or MongoDB Atlas URI)

### 1. Clone & Setup Repository
```bash
git clone https://github.com/Sagarjain45/wt.git
cd wt/Restora
```

### 2. Start the Backend API Server
```bash
cd server
npm install
npm run dev
```
The server will start on `http://localhost:5000`.

### 3. Start the Frontend Application
In a separate terminal window:
```bash
cd client
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## ⚡ Instant Demo Credentials

The login screen includes 1-click **Instant Role Login** buttons with pre-configured demo credentials:

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@restora.com` | `Admin@123` | Platform-wide oversight & onboarding |
| **Restaurant Owner** | `owner@bistro.com` | `Owner@123` | Trattoria Roma (Full operations & staff) |
| **Restaurant Staff** | `staff@bistro.com` | `Staff@123` | Trattoria Roma (Floor tables, orders & queue) |

> **Note:** Demo seed data is automatically created on first run (or via `POST /api/auth/seed-demo`).

---

## 🧪 Running the Test Suite

The test suite validates multi-tenant isolation, role-based authorization, state machines, billing calculations, and security defenses:

```bash
cd server
npm test
```

**Results:**
- **156 tests** across **81 suites** passing with 0 failures.

To test the frontend build:
```bash
cd client
npm run build
```

---

## 📂 Project Structure

```text
Restora/
├── DOCS/                         # Architecture, PRD, and execution plans
├── server/
│   ├── config/                   # Database & Environment configuration
│   ├── controllers/              # Express route controllers
│   ├── middleware/               # Auth, RBAC, tenant isolation & security
│   ├── models/                   # Mongoose multi-tenant data schemas
│   ├── routes/                   # REST API routes
│   ├── services/                 # Business logic & aggregation services
│   ├── tests/                    # 81 test suites (156 tests)
│   ├── utils/                    # JWT, password & tenant helper utilities
│   ├── app.js                    # Express application setup
│   └── server.js                 # Entrypoint & HTTP server
└── client/
    ├── src/
    │   ├── components/           # Reusable UI & modal components
    │   │   ├── common/           # Navbar, Footer, Toast, ConfirmModal, StatusBadge
    │   │   └── restaurant/       # TableCard, OrderCard, QueueCard, ServiceOrchestrator
    │   ├── context/              # AuthContext & ToastContext
    │   ├── hooks/                # useAuth, useToast
    │   ├── layouts/              # MainLayout with sticky RestaurantSubNav
    │   ├── pages/                # Admin, Restaurant & Auth view pages
    │   ├── services/             # Axios/Fetch API service connectors
    │   ├── App.jsx               # Top-level routing and providers
    │   └── index.css             # Design system tokens and animations
    └── index.html
```

---

## 📜 License
ISC License © 2026 Restora Inc.
