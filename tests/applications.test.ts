import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../src/app";

describe("Applications API", () => {
  let token: string;
  let userId: string;
  let appId: string;

  // Create a user and get a token before each test
  beforeEach(async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      name: "App User",
      email: "appuser@example.com",
      password: "Password123",
    });
    token = res.body.data.accessToken;
    userId = res.body.data.user.id;
  });

  describe("POST /api/v1/applications", () => {
    it("should create a new application", async () => {
      const res = await request(app)
        .post("/api/v1/applications")
        .set("Authorization", `Bearer ${token}`)
        .send({
          company: "Google",
          role: "Frontend Engineer",
          status: "APPLIED",
          notes: "Referral from friend",
        });

      expect(res.status).toBe(201);
      expect(res.body.data.company).toBe("Google");
      expect(res.body.data.userId).toBe(userId);
    });

    it("should fail if not authenticated", async () => {
      const res = await request(app)
        .post("/api/v1/applications")
        .send({ company: "Google", role: "Frontend" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/applications", () => {
    beforeEach(async () => {
      const res = await request(app)
        .post("/api/v1/applications")
        .set("Authorization", `Bearer ${token}`)
        .send({ company: "Google", role: "Frontend" });
      appId = res.body.data.id;
    });

    it("should list user applications with pagination", async () => {
      const res = await request(app)
        .get("/api/v1/applications?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(1);
      expect(res.body.pagination.total).toBe(1);
    });

    it("should filter by status", async () => {
      const res = await request(app)
        .get("/api/v1/applications?status=INTERVIEW")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBe(0); // No INTERVIEW yet
    });
  });

  describe("GET /api/v1/applications/:id", () => {
    beforeEach(async () => {
      const res = await request(app)
        .post("/api/v1/applications")
        .set("Authorization", `Bearer ${token}`)
        .send({ company: "Google", role: "Frontend" });
      appId = res.body.data.id;
    });

    it("should return the application if owned by user", async () => {
      const res = await request(app)
        .get(`/api/v1/applications/${appId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(appId);
    });

    it("should NOT return application owned by another user (IDOR protection)", async () => {
      // Register a second user
      const res2 = await request(app).post("/api/v1/auth/register").send({
        name: "Hacker",
        email: "hacker@example.com",
        password: "Password123",
      });
      const hackerToken = res2.body.data.accessToken;

      const res = await request(app)
        .get(`/api/v1/applications/${appId}`)
        .set("Authorization", `Bearer ${hackerToken}`);

      expect(res.status).toBe(404); // Not found (not forbidden, to avoid leaking existence)
    });
  });

  describe("PATCH /api/v1/applications/:id", () => {
    beforeEach(async () => {
      const res = await request(app)
        .post("/api/v1/applications")
        .set("Authorization", `Bearer ${token}`)
        .send({ company: "Google", role: "Frontend", status: "APPLIED" });
      appId = res.body.data.id;
    });

    it("should update the application status", async () => {
      const res = await request(app)
        .patch(`/api/v1/applications/${appId}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status: "INTERVIEW" });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("INTERVIEW");
    });
  });

  describe("DELETE /api/v1/applications/:id", () => {
    beforeEach(async () => {
      const res = await request(app)
        .post("/api/v1/applications")
        .set("Authorization", `Bearer ${token}`)
        .send({ company: "Google", role: "Frontend" });
      appId = res.body.data.id;
    });

    it("should delete the application", async () => {
      const res = await request(app)
        .delete(`/api/v1/applications/${appId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(204);

      // Verify it's gone
      const getRes = await request(app)
        .get(`/api/v1/applications/${appId}`)
        .set("Authorization", `Bearer ${token}`);
      expect(getRes.status).toBe(404);
    });
  });
});