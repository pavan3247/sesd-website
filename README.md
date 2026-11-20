# ⚡ FITZONE — Gym Membership Management System (GMMS)

> **College Project Demonstration & Production Architecture**  
> Built with HTML5, CSS3, TypeScript, Chart.js, Node.js, Express.js, and Google Stitch MCP UI Designs.  
> **100% Mock Data Driven:** Zero database installation or external dependencies required!

---

## 1. Project Overview

**FITZONE** is a high-performance Gym Membership Management System designed to modernize daily fitness club operations. Built upon Google Stitch MCP designs, FITZONE features an athletic dark charcoal aesthetic with an energetic orange accent (`#FF6B2C`), Material Symbols, Chart.js analytics, and real-time frontend-to-backend data synchronization.

### 🌟 Key Highlights
- **Zero Database Setup:** Runs out-of-the-box using local JSON data stores with atomic file persistence.
- **Stitch MCP UI:** Accurate recreation of dark theme dashboard, cards, tables, drawers, and modal workflows.
- **Full TypeScript Logic:** Cleanly typed data structures, API client, authentication state, and component controllers compiled to vanilla JavaScript.
- **Complete Feature Suite:** Member management, plan subscriptions, coach assignments, turnstile rapid check-in, revenue tracking, tax invoice generation, and workout plan programming.

---

## 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (Tailwind CSS + Custom Theme), TypeScript, Chart.js, Google Material Symbols |
| **Backend API** | Node.js (v18+), Express.js (v4.21+), CORS |
| **Data Persistence** | Local JSON data stores (`backend/data/*.json`) with read/write synchronization |
| **Authentication** | Demo state-driven session authentication with `sessionStorage` & `localStorage` |

---

## 3. Demo Credentials

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **General Manager / Admin** | `admin@fitzone.com` | `Admin@123` | Full Access across all 8 modules |

*The login page includes a 1-click **Auto-fill** button for quick demonstration.*

---

## 4. Quick Start & Local Execution

### Prerequisites
- Node.js 18 or higher installed on your system.

### Steps to Run:

1. **Navigate to the Backend Directory:**
   ```bash
   cd FITZONE/backend
   ```

2. **Install Dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Start the FITZONE Server:**
   ```bash
   npm start
   ```

4. **Open in Browser:**
   Open your browser and navigate to:
   ```
   http://localhost:5000
   ```
   *(The server serves both the Express REST API under `/api/*` and the static frontend pages under the root URL!)*

---

## 5. Website Modules & Pages

1. **Admin Login (`login.html`)**
   - Validates credentials against `admin.json`.
   - Show/hide password toggle, remember me checkbox, and 1-click demo auto-fill.
   - Protected routes automatically redirect unauthenticated users to login.

2. **Executive Dashboard (`dashboard.html`)**
   - Live KPI cards: Total Members (24), Active Members (14), Expired/Expiring Soon (4), Total Coaches (5), Month Revenue (₹26,492), and Today's Attendance.
   - Dynamic Chart.js Monthly Revenue Curve with gradient fill.
   - Dynamic Chart.js New Member Growth Bar Chart.
   - Live club capacity turnstile widget with real-time occupancy percentage.
   - Recent registrations and recent transactions tables.
   - Quick "Check-in Athlete" modal.

3. **Member Directory & Management (`members.html`)**
   - Search by name, phone, email, or Member ID (`FZ-2026-XXXX`).
   - Filter by status (`Active`, `Expiring Soon`, `Expired`) and plan (`Basic`, `Standard`, `Premium`, `VIP Elite`).
   - "Add Athlete" modal with phone uniqueness check and auto-calculated expiry dates.
   - "Edit Athlete" modal and deletion confirmation dialog.

4. **Membership Plans & Tiers (`memberships.html`)**
   - Plan cards: Basic (₹999 / 1 Mo), Standard (₹2,499 / 3 Mo), Premium (₹4,499 / 6 Mo), VIP Elite (₹7,999 / 12 Mo).
   - Detailed feature checklist per plan tier.
   - Add, edit, and delete plans.

5. **Trainer Management (`trainers.html`)**
   - Coach cards with specialization (Strength, HIIT, Bodybuilding, Mobility, Functional).
   - Experience, star rating, and assigned athlete chips.
   - Add new coach modal and "Assign Athlete to Coach" modal.

6. **Turnstile & Attendance Desk (`attendance.html`)**
   - Rapid check-in terminal: enters Member ID or name.
   - Rejects expired memberships with clear feedback.
   - Prevents duplicate check-ins for already present athletes.
   - Live table with 1-click "Check-out" button recording egress timestamps.
   - Historical date filter to review past daily attendance logs.

7. **Payments & Billing Management (`payments.html`)**
   - Transaction ledger with payment modes (UPI, Card, Cash).
   - "Process New Transaction" modal with athlete dropdown and plan amount auto-fill.
   - Recording a payment automatically extends or activates the member's subscription!
   - **Printable Official Tax Receipt Modal:** Features FITZONE gym branding, invoice ID, GST (18%) breakdown, member details, and 1-click **Print / Save as PDF** support.

8. **Workout Plans & Regimens (`workouts.html`)**
   - Customized workout blueprints: Push-Pull-Legs, HIIT Tabata, Barbell Squat Session, Rotator Cuff Rehab, etc.
   - Filterable by difficulty: Beginner, Intermediate, Advanced.
   - "View Routine" modal showing full exercise table (sets, reps, weight, target muscle).
   - "Create Periodized Plan" modal with dynamic exercise row builder.

