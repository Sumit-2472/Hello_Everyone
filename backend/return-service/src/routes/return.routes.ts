import { Router } from 'express';
import { body } from 'express-validator';
import { predictReturnRisk } from '../controllers/return.controller';
import { authenticate } from '../../../shared/middleware/authMiddleware';

const router = Router();

/**
 * @route   POST /api/v1/returns/predict-risk
 * @desc    Predict return probability for a product+user combination
 * @access  Private
 * @body    { productId, productCategory, userId, selectedSize?, userHeight?, userWeight?, pastReturnCount }
 */
router.post(
  '/predict-risk',
  authenticate,
  [
    body('productId').notEmpty().withMessage('productId is required'),
    body('productCategory').notEmpty().withMessage('productCategory is required'),
    body('userId').notEmpty().withMessage('userId is required'),
    body('pastReturnCount').isInt({ min: 0 }).withMessage('pastReturnCount must be a non-negative integer'),
    body('userHeight').optional().isFloat({ min: 50, max: 300 }),
    body('userWeight').optional().isFloat({ min: 10, max: 500 }),
  ],
  predictReturnRisk
);

export default router;
