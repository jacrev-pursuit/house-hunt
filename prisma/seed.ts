import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.offer.deleteMany();
  await prisma.houseEvaluation.deleteMany();
  await prisma.houseNote.deleteMany();
  await prisma.housePhoto.deleteMany();
  await prisma.priority.deleteMany();
  await prisma.house.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: { name: "Mom", role: "parent", passcode: "juliette" },
  });

  await prisma.user.create({
    data: { name: "Dad", role: "parent", passcode: "john" },
  });

  await prisma.user.create({
    data: { name: "Family", role: "viewer", passcode: "family" },
  });

  console.log("Seeded: Mom, Dad, Family accounts (priorities set on first login)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
