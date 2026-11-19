const router = require('express').Router();
const { auth } = require('../middleware/auth.middleware');
const { analyzeTask, breakdownTask, explainPriority, getAIStatus } = require('../controllers/ai.controller');

router.use(auth);

router.post('/analyze-task', analyzeTask);
router.post('/breakdown-task', breakdownTask);
router.post('/explain-priority', explainPriority);
router.get('/status', getAIStatus);

module.exports = router;
