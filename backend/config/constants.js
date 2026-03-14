const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PRADHIKARAN: 'PRADHIKARAN',
  DEPARTMENT: 'DEPARTMENT',
  SENATE: 'SENATE',
  AUDITOR: 'AUDITOR',
};

const QUESTION_STATUS = {
  OPEN: 'open',
  LOCKED: 'locked',
  FINALIZED: 'finalized',
};

const ANSWER_STATUS = {
  PENDING_REVIEW: 'pending_review',
  UPDATE_REQUESTED: 'update_requested',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
};

const REGISTRATION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

/** Department options used in registration and question assignment (must match frontend) */
const ALLOWED_DEPARTMENT_NAMES = [
  'Affiliation dept',
  'Dean Department',
  'VC Office',
  'PVC Office',
  'Exam Department',
  'Accounts Departments',
  'NSS Department',
  'Registrar Office',
  'Student Development',
  'Engineering Dept',
  'Hingoli',
  'Parbhani',
  'Latur',
  'Kinwat',
  'Other',
];

const ACTIVITY_ACTIONS = {
  QUESTION_CREATED: 'question_created',
  QUESTION_UPDATED: 'question_updated',
  QUESTION_LOCKED: 'question_locked',
  QUESTION_FINALIZED: 'question_finalized',
  QUESTION_DELETED: 'question_deleted',
  ANSWER_SUBMITTED: 'answer_submitted',
  ANSWER_ACCEPTED: 'answer_accepted',
  ANSWER_REJECTED: 'answer_rejected',
  UPDATE_REQUESTED: 'update_requested',
  FINAL_ANSWER_PUBLISHED: 'final_answer_published',
  FINAL_ANSWER_VIEWED: 'final_answer_viewed',
  REGISTRATION_APPROVED: 'registration_approved',
  REGISTRATION_REJECTED: 'registration_rejected',
  USER_CREATED: 'user_created',
  AUDIT_APPROVED: 'audit_approved',
  AUDIT_REJECTED: 'audit_rejected',
  AUDIT_FORWARDED: 'audit_forwarded',
  AUDIT_RESUBMITTED: 'audit_resubmitted',
};

const ACTIVITY_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING: 'pending',
};

module.exports = {
  ROLES,
  QUESTION_STATUS,
  ANSWER_STATUS,
  REGISTRATION_STATUS,
  ACTIVITY_ACTIONS,
  ACTIVITY_STATUS,
  ALLOWED_DEPARTMENT_NAMES,
};
