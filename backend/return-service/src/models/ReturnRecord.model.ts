import mongoose, { Schema, Document } from 'mongoose';

export interface IReturnRecord extends Document {
  userId: string;
  productId: string;
  productCategory: string;
  productName: string;
  returnProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  explanation: string[];
  sizeSelected?: string;
  sizeRecommended?: string;
  wasReturnPrevented: boolean;
  createdAt: Date;
}

const ReturnRecordSchema = new Schema<IReturnRecord>(
  {
    userId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    productCategory: { type: String, required: true },
    productName: { type: String, required: true },
    returnProbability: { type: Number, required: true, min: 0, max: 100 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], required: true },
    explanation: [{ type: String }],
    sizeSelected: { type: String },
    sizeRecommended: { type: String },
    wasReturnPrevented: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

ReturnRecordSchema.index({ userId: 1, createdAt: -1 });
ReturnRecordSchema.index({ productId: 1 });

export const ReturnRecordModel = mongoose.model<IReturnRecord>('ReturnRecord', ReturnRecordSchema);
