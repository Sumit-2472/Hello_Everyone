import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { returnRiskService } from '../services/returnRisk.service';
import { asyncHandler, AppError } from '../../../shared/middleware/errorHandler';
import { ApiResponse } from '../../../shared/types';

export const predictReturnRisk = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg as string, 400);

  const result = await returnRiskService.predictReturnRisk(req.body);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Return risk assessed',
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});

export const recommendSize = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg as string, 400);

  const { category, height, weight, bodyType } = req.body;
  const result = await returnRiskService.recommendSize(category, height, weight, bodyType);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Size recommendation generated',
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});

export const checkCompatibility = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg as string, 400);

  const { productName, productSpecs, userDeviceModel } = req.body;
  const result = await returnRiskService.checkCompatibility(productName, productSpecs, userDeviceModel);

  res.status(200).json({
    success: true,
    data: result,
    message: 'Compatibility check complete',
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});
