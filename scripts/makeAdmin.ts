import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  // First, list all users
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
  });
  
  console.log('\n📋 All users in database:');
  allUsers.forEach(u => {
    console.log(`  - ${u.email} (${u.name}) - role: ${u.role} - id: ${u.id}`);
  });
  
  // Find and update the target user
  const targetEmail = 'moh.alneama@yahoo.com';
  const existingUser = await prisma.user.findUnique({
    where: { email: targetEmail },
  });
  
  if (!existingUser) {
    console.log(`\n❌ User ${targetEmail} not found in database!`);
    console.log('Available emails:', allUsers.map(u => u.email).join(', '));
    await prisma.$disconnect();
    return;
  }
  
  const user = await prisma.user.update({
    where: { email: targetEmail },
    data: { role: 'admin' },
  });
  
  console.log(`\n✅ SUCCESS! ${user.name} (${user.email}) is now an admin!`);
  console.log(`   User ID: ${user.id}`);
  console.log(`   Role: ${user.role}`);
  console.log('\n⚠️  IMPORTANT: Log out and log back in to get the new admin role!');
  
  await prisma.$disconnect();
}

makeAdmin().catch(console.error);
