const router = require('express').Router();
const { register, login, getMe, getUsers } = require('../controllers/auth.controller');
const { auth } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.get('/users', auth, getUsers);

module.exports = router;
