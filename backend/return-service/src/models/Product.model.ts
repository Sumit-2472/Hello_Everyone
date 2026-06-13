import mongoose, { Schema, Document, Model } from 'mongoose';
import { ProductCategory } from '../../../shared/types/enums';

// ── Nested interfaces ────────────────────────────────────────
export interface IProductSpecification {
  key: string;   // e.g. "RAM", "Color", "Material"
  value: string; // e.g. "16GB", "Black", "Cotton"
}

export interface IDimensionSpec {
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  unit: 'cm' | 'inch' | 'kg' | 'g';
}

// ── Document interface ───────────────────────────────────────
export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  category: ProductCategory;
  brand: string;
  originalPrice: number;
  currentPrice: number;
  sku?: string;
  description?: string;
  specifications: IProductSpecification[];
  dimensions?: IDimensionSpec;
  imageUrls: string[];
  isActive: boolean;
  returnRatePercent: number;   // Updated from analytics
  totalSold: number;
  totalReturned: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductModel extends Model<IProduct> {
  findByCategory(category: ProductCategory): Promise<IProduct[]>;
  findBySku(sku: string): Promise<IProduct | null>;
}

// ── Sub-schemas ──────────────────────────────────────────────
const SpecificationSchema = new Schema<IProductSpecification>(
  {
    key: {
      type: String,
      required: [true, 'Specification key is required'],
      trim: true,
      maxlength: [100, 'Specification key too long'],
    },
    value: {
      type: String,
      required: [true, 'Specification value is required'],
      trim: true,
      maxlength: [500, 'Specification value too long'],
    },
  },
  { _id: false }
);

const DimensionSchema = new Schema<IDimensionSpec>(
  {
    length: { type: Number, min: 0 },
    width:  { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    weight: { type: Number, min: 0 },
    unit: {
      type: String,
      enum: ['cm', 'inch', 'kg', 'g'],
      required: true,
    },
  },
  { _id: false }
);

// ── Main schema ──────────────────────────────────────────────
const ProductSchema = new Schema<IProduct, IProductModel>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name too short'],
      maxlength: [300, 'Product name too long'],
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
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
    originalPrice: {
      type: Number,
      required: [true, 'Original price is required'],
      min: [0, 'Price cannot be negative'],
      validate: {
        validator: (v: number) => Number.isFinite(v),
        message: 'Price must be a finite number',
      },
    },
    currentPrice: {
      type: Number,
      required: [true, 'Current price is required'],
      min: [0, 'Price cannot be negative'],
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true,  // Unique but allows multiple nulls
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description too long'],
    },
    specifications: {
      type: [SpecificationSchema],
      default: [],
      validate: {
        validator: (specs: IProductSpecification[]) => specs.length <= 50,
        message: 'Cannot have more than 50 specifications',
      },
    },
    dimensions: {
      type: DimensionSchema,
    },
    imageUrls: {
      type: [String],
      default: [],
      validate: {
        validator: (urls: string[]) => urls.length <= 10,
        message: 'Cannot have more than 10 images',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    returnRatePercent: {
      type: Number,
      default: 0,
      min: [0, 'Return rate cannot be negative'],
      max: [100, 'Return rate cannot exceed 100%'],
    },
    totalSold: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalReturned: {
      type: Number,
      default: 0,
      min: 0,
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
ProductSchema.index({ name: 'text', brand: 'text', description: 'text' }); // Full-text search
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ brand: 1, category: 1 });
ProductSchema.index({ originalPrice: 1 });
ProductSchema.index({ returnRatePercent: -1 });
ProductSchema.index({ sku: 1 }, { unique: true, sparse: true });
ProductSchema.index({ createdAt: -1 });

// ── Virtual: discount percentage ────────────────────────────
ProductSchema.virtual('discountPercent').get(function (this: IProduct) {
  if (this.originalPrice === 0) return 0;
  return Math.round(
    ((this.originalPrice - this.currentPrice) / this.originalPrice) * 100
  );
});

// ── Static methods ───────────────────────────────────────────
ProductSchema.statics.findByCategory = function (
  category: ProductCategory
): Promise<IProduct[]> {
  return this.find({ category, isActive: true }).sort({ name: 1 }).exec();
};

ProductSchema.statics.findBySku = function (
  sku: string
): Promise<IProduct | null> {
  return this.findOne({ sku: sku.toUpperCase() }).exec();
};

export const ProductModel = mongoose.model<IProduct, IProductModel>(
  'Product',
  ProductSchema
);
