const router = require('express').Router();
const { auth } = require('../middleware/auth.middleware');
const {
  getProjectAnalytics, getWorkloadAnalytics, getPriorityAnalytics, getDashboardStats,
} = require('../controllers/analytics.controller');

router.use(auth);

router.get('/dashboard', getDashboardStats);
router.get('/project/:id', getProjectAnalytics);
router.get('/workload', getWorkloadAnalytics);
router.get('/priorities', getPriorityAnalytics);

module.exports = router;
