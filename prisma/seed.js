const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  console.log('Cleaning up database...');
  await prisma.evaluationResult.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.indicator.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  console.log('Seeding new data...');

  // Departments
  const hr = await prisma.department.create({ data: { name: 'Human Resources' } });
  const it = await prisma.department.create({ data: { name: 'Information Technology' } });
  const marketing = await prisma.department.create({ data: { name: 'Marketing' } });
  const finance = await prisma.department.create({ data: { name: 'Finance' } });

  // Users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin System',
      email: 'admin@example.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const evaluator = await prisma.user.create({
    data: {
      name: 'Evaluator User (HR Manager)',
      email: 'evaluator@example.com',
      passwordHash,
      role: 'EVALUATOR',
      departmentId: hr.id,
    },
  });

  const evaluatee = await prisma.user.create({
    data: {
      name: 'Evaluatee User (IT Developer)',
      email: 'evaluatee@example.com',
      passwordHash,
      role: 'EVALUATEE',
      departmentId: it.id,
    },
  });

  // Additional Evaluatees for more variety
  const dev2 = await prisma.user.create({
    data: {
      name: 'Jane Doe (Designer)',
      email: 'jane@example.com',
      passwordHash,
      role: 'EVALUATEE',
      departmentId: it.id,
    },
  });

  const mkt1 = await prisma.user.create({
    data: {
      name: 'John Smith (Marketing Specialist)',
      email: 'john@example.com',
      passwordHash,
      role: 'EVALUATEE',
      departmentId: marketing.id,
    },
  });

  // Evaluation - Yearly Assessment 2026
  const yearlyEval = await prisma.evaluation.create({
    data: {
      name: 'Annual Performance Review 2026',
      startAt: new Date('2026-03-01'),
      endAt: new Date('2026-03-31'),
      status: 'OPEN',
      creatorId: admin.id,
    },
  });

  // Topics & Indicators for Yearly Eval
  const technicalTopic = await prisma.topic.create({
    data: {
      name: 'Technical Competencies',
      evaluationId: yearlyEval.id,
    },
  });

  const behaviorTopic = await prisma.topic.create({
    data: {
      name: 'Behavioral Attributes',
      evaluationId: yearlyEval.id,
    },
  });

  await prisma.indicator.createMany({
    data: [
      {
        name: 'Quality of Work',
        type: 'SCALE_1_4',
        weight: 30.0,
        requireEvidence: true,
        topicId: technicalTopic.id,
      },
      {
        name: 'Technical Problem Solving',
        type: 'SCALE_1_4',
        weight: 30.0,
        requireEvidence: false,
        topicId: technicalTopic.id,
      },
      {
        name: 'Collaboration & Communication',
        type: 'SCALE_1_4',
        weight: 20.0,
        requireEvidence: false,
        topicId: behaviorTopic.id,
      },
      {
        name: 'Punctuality',
        type: 'YES_NO',
        weight: 20.0,
        requireEvidence: false,
        topicId: behaviorTopic.id,
      },
    ],
  });

  // Evaluation - Mid-year Review 2025 (CLOSED)
  const pastEval = await prisma.evaluation.create({
    data: {
      name: 'Mid-year Review 2025',
      startAt: new Date('2025-06-01'),
      endAt: new Date('2025-06-30'),
      status: 'CLOSED',
      creatorId: admin.id,
    },
  });

  // Assignments
  await prisma.assignment.createMany({
    data: [
      {
        evaluationId: yearlyEval.id,
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
      },
      {
        evaluationId: yearlyEval.id,
        evaluatorId: evaluator.id,
        evaluateeId: dev2.id,
      },
      {
        evaluationId: pastEval.id,
        evaluatorId: evaluator.id,
        evaluateeId: evaluatee.id,
      }
    ],
  });

  console.log('Seed data created successfully!');
  console.log('--- Account Credentials ---');
  console.log('Admin:     admin@example.com / password123');
  console.log('Evaluator: evaluator@example.com / password123');
  console.log('Evaluatee: evaluatee@example.com / password123');
  console.log('---------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
