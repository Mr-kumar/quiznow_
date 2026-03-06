import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Check if Admin exists
  const adminEmail = 'admin@quiznow.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    // 2. Create Admin
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Super Admin',
        role: Role.ADMIN,
        // No password needed for Dev Login
      },
    });
    console.log('✅ Admin User Created: admin@quiznow.com');
  } else {
    console.log('ℹ️ Admin already exists.');
  }

  // 3. Check if Student exists
  const studentEmail = 'student@quiznow.com';
  const existingStudent = await prisma.user.findUnique({
    where: { email: studentEmail },
  });

  if (!existingStudent) {
    // 4. Create Student
    await prisma.user.create({
      data: {
        email: studentEmail,
        name: 'Test Student',
        role: Role.STUDENT,
        // No password needed for Dev Login
      },
    });
    console.log('✅ Student User Created: student@quiznow.com');
  } else {
    console.log('ℹ️ Student already exists.');
  }

  // 5. Create Sample Subjects
  const mathSubject = await prisma.subject.upsert({
    where: { name: 'Mathematics' },
    update: {},
    create: {
      id: 'subject-math',
      name: 'Mathematics',
      isActive: true,
    },
  });

  const scienceSubject = await prisma.subject.upsert({
    where: { name: 'Science' },
    update: {},
    create: {
      id: 'subject-science',
      name: 'Science',
      isActive: true,
    },
  });

  console.log('✅ Sample Subjects Created');

  // 6. Create Sample Topics with new schema
  const algebraTopic = await prisma.topic.upsert({
    where: {
      subjectId_name: {
        subjectId: mathSubject.id,
        name: 'Algebra',
      },
    },
    update: {},
    create: {
      id: 'topic-algebra',
      name: 'Algebra',
      subjectId: mathSubject.id,
    },
  });

  const physicsTopic = await prisma.topic.upsert({
    where: {
      subjectId_name: {
        subjectId: scienceSubject.id,
        name: 'Physics',
      },
    },
    update: {},
    create: {
      id: 'topic-physics',
      name: 'Physics',
      subjectId: scienceSubject.id,
    },
  });

  console.log('✅ Sample Topics Created');

  // 6. Create Sample Audit Logs for testing
  const sampleAuditLogs = [
    {
      action: 'QUESTION_CREATED',
      targetType: 'Question',
      targetId: 'sample-question-1',
      actorId: 'admin-user-id',
      actorRole: 'ADMIN',
      metadata: { question: 'Sample question 1' },
    },
    {
      action: 'TEST_PUBLISHED',
      targetType: 'Test',
      targetId: 'sample-test-1',
      actorId: 'admin-user-id',
      actorRole: 'ADMIN',
      metadata: { test: 'Sample test 1' },
    },
    {
      action: 'USER_BANNED',
      targetType: 'User',
      targetId: 'sample-user-1',
      actorId: 'admin-user-id',
      actorRole: 'ADMIN',
      metadata: { reason: 'Violation of terms' },
    },
    {
      action: 'SECTION_CREATED',
      targetType: 'Section',
      targetId: 'sample-section-1',
      actorId: 'admin-user-id',
      actorRole: 'ADMIN',
      metadata: { section: 'Sample section 1' },
    },
  ];

  await prisma.auditLog.createMany({
    data: sampleAuditLogs.map((log) => ({
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      actorId: log.actorId,
      actorRole: log.actorRole as any,
      metadata: log.metadata as any,
    })),
  });

  console.log('✅ Sample Audit Logs Created');
  console.log('🎯 Database seeding completed!');
  console.log('');
  console.log('📋 Login Credentials:');
  console.log('👨‍💼 Admin: admin@quiznow.com');
  console.log('👨‍🎓 Student: student@quiznow.com');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
