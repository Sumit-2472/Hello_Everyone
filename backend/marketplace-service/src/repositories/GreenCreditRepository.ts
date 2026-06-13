import { BaseRepository } from '../../../shared/repositories/BaseRepository';
import { GreenCreditModel, IGreenCreditTransaction, CREDIT_POINT_VALUES } from '../models/GreenCredit.model';
import { CreditAction } from '../../../shared/types/enums';
import { AppError } from '../../../shared/middleware/errorHandler';

export class GreenCreditRepository extends BaseRepository<IGreenCreditTransaction> {
  constructor() {
    super(GreenCreditModel);
  }

  // ── Domain-specific queries ──────────────────────────────

  async findByUser(userId: string, limit = 20): Promise<IGreenCreditTransaction[]> {
    return GreenCreditModel.find({ userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean<IGreenCreditTransaction[]>()
      .exec();
  }

  async getUserBalance(userId: string): Promise<number> {
    return GreenCreditModel.getUserBalance(userId);
  }

  /**
   * Award credits for a sustainable action.
   * Calculates balance snapshot atomically.
   */
  async awardCredits(
    userId: string,
    action: CreditAction,
    relatedEntityId?: string,
    relatedEntityType?: string
  ): Promise<IGreenCreditTransaction> {
    if (action === CreditAction.Redemption) {
      throw new AppError('Use redeemCredits() for redemptions', 400);
    }

    const points = CREDIT_POINT_VALUES[action];
    const currentBalance = await this.getUserBalance(userId);

    return this.create({
      userId,
      action,
      points,
      relatedEntityId,
      relatedEntityType,
      balanceAfter: currentBalance + points,
      timestamp: new Date(),
    });
  }

  /**
   * Redeem credits — validates sufficient balance before deducting.
   */
  async redeemCredits(
    userId: string,
    pointsToRedeem: number,
    description: string,
    relatedEntityId?: string
  ): Promise<IGreenCreditTransaction> {
    if (pointsToRedeem <= 0) {
      throw new AppError('Redemption amount must be positive', 400);
    }

    const balance = await this.getUserBalance(userId);
    if (balance < pointsToRedeem) {
      throw new AppError(
        `Insufficient credits. Balance: ${balance}, Required: ${pointsToRedeem}`,
        400
      );
    }

    return this.create({
      userId,
      action: CreditAction.Redemption,
      points: -pointsToRedeem,   // Negative — deduction
      description,
      relatedEntityId,
      relatedEntityType: 'other',
      balanceAfter: balance - pointsToRedeem,
      timestamp: new Date(),
    });
  }

  /** Get full transaction history with pagination */
  async getPaginatedHistory(userId: string, page = 1, limit = 20) {
    return this.paginate(
      { userId } as any,
      page,
      limit,
      { timestamp: -1 }
    );
  }

  /** Monthly credit summary for user dashboard */
  async getMonthlySummary(
    userId: string,
    year: number,
    month: number
  ): Promise<{ earned: number; redeemed: number; net: number }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const result = await GreenCreditModel.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          earned:   { $sum: { $cond: [{ $gt: ['$points', 0] }, '$points', 0] } },
          redeemed: { $sum: { $cond: [{ $lt: ['$points', 0] }, { $abs: '$points' }, 0] } },
        },
      },
    ]).exec();

    if (result.length === 0) return { earned: 0, redeemed: 0, net: 0 };
    const { earned, redeemed } = result[0];
    return { earned, redeemed, net: earned - redeemed };
  }

  /** Global leaderboard */
  async getLeaderboard(limit = 10) {
    return GreenCreditModel.getLeaderboard(limit);
  }

  /** Get all transactions tied to a specific entity (e.g. a listing purchase) */
  async findByRelatedEntity(
    relatedEntityId: string
  ): Promise<IGreenCreditTransaction[]> {
    return GreenCreditModel.find({ relatedEntityId })
      .lean<IGreenCreditTransaction[]>()
      .exec();
  }
}

export const greenCreditRepository = new GreenCreditRepository();
