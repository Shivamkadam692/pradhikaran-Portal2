# Department Selection Implementation

This document describes the department dropdown implementation used in the **Department role registration form** and the **Pradhikaran role create-question interface**.

## Overview

- A single, consistent set of department options is used across the app.
- Both interfaces use the shared `DepartmentSelect` component and the `DEPARTMENT_OPTIONS` constant.
- Department is **required** in registration and when creating a question; validation is applied on the frontend and backend.

## Department Options

The following departments are available in the dropdown (same list in both places):

- Computer Science
- Physical Science
- Chemical Science
- Mathematics and Statistics
- Pharmacy
- Language

**Frontend constant:** `frontend/src/constants/departments.js` — `DEPARTMENT_OPTIONS`  
**Backend constant:** `backend/config/constants.js` — `ALLOWED_DEPARTMENT_NAMES`

Keep these two lists in sync when adding or changing departments.

## Components and Files

### Shared

| Item | Path | Purpose |
|------|------|---------|
| Department options | `frontend/src/constants/departments.js` | Canonical list of department names |
| DepartmentSelect | `frontend/src/components/DepartmentSelect.jsx` | Reusable dropdown with label, error, and a11y |
| DepartmentSelect styles | `frontend/src/components/DepartmentSelect.css` | Theming and responsive behavior for the dropdown |

### Department Role – Registration

| Item | Path | Change |
|------|------|--------|
| Registration page | `frontend/src/pages/DepartmentRegister.jsx` | Department text input replaced with `DepartmentSelect`; client-side validation requires a selection; `departmentError` state for “Please select a department” |
| Auth styles | `frontend/src/pages/Auth.css` | `.auth-form-field` for form layout |
| Backend registration | `backend/controllers/authController.js` | Validates presence and allowed value of `departmentName`; returns 400 with clear message if missing or invalid |
| Backend constants | `backend/config/constants.js` | `ALLOWED_DEPARTMENT_NAMES` used for validation |

### Pradhikaran Role – Create Question

| Item | Path | Change |
|------|------|--------|
| Question list / create form | `frontend/src/pages/PradhikaranDashboard.jsx` | Create-question form uses `DepartmentSelect` with same options; form stores selected **department name**; on submit, selection is resolved to an **approved department user** and question is created with that user’s ID |
| Dashboard styles | `frontend/src/pages/Dashboard.css` | `.dashboard-form-field` for spacing of the department field |

### Backend

- **Registration:** `departmentName` is required and must be one of `ALLOWED_DEPARTMENT_NAMES`. Otherwise the API responds with 400 and a message indicating department is required or must be from the allowed list.
- **Questions:** The question creation API still expects `department` to be a **User ID** (reference to an approved department user). The frontend maps the selected department name to the first approved user with that `departmentName` (or `name`) and sends that ID. If no such user exists, the frontend shows an error and does not submit.

## State and Data Flow

### Registration (Department role)

1. User selects a department from the dropdown (value = one of `DEPARTMENT_OPTIONS`).
2. If they submit without selecting, frontend shows “Please select a department” and does not call the API.
3. On submit, `departmentName` is sent to `POST /api/auth/register`. Backend validates and stores it on the user.

### Create Question (Pradhikaran role)

1. Pradhikaran selects a department from the same dropdown (value = department name).
2. Frontend loads department users from `GET /users/departments`.
3. On submit:  
   - If no department selected → show “Please select a department to assign this question to.”  
   - Else find an **approved** user in `departments` whose `departmentName` or `name` matches the selected name.  
   - If none found → show message that no approved department user exists for that department.  
   - If found → send `POST /questions` with `department: departmentUser._id` (and other fields). The question is stored with that user as the assigned department.

## Accessibility and UX

- **DepartmentSelect**:
  - `<label htmlFor={id}>` so the label is associated with the `<select>`.
  - `aria-required`, `aria-invalid`, `aria-describedby` for the error.
  - Required indicator: “*” in the label (with `aria-hidden="true"`).
  - Native `<select>` for keyboard navigation and screen reader support.
- **Styling:** Matches existing form inputs (border, focus, error state) and is responsive (e.g. min height and font size on small screens to avoid zoom on iOS).

## Testing

- **Backend:** `backend/__tests__/auth.test.js` includes:
  - Successful registration with valid department (e.g. Computer Science).
  - 400 when department is missing, empty, or not in the allowed list.
- **Manual / E2E:** See `docs/DEPARTMENT_SELECTION_TEST_CASES.md` for a checklist covering both roles, all options, and edge cases.

## Consistency Checklist

When changing department options:

1. Update `frontend/src/constants/departments.js` (`DEPARTMENT_OPTIONS`).
2. Update `backend/config/constants.js` (`ALLOWED_DEPARTMENT_NAMES`).
3. Re-run backend auth tests and any E2E tests that depend on department list.
