const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

// User Management
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { department: true },
      orderBy: { id: 'asc' }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, departmentId } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password || 'password123', 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        departmentId: departmentId ? parseInt(departmentId) : null,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, departmentId, password } = req.body;

    const updateData = {
      name,
      email,
      role,
      departmentId: departmentId ? parseInt(departmentId) : null,
    };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if user is being used in assignments
    const assignmentsCount = await prisma.assignment.count({
      where: {
        OR: [
          { evaluatorId: parseInt(id) },
          { evaluateeId: parseInt(id) }
        ]
      }
    });

    if (assignmentsCount > 0) {
      return res.status(400).json({ message: 'Cannot delete user as they have active evaluation assignments' });
    }

    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany();
    res.json(departments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Evaluation
const createEvaluation = async (req, res) => {
  try {
    const { name, startAt, endAt, status } = req.body;
    const creatorId = req.user.userId; // Get from JWT token
    const evaluation = await prisma.evaluation.create({
      data: {
        name,
        startAt: new Date(startAt),
        endAt: new Date(endAt),
        status: status || 'DRAFT',
        creatorId,
      },
    });
    res.status(201).json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getEvaluations = async (req, res) => {
  try {
    const evaluations = await prisma.evaluation.findMany({
      include: {
        creator: { select: { name: true } },
        topics: {
          include: {
            indicators: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(evaluations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startAt, endAt, status } = req.body;
    const evaluation = await prisma.evaluation.update({
      where: { id: parseInt(id) },
      data: {
        name,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
        status,
      },
    });
    res.json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteEvaluation = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.evaluation.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getEvaluationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Fetching evaluation detail for ID:', id);
    
    const evaluation = await prisma.evaluation.findUnique({
      where: { id: parseInt(id) },
      include: {
        topics: {
          include: {
            indicators: true,
          },
        },
      },
    });
    
    if (!evaluation) {
      console.log('Evaluation not found in DB for ID:', id);
      return res.status(404).json({ message: 'Evaluation not found' });
    }
    
    console.log('Evaluation found:', evaluation.name);
    res.json(evaluation);
  } catch (error) {
    console.error('Error fetching evaluation detail:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Topic
const createTopic = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    const { name } = req.body;
    const topic = await prisma.topic.create({
      data: {
        name,
        evaluationId: parseInt(evaluationId),
      },
    });
    res.status(201).json(topic);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const topic = await prisma.topic.update({
      where: { id: parseInt(id) },
      data: { name },
    });
    res.json(topic);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.topic.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Indicator
const createIndicator = async (req, res) => {
  try {
    const { id: topicId } = req.params;
    const { name, type, weight, requireEvidence } = req.body;

    const topic = await prisma.topic.findUnique({
      where: { id: parseInt(topicId) },
      include: { evaluation: { include: { topics: { include: { indicators: true } } } } },
    });

    if (!topic) return res.status(404).json({ message: 'Topic not found' });

    // Check weight sum
    let totalWeight = 0;
    topic.evaluation.topics.forEach(t => {
      t.indicators.forEach(i => {
        totalWeight += i.weight;
      });
    });

    if (totalWeight + weight > 100) {
      return res.status(400).json({ message: 'Total weight of indicators in an evaluation must be exactly 100%. Cannot exceed 100%.' });
    }

    const indicator = await prisma.indicator.create({
      data: {
        name,
        type,
        weight,
        requireEvidence: !!requireEvidence,
        topicId: parseInt(topicId),
      },
    });
    res.status(201).json(indicator);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const updateIndicator = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, weight, requireEvidence } = req.body;

    const currentIndicator = await prisma.indicator.findUnique({
      where: { id: parseInt(id) },
      include: { topic: { include: { evaluation: { include: { topics: { include: { indicators: true } } } } } } },
    });

    if (!currentIndicator) return res.status(404).json({ message: 'Indicator not found' });

    if (weight !== undefined) {
      let totalWeight = 0;
      currentIndicator.topic.evaluation.topics.forEach(t => {
        t.indicators.forEach(i => {
          if (i.id !== parseInt(id)) {
            totalWeight += i.weight;
          }
        });
      });

      if (totalWeight + weight > 100) {
        return res.status(400).json({ message: 'Total weight cannot exceed 100%' });
      }
    }

    const indicator = await prisma.indicator.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        weight,
        requireEvidence,
      },
    });
    res.json(indicator);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteIndicator = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.indicator.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Assignment
const getAssignments = async (req, res) => {
  try {
    const { evaluationId } = req.params;
    console.log('Fetching assignments for Evaluation ID:', evaluationId);
    
    const assignments = await prisma.assignment.findMany({
      where: { evaluationId: parseInt(evaluationId) },
      include: {
        evaluator: { select: { name: true, email: true } },
        evaluatee: { select: { name: true, email: true } },
        // include results so we can determine status without additional queries
        results: {
          select: { id: true },
        },
      },
    });

    // derive a simple flag indicating whether any evaluation result exists
    const formatted = assignments.map(a => ({
      ...a,
      isEvaluated: Array.isArray(a.results) && a.results.length > 0,
    }));

    // strip the results array from response if we don't need it on client
    const payload = formatted.map(({ results, ...rest }) => rest);
    res.json(payload);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { evaluationId, evaluatorId, evaluateeId } = req.body;

    if (evaluatorId === evaluateeId) {
      return res.status(400).json({ message: 'evaluatorId ≠ evaluateeId' });
    }

    const existingAssignment = await prisma.assignment.findUnique({
      where: {
        evaluationId_evaluatorId_evaluateeId: {
          evaluationId: parseInt(evaluationId),
          evaluatorId: parseInt(evaluatorId),
          evaluateeId: parseInt(evaluateeId),
        },
      },
    });

    if (existingAssignment) {
      return res.status(409).json({ message: 'DUPLICATE_ASSIGNMENT' });
    }

    const assignment = await prisma.assignment.create({
      data: {
        evaluationId: parseInt(evaluationId),
        evaluatorId: parseInt(evaluatorId),
        evaluateeId: parseInt(evaluateeId),
      },
    });
    res.status(201).json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.assignment.delete({ where: { id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getAssignmentResults = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await prisma.assignment.findUnique({
      where: { id: parseInt(id) },
      include: {
        evaluation: {
          include: {
            topics: {
              include: {
                indicators: {
                  include: {
                    results: { where: { assignmentId: parseInt(id) } },
                    evidences: { where: { evaluateeId: { equals: prisma.evaluateeId } } } // Placeholder, logic handled below
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

    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });

    // Correctly map evidences to the evaluatee of this assignment
    const evaluateeId = assignment.evaluatee.id;
    const results = assignment.evaluation.topics.map(topic => ({
      ...topic,
      indicators: topic.indicators.map(indicator => {
        // Find evidence for this indicator and this evaluatee
        return prisma.evidence.findUnique({
          where: { indicatorId_evaluateeId: { indicatorId: indicator.id, evaluateeId } }
        }).then(evidence => ({
          ...indicator,
          evidence,
          result: indicator.results[0] || null
        }));
      })
    }));

    // Since we used .then for evidence, we need to wait for all
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
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getDepartments,
  createEvaluation,
  getEvaluations,
  updateEvaluation,
  deleteEvaluation,
  getEvaluationDetail,
  createTopic,
  updateTopic,
  deleteTopic,
  createIndicator,
  updateIndicator,
  deleteIndicator,
  getAssignments,
  createAssignment,
  deleteAssignment,
  getAssignmentResults,
};
