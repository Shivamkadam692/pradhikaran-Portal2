# Department Selection – Test Cases

Use this checklist to verify department dropdown behavior in both **Department registration** and **Pradhikaran create-question** flows.

---

## 1. Department role – Registration form

### 1.1 Dropdown content and layout

- [ ] **TC-DR-1** Dropdown is labeled **"Department"** with a visible required indicator (e.g. asterisk).
- [ ] **TC-DR-2** Placeholder is “Select department” (or equivalent).
- [ ] **TC-DR-3** All six options appear in the list:
  - Computer Science  
  - Physical Science  
  - Chemical Science  
  - Mathematics and Statistics  
  - Pharmacy  
  - Language  

### 1.2 Validation and errors

- [ ] **TC-DR-4** Submitting without selecting a department shows an error (e.g. “Please select a department”) and does not submit.
- [ ] **TC-DR-5** After selecting a department, the previous “no department” error clears (if it was shown).
- [ ] **TC-DR-6** Submitting with a selected department succeeds (201) and the success view is shown.
- [ ] **TC-DR-7** In the database (or via API), the created user has `departmentName` equal to the selected option (e.g. “Computer Science”).

### 1.3 Submission with each department

Submit the registration form once per option and confirm the stored `departmentName`:

- [ ] **TC-DR-8** Computer Science
- [ ] **TC-DR-9** Physical Science
- [ ] **TC-DR-10** Chemical Science
- [ ] **TC-DR-11** Mathematics and Statistics
- [ ] **TC-DR-12** Pharmacy
- [ ] **TC-DR-13** Language

### 1.4 Accessibility and responsiveness

- [ ] **TC-DR-14** Keyboard: Tab to the dropdown, open with Enter/Space, move with arrow keys, select with Enter.
- [ ] **TC-DR-15** Screen reader: Label “Department” is announced and required state is indicated.
- [ ] **TC-DR-16** On a narrow viewport (e.g. 480px), dropdown remains usable and readable (no unintended zoom if applicable).

---

## 2. Pradhikaran role – Create question form

### 2.1 Dropdown content and layout

- [ ] **TC-PQ-1** Dropdown is present in the “New Question” / create form and labeled (e.g. “Assign to Department”).
- [ ] **TC-PQ-2** Same six department options as in registration (Computer Science through Language).
- [ ] **TC-PQ-3** Department field is positioned clearly (e.g. after Title and Description, before Deadline).

### 2.2 Validation and assignment

- [ ] **TC-PQ-4** Submitting without selecting a department shows an error (e.g. “Please select a department to assign this question to”) and does not create a question.
- [ ] **TC-PQ-5** Selecting a department that has at least one **approved** department user allows submit; question is created and linked to that department (user).
- [ ] **TC-PQ-6** Selecting a department that has **no** approved user shows an error (e.g. no approved department user for that department) and does not create a question.
- [ ] **TC-PQ-7** After a successful create, the new question appears in the list and displays the correct department (name or assigned user).

### 2.3 Submission with each department (when users exist)

For each department that has an approved department user, create a question and verify:

- [ ] **TC-PQ-8** Computer Science
- [ ] **TC-PQ-9** Physical Science
- [ ] **TC-PQ-10** Chemical Science
- [ ] **TC-PQ-11** Mathematics and Statistics
- [ ] **TC-PQ-12** Pharmacy
- [ ] **TC-PQ-13** Language

### 2.4 Data and consistency

- [ ] **TC-PQ-14** Created question has `department` set to the ID of an approved user whose `departmentName` (or `name`) matches the selected option.
- [ ] **TC-PQ-15** Department dropdown styling and behavior match the registration form (same component/design system).

### 2.5 Accessibility and responsiveness

- [ ] **TC-PQ-16** Keyboard navigation and screen reader behavior match registration (label, required, options).
- [ ] **TC-PQ-17** Create form and dropdown behave correctly on different screen sizes.

---

## 3. Edge cases and cross-role

- [ ] **TC-EC-1** Registration: backend rejects request with empty or invalid `departmentName` (e.g. 400 with a clear message).
- [ ] **TC-EC-2** Registration: backend accepts only the exact allowed department names (e.g. “Computer Science” accepted; “computer science” or “Engineering” rejected if not in the list).
- [ ] **TC-EC-3** Pradhikaran: If multiple approved users share the same department name, question is assigned to one of them (e.g. first match); no duplicate or wrong assignment.
- [ ] **TC-EC-4** After creating a question, the department dropdown resets when the form is closed or after a successful submit.

---

## 4. Backend automated tests

- [ ] **TC-BE-1** Run `backend/__tests__/auth.test.js`: all tests pass, including:
  - Register with valid department (e.g. Computer Science).
  - Reject when department is missing.
  - Reject when department is empty/whitespace.
  - Reject when department is not in the allowed list (e.g. “Engineering”).

---

## Summary

- **Department role:** 16 test cases (dropdown, validation, each option, a11y, responsiveness).
- **Pradhikaran role:** 14 test cases (dropdown, validation, each option, data, a11y, responsiveness).
- **Edge cases:** 4; **Backend:** 1 checklist item (multiple assertions in one test file).

Total: 35 checklist items covering all department options and the main edge cases for both roles.
