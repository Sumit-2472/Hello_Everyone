import mongoose from 'mongoose';
import { BaseRepository } from '../../../shared/repositories/BaseRepository';
import { PassportModel, IProductPassport } from '../models/Passport.model';
import { CosmeticGrade, FunctionalGrade } from '../../../shared/types/enums';

export class PassportRepository extends BaseRepository<IProductPassport> {
  constructor() {
    super(PassportModel);
  }

  // ── Domain-specific queries ──────────────────────────────

  async findByReturnRequest(returnRequestId: string): Promise<IProductPassport | null> {
    return PassportModel.findOne({
      returnRequestId: new mongoose.Types.ObjectId(returnRequestId),
    })
      .select('-aiAnalysisRaw')
      .lean<IProductPassport>()
      .exec();
  }

  async findByProduct(productId: string): Promise<IProductPassport[]> {
    return PassportModel.find({
      productId: new mongoose.Types.ObjectId(productId),
    })
      .sort({ createdAt: -1 })
      .select('-aiAnalysisRaw')
      .lean<IProductPassport[]>()
      .exec();
  }

  /** Get all passports eligible for marketplace listing */
  async findPublishable(minHealthScore = 40): Promise<IProductPassport[]> {
    return PassportModel.find({
      healthScore:  { $gte: minHealthScore },
      aiVerified:   true,
      isPublished:  false,
      functionalGrade: {
        $in: [FunctionalGrade.Operational, FunctionalGrade.MinorIssues],
      },
    })
      .sort({ healthScore: -1 })
      .lean<IProductPassport[]>()
      .exec();
  }

  /** Mark passport as published to marketplace */
  async markPublished(passportId: string): Promise<IProductPassport | null> {
    return PassportModel.findByIdAndUpdate(
      passportId,
      { $set: { isPublished: true } },
      { new: true }
    )
      .lean<IProductPassport>()
      .exec();
  }

  /** Get raw AI analysis for audit (explicitly opts into excluded field) */
  async findWithRawAnalysis(passportId: string): Promise<IProductPassport | null> {
    return PassportModel.findById(passportId)
      .select('+aiAnalysisRaw')
      .lean<IProductPassport>()
      .exec();
  }

  /** Health score distribution — for dashboard analytics */
  async getHealthScoreDistribution(): Promise<Array<{ range: string; count: number }>> {
    return PassportModel.aggregate([
      {
        $bucket: {
          groupBy: '$healthScore',
          boundaries: [0, 25, 50, 70, 85, 101],
          default: 'other',
          output: { count: { $sum: 1 } },
        },
      },
    ]).exec();
  }

  /** Grade distribution breakdown */
  async getGradeDistribution(): Promise<
    Array<{ cosmeticGrade: CosmeticGrade; count: number }>
  > {
    return PassportModel.aggregate([
      { $group: { _id: '$cosmeticGrade', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { _id: 0, cosmeticGrade: '$_id', count: 1 } },
    ]).exec();
  }
}

export const passportRepository = new PassportRepository();
