import mongoose, { Schema, Document, Model } from 'mongoose';
import { DisposalRoute } from '../../../shared/types/enums';

// ── Recovery value breakdown ─────────────────────────────────
export interface IRecoveryValues {
  resell: number;
  refurbish: number;
  recycle: number;
  donate: number;
  exchange: number;
}

// ── Document interface ───────────────────────────────────────
export interface IRoutingDecision extends Document {
  _id: mongoose.Types.ObjectId;
  passportId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;

  // Decision inputs (stored for ML retraining)
  healthScore: number;
  demandScore: number;        // 0–100: market demand signal
  repairCost: number;         // Estimated repair cost in INR
  productCategory: string;
  productAgeMonths: number;

  // Decision outputs
  route: DisposalRoute;
  recoveryValue: number;      // Max recovery value for chosen route (INR)
  allRecoveryValues: IRecoveryValues;
  sustainabilityScore: number;
  reasoning: string;

  // Execution tracking
  executedRoute?: DisposalRoute;   // Actual route taken (may differ)
  executedAt?: Date;
  executedBy?: string;             // userId of staff who confirmed

  // Model metadata
  algorithmVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRoutingDecisionModel extends Model<IRoutingDecision> {
  findByPassport(passportId: string): Promise<IRoutingDecision | null>;
  getAggregatedStats(): Promise<Record<string, unknown>>;
}

// ── Recovery values sub-schema ───────────────────────────────
const RecoveryValuesSchema = new Schema<IRecoveryValues>(
  {
    resell:   { type: Number, required: true, min: 0, default: 0 },
    refurbish:{ type: Number, required: true, min: 0, default: 0 },
    recycle:  { type: Number, required: true, min: 0, default: 0 },
    donate:   { type: Number, required: true, min: 0, default: 0 },
    exchange: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

// ── Main schema ──────────────────────────────────────────────
const RoutingDecisionSchema = new Schema<IRoutingDecision, IRoutingDecisionModel>(
  {
    passportId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Passport ID is required'],
      ref: 'Passport',
      index: true,
      unique: true,   // One routing decision per passport
    },
    productId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Product ID is required'],
      ref: 'Product',
      index: true,
    },
    healthScore: {
      type: Number,
      required: true,
      min: [0, 'Health score cannot be below 0'],
      max: [100, 'Health score cannot exceed 100'],
    },
    demandScore: {
      type: Number,
      required: true,
      min: [0, 'Demand score cannot be below 0'],
      max: [100, 'Demand score cannot exceed 100'],
    },
    repairCost: {
      type: Number,
      required: true,
      min: [0, 'Repair cost cannot be negative'],
    },
    productCategory: {
      type: String,
      required: true,
      trim: true,
    },
    productAgeMonths: {
      type: Number,
      required: true,
      min: [0, 'Age cannot be negative'],
    },
    route: {
      type: String,
      required: [true, 'Recommended route is required'],
      enum: {
        values: Object.values(DisposalRoute),
        message: '{VALUE} is not a valid disposal route',
      },
      index: true,
    },
    recoveryValue: {
      type: Number,
      required: [true, 'Recovery value is required'],
      min: [0, 'Recovery value cannot be negative'],
    },
    allRecoveryValues: {
      type: RecoveryValuesSchema,
      required: true,
    },
    sustainabilityScore: {
      type: Number,
      required: true,
      min: [0, 'Sustainability score cannot be below 0'],
      max: [100, 'Sustainability score cannot exceed 100'],
    },
    reasoning: {
      type: String,
      required: [true, 'Reasoning is required'],
      maxlength: [1000, 'Reasoning too long'],
    },
    executedRoute: {
      type: String,
      enum: Object.values(DisposalRoute),
    },
    executedAt: { type: Date },
    executedBy: { type: String },
    algorithmVersion: {
      type: String,
      required: true,
      default: '1.0.0',
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
RoutingDecisionSchema.index({ passportId: 1 }, { unique: true });
RoutingDecisionSchema.index({ route: 1, createdAt: -1 });
RoutingDecisionSchema.index({ recoveryValue: -1 });
RoutingDecisionSchema.index({ sustainabilityScore: -1 });
RoutingDecisionSchema.index({ productCategory: 1, route: 1 });

// ── Static: find by passport ─────────────────────────────────
RoutingDecisionSchema.statics.findByPassport = function (
  passportId: string
): Promise<IRoutingDecision | null> {
  return this.findOne({ passportId }).exec();
};

// ── Static: route distribution stats ────────────────────────
RoutingDecisionSchema.statics.getAggregatedStats = function (): Promise<
  Record<string, unknown>
> {
  return this.aggregate([
    {
      $group: {
        _id: '$route',
        count: { $sum: 1 },
        avgRecoveryValue: { $avg: '$recoveryValue' },
        totalRecoveryValue: { $sum: '$recoveryValue' },
        avgSustainabilityScore: { $avg: '$sustainabilityScore' },
      },
    },
    { $sort: { count: -1 } },
  ]).exec();
};

export const RoutingDecisionModel = mongoose.model<
  IRoutingDecision,
  IRoutingDecisionModel
>('RoutingDecision', RoutingDecisionSchema);
