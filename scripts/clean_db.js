const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User", "Tenant", "Profile", "Exam", "Question", "Result" CASCADE;');
  console.log('Cleaned successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
