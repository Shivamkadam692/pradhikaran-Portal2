/**
 * Action type groups for History filters (create / update / delete).
 * Values are backend ACTIVITY_ACTIONS.
 */
export const ACTION_TYPE_GROUPS = {
  create: [
    'question_created',
    'answer_submitted',
    'user_created',
  ],
  update: [
    'question_updated',
    'question_locked',
    'question_finalized',
    'answer_accepted',
    'answer_rejected',
    'update_requested',
    'final_answer_published',
    'registration_approved',
    'registration_rejected',
  ],
  delete: ['question_deleted'],
  view: [], // reserved for future view-action logging
};

export const ACTION_LABELS = {
  question_created: 'Created question',
  question_updated: 'Updated question',
  question_locked: 'Locked question',
  question_finalized: 'Finalized question',
  question_deleted: 'Deleted question',
  answer_submitted: 'Submitted answer',
  answer_accepted: 'Accepted answer',
  answer_rejected: 'Rejected answer',
  update_requested: 'Requested update',
  final_answer_published: 'Published final answer',
  registration_approved: 'Approved registration',
  registration_rejected: 'Rejected registration',
  user_created: 'Created user',
};

export const DATE_PRESETS = {
  today: 'Today',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  custom: 'Custom range',
};

export const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
];

export const ACTION_TYPE_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'create', label: 'Create' },
  { value: 'update', label: 'Update' },
  { value: 'delete', label: 'Delete' },
  { value: 'view', label: 'View' },
];
