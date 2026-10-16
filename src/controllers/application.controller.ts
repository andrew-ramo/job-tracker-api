import type { Request, Response } from "express";
import * as applicationService from "../services/application.service";
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
  ListApplicationsQuery,
} from "../schemas";

export async function create(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const input = req.body as CreateApplicationInput;
  const application = await applicationService.create(userId, input);
  res.status(201).json({ success: true, data: application });
}

export async function list(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  // Express 5: use the validated query object stored by the validate middleware
  const query = (req as Request & { validatedQuery?: ListApplicationsQuery })
    .validatedQuery as ListApplicationsQuery;
  const result = await applicationService.list(userId, query);
  res.status(200).json({ success: true, ...result });
}
export async function getById(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const application = await applicationService.getById(userId, id);
  res.status(200).json({ success: true, data: application });
}

export async function update(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  const input = req.body as UpdateApplicationInput;
  const application = await applicationService.update(userId, id, input);
  res.status(200).json({ success: true, data: application });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const id = req.params.id as string;
  await applicationService.remove(userId, id);
  res.status(204).send();
}