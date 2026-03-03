const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/stats', (req, res, next) => {
  /* #swagger.tags = ['Report'] */
  reportController.getDashboardStats(req, res, next);
});

router.get('/evaluation/:evaluationId/result', (req, res, next) => {
  /* #swagger.tags = ['Report'] */
  reportController.getEvaluationResult(req, res, next);
});

module.exports = router;