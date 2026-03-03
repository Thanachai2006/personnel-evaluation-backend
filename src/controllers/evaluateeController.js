const prisma = require('../config/prisma');

const getEvaluationsForMe = async (req, res) => {
  try {
    const evaluateeId = req.user.userId;
    const assignments = await prisma.assignment.findMany({
      where: { evaluateeId },
      include: {
        evaluation: {
          include: {
            topics: {
              include: {
                indicators: {
                  include: {
                    results: {
                      where: { assignmentId: { in: (await prisma.assignment.findMany({ where: { evaluateeId }, select: { id: true } })).map(a => a.id) } },
                    },
                    evidences: {
                      where: { evaluateeId },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const uploadEvidence = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const { indicatorId } = req.body;
    const evaluateeId = req.user.userId;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const indicator = await prisma.indicator.findUnique({
      where: { id: parseInt(indicatorId) },
    });

    if (!indicator) {
      return res.status(404).json({ message: 'Indicator not found' });
    }

    if (!indicator.requireEvidence) {
      // PDF says requireEvidence = true -> must attach file. 
      // It doesn't explicitly say we CAN'T upload if not required, 
      // but usually, we follow the requirement.
    }

    const evidence = await prisma.evidence.upsert({
      where: {
        indicatorId_evaluateeId: {
          indicatorId: parseInt(indicatorId),
          evaluateeId: evaluateeId,
        },
      },
      update: {
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      },
      create: {
        indicatorId: parseInt(indicatorId),
        evaluateeId: evaluateeId,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        sizeBytes: req.file.size,
      },
    });

    res.status(201).json(evidence);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getEvaluationsForMe,
  uploadEvidence,
};
