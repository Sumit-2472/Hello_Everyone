import { Router } from 'express';
import { body } from 'express-validator';
import { recommendSize } from '../controllers/return.controller';
import { authenticate } from '../../../shared/middleware/authMiddleware';

const router = Router();

/**
 * @route   POST /api/v1/size-advisor/recommend
 * @desc    Get size recommendation based on body measurements
 * @access  Private
 */
router.post(
  '/recommend',
  authenticate,
  [
    body('category').notEmpty().withMessage('Product category is required'),
    body('height').isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50-300 cm'),
    body('weight').isFloat({ min: 10, max: 500 }).withMessage('Weight must be between 10-500 kg'),
    body('bodyType').optional().isString(),
  ],
  recommendSize
);

export default router;
