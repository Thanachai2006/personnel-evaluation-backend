const prisma = require('../config/prisma');

const getAssignedEvaluations = async (req, res) => {
  try {
    const evaluatorId = req.user.userId;
    const assignments = await prisma.assignment.findMany({
      where: { 
        evaluatorId,
        evaluation: {
          status: 'OPEN'
        }
      },
      select: {
        evaluation: {
          select: { id: true, name: true, startAt: true, endAt: true, status: true },
        },
      },
      distinct: ['evaluationId'],
    });

    const evaluations = assignments.map(a => a.evaluation);
    res.json(evaluations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getEvaluatorAssignments = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const evaluatorId = req.user.userId;

    const assignments = await prisma.assignment.findMany({
      where: {
        evaluationId: parseInt(evaluationId),
        evaluatorId: evaluatorId,
      },
      include: {
        evaluatee: {
          select: { id: true, name: true, email: true, department: true },
        },
        evaluation: {
          include: {
            topics: {
              include: {
                indicators: true,
              },
            },
          },
        },
      },
    });

    const formattedAssignments = await Promise.all(assignments.map(async (a) => {
      let scoredCount = 0;
      let totalIndicators = 0;

      const evaluationWithEvidence = { ...a.evaluation };
      evaluationWithEvidence.topics = await Promise.all(evaluationWithEvidence.topics.map(async (t) => {
        const indicatorsWithEvidence = await Promise.all(t.indicators.map(async (i) => {
          totalIndicators++;
          
          const result = await prisma.evaluationResult.findFirst({
            where: { assignmentId: a.id, indicatorId: i.id }
          });
          if (result) scoredCount++;

          const evidence = await prisma.evidence.findUnique({
            where: { indicatorId_evaluateeId: { indicatorId: i.id, evaluateeId: a.evaluateeId } },
          });
          return { ...i, evidence };
        }));
        return { ...t, indicators: indicatorsWithEvidence };
      }));
      return { 
        ...a, 
        evaluation: evaluationWithEvidence,
        progress: {
          scoredCount,
          totalIndicators,
          isCompleted: totalIndicators > 0 && scoredCount === totalIndicators
        }
      };
    }));

    res.json(formattedAssignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const evaluatorId = req.user.userId;

    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) },
      include: {
        evaluatee: {
          select: { id: true, name: true, email: true, department: true },
        },
        evaluation: {
          include: {
            topics: {
              include: {
                indicators: {
                  include: {
                    results: { where: { assignmentId: parseInt(id) } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!assignment || (
      assignment.evaluatorId !== evaluatorId && 
      assignment.evaluateeId !== req.user.userId && 
      req.user.role !== 'ADMIN'
    )) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const evaluationWithEvidence = { ...assignment.evaluation };
    evaluationWithEvidence.topics = await Promise.all(evaluationWithEvidence.topics.map(async (t) => {
      const indicatorsWithEvidence = await Promise.all(t.indicators.map(async (i) => {
        const evidence = await prisma.evidence.findUnique({
          where: { indicatorId_evaluateeId: { indicatorId: i.id, evaluateeId: assignment.evaluateeId } },
        });
        return { ...i, evidence };
      }));
      return { ...t, indicators: indicatorsWithEvidence };
    }));

    res.json({ ...assignment, evaluation: evaluationWithEvidence });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const submitScore = async (req, res) => {
  try {
    const { id: assignmentId } = req.params;
    const { indicatorId, score } = req.body;
    const evaluatorId = req.user.userId;

    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(assignmentId) },
    });

    if (!assignment || assignment.evaluatorId !== evaluatorId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await prisma.evaluationResult.findFirst({
      where: {
        assignmentId: parseInt(assignmentId),
        indicatorId: parseInt(indicatorId),
      },
    });

    if (result) {
      await prisma.evaluationResult.update({
        where: { id: result.id },
        data: { score: parseInt(score) },
      });
    } else {
      await prisma.evaluationResult.create({
        data: {
          assignmentId: parseInt(assignmentId),
          indicatorId: parseInt(indicatorId),
          score: parseInt(score),
        },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAssignmentResults = async (req, res) => {
  try {
    const { id } = req.params;
    const evaluatorId = req.user.userId;

    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) },
      include: {
        evaluation: {
          include: {
            topics: {
              include: {
                indicators: {
                  include: {
                    results: { where: { assignmentId: parseInt(id) } }
                  }
                }
              }
            }
          }
        },
        evaluator: { select: { name: true } },
        evaluatee: { select: { name: true, id: true } },
      }
    });

    if (!assignment || (
      assignment.evaluatorId !== evaluatorId && 
      assignment.evaluateeId !== req.user.userId && 
      req.user.role !== 'ADMIN'
    )) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const evaluateeId = assignment.evaluatee.id;
    const resolvedTopics = await Promise.all(assignment.evaluation.topics.map(async topic => {
      const resolvedIndicators = await Promise.all(topic.indicators.map(async indicator => {
        const evidence = await prisma.evidence.findUnique({
          where: { indicatorId_evaluateeId: { indicatorId: indicator.id, evaluateeId } }
        });
        return {
          ...indicator,
          evidence,
          result: indicator.results[0] || null
        };
      }));
      return { ...topic, indicators: resolvedIndicators };
    }));

    res.json({
      evaluationName: assignment.evaluation.name,
      evaluatorName: assignment.evaluator.name,
      evaluateeName: assignment.evaluatee.name,
      topics: resolvedTopics
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getAssignedEvaluations,
  getEvaluatorAssignments,
  getAssignmentById,
  submitScore,
  getAssignmentResults,
};
