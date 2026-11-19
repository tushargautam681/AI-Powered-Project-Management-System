const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const {
  getTasks, getTask, createTask, updateTask, deleteTask,
  updateTaskStatus, prioritizeTask, reprioritizeProject,
} = require('../controllers/task.controller');

router.use(auth);

router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', authorize('PROJECT_MANAGER'), createTask);
router.put('/:id', authorize('PROJECT_MANAGER', 'DEVELOPER'), updateTask);
router.delete('/:id', authorize('PROJECT_MANAGER'), deleteTask);
router.patch('/:id/status', authorize('PROJECT_MANAGER', 'DEVELOPER'), updateTaskStatus);
router.post('/:id/prioritize', authorize('PROJECT_MANAGER'), prioritizeTask);
router.post('/project/:id/reprioritize', authorize('PROJECT_MANAGER'), reprioritizeProject);

module.exports = router;
