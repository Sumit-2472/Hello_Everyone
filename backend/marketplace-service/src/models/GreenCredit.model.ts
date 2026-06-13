import mongoose, { Schema, Document, Model } from 'mongoose';
import { CreditAction } from '../../../shared/types/enums';

// ── Credit value map (points per action) ─────────────────────
export const CREDIT_POINT_VALUES: Record<CreditAction, number> = {
  [CreditAction.BuyRefurbished]:        20,
  [CreditAction.DonateProduct]:        100,
  [CreditAction.ChooseSustainableRoute]: 30,
  [CreditAction.ReturnReusable]:         50,
  [CreditAction.ReferUser]:             15,
  [CreditAction.Redemption]:             0,  // Redemptions are negative; handled at service layer
};

// ── Document interface ───────────────────────────────────────
export interface IGreenCreditTransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;              // References User in auth-service
  points: number;              // Positive = earned, Negative = redeemed
  action: CreditAction;
  description: string;
  relatedEntityId?: string;    // ListingId, ReturnRequestId, etc.
  relatedEntityType?: string;  // 'listing' | 'return' | 'referral'
  balanceAfter?: number;       // Snapshot of user balance post-transaction
  timestamp: Date;             // Explicit field per requirements (= createdAt)
  createdAt: Date;
  updatedAt: Date;
}

export interface IGreenCreditTransactionModel extends Model<IGreenCreditTransaction> {
  getUserBalance(userId: string): Promise<number>;
  getTransactionHistory(userId: string, limit?: number): Promise<IGreenCreditTransaction[]>;
  getLeaderboard(limit?: number): Promise<Array<{ userId: string; totalPoints: number }>>;
}

// ── Schema ───────────────────────────────────────────────────
const GreenCreditSchema = new Schema<
  IGreenCreditTransaction,
  IGreenCreditTransactionModel
>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      index: true,
    },
    points: {
      type: Number,
      required: [true, 'Points value is required'],
      validate: {
        validator: (v: number) => v !== 0 && Number.isFinite(v),
        message: 'Points must be a non-zero finite number',
      },
    },
    action: {
      type: String,
      required: [true, 'Credit action is required'],
      enum: {
        values: Object.values(CreditAction),
        message: '{VALUE} is not a valid credit action',
      },
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    relatedEntityId: {
      type: String,
      index: true,
    },
    relatedEntityType: {
      type: String,
      enum: ['listing', 'return', 'referral', 'donation', 'other'],
    },
    balanceAfter: {
      type: Number,
      min: [0, 'Balance cannot be negative'],
    },
    // Explicit timestamp field per requirements spec
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,    // Also adds createdAt / updatedAt
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
GreenCreditSchema.index({ userId: 1, timestamp: -1 });
GreenCreditSchema.index({ userId: 1, action: 1 });
GreenCreditSchema.index({ action: 1, timestamp: -1 });
GreenCreditSchema.index({ relatedEntityId: 1, userId: 1 });

// ── Pre-save: auto-populate description if missing ───────────
GreenCreditSchema.pre<IGreenCreditTransaction>('save', function (next) {
  if (!this.description) {
    const actionLabels: Record<CreditAction, string> = {
      [CreditAction.BuyRefurbished]:         'Purchased a refurbished product',
      [CreditAction.DonateProduct]:          'Donated a product',
      [CreditAction.ChooseSustainableRoute]: 'Chose a sustainable disposal route',
      [CreditAction.ReturnReusable]:         'Returned a reusable item',
      [CreditAction.ReferUser]:              'Referred a new user',
      [CreditAction.Redemption]:             'Redeemed green credits',
    };
    this.description = actionLabels[this.action] || 'Green credit transaction';
  }
  next();
});

// ── Static: compute user balance ────────────────────────────
GreenCreditSchema.statics.getUserBalance = async function (
  userId: string
): Promise<number> {
  const result = await this.aggregate([
    { $match: { userId } },
    { $group: { _id: null, total: { $sum: '$points' } } },
  ]).exec();
  return result.length > 0 ? Math.max(0, result[0].total) : 0;
};

// ── Static: transaction history ─────────────────────────────
GreenCreditSchema.statics.getTransactionHistory = function (
  userId: string,
  limit = 20
): Promise<IGreenCreditTransaction[]> {
  return this.find({ userId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean<IGreenCreditTransaction[]>()
    .exec();
};

// ── Static: global leaderboard ───────────────────────────────
GreenCreditSchema.statics.getLeaderboard = function (
  limit = 10
): Promise<Array<{ userId: string; totalPoints: number }>> {
  return this.aggregate([
    { $group: { _id: '$userId', totalPoints: { $sum: '$points' } } },
    { $match: { totalPoints: { $gt: 0 } } },
    { $sort: { totalPoints: -1 } },
    { $limit: limit },
    { $project: { _id: 0, userId: '$_id', totalPoints: 1 } },
  ]).exec();
};

export const GreenCreditModel = mongoose.model<
  IGreenCreditTransaction,
  IGreenCreditTransactionModel
>('GreenCreditTransaction', GreenCreditSchema);
