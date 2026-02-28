# Pradhikaran Portal

A production-ready MERN stack application for **research governance and collaboration** between Super Admin, Pradhikaran (Governing Authority), and Department (Contributor) roles.

## Features

- **Role-based access**: Super Admin (hidden URL), Pradhikaran, Department
- **Department selection**: Dynamic department dropdown. Users can select "Other" during registration to define custom departments. Once approved, these custom departments become available in the dropdown for future registrations and for assigning questions by Pradhikaran.
- **Strict workflow**: Question states (open → locked → finalized), Answer states (pending_review, update_requested, accepted, rejected)
- **Final decision authority**: Pradhikaran can merge accepted answers into an official final answer and finalize
- **Permissions (Pradhikaran)**: Dedicated **Permissions** section to view pending department registrations, **approve** or **reject** with mandatory reason; audit logging and real-time notifications to departments (approval/rejection)
- **History**: Role-scoped **History** for Pradhikaran and Department: chronological timeline of own actions, keyword search, date filters (today, last 7/30 days, custom), action-type and status filters, pagination, **CSV/JSON export** (capped); access-controlled
- **Immutable audit logs**: All major actions logged (questions, answers, registration approve/reject, user creation); History and Super Admin audit view
- **Real-time updates**: Socket.io for answer status, finalization, registration approval/rejection, question lock
- **Secure auth**: JWT access (15m) + refresh (7d) in HTTP-only cookie, bcrypt, rate limiting, Helmet, CORS
- **Glassmorphism UI**: Blue → purple → navy gradient theme, blur cards, smooth transitions
- **PDF export**: Question and department reports (PDFKit)
- **Cron**: Auto-lock questions when deadline passes
- **Analytics**: Aggregation pipeline metrics for dashboards

## Recent Changes

- **Dynamic Custom Departments**: Added support for custom department registration. Users selecting "Other" can specify new departments. Upon approval, these dynamically populate the registration and assignment dropdowns across the portal.
- Marathi (Devanagari) Unicode rendering in PDF exports via PDFKit. System font detection for Nirmala UI/Mangal (Windows) and Noto/Lohit (Linux/macOS). For consistent results, bundle a Devanagari TTF (e.g., NotoSansDevanagari-Regular.ttf) and point PDFKit to it.
- Removed manual "Lock Question" button from Pradhikaran UI. Auto-lock via cron continues based on deadlines.
- New Pradhikaran section: Departments overview at `/pradhikaran/departments` listing all departments and questions answered by each.
- Socket.IO client supports direct backend connection via `VITE_API_ORIGIN` (falls back to dev proxy). Use this if ws proxy issues occur.

## Roles (summary)

| Role            | Key capabilities |
|-----------------|------------------|
| **Super Admin** | Create Pradhikaran accounts, view analytics, all questions, activity logs. Does **not** approve department registrations. |
| **Pradhikaran** | Create/manage questions, review answers, lock/finalize, **Permissions** (approve/reject department registrations), **History**, export. |
| **Department**  | Register (pending approval), sign in after approval, view assigned questions, submit answers, **History**, PDF export. |

## Tech Stack

**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Socket.io, node-cron, PDFKit, express-rate-limit, helmet, cors, morgan, express-validator  
**Frontend:** React, Context API, Axios, Socket.io-client, Vite

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set MONGODB_URI, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET, SUPER_ADMIN_SECRET_PATH, CORS_ORIGIN
npm install
npm run seed   # creates Super Admin (default: superadmin@pradhikaran.local / SuperAdmin@123)
npm run dev    # runs on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev    # runs on http://localhost:3000, proxies /api and /socket.io to backend
```

Optional: create `.env` in `frontend` to set direct backend URL for Socket.IO and API:

```
VITE_API_ORIGIN=http://localhost:5000
```

### 3. Super Admin access

- Log in with the seeded Super Admin credentials.
- Open the Super Admin dashboard (link in nav when role is SUPER_ADMIN).
- For “hidden” access, use the secure path: append `?access=<SUPER_ADMIN_SECRET_PATH>` to the URL (e.g. `/super-admin?access=super-admin-secure`). Configure `SUPER_ADMIN_SECRET_PATH` in backend `.env`.

## Environment (backend .env)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `JWT_ACCESS_EXPIRY` | e.g. 15m |
| `JWT_REFRESH_EXPIRY` | e.g. 7d |
| `SUPER_ADMIN_SECRET_PATH` | Secret query/header for super-admin routes |
| `CORS_ORIGIN` | Frontend origin (e.g. http://localhost:3000) |
| `PORT` | Backend port (default 5000) |

## API Overview

- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/departments` (Public dynamic department list)
- **Users:** `GET/POST /api/users/pradhikaran` (Super Admin), `GET /api/users/departments`, `GET /api/users/pending-registrations` (Pradhikaran), `POST /api/users/:userId/approve` (Pradhikaran), `POST /api/users/:userId/reject` (Pradhikaran, body: `{ reason }`)
- **Questions:** `GET/POST /api/questions`, `GET/PUT/DELETE /api/questions/:id`, `POST /api/questions/:id/lock`, `GET /api/questions/:id/answers`, `POST /api/questions/:id/finalize`
- **Answers:** `POST /api/answers`, `GET /api/answers/question/:questionId`, `PUT /api/answers/:id`, `POST /api/answers/:id/status`
- **Answers (Pradhikaran):** `GET /api/answers/department/:departmentId` — list answers for a department (includes populated question summary)
- **Analytics:** `GET /api/analytics`
- **Activity logs:** `GET /api/activity-logs` (Super Admin), `GET /api/activity-logs/mine` (Pradhikaran, Department; query: page, limit, keyword, dateFrom, dateTo, action, status), `GET /api/activity-logs/mine/export?format=csv|json`
- **Export:** `GET /api/export/question/:id`, `GET /api/export/department/:userId`
- **Super Admin (with secret):** `GET /api/super-admin/health`, `GET/POST /api/super-admin/users/...`, `GET /api/super-admin/questions/all`, `GET /api/super-admin/analytics`, `GET /api/super-admin/activity-logs`, etc.

## Documentation

- **`docs/DEPARTMENT_SELECTION_IMPLEMENTATION.md`** — Department dropdown (registration + Pradhikaran create-question), options, validation, data flow
- **`docs/DEPARTMENT_SELECTION_TEST_CASES.md`** — Test checklist for department selection
- **`docs/HISTORY_FEATURE.md`** — History section (Pradhikaran & Department), search/filters, export, API
- **`docs/ROLE_PERMISSIONS.md`** — Permission system: Super Admin vs Pradhikaran (department approval/rejection), workflow, audit, notifications

## Tests

```bash
cd backend
npm test
```

If PowerShell blocks `npm` scripts (Execution Policy), run:

```bash
node ./node_modules/jest/bin/jest.js --coverage --forceExit
```

## License

MIT
