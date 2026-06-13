import { Request, Response } from 'express';
import { passportService } from '../services/passport.service';
import { asyncHandler, AppError } from '../../../shared/middleware/errorHandler';
import { ApiResponse } from '../../../shared/types';

export const gradeVisual = asyncHandler(async (req: Request, res: Response) => {
  const { productId, returnId, category } = req.body;

  if (!productId || !returnId || !category) {
    throw new AppError('productId, returnId, and category are required', 400);
  }

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new AppError('At least one image file is required', 400);
  }

  const imageBuffers = files.map((f) => ({ buffer: f.buffer, mimeType: f.mimetype }));
  const passport = await passportService.gradeVisual(productId, returnId, category, imageBuffers);

  res.status(201).json({
    success: true,
    data: passport,
    message: 'Visual grading complete',
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});

export const gradeTelemetry = asyncHandler(async (req: Request, res: Response) => {
  const { productId, returnId, productName, telemetry } = req.body;

  if (!productId || !returnId || !productName || !telemetry) {
    throw new AppError('productId, returnId, productName, and telemetry are required', 400);
  }

  const passport = await passportService.gradeTelemetry(productId, returnId, productName, telemetry);

  res.status(201).json({
    success: true,
    data: passport,
    message: 'Telemetry grading complete',
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});

export const getPassportByReturnId = asyncHandler(async (req: Request, res: Response) => {
  const passport = await passportService.getPassportByReturnId(req.params.returnId);
  res.status(200).json({
    success: true,
    data: passport,
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});

export const getPassportById = asyncHandler(async (req: Request, res: Response) => {
  const passport = await passportService.getPassportById(req.params.id);
  res.status(200).json({
    success: true,
    data: passport,
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});
