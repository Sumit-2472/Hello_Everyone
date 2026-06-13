import { Router } from 'express';
import multer from 'multer';
import { gradeVisual, gradeTelemetry, getPassportByReturnId, getPassportById } from '../controllers/passport.controller';
import { authenticate, authorize } from '../../../shared/middleware/authMiddleware';

const router = Router();

// Store files in memory for Gemini processing
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

/**
 * @route   POST /api/v1/passports/grade/visual
 * @desc    Grade returned product visually using Gemini Vision (Tier 1)
 * @access  Private (warehouse_staff, admin)
 */
router.post(
  '/grade/visual',
  authenticate,
  authorize('warehouse_staff', 'admin'),
  upload.array('images', 5),
  gradeVisual
);

/**
 * @route   POST /api/v1/passports/grade/telemetry
 * @desc    Grade device using diagnostics data (Tier 3)
 * @access  Private (warehouse_staff, admin)
 */
router.post(
  '/grade/telemetry',
  authenticate,
  authorize('warehouse_staff', 'admin'),
  gradeTelemetry
);

/**
 * @route   GET /api/v1/passports/return/:returnId
 * @desc    Get passport by return ID
 * @access  Private
 */
router.get('/return/:returnId', authenticate, getPassportByReturnId);

/**
 * @route   GET /api/v1/passports/:id
 * @desc    Get passport by ID
 * @access  Private
 */
router.get('/:id', authenticate, getPassportById);

export default router;
