import mongoose, { Schema, Document, Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@shared/types/enums';
import { CallbackWithoutResult } from 'mongoose';
// ── Interface ────────────────────────────────────────────────
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  greenCredits: number;
  role: UserRole;
  returnCount: number;
  isEmailVerified: boolean;
  refreshToken?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidate: string): Promise<boolean>;
  toSafeObject(): Omit<IUser, 'password' | 'refreshToken'>;
}

export interface IUserModel extends Model<IUser> {
  // Static methods
  findByEmail(email: string): Promise<IUser | null>;
}

// ── Schema ───────────────────────────────────────────────────
const UserSchema = new Schema<IUser, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      maxlength: [255, 'Email cannot exceed 255 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },
    greenCredits: {
      type: Number,
      default: 0,
      min: [0, 'Green credits cannot be negative'],
    },
    role: {
      type: String,
      enum: {
        values: Object.values(UserRole),
        message: '{VALUE} is not a valid role',
      },
      default: UserRole.Customer,
    },
    returnCount: {
      type: Number,
      default: 0,
      min: [0, 'Return count cannot be negative'],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,   // Adds createdAt, updatedAt automatically
    versionKey: false,
    toJSON: {
  transform(_doc, ret) {
    // Cast 'ret' as any to bypass the strict type checking for the transformation
    const transformed = ret as any;
    transformed.id = transformed._id.toString();
    delete transformed._id;
    delete transformed.password;
    delete transformed.refreshToken;
    return transformed;
  },
},
  }
);

// ── Indexes ──────────────────────────────────────────────────
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ greenCredits: -1 });
UserSchema.index({ createdAt: -1 });

// ── Pre-save hook: hash password ─────────────────────────────
// Remove the 'next' parameter entirely for async functions
UserSchema.pre<IUser>('save', async function (this: IUser) {
  if (!this.isModified('password')) {
    return;
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error; // Mongoose will catch the error automatically
  }
});

// ── Instance method: compare password ───────────────────────
UserSchema.methods.comparePassword = async function (
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// ── Instance method: safe serialization ─────────────────────
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  return obj;
};

// ── Static method: find by email ─────────────────────────────
UserSchema.statics.findByEmail = function (email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase() }).select('+password').exec();
};

export const UserModel = mongoose.model<IUser, IUserModel>('User', UserSchema);
