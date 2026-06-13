import { Router } from 'express';
import { body } from 'express-validator';
import { createListing, getListings, getListingById, purchaseListing } from '../controllers/listing.controller';
import { authenticate, authorize } from '../../../shared/middleware/authMiddleware';

const router = Router();

/**
 * @route   GET /api/v1/listings
 * @desc    Get all active listings with filters
 * @access  Public
 */
router.get('/', getListings);

/**
 * @route   GET /api/v1/listings/:id
 * @desc    Get a specific listing by ID
 * @access  Public
 */
router.get('/:id', getListingById);

/**
 * @route   POST /api/v1/listings
 * @desc    Create a new Second Life listing
 * @access  Private (seller, admin)
 */
router.post(
  '/',
  authenticate,
  authorize('seller', 'admin'),
  [
    body('productId').notEmpty(),
    body('passportId').notEmpty(),
    body('title').trim().notEmpty().isLength({ max: 200 }),
    body('description').trim().notEmpty().isLength({ max: 2000 }),
    body('price').isFloat({ min: 0 }),
    body('originalPrice').isFloat({ min: 0 }),
    body('category').notEmpty(),
    body('trustCard').isObject(),
  ],
  createListing
);

/**
 * @route   POST /api/v1/listings/:id/purchase
 * @desc    Purchase a listing
 * @access  Private
 */
router.post('/:id/purchase', authenticate, purchaseListing);

export default router;
