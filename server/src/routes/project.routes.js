const router = require('express').Router();
const { auth, authorize } = require('../middleware/auth.middleware');
const {
  getProjects, getProject, createProject, updateProject, deleteProject,
  addMember, removeMember,
} = require('../controllers/project.controller');

router.use(auth); // All project routes require auth

router.get('/', getProjects);
router.get('/:id', getProject);
router.post('/', authorize('PROJECT_MANAGER'), createProject);
router.put('/:id', authorize('PROJECT_MANAGER'), updateProject);
router.delete('/:id', authorize('PROJECT_MANAGER'), deleteProject);
router.post('/:id/members', authorize('PROJECT_MANAGER'), addMember);
router.delete('/:id/members/:userId', authorize('PROJECT_MANAGER'), removeMember);

module.exports = router;
