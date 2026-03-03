const express = require('express');
const { register, login, getMe, getDepartments } = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/departments', (req, res, next) => {
  /* #swagger.tags = ['Auth'] */
  getDepartments(req, res, next);
});

router.post('/register', (req, res, next) => {
  /* #swagger.tags = ['Auth'] */
  register(req, res, next);
});

router.post('/login', (req, res, next) => {
  /* #swagger.tags = ['Auth'] */
  login(req, res, next);
});

router.get('/me', authenticateToken, (req, res, next) => {
  /* #swagger.tags = ['Auth'] */
  getMe(req, res, next);
});

module.exports = router;
