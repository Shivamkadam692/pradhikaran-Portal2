# History Section (Pradhikaran & Department)

The History section provides role-specific activity timelines for **Pradhikaran** and **Department** users, with search, filters, pagination, and export.

## Access

- **Pradhikaran:** Dashboard → **History** (nav) or `/pradhikaran/history`
- **Department:** Dashboard → **History** (nav) or `/department/history`

Only the current user’s own actions are shown (access is scoped by `user` on the backend).

## Tracked Actions

All relevant actions are logged automatically:

| Action | Description |
|--------|-------------|
| question_created | Pradhikaran created a question |
| question_updated | Pradhikaran updated question title/description/deadline |
| question_locked | Pradhikaran locked the question |
| question_finalized | Pradhikaran finalized and published final answer |
| question_deleted | Pradhikaran soft-deleted a question |
| answer_submitted | Department submitted or updated an answer |
| answer_accepted | Pradhikaran accepted an answer |
| answer_rejected | Pradhikaran rejected an answer |
| update_requested | Pradhikaran requested an answer update |
| final_answer_published | Final answer published (logged with finalize) |
| registration_approved | Super Admin approved a department registration |
| user_created | Super Admin created a Pradhikaran user |

(History for Pradhikaran/Department shows only actions performed by that user, so they will typically see question/answer actions, not registration_approved/user_created unless a Super Admin is also using the same role, which is not the normal setup.)

## UI Features

- **Timeline:** Chronological list with timestamp, action label, optional metadata (e.g. question title), and status badge.
- **Keyword search:** Searches action, entity type, metadata (e.g. title, email).
- **Date filters:** Today, Last 7 days, Last 30 days, or custom date range.
- **Action type:** All, Create, Update, Delete, View (View reserved for future).
- **Status:** All, Success, Failed, Pending.
- **Pagination:** Previous/Next with page size 20 (max 100 per request).
- **Export:** CSV or JSON of current filter set (capped at 5000 records).

## API

- `GET /api/activity-logs/mine` — List current user’s logs (Pradhikaran or Department only).  
  Query: `page`, `limit`, `keyword`, `dateFrom`, `dateTo`, `action` (single or comma-separated), `status`, `entityType`.
- `GET /api/activity-logs/mine/export?format=csv|json` — Same filters; returns CSV file or JSON.

## Backend

- **Model:** `ActivityLog` — `user`, `action`, `entityType`, `entityId`, `metadata`, `status` (success/failed/pending), `timestamp`.
- **Indexes:** `user`, `timestamp`, `{ user, timestamp }`, `action`, `status` for efficient role-scoped queries.
- **Controller:** `listMine` and `exportMine` in `activityLogController.js`; routes under `activityLogRoutes.js` with `authorizeRoles(PRADHIKARAN, DEPARTMENT)`.

## Performance

- Queries are restricted by `user: req.user._id` and use indexed fields.
- Export is limited to 5000 records per request.
- Pagination uses `skip`/`limit`; for very large datasets consider cursor-based pagination later.

## Data Integrity & Access Control

- Users only see their own logs (`user = req.user._id`).
- Super Admin continues to use the existing `/api/activity-logs` list (all logs); History uses `/mine` only for Pradhikaran and Department.
