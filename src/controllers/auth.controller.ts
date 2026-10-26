import type { Request, Response } from "express";
import * as authService from "../services/auth.service";
import type { RegisterInput, LoginInput, RefreshInput } from "../schemas";

export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;
  const result = await authService.register(input);
  res.status(201).json({ success: true, data: result });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;
  const result = await authService.login(input);
  res.status(200).json({ success: true, data: result });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as RefreshInput;
  const tokens = await authService.refresh(refreshToken);
  res.status(200).json({ success: true, data: tokens });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = req.body as RefreshInput;
  await authService.logout(refreshToken);
  res.status(204).send();
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getCurrentUser(req.user!.userId);
  res.status(200).json({ success: true, data: user });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const user = await authService.updateProfile(req.user!.userId, req.body);
  res.status(200).json({ success: true, data: user });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  await authService.changePassword(req.user!.userId, req.body);
  res.status(200).json({ success: true, message: "Password updated successfully" });
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string };
  await authService.forgotPassword(email);
  res.status(200).json({ 
    success: true, 
    message: "If an account exists, a reset link has been sent to your email." 
  });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  await authService.resetPassword(token, newPassword);
  res.status(200).json({ success: true, message: "Password reset successfully" });
}