import "dotenv/config";

import { PrismaClient, UserRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";


const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("🌱 Seeding database...");

  const password = await bcrypt.hash("Admin@123", 12);

  // Master Admin
  await prisma.user.upsert({
    where: {
      email: "master@mill.com",
    },
    update: {},
    create: {
      fullName: "Master Admin",
      email: "master@mill.com",
      password,
      role: UserRole.MASTER_ADMIN,
    },
  });

  // Tenant
  const tenant = await prisma.tenant.upsert({
    where: {
      code: "DEMO001",
    },
    update: {},
    create: {
      name: "Demo Rice Mill",
      code: "DEMO001",
    },
  });

  // Tenant Admin
  await prisma.user.upsert({
    where: {
      email: "admin@mill.com",
    },
    update: {},
    create: {
      fullName: "Demo Admin",
      email: "admin@mill.com",
      password,
      role: UserRole.ADMIN,
      tenantId: tenant.id,
    },
  });

  // Partner
  await prisma.user.upsert({
    where: {
      email: "partner@mill.com",
    },
    update: {},
    create: {
      fullName: "Demo Partner",
      email: "partner@mill.com",
      password,
      role: UserRole.PARTNER,
      tenantId: tenant.id,
    },
  });

  console.log("✅ Database seeded successfully.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });