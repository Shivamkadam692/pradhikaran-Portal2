const { buildQuestionPdf, buildDepartmentPdf, buildR1Pdf, buildR2Pdf, buildR3Pdf, buildR4Pdf } = require('../exports/pdfExport');
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

const exportR1 = async (req, res, next) => {
  try {
    const buffer = await buildR1Pdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-R1-${Date.now()}.pdf`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const exportR2 = async (req, res, next) => {
  try {
    const buffer = await buildR2Pdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-R2-${Date.now()}.pdf`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const exportR3 = async (req, res, next) => {
  try {
    const buffer = await buildR3Pdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-R3-${Date.now()}.pdf`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

const exportR4 = async (req, res, next) => {
  try {
    const buffer = await buildR4Pdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-R4-${Date.now()}.pdf`);
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { exportQuestion, exportDepartment, exportR1, exportR2, exportR3, exportR4 };


