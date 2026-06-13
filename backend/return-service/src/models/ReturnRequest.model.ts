import mongoose, { Schema, Document, Model } from 'mongoose';
import { ReturnStatus } from '../../../shared/types/enums';

// ── Return reason categories ─────────────────────────────────
export enum ReturnReason {
  WrongSize = 'wrong_size',
  DefectiveDamaged = 'defective_damaged',
  NotAsDescribed = 'not_as_described',
  ChangeOfMind = 'change_of_mind',
  CompatibilityIssue = 'compatibility_issue',
  QualityIssue = 'quality_issue',
  DeliveryDamage = 'delivery_damage',
  Other = 'other',
}

// ── Timeline event for audit trail ──────────────────────────
export interface IStatusEvent {
  status: ReturnStatus;
  timestamp: Date;
  note?: string;
  updatedBy?: string;   // userId of staff member
}

// ── Document interface ───────────────────────────────────────
export interface IReturnRequest extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  reason: ReturnReason;
  reasonDescription?: string;  // Free-text elaboration
  riskScore: number;            // 0–100: AI-predicted return legitimacy risk
  status: ReturnStatus;
  statusHistory: IStatusEvent[];
  images: string[];             // Customer-uploaded evidence
  refundAmount?: number;
  refundIssued: boolean;
  passportId?: mongoose.Types.ObjectId;  // Linked after warehouse inspection
  createdAt: Date;
  updatedAt: Date;

  // Instance method
  addStatusEvent(status: ReturnStatus, note?: string, updatedBy?: string): Promise<IReturnRequest>;
}

export interface IReturnRequestModel extends Model<IReturnRequest> {
  findByUser(userId: string): Promise<IReturnRequest[]>;
  findPendingRequests(): Promise<IReturnRequest[]>;
}

// ── Sub-schema ───────────────────────────────────────────────
const StatusEventSchema = new Schema<IStatusEvent>(
  {
    status: {
      type: String,
      enum: Object.values(ReturnStatus),
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: {
      type: String,
      maxlength: [500, 'Note too long'],
    },
    updatedBy: { type: String },
  },
  { _id: false }
);

// ── Main schema ──────────────────────────────────────────────
const ReturnRequestSchema = new Schema<IReturnRequest, IReturnRequestModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      ref: 'User',
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Product ID is required'],
      ref: 'Product',
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Return reason is required'],
      enum: {
        values: Object.values(ReturnReason),
        message: '{VALUE} is not a valid return reason',
      },
    },
    reasonDescription: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    riskScore: {
      type: Number,
      required: [true, 'Risk score is required'],
      min: [0, 'Risk score cannot be below 0'],
      max: [100, 'Risk score cannot exceed 100'],
      default: 0,
    },
    status: {
      type: String,
      enum: {
        values: Object.values(ReturnStatus),
        message: '{VALUE} is not a valid status',
      },
      default: ReturnStatus.Pending,
      index: true,
    },
    statusHistory: {
      type: [StatusEventSchema],
      default: [],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (imgs: string[]) => imgs.length <= 5,
        message: 'Cannot attach more than 5 images',
      },
    },
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative'],
    },
    refundIssued: {
      type: Boolean,
      default: false,
    },
    passportId: {
      type: Schema.Types.ObjectId,
      ref: 'Passport',
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

// ── Indexes ──────────────────────────────────────────────────
ReturnRequestSchema.index({ userId: 1, createdAt: -1 });
ReturnRequestSchema.index({ productId: 1, status: 1 });
ReturnRequestSchema.index({ status: 1, createdAt: -1 });
ReturnRequestSchema.index({ riskScore: -1 });
// Compound: prevent duplicate active returns for same user+product
ReturnRequestSchema.index(
  { userId: 1, productId: 1, status: 1 },
  {
    partialFilterExpression: {
      status: { $in: [ReturnStatus.Pending, ReturnStatus.Processing] },
    },
  }
);

// ── Pre-save: push initial status to history ─────────────────
ReturnRequestSchema.pre<IReturnRequest>('save', function (next) {
  if (this.isNew) {
    this.statusHistory.push({
      status: ReturnStatus.Pending,
      timestamp: new Date(),
      note: 'Return request created',
    });
  }
  next();
});

// ── Instance method: append status event ────────────────────
ReturnRequestSchema.methods.addStatusEvent = async function (
  status: ReturnStatus,
  note?: string,
  updatedBy?: string
): Promise<IReturnRequest> {
  this.status = status;
  this.statusHistory.push({ status, timestamp: new Date(), note, updatedBy });
  return this.save();
};

// ── Static methods ───────────────────────────────────────────
ReturnRequestSchema.statics.findByUser = function (
  userId: string
): Promise<IReturnRequest[]> {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .populate('productId', 'name category brand imageUrls')
    .exec();
};

ReturnRequestSchema.statics.findPendingRequests = function (): Promise<IReturnRequest[]> {
  return this.find({ status: ReturnStatus.Pending })
    .sort({ riskScore: -1, createdAt: 1 })   // High risk first, then oldest
    .populate('userId', 'name email')
    .populate('productId', 'name category brand')
    .exec();
};

export const ReturnRequestModel = mongoose.model<
  IReturnRequest,
  IReturnRequestModel
>('ReturnRequest', ReturnRequestSchema);
