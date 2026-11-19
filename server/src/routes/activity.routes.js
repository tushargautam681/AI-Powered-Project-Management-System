const router = require('express').Router();
const { auth } = require('../middleware/auth.middleware');
const Activity = require('../models/Activity');

// GET /api/activities?project=xxx&limit=20
router.get('/', auth, async (req, res, next) => {
  try {
    const { project, limit = 20 } = req.query;
    const query = {};
    if (project) query.project = project;

    const activities = await Activity.find(query)
      .populate('user', 'name email avatar')
      .populate('project', 'name')
      .populate('task', 'title')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
