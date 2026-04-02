import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import path from "path";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.houseEvaluation.deleteMany();
  await prisma.houseNote.deleteMany();
  await prisma.housePhoto.deleteMany();
  await prisma.priority.deleteMany();
  await prisma.house.deleteMany();
  await prisma.user.deleteMany();

  const mom = await prisma.user.create({
    data: { name: "Mom", role: "parent", passcode: "northfork1" },
  });

  const dad = await prisma.user.create({
    data: { name: "Dad", role: "parent", passcode: "northfork2" },
  });

  await prisma.user.create({
    data: { name: "Family", role: "viewer", passcode: "viewer" },
  });

  const momPriorities = [
    { name: "Close to water", category: "must_have" },
    { name: "3+ bedrooms", category: "must_have" },
    { name: "Updated kitchen", category: "must_have" },
    { name: "Good natural light", category: "must_have" },
    { name: "Garage or covered parking", category: "nice_to_have" },
    { name: "Open floor plan", category: "nice_to_have" },
    { name: "Large yard", category: "nice_to_have" },
    { name: "Walk to town", category: "nice_to_have" },
    { name: "Home office space", category: "nice_to_have" },
    { name: "Pool", category: "nice_to_have" },
  ];

  const dadPriorities = [
    { name: "Garage or workshop space", category: "must_have" },
    { name: "3+ bedrooms", category: "must_have" },
    { name: "Large yard", category: "must_have" },
    { name: "Quiet neighborhood", category: "must_have" },
    { name: "Close to water", category: "nice_to_have" },
    { name: "Updated kitchen", category: "nice_to_have" },
    { name: "Good natural light", category: "nice_to_have" },
    { name: "Home office space", category: "nice_to_have" },
    { name: "Pool", category: "nice_to_have" },
    { name: "Low maintenance exterior", category: "nice_to_have" },
  ];

  for (let i = 0; i < momPriorities.length; i++) {
    await prisma.priority.create({
      data: { userId: mom.id, rank: i + 1, ...momPriorities[i] },
    });
  }

  for (let i = 0; i < dadPriorities.length; i++) {
    await prisma.priority.create({
      data: { userId: dad.id, rank: i + 1, ...dadPriorities[i] },
    });
  }

  console.log("Seeded: Mom, Dad, Family accounts with starter priorities");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
