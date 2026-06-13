import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { routingService } from '../services/routing.service';
import { asyncHandler, AppError } from '../../../shared/middleware/errorHandler';
import { ApiResponse } from '../../../shared/types';

export const decideRoute = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg as string, 400);

  const decision = await routingService.decideRoute(req.body);

  res.status(200).json({
    success: true,
    data: decision,
    message: 'Routing decision generated',
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});

export const calculateRecovery = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg as string, 400);

  const values = routingService.calculateRecoveryValues(req.body);

  res.status(200).json({
    success: true,
    data: values,
    message: 'Recovery values calculated',
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});
