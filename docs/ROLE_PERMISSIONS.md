# Role Permissions and Department Approval

This document describes the permission system for department registration approval and the roles that can perform it.

## Summary of changes

- **Super Admin** no longer has permission to approve or reject department registrations. Existing approved departments are unchanged; only the authority to approve new requests has been moved.
- **Pradhikaran** is the only role that can approve or reject department registration requests. Pradhikaran users have a dedicated **Permissions** section to manage these requests.

## Role configuration

### Super Admin

- **Can:** Create and manage Pradhikaran accounts, view analytics, view all questions, view activity/audit logs.
- **Cannot:** View pending department registrations, approve or reject department registrations.
- Department registration approval has been removed from the Super Admin role configuration.

### Pradhikaran

- **Can:** Create and manage questions, review answers, lock/finalize questions, **view pending department registration requests**, **approve** department registrations, **reject** department registrations (with mandatory reason).
- **Permissions section:** Available at `/pradhikaran/permissions`. Lists all pending department registrations; each request can be **Accepted** or **Rejected**. Rejection requires a reason (min 10 characters); the reason is stored and can be communicated to the applicant (e.g. via notification).

### Department

- **Can:** Register (pending approval), sign in after approval, view assigned questions, submit answers.
- **Cannot:** Approve or reject other departments; they only receive approval/rejection decisions (e.g. via notifications).

## Department approval workflow

1. A department user registers via the department registration form. Their account is created with `isApproved: false` and `registrationRequest: 'pending'`.
2. A **Pradhikaran** user opens **Permissions** and sees the pending request (name, email, department).
3. **Accept:** Pradhikaran clicks **Accept**. The backend sets `isApproved: true`, `registrationRequest: 'approved'`, logs the action, and emits `registrationApproved` to the department user (e.g. for in-app notification).
4. **Reject:** Pradhikaran clicks **Reject**, enters a **mandatory reason** (at least 10 characters), and submits. The backend sets `registrationRequest: 'rejected'`, stores `registrationRejectionReason`, logs the action, and emits `registrationRejected` (with reason) to the department user.
5. Existing approved departments are unaffected; only new pending requests are processed by Pradhikaran.

## Audit trail

- **Approval:** `activityLogService.logRegistrationApproved(actorUserId, departmentUserId, { email })` — action `registration_approved`.
- **Rejection:** `activityLogService.logRegistrationRejected(actorUserId, departmentUserId, { email, reason })` — action `registration_rejected`.
- Both appear in the History section for the acting Pradhikaran user.

## Notifications

- **Approval:** Department user receives `registrationApproved` (e.g. “Registration approved”) via socket; shown in the notification dropdown.
- **Rejection:** Department user receives `registrationRejected` with `reason`; notification text can include a short version of the reason.

## API (Pradhikaran only)

- `GET /api/users/pending-registrations` — List department users with `registrationRequest: 'pending'`. **Authorized:** Pradhikaran only.
- `POST /api/users/:userId/approve` — Approve a department user. **Authorized:** Pradhikaran only.
- `POST /api/users/:userId/reject` — Reject with body `{ reason: string }` (min 10 characters). **Authorized:** Pradhikaran only.

## Data model

- **User** (department): `registrationRequest` (`pending` | `approved` | `rejected`), `registrationRejectionReason` (optional, set when rejected), `isApproved` (true when approved).

## Removal of Super Admin approval authority

- The Super Admin dashboard no longer shows “Pending Registrations” or any approve/reject controls.
- The backend routes for pending-registrations, approve, and reject are restricted to **Pradhikaran**; Super Admin receives 403 if calling them.
- This is documented as the intended role management: department approval is a Pradhikaran permission only.
