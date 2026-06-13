import { Router } from 'express';
import { authenticate, authorize } from '../../../shared/middleware/authMiddleware';
import { asyncHandler } from '../../../shared/middleware/errorHandler';
import { UserModel } from '../models/User.model';
import { ApiResponse } from '../../../shared/types';

const router = Router();

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get(
  '/',
  authenticate,
  authorize('admin'),
  asyncHandler(async (_req, res) => {
    const users = await UserModel.find().select('-password -refreshToken');
    res.json({
      success: true,
      data: users,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  })
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req, res, next) => { // 1. Add 'next' to the signature
    const user = await UserModel.findById(req.params.id).select('-password -refreshToken');
    
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return; // 2. Return early to stop execution
    }
    
    res.json({ success: true, data: user });
    // 3. Do not return the result of res.json()
  })
);

export default router;
