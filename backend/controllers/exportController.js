const { buildQuestionPdf, buildDepartmentPdf } = require('../exports/pdfExport');
const { ROLES } = require('../config/constants');

const exportQuestion = async (req, res, next) => {
  try {
    const buffer = await buildQuestionPdf(req.params.id);
    if (!buffer) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=question-${req.params.id}.pdf`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const exportDepartment = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    if (req.user.role === ROLES.DEPARTMENT && req.user._id.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const buffer = await buildDepartmentPdf(userId);
    if (!buffer) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=department-${userId}.pdf`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { exportQuestion, exportDepartment };
