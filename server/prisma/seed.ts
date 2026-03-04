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

  console.log('🎯 Database seeding completed!');
  console.log('');
  console.log('📋 Login Credentials:');
  console.log('👨‍💼 Admin: admin@quiznow.com');
  console.log('👨‍🎓 Student: student@quiznow.com');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
