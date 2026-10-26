import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError.util";
import { hashPassword, verifyPassword } from "../utils/password.util";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.util";
import type { RegisterInput, LoginInput } from "../schemas";

type SafeUser = {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
};

type AuthResult = {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
};

function toSafeUser(user: {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

function getRefreshExpiry(token: string): Date {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    throw ApiError.internal("Failed to compute refresh token expiry");
  }
  return new Date(decoded.exp * 1000);
}

async function issueTokens(
  userId: string,
  email: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = { userId, email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const expiresAt = getRefreshExpiry(refreshToken);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId, expiresAt },
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw ApiError.conflict("Email already registered");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
    },
  });

  const tokens = await issueTokens(user.id, user.email);

  return { user: toSafeUser(user), ...tokens };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordOk = await verifyPassword(input.password, user.passwordHash);
  if (!passwordOk) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const tokens = await issueTokens(user.id, user.email);

  return { user: toSafeUser(user), ...tokens };
}

export async function refresh(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // 1) Verify JWT signature + expiry
  let payload: { userId: string; email: string };
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized("Invalid or expired refresh token");
  }

  // 2) Verify it exists in DB and is still valid (not revoked, not expired)
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is no longer valid");
  }

  // 3) Rotate: revoke the old token before issuing a new one
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  return issueTokens(payload.userId, payload.email);
}

export async function logout(refreshToken: string): Promise<void> {
  const stored = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (stored && !stored.revokedAt) {
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
  }
}

export async function getCurrentUser(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return toSafeUser(user);
}

export async function updateProfile(userId: string, input: { name?: string; email?: string }): Promise<SafeUser> {
  if (input.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing && existing.id !== userId) {
      throw ApiError.conflict("Email already in use");
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.name && { name: input.name }),
      ...(input.email && { email: input.email }),
    },
  });

  return toSafeUser(user);
}

export async function changePassword(userId: string, input: { currentPassword: string; newPassword: string }): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");

  const isMatch = await verifyPassword(input.currentPassword, user.passwordHash);
  if (!isMatch) throw ApiError.unauthorized("Incorrect current password");

  const newHash = await hashPassword(input.newPassword);
  
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  // Revoke all existing refresh tokens for security
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revokedAt: new Date() },
  });
}