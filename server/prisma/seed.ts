import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
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
        role: 'ADMIN',
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
        name: 'John Student',
        role: 'STUDENT',
        // No password needed for Dev Login
      },
    });
    console.log('✅ Student User Created: student@quiznow.com');
  } else {
    console.log('ℹ️ Student already exists.');
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
