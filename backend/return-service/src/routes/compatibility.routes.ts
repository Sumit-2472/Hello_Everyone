import { Router } from 'express';
import { body } from 'express-validator';
import { checkCompatibility } from '../controllers/return.controller';
import { authenticate } from '../../../shared/middleware/authMiddleware';

const router = Router();

/**
 * @route   POST /api/v1/compatibility/check
 * @desc    Check if a product is compatible with user's existing device
 * @access  Private
 */
router.post(
  '/check',
  authenticate,
  [
    body('productName').notEmpty().withMessage('productName is required'),
    body('productSpecs').isObject().withMessage('productSpecs must be an object'),
    body('userDeviceModel').notEmpty().withMessage('userDeviceModel is required'),
  ],
  checkCompatibility
);

export default router;
