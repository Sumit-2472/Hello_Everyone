import { Router } from 'express';
import { body } from 'express-validator';
import { calculateRecovery } from '../controllers/routing.controller';
import { authenticate } from '../../../shared/middleware/authMiddleware';

const router = Router();

/**
 * @route   POST /api/v1/recovery/calculate
 * @desc    Calculate recovery values for all disposal routes
 * @access  Private
 */
router.post(
  '/calculate',
  authenticate,
  [
    body('passportId').notEmpty(),
    body('healthScore').isFloat({ min: 0, max: 100 }),
    body('marketDemand').isFloat({ min: 0, max: 100 }),
    body('repairCost').isFloat({ min: 0 }),
    body('productCategory').notEmpty(),
    body('age').isInt({ min: 0 }),
  ],
  calculateRecovery
);

export default router;
