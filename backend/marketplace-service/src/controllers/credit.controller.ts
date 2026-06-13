import { Request, Response } from 'express';
import { creditService } from '../services/credit.service';
import { asyncHandler, AppError } from '../../../shared/middleware/errorHandler';
import { ApiResponse, CreditAction } from '../../../shared/types';

export const awardCredits = asyncHandler(async (req: Request, res: Response) => {
  const { userId, action, relatedEntityId } = req.body;
  if (!userId || !action) throw new AppError('userId and action are required', 400);

  const transaction = await creditService.awardCredits(userId, action as CreditAction, relatedEntityId);
  res.status(201).json({ success: true, data: transaction, timestamp: new Date().toISOString() } as ApiResponse);
});

export const getUserCredits = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId || req.user!.userId;
  const result = await creditService.getUserCredits(userId);
  res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() } as ApiResponse);
});

export const getSustainabilityMetrics = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.params.userId || req.user!.userId;
  const metrics = await creditService.getSustainabilityMetrics(userId);
  res.status(200).json({ success: true, data: metrics, timestamp: new Date().toISOString() } as ApiResponse);
});
