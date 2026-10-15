import { Prisma } from "../generated/prisma";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/apiError.util";
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
  ListApplicationsQuery,
} from "../schemas";

async function ensureOwned(userId: string, id: string) {
  const application = await prisma.application.findFirst({
    where: { id, userId },
  });
  if (!application) {
    throw ApiError.notFound("Application not found");
  }
  return application;
}

export async function create(userId: string, input: CreateApplicationInput) {
  return prisma.application.create({
    data: {
      company: input.company,
      role: input.role,
      status: input.status,
      appliedDate: input.appliedDate ?? new Date(),
      notes: input.notes || null,
      userId,
    },
  });
}

export async function list(userId: string, query: ListApplicationsQuery) {
  const where: Prisma.ApplicationWhereInput = { userId };
  if (query.status) {
    where.status = query.status;
  }

  const skip = (query.page - 1) * query.limit;

  const [items, total] = await prisma.$transaction([
    prisma.application.findMany({
      where,
      orderBy: { appliedDate: "desc" },
      skip,
      take: query.limit,
    }),
    prisma.application.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function getById(userId: string, id: string) {
  return ensureOwned(userId, id);
}

export async function update(
  userId: string,
  id: string,
  input: UpdateApplicationInput
) {
  await ensureOwned(userId, id);

  const data: Prisma.ApplicationUpdateInput = {};
  if (input.company !== undefined) data.company = input.company;
  if (input.role !== undefined) data.role = input.role;
  if (input.status !== undefined) data.status = input.status;
  if (input.appliedDate !== undefined) data.appliedDate = input.appliedDate;
  if (input.notes !== undefined) data.notes = input.notes;

  return prisma.application.update({ where: { id }, data });
}

export async function remove(userId: string, id: string): Promise<void> {
  await ensureOwned(userId, id);
  await prisma.application.delete({ where: { id } });
}