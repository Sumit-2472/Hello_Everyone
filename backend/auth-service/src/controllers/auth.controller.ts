import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { authService } from '../services/auth.service';
import { asyncHandler, AppError } from '../../../shared/middleware/errorHandler';
import { ApiResponse } from '../../../shared/types';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg as string, 400);
  }

  const result = await authService.register(req.body);

  const response: ApiResponse = {
    success: true,
    data: result,
    message: 'Registration successful',
    timestamp: new Date().toISOString(),
  };

  res.status(201).json(response);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg as string, 400);
  }

  const result = await authService.login(req.body);

  const response: ApiResponse = {
    success: true,
    data: result,
    message: 'Login successful',
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400);
  }

  const tokens = await authService.refreshToken(refreshToken);

  res.status(200).json({
    success: true,
    data: tokens,
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  await authService.logout(req.user!.userId);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: req.user,
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});
