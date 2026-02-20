const ActivityLog = require('../models/ActivityLog');
const { ROLES, ACTIVITY_ACTIONS, ACTIVITY_STATUS } = require('../config/constants');

const list = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const query = {};
    if (req.query.userId) query.user = req.query.userId;
    if (req.query.action) query.action = req.query.action;
    if (req.query.entityType) query.entityType = req.query.entityType;

    const [logs, total] = await Promise.all([
      ActivityLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).populate('user', 'name email role').lean(),
      ActivityLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { logs, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

function buildMineQuery(req) {
  const query = { user: req.user._id };

  const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim() : '';
  if (keyword) {
    const re = new RegExp(escapeRegex(keyword), 'i');
    query.$or = [
      { 'metadata.title': re },
      { action: re },
      { entityType: re },
      { 'metadata.email': re },
    ];
  }

  if (req.query.action) {
    const actions = req.query.action.split(',').map((a) => a.trim()).filter(Boolean);
    if (actions.length) query.action = actions.length === 1 ? actions[0] : { $in: actions };
  }
  if (req.query.status) {
    if (req.query.status === ACTIVITY_STATUS.SUCCESS) {
      query.$and = query.$and || [];
      query.$and.push({ $or: [{ status: ACTIVITY_STATUS.SUCCESS }, { status: { $exists: false } }] });
    } else {
      query.status = req.query.status;
    }
  }
  if (req.query.entityType) query.entityType = req.query.entityType;

  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom) : null;
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo) : null;
  if ((dateFrom && !isNaN(dateFrom.getTime())) || (dateTo && !isNaN(dateTo.getTime()))) {
    query.timestamp = {};
    if (dateFrom && !isNaN(dateFrom.getTime())) query.timestamp.$gte = dateFrom;
    if (dateTo && !isNaN(dateTo.getTime())) query.timestamp.$lte = dateTo;
  }

  return query;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const listMine = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const query = buildMineQuery(req);

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email role departmentName')
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: { logs, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

const EXPORT_MAX = 5000;

const exportMine = async (req, res, next) => {
  try {
    const query = buildMineQuery(req);
    const format = (req.query.format || 'json').toLowerCase();
    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(EXPORT_MAX)
      .populate('user', 'name email role departmentName')
      .lean();

    if (format === 'csv') {
      const header = 'Timestamp,Action,Entity Type,Entity ID,Status,User,Metadata';
      const rows = logs.map((log) => {
        const meta = typeof log.metadata === 'object' ? JSON.stringify(log.metadata).replace(/"/g, '""') : '';
        const userStr = log.user ? (log.user.name || '') : '';
        return [
          log.timestamp ? new Date(log.timestamp).toISOString() : '',
          log.action || '',
          log.entityType || '',
          (log.entityId && log.entityId.toString()) || '',
          log.status || 'success',
          userStr,
          `"${meta}"`,
        ].join(',');
      });
      const csv = [header, ...rows].join('\r\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="history-${Date.now()}.csv"`);
      return res.send('\uFEFF' + csv);
    }

    res.json({
      success: true,
      data: { logs, exported: logs.length },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { list, listMine, exportMine };
