import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  CosmeticGrade,
  FunctionalGrade,
  PassportTier,
} from '../../../shared/types/enums';
// ── Nested interfaces ────────────────────────────────────────
export interface IRepairRecord {
  date: Date;
  description: string;
  cost: number;        // INR
  technician?: string;
  partsReplaced?: string[];
}

export interface IDefectDetail {
  location: string;    // e.g. "back panel", "screen"
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
}

export interface ITelemetryData {
  batteryHealth?: number;        // 0–100
  batteryCycleCount?: number;
  storageHealth?: number;        // 0–100
  cpuBenchmarkScore?: number;
  memoryBenchmarkScore?: number;
  screenDeadPixels?: number;
  overheatingDetected?: boolean;
}

// ── Document interface ───────────────────────────────────────
export interface IProductPassport extends Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  returnRequestId: mongoose.Types.ObjectId;
  gradedBy: string;              // userId of warehouse staff
  tier: PassportTier;

  // Grading outputs
  healthScore: number;           // 0–100 composite
  cosmeticGrade: CosmeticGrade;
  functionalGrade: FunctionalGrade;
  confidenceScore: number;       // 0–100 AI confidence

  // Evidence
  imageUrls: string[];           // S3 URLs
  videoUrls: string[];           // S3 URLs (for mechanical tier)

  // Detailed findings
  defects: IDefectDetail[];
  telemetry?: ITelemetryData;    // Populated for Tier 3 (Telemetry)
  repairHistory: IRepairRecord[];

  // AI metadata
  aiAnalysisRaw?: string;        // Raw Gemini JSON response (audit)
  aiModelVersion?: string;

  aiVerified: boolean;
  isPublished: boolean;          // True when visible on marketplace
  createdAt: Date;
  updatedAt: Date;

  // Instance method
  getGradeLabel(): string;
}

export interface IProductPassportModel extends Model<IProductPassport> {
  findByProduct(productId: string): Promise<IProductPassport[]>;
  findLatestByReturnRequest(returnRequestId: string): Promise<IProductPassport | null>;
}

// ── Sub-schemas ──────────────────────────────────────────────
const RepairRecordSchema = new Schema<IRepairRecord>(
  {
    date: { type: Date, required: true },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Description too long'],
    },
    cost: {
      type: Number,
      required: true,
      min: [0, 'Repair cost cannot be negative'],
    },
    technician: { type: String, maxlength: 100 },
    partsReplaced: [{ type: String, maxlength: 200 }],
  },
  { _id: false }
);

const DefectDetailSchema = new Schema<IDefectDetail>(
  {
    location: {
      type: String,
      required: true,
      maxlength: [200, 'Location description too long'],
    },
    severity: {
      type: String,
      required: true,
      enum: {
        values: ['minor', 'moderate', 'severe'],
        message: '{VALUE} is not a valid severity level',
      },
    },
    description: {
      type: String,
      required: true,
      maxlength: [500, 'Defect description too long'],
    },
  },
  { _id: false }
);

const TelemetrySchema = new Schema<ITelemetryData>(
  {
    batteryHealth:        { type: Number, min: 0, max: 100 },
    batteryCycleCount:    { type: Number, min: 0 },
    storageHealth:        { type: Number, min: 0, max: 100 },
    cpuBenchmarkScore:    { type: Number, min: 0 },
    memoryBenchmarkScore: { type: Number, min: 0 },
    screenDeadPixels:     { type: Number, min: 0 },
    overheatingDetected:  { type: Boolean },
  },
  { _id: false }
);

// ── Main schema ──────────────────────────────────────────────
const PassportSchema = new Schema<IProductPassport, IProductPassportModel>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Product ID is required'],
      ref: 'Product',
      index: true,
    },
    returnRequestId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Return request ID is required'],
      ref: 'ReturnRequest',
      unique: true,             // One passport per return request
    },
    gradedBy: {
      type: String,
      required: [true, 'Grader user ID is required'],
    },
    tier: {
      type: String,
      required: [true, 'Grading tier is required'],
      enum: {
        values: Object.values(PassportTier),
        message: '{VALUE} is not a valid grading tier',
      },
    },
    healthScore: {
      type: Number,
      required: [true, 'Health score is required'],
      min: [0, 'Health score cannot be below 0'],
      max: [100, 'Health score cannot exceed 100'],
    },
    cosmeticGrade: {
      type: String,
      required: [true, 'Cosmetic grade is required'],
      enum: {
        values: Object.values(CosmeticGrade),
        message: '{VALUE} is not a valid cosmetic grade',
      },
    },
    functionalGrade: {
      type: String,
      required: [true, 'Functional grade is required'],
      enum: {
        values: Object.values(FunctionalGrade),
        message: '{VALUE} is not a valid functional grade',
      },
    },
    confidenceScore: {
      type: Number,
      required: [true, 'Confidence score is required'],
      min: [0, 'Confidence score cannot be below 0'],
      max: [100, 'Confidence score cannot exceed 100'],
    },
    imageUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (urls: string[]) => urls.length <= 10,
        message: 'Maximum 10 images allowed',
      },
    },
    videoUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (urls: string[]) => urls.length <= 3,
        message: 'Maximum 3 videos allowed',
      },
    },
    defects: {
      type: [DefectDetailSchema],
      default: [],
    },
    telemetry: {
      type: TelemetrySchema,
    },
    repairHistory: {
      type: [RepairRecordSchema],
      default: [],
    },
    aiAnalysisRaw: {
      type: String,
      select: false,   // Excluded from default queries — audit only
    },
    aiModelVersion: { type: String },
    aiVerified: {
      type: Boolean,
      default: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret.aiAnalysisRaw;
        return ret;
      },
    },
  }
);

// ── Indexes ──────────────────────────────────────────────────
PassportSchema.index({ productId: 1, createdAt: -1 });
PassportSchema.index({ healthScore: -1 });
PassportSchema.index({ cosmeticGrade: 1, functionalGrade: 1 });
PassportSchema.index({ aiVerified: 1, isPublished: 1 });
PassportSchema.index({ returnRequestId: 1 }, { unique: true });

// ── Instance methods ─────────────────────────────────────────
PassportSchema.methods.getGradeLabel = function (): string {
  const score: number = this.healthScore;
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Poor';
};

// ── Static methods ───────────────────────────────────────────
PassportSchema.statics.findByProduct = function (
  productId: string
): Promise<IProductPassport[]> {
  return this.find({ productId })
    .sort({ createdAt: -1 })
    .select('-aiAnalysisRaw')
    .exec();
};

PassportSchema.statics.findLatestByReturnRequest = function (
  returnRequestId: string
): Promise<IProductPassport | null> {
  return this.findOne({ returnRequestId })
    .sort({ createdAt: -1 })
    .select('-aiAnalysisRaw')
    .exec();
};

export const PassportModel = mongoose.model<
  IProductPassport,
  IProductPassportModel
>('Passport', PassportSchema);
