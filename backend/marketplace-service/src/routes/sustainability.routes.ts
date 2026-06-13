import { Router } from 'express';
import { getSustainabilityMetrics } from '../controllers/credit.controller';
import { authenticate } from '../../../shared/middleware/authMiddleware';

const router = Router();

/**
 * @route   GET /api/v1/sustainability/me
 * @desc    Get current user's sustainability dashboard metrics
 * @access  Private
 */
router.get('/me', authenticate, getSustainabilityMetrics);

/**
 * @route   GET /api/v1/sustainability/:userId
 * @desc    Get sustainability metrics for a specific user
 * @access  Private
 */
router.get('/:userId', authenticate, getSustainabilityMetrics);

export default router;
