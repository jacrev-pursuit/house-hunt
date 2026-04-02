import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
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
    data: { name: "Mom", role: "parent", passcode: "northfork1" },
  });

  await prisma.user.create({
    data: { name: "Dad", role: "parent", passcode: "northfork2" },
  });

  await prisma.user.create({
    data: { name: "Family", role: "viewer", passcode: "viewer" },
  });

  console.log("Seeded: Mom, Dad, Family accounts (priorities set on first login)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
