import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  ListingStatus,
  CosmeticGrade,
  FunctionalGrade,
  ProductCategory,
} from '../../../shared/types/enums';

// ── Trust Card sub-interface ─────────────────────────────────
export interface ITrustCard {
  healthScore: number;
  cosmeticGrade: CosmeticGrade;
  functionalGrade: FunctionalGrade;
  batteryHealth?: number;
  storageHealth?: number;
  aiVerified: boolean;
  verifiedAt: Date;
  warrantyMonths: number;
  defectSummary: string;     // Human-readable defect summary from passport
}

// ── Document interface ───────────────────────────────────────
export interface IMarketplaceListing extends Document {
  _id: mongoose.Types.ObjectId;
  passportId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  sellerId: string;           // userId of seller / platform

  title: string;
  description: string;
  category: ProductCategory;
  brand: string;
  sellingPrice: number;        // Final listed price (INR)
  originalPrice: number;       // For discount % display
  trustCard: ITrustCard;
  imageUrls: string[];

  status: ListingStatus;
  viewCount: number;
  greenCreditsEarned: number;  // Credits buyer earns on purchase

  // Buyer info (populated after sale)
  buyerId?: string;
  soldAt?: Date;

  // SEO / search
  tags: string[];

  createdAt: Date;
  updatedAt: Date;

  // Virtual
  discountPercent: number;
}

export interface IMarketplaceListingModel extends Model<IMarketplaceListing> {
  findActive(
    filter?: Partial<{ category: ProductCategory; minHealth: number }>
  ): Promise<IMarketplaceListing[]>;
  findByPassport(passportId: string): Promise<IMarketplaceListing | null>;
}

// ── Trust Card sub-schema ────────────────────────────────────
const TrustCardSchema = new Schema<ITrustCard>(
  {
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
    batteryHealth:  { type: Number, min: 0, max: 100 },
    storageHealth:  { type: Number, min: 0, max: 100 },
    aiVerified:     { type: Boolean, default: true },
    verifiedAt:     { type: Date, default: Date.now },
    warrantyMonths: {
      type: Number,
      required: true,
      min: [0, 'Warranty months cannot be negative'],
      default: 6,
    },
    defectSummary: {
      type: String,
      default: 'No significant defects detected',
      maxlength: [500, 'Defect summary too long'],
    },
  },
  { _id: false }
);

// ── Main schema ──────────────────────────────────────────────
const ListingSchema = new Schema<IMarketplaceListing, IMarketplaceListingModel>(
  {
    passportId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Passport ID is required'],
      ref: 'Passport',
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Product ID is required'],
      ref: 'Product',
      index: true,
    },
    sellerId: {
      type: String,
      required: [true, 'Seller ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [3000, 'Description cannot exceed 3000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: Object.values(ProductCategory),
        message: '{VALUE} is not a valid product category',
      },
      index: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      maxlength: [100, 'Brand name too long'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
      validate: {
        validator: (v: number) => Number.isFinite(v),
        message: 'Selling price must be a valid number',
      },
    },
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0, 'Original price cannot be negative'],
    },
    trustCard: {
      type: TrustCardSchema,
      required: [true, 'Trust card is required'],
    },
    imageUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (urls: string[]) => urls.length <= 10,
        message: 'Maximum 10 images allowed',
      },
    },
    status: {
      type: String,
      enum: {
        values: Object.values(ListingStatus),
        message: '{VALUE} is not a valid listing status',
      },
      default: ListingStatus.Active,
      index: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    greenCreditsEarned: {
      type: Number,
      default: 20,
      min: [0, 'Green credits cannot be negative'],
    },
    buyerId: { type: String },
    soldAt:  { type: Date },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags: string[]) => tags.length <= 20,
        message: 'Maximum 20 tags allowed',
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        // delete
        return ret;
      },
    },
  }
);

// ── Indexes ──────────────────────────────────────────────────
ListingSchema.index({ status: 1, category: 1, sellingPrice: 1 });
ListingSchema.index({ status: 1, 'trustCard.healthScore': -1 });
ListingSchema.index({ status: 1, createdAt: -1 });
ListingSchema.index({ tags: 1 });
ListingSchema.index({ title: 'text', description: 'text', brand: 'text', tags: 'text' }); // Full-text
ListingSchema.index({ passportId: 1 }, { unique: true }); // One listing per passport

// ── Virtual: discount percentage ─────────────────────────────
ListingSchema.virtual('discountPercent').get(function (this: IMarketplaceListing) {
  if (!this.originalPrice || this.originalPrice === 0) return 0;
  return Math.round(
    ((this.originalPrice - this.sellingPrice) / this.originalPrice) * 100
  );
});

// ── Static methods ───────────────────────────────────────────
ListingSchema.statics.findActive = function (
  filter: Partial<{ category: ProductCategory; minHealth: number }> = {}
): Promise<IMarketplaceListing[]> {
  const query: Record<string, unknown> = { status: ListingStatus.Active };
  if (filter.category) query.category = filter.category;
  if (filter.minHealth) query['trustCard.healthScore'] = { $gte: filter.minHealth };
  return this.find(query).sort({ createdAt: -1 }).exec();
};

ListingSchema.statics.findByPassport = function (
  passportId: string
): Promise<IMarketplaceListing | null> {
  return this.findOne({ passportId }).exec();
};

export const ListingModel = mongoose.model<
  IMarketplaceListing,
  IMarketplaceListingModel
>('Listing', ListingSchema);
