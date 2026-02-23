const mongoose = require('mongoose');
const { QUESTION_STATUS, ROLES } = require('../config/constants');

const questionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerPradhikaran: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: Object.values(QUESTION_STATUS),
      default: QUESTION_STATUS.OPEN,
    },
    auditStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'forwarded'],
    },
    auditTrail: [
      {
        action: { type: String, enum: ['approved', 'rejected', 'forwarded', 'resubmitted'], required: true },
        auditor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String, trim: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    lastAuditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastAuditedAt: { type: Date },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    tags: [{ type: String, trim: true }],
    deadline: { type: Date },
    finalAnswer: { type: String },
    finalAnswerPublishedAt: { type: Date },
    classificationHistory: [
      {
        classifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        department: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        priority: {
          type: String,
          enum: ['low', 'medium', 'high', 'urgent'],
        },
        tags: [{ type: String, trim: true }],
        note: { type: String, trim: true },
        classifiedAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

questionSchema.index({ department: 1 });
questionSchema.index({ status: 1 });
questionSchema.index({ deadline: 1 });
questionSchema.index({ isDeleted: 1 });
questionSchema.index({ createdBy: 1 });
questionSchema.index({ ownerPradhikaran: 1 });
questionSchema.index({ auditStatus: 1 });

module.exports = mongoose.model('Question', questionSchema);
