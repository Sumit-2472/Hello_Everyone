import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { listingService } from '../services/listing.service';
import { asyncHandler, AppError } from '../../../shared/middleware/errorHandler';
import { ApiResponse } from '../../../shared/types';

export const createListing = asyncHandler(async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg as string, 400);

  const listing = await listingService.createListing(req.body);
  res.status(201).json({ success: true, data: listing, message: 'Listing created', timestamp: new Date().toISOString() } as ApiResponse);
});

export const getListings = asyncHandler(async (req: Request, res: Response) => {
  const { category, minPrice, maxPrice, minHealthScore, page, limit, sortBy } = req.query;

  const result = await listingService.getListings({
    category: category as string,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    minHealthScore: minHealthScore ? Number(minHealthScore) : undefined,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    sortBy: sortBy as any,
  });

  res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() } as ApiResponse);
});

export const getListingById = asyncHandler(async (req: Request, res: Response) => {
  const listing = await listingService.getListingById(req.params.id);
  res.status(200).json({ success: true, data: listing, timestamp: new Date().toISOString() } as ApiResponse);
});

export const purchaseListing = asyncHandler(async (req: Request, res: Response) => {
  const result = await listingService.purchaseListing(req.params.id, req.user!.userId);
  res.status(200).json({
    success: true,
    data: result,
    message: `Purchase successful. You earned ${result.creditsEarned} Green Credits!`,
    timestamp: new Date().toISOString(),
  } as ApiResponse);
});
