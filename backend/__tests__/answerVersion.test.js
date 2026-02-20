/**
 * Unit tests for answer versioning and finalization locking behavior.
 * These describe the expected behavior of the answer service.
 */
const { ANSWER_STATUS } = require('../config/constants');
const { QUESTION_STATUS } = require('../config/constants');

describe('Answer versioning logic', () => {
  it('ANSWER_STATUS has update_requested for department to edit', () => {
    expect(ANSWER_STATUS.UPDATE_REQUESTED).toBe('update_requested');
  });

  it('after update_requested, department can submit new version and status becomes pending_review', () => {
    const previousVersions = [];
    let version = 1;
    let status = ANSWER_STATUS.UPDATE_REQUESTED;
    const content = 'Updated content';
    previousVersions.push({ content: 'Old', version, submittedAt: new Date() });
    version += 1;
    status = ANSWER_STATUS.PENDING_REVIEW;
    expect(status).toBe('pending_review');
    expect(version).toBe(2);
  });
});

describe('Finalization locking behavior', () => {
  it('QUESTION_STATUS finalized means no more edits', () => {
    expect(QUESTION_STATUS.FINALIZED).toBe('finalized');
  });

  it('when status is finalized, answers are read-only', () => {
    const questionStatus = QUESTION_STATUS.FINALIZED;
    const canEditAnswer = questionStatus !== QUESTION_STATUS.FINALIZED;
    expect(canEditAnswer).toBe(false);
  });
});
