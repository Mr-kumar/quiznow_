const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const attemptId = 20n; // Use BigInt for attempt ID if it's bigint, wait attempt ID is string or int? 
  // Let's check attempt schema
  
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { test: true }
  });
  
  if (!attempt) {
    console.log("No attempt found with ID", attemptId);
    return;
  }
  
  console.log("Found attempt for test:", attempt.testId);
  
  const questions = await prisma.question.findMany({
    where: {
      sectionLinks: {
        some: {
          section: { testId: attempt.testId }
        }
      }
    },
    include: { translations: true },
    take: 2 // check first 2
  });
  
  console.log("Questions found:", questions.length);
  for (const q of questions) {
    console.log(`Q ID: ${q.id}, translations count: ${q.translations?.length}`);
    if (q.translations?.length > 0) {
      console.log(`  Translation 0 content: ${q.translations[0].content.substring(0, 50)}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
