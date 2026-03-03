const express = require('express');
const multer = require('multer');
const path = require('path');
const evaluateeController = require('../controllers/evaluateeController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.originalname.match(/\.(exe)$/)) {
    return cb(new Error('EXE files are not allowed'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.use(authenticateToken);
router.use(authorizeRole('EVALUATEE', 'ADMIN', 'EVALUATOR'));

router.get('/evaluations', (req, res, next) => {
  /* #swagger.tags = ['Evaluatee'] */
  evaluateeController.getEvaluationsForMe(req, res, next);
});

router.post('/evaluations/:evaluationId/evidence', upload.single('file'), (req, res, next) => {
  /* #swagger.tags = ['Evaluatee'] */
  if (req.fileError) {
    return res.status(415).json({ message: req.fileError });
  }
  next();
}, evaluateeController.uploadEvidence);

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File too large (Max 10MB)' });
    }
  }
  if (err.message === 'EXE files are not allowed') {
    return res.status(415).json({ message: err.message });
  }
  res.status(500).json({ message: err.message });
});

module.exports = router;