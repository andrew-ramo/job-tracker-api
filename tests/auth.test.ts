import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("Auth API", () => {
  const testUser = {
    name: "Test User",
    email: "test@example.com",
    password: "Password123",
  };

  describe("POST /api/v1/auth/register", () => {
    it("should register a new user and return tokens", async () => {
      const res = await request(app).post("/api/v1/auth/register").send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it("should fail if email already exists", async () => {
      // Register once
      await request(app).post("/api/v1/auth/register").send(testUser);
      
      // Try again with the same email
      const res = await request(app).post("/api/v1/auth/register").send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe("Email already registered");
    });

    it("should fail on invalid input", async () => {
      const res = await request(app).post("/api/v1/auth/register").send({
        name: "A", // too short
        email: "not-an-email",
        password: "123", // too short
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /api/v1/auth/login", () => {
    // Create a fresh user before each login test
    beforeEach(async () => {
      await request(app).post("/api/v1/auth/register").send(testUser);
    });

    it("should login with valid credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it("should fail with invalid password", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({
        email: testUser.email,
        password: "WrongPassword123",
      });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe("Invalid email or password");
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return user profile with valid token", async () => {
      const registerRes = await request(app).post("/api/v1/auth/register").send(testUser);
      const token = registerRes.body.data.accessToken;

      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(testUser.email);
    });

    it("should return 401 without token", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    it("should rotate refresh token and invalidate the old one", async () => {
      const registerRes = await request(app).post("/api/v1/auth/register").send(testUser);
      const oldRefreshToken = registerRes.body.data.refreshToken;

      // 1. Refresh successfully
      const res = await request(app).post("/api/v1/auth/refresh").send({
        refreshToken: oldRefreshToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.refreshToken).not.toBe(oldRefreshToken); // Must be different

      // 2. Try using the OLD token again (should fail due to rotation)
      const failRes = await request(app).post("/api/v1/auth/refresh").send({
        refreshToken: oldRefreshToken,
      });
      
      expect(failRes.status).toBe(401);
    });
  });
});