import "dotenv/config";
import { config } from "dotenv";
import { beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "../src/config/prisma";
import { execSync } from "node:child_process";

// Load .env.test INSTEAD of .env
config({ path: ".env.test", override: true });

beforeAll(async () => {
  // 1. Ensure schema is up to date
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: process.env.DIRECT_URL },
    stdio: "inherit",
  });

  // 2. Connect
  await prisma.$connect();
}, 60000);

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean tables before each test, but keep schema
  await prisma.refreshToken.deleteMany();
  await prisma.application.deleteMany();
  await prisma.user.deleteMany();
});