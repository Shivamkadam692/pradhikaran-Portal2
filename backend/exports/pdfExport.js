const PDFDocument = require('pdfkit');
const { Question, Answer, User } = require('../models');

const buildQuestionPdf = async (questionId) => {
  const question = await Question.findOne({
    _id: questionId,
    isDeleted: { $ne: true },
  })
    .populate('department', 'name email departmentName')
    .populate('createdBy', 'name email')
    .lean();
  if (!question) return null;

  const answers = await Answer.find({
    question: questionId,
    isDeleted: { $ne: true },
  })
    .populate('department', 'name departmentName')
    .sort({ createdAt: -1 })
    .lean();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('Question Export', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Title: ${question.title}`);
    doc.text(`Description: ${question.description}`);
    doc.text(`Department: ${question.department?.departmentName || question.department?.name || 'N/A'}`);
    doc.text(`Status: ${question.status}`);
    doc.text(`Created: ${question.createdAt}`);
    if (question.finalAnswer) {
      doc.moveDown();
      doc.text('Final Answer:', { underline: true });
      doc.text(question.finalAnswer);
      doc.text(`Published: ${question.finalAnswerPublishedAt}`);
    }
    doc.moveDown(2);
    doc.text('Submissions:', { underline: true });
    answers.forEach((a, i) => {
      doc.moveDown();
      doc.text(`${i + 1}. ${a.department?.departmentName || a.department?.name || 'N/A'} (v${a.version}) - ${a.status}`);
      doc.text(a.content.substring(0, 500) + (a.content.length > 500 ? '...' : ''));
    });
    doc.end();
  });
};

const buildDepartmentPdf = async (userId) => {
  const user = await User.findOne({
    _id: userId,
    role: 'DEPARTMENT',
    isDeleted: { $ne: true },
  }).lean();
  if (!user) return null;

  const questions = await Question.find({
    department: userId,
    isDeleted: { $ne: true },
  })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  const answers = await Answer.find({
    department: userId,
    isDeleted: { $ne: true },
  })
    .populate('question', 'title status')
    .lean();
  const answerByQuestion = {};
  answers.forEach((a) => {
    answerByQuestion[a.question._id.toString()] = a;
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(18).text('Department Export', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Name: ${user.name}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Department: ${user.departmentName || 'N/A'}`);
    doc.moveDown(2);
    doc.text('Assigned Questions & Submissions:', { underline: true });
    questions.forEach((q, i) => {
      const ans = answerByQuestion[q._id.toString()];
      doc.moveDown();
      doc.text(`${i + 1}. ${q.title} (${q.status})`);
      if (ans) {
        doc.text(`   Your submission (v${ans.version}): ${ans.status}`);
        doc.text(`   Content: ${ans.content.substring(0, 300)}${ans.content.length > 300 ? '...' : ''}`);
      } else {
        doc.text('   No submission yet.');
      }
    });
    doc.end();
  });
};

module.exports = { buildQuestionPdf, buildDepartmentPdf };
