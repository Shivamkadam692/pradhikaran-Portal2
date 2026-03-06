const TimeWindow = require('../models/TimeWindow');

const list = async (req, res, next) => {
  try {
    const windows = await TimeWindow.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: windows });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { type, startDate, endDate } = req.body;
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }
    const tw = await TimeWindow.create({
      type,
      startDate,
      endDate,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: tw });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { startDate, endDate, isActive } = req.body;
    const tw = await TimeWindow.findById(req.params.id);
    if (!tw) {
      return res.status(404).json({ success: false, message: 'Time window not found' });
    }
    if (startDate) tw.startDate = startDate;
    if (endDate) tw.endDate = endDate;
    if (typeof isActive === 'boolean') tw.isActive = isActive;
    if (tw.endDate <= tw.startDate) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }
    await tw.save();
    res.json({ success: true, data: tw });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const tw = await TimeWindow.findByIdAndDelete(req.params.id);
    if (!tw) {
      return res.status(404).json({ success: false, message: 'Time window not found' });
    }
    res.json({ success: true, message: 'Time window deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, create, update, remove };
