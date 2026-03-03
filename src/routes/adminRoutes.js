const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRole('ADMIN'));

// User Management
router.get('/users', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.getUsers(req, res, next);
});

router.post('/users', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.createUser(req, res, next);
});

router.patch('/users/:id', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.updateUser(req, res, next);
});

router.delete('/users/:id', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.deleteUser(req, res, next);
});

router.get('/departments', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.getDepartments(req, res, next);
});

// Evaluation
router.get('/evaluations', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.getEvaluations(req, res, next);
});

router.post('/evaluations', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.createEvaluation(req, res, next);
});

router.get('/evaluations/:id', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.getEvaluationDetail(req, res, next);
});

router.patch('/evaluations/:id', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.updateEvaluation(req, res, next);
});

router.delete('/evaluations/:id', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.deleteEvaluation(req, res, next);
});

// Topic / Indicator
router.post('/evaluations/:evaluationId/topics', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.createTopic(req, res, next);
});

router.patch('/topics/:id', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.updateTopic(req, res, next);
});

router.delete('/topics/:id', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.deleteTopic(req, res, next);
});

router.post('/topics/:id/indicators', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.createIndicator(req, res, next);
});

router.patch('/indicators/:id', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.updateIndicator(req, res, next);
});

router.delete('/indicators/:id', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.deleteIndicator(req, res, next);
});

// Assignment
router.get('/evaluations/:evaluationId/assignments', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.getAssignments(req, res, next);
});

router.post('/assignments', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.createAssignment(req, res, next);
});

router.delete('/assignments/:id', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.deleteAssignment(req, res, next);
});

router.get('/assignments/:id/results', (req, res, next) => {
  /* #swagger.tags = ['Admin'] */
  adminController.getAssignmentResults(req, res, next);
});

module.exports = router;