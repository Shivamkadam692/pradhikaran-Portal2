const Report = require('../models/Report');
const { ROLES } = require('../config/constants');

const listReports = async (req, res, next) => {
  try {
    const reports = await Report.find()
      .select('-pdfBuffer')
      .populate('sentBy', 'name email')
      .sort({ sentAt: -1 })
      .lean();
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
};

const downloadReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).lean();
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${report.reportType}-report-${report.sentAt.toISOString().slice(0, 10)}.pdf`
    );
    res.send(report.pdfBuffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { listReports, downloadReport };
