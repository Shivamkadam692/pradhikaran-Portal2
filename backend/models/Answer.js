const mongoose = require('mongoose');
const { ANSWER_STATUS } = require('../config/constants');

const previousVersionSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    version: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    version: { type: Number, default: 1 },
    previousVersions: [previousVersionSchema],
    attachments: [{
      filename: { type: String, required: true },
      originalName: { type: String, required: true },
      mimeType: { type: String, required: true },
      size: { type: Number, required: true },
      uploadedAt: { type: Date, default: Date.now },
      path: { type: String, required: true }  // Path to the file in the file system
    }],
    status: {
      type: String,
      enum: Object.values(ANSWER_STATUS),
      default: ANSWER_STATUS.PENDING_REVIEW,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

answerSchema.index({ question: 1, department: 1 }, { unique: true });
answerSchema.index({ status: 1 });
answerSchema.index({ isDeleted: 1 });

module.exports = mongoose.model('Answer', answerSchema);
