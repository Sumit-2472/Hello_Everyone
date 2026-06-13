import { Router } from 'express';
import { body } from 'express-validator';
import { decideRoute } from '../controllers/routing.controller';
import { authenticate, authorize } from '../../../shared/middleware/authMiddleware';

const router = Router();

/**
 * @route   POST /api/v1/routing/decide
 * @desc    Get optimal disposal route for a returned product
 * @access  Private (warehouse_staff, admin)
 */
router.post(
  '/decide',
  authenticate,
  authorize('warehouse_staff', 'admin'),
  [
    body('passportId').notEmpty().withMessage('passportId is required'),
    body('healthScore').isFloat({ min: 0, max: 100 }).withMessage('healthScore must be 0-100'),
    body('marketDemand').isFloat({ min: 0, max: 100 }).withMessage('marketDemand must be 0-100'),
    body('repairCost').isFloat({ min: 0 }).withMessage('repairCost must be non-negative'),
    body('productCategory').notEmpty().withMessage('productCategory is required'),
    body('age').isInt({ min: 0 }).withMessage('age (months) must be non-negative'),
  ],
  decideRoute
);

export default router;
