const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const testId = 'cmmcz5wta0007ujzavu4spv3h';
  const questions = await prisma.question.findMany({
    where: {
      sectionLinks: {
        some: {
          section: { testId: testId }
        }
      }
    },
    include: { translations: true }
  });
  console.log(`Found ${questions.length} questions for test ${testId}`);
  const withTrans = questions.filter(q => q.translations && q.translations.length > 0);
  console.log(`${withTrans.length} questions have translations.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
