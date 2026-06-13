import { Router } from 'express';
import { awardCredits, getUserCredits } from '../controllers/credit.controller';
import { authenticate, authorize } from '../../../shared/middleware/authMiddleware';

const router = Router();

/**
 * @route   GET /api/v1/credits/me
 * @desc    Get current user's green credits and transactions
 * @access  Private
 */
router.get('/me', authenticate, getUserCredits);

/**
 * @route   GET /api/v1/credits/:userId
 * @desc    Get a specific user's credits (admin only)
 * @access  Private/Admin
 */
router.get('/:userId', authenticate, authorize('admin'), getUserCredits);

/**
 * @route   POST /api/v1/credits/award
 * @desc    Award green credits for a sustainable action (internal use)
 * @access  Private/Admin
 */
router.post('/award', authenticate, authorize('admin'), awardCredits);

export default router;
