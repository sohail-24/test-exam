const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  const users = await prisma.user.findMany();
  const exams = await prisma.exam.findMany();
  console.log('Tenants count:', tenants.length, tenants);
  console.log('Users count:', users.length, users);
  console.log('Exams count:', exams.length, exams);
}

main().catch(console.error).finally(() => prisma.$disconnect());