9. **Club Configuration & Settings (`settings.html`)**
   - Edit operating name, manager name, phone number, and physical gym address.
   - Change demo administrator password with verification.
   - System overview notes confirming zero external database dependencies.

---

## 6. REST API Endpoints

| Domain | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Validates demo admin credentials |
| **Auth** | `GET` | `/api/auth/me` | Fetches current admin profile |
| **Auth** | `POST` | `/api/auth/change-password` | Updates demo administrator password |
| **Auth** | `PUT` | `/api/auth/profile` | Updates gym business details |
| **Dashboard**| `GET` | `/api/dashboard/stats` | Dynamically aggregates all metrics and chart series |
| **Members** | `GET` | `/api/members` | Searches and filters members list |
| **Members** | `POST` | `/api/members` | Registers member and auto-generates ID |
| **Members** | `PUT` | `/api/members/:id` | Updates member details and recalculates status |
| **Members** | `DELETE`| `/api/members/:id` | Deletes member record |
| **Plans** | `GET` | `/api/memberships` | Lists all membership packages |
| **Plans** | `POST` | `/api/memberships` | Creates a new membership plan |
| **Plans** | `PUT` | `/api/memberships/:id` | Modifies an existing plan |
| **Plans** | `DELETE`| `/api/memberships/:id` | Deletes a plan |
| **Trainers** | `GET` | `/api/trainers` | Returns coaches and assigned athlete rosters |
| **Trainers** | `POST` | `/api/trainers` | Enrolls a new coach |
| **Trainers** | `POST` | `/api/trainers/:id/assign` | Assigns an athlete to a coach |
| **Attendance**| `GET` | `/api/attendance` | Returns attendance records by date |
| **Attendance**| `POST` | `/api/attendance/check-in` | Validates subscription & logs check-in |
| **Attendance**| `POST` | `/api/attendance/check-out/:id`| Records exit time & marks checked out |
| **Payments** | `GET` | `/api/payments` | Returns payment records with totals |
| **Payments** | `POST` | `/api/payments` | Records payment & auto-renews member plan |
| **Payments** | `GET` | `/api/payments/:id/receipt` | Returns GST tax invoice payload |
| **Workouts** | `GET` | `/api/workouts` | Lists all periodized workout routines |
| **Workouts** | `POST` | `/api/workouts` | Creates new routine with exercise items |
| **Workouts** | `DELETE`| `/api/workouts/:id` | Removes a workout plan |

---

## 7. Project Directory Structure

```
FITZONE/
├── backend/
│   ├── data/
│   │   ├── admin.json          # Admin credentials & club profile
│   │   ├── attendance.json     # 32+ attendance records
│   │   ├── members.json        # 24 realistic members (Active, Expiring, Expired)
│   │   ├── memberships.json    # 4 membership plans
│   │   ├── payments.json       # 22+ payment transactions
│   │   ├── trainers.json       # 5 certified fitness coaches
│   │   └── workouts.json       # 10 periodized workout regimens
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── attendance.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── db.js               # Safe atomic JSON file reader & writer
│   │   ├── members.routes.js
│   │   ├── memberships.routes.js
│   │   ├── payments.routes.js
│   │   ├── trainers.routes.js
│   │   └── workouts.routes.js
│   ├── package.json
│   └── server.js               # Express server (API + Static Frontend)
├── frontend/
│   ├── css/
│   │   └── style.css           # Styling, scrollbars, print styles
│   ├── ts/                     # TypeScript source files
│   │   ├── api.ts
│   │   ├── attendance.ts
│   │   ├── auth.ts
│   │   ├── dashboard.ts
│   │   ├── members.ts
│   │   ├── memberships.ts
│   │   ├── payments.ts
│   │   ├── settings.ts
│   │   ├── trainers.ts
│   │   ├── types.ts
│   │   └── workouts.ts
│   ├── js/                     # Compiled JavaScript files (ESNext)
│   │   ├── api.js
│   │   ├── attendance.js
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── members.js
│   │   ├── memberships.js
│   │   ├── payments.js
│   │   ├── settings.js
│   │   ├── trainers.js
│   │   └── workouts.js
│   ├── attendance.html
│   ├── dashboard.html
│   ├── index.html
│   ├── login.html
│   ├── members.html
│   ├── memberships.html
│   ├── payments.html
│   ├── settings.html
│   ├── trainers.html
│   ├── tsconfig.json
│   └── workouts.html
└── README.md
```

---

## 8. Verification & Demonstration Checklist

- [x] Predefined credentials (`admin@fitzone.com` / `Admin@123`) functional with show/hide password and auto-fill.
- [x] Unauthenticated users are redirected from protected pages to `login.html`.
- [x] Dashboard dynamically calculates KPI cards and draws Chart.js Monthly Revenue & Growth curves.
- [x] Member directory supports search, status filtering, registration drawer, editing, and soft/hard deletion.
- [x] Membership plans support CRUD and price display in Indian Rupee (₹).
- [x] Trainers module displays 5 coaches with specialties and athlete assignment capability.
- [x] Turnstile attendance performs rapid check-in, checks subscription expiry, and prevents duplicate entries.
- [x] Payments ledger allows recording payments with instant subscription renewal and printable tax receipts.
- [x] Workout regimens display difficulty badges and allow inspecting exercise sets, reps, and weights.
- [x] Settings page allows updating club address and changing the demo password.
- [x] Zero external databases needed; all changes persist to JSON files.
