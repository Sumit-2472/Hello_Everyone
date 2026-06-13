import { GreenCreditModel, CREDIT_VALUES } from '../models/GreenCredit.model';
import { AppError } from '../../../shared/middleware/errorHandler';
import { CreditAction, GreenCreditTransaction, SustainabilityMetrics } from '../../../shared/types';

export class CreditService {
  /**
   * Award green credits to a user for a sustainable action.
   */
  async awardCredits(
    userId: string,
    action: CreditAction,
    relatedEntityId?: string
  ): Promise<GreenCreditTransaction> {
    const credits = CREDIT_VALUES[action];
    if (!credits) throw new AppError(`Unknown credit action: ${action}`, 400);

    const descriptions: Record<CreditAction, string> = {
      buy_refurbished: `+${credits} credits for buying a refurbished product`,
      donate_product: `+${credits} credits for donating a product`,
      choose_sustainable_route: `+${credits} credits for choosing a sustainable disposal route`,
      return_reusable: `+${credits} credits for returning a reusable item`,
      refer_user: `+${credits} credits for referring a new user`,
    };

    const transaction = await GreenCreditModel.create({
      userId,
      action,
      credits,
      description: descriptions[action],
      relatedEntityId,
    });

    return this.toDTO(transaction);
  }

  /**
   * Get all credit transactions for a user.
   */
  async getUserCredits(userId: string): Promise<{
    transactions: GreenCreditTransaction[];
    totalCredits: number;
  }> {
    const transactions = await GreenCreditModel.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const totalCredits = transactions.reduce((sum, t) => sum + t.credits, 0);

    return {
      transactions: transactions.map(this.toDTO),
      totalCredits,
    };
  }

  /**
   * Get sustainability metrics (aggregated) for a user.
   */
  async getSustainabilityMetrics(userId: string): Promise<SustainabilityMetrics> {
    const transactions = await GreenCreditModel.find({ userId }).lean();

    const totalCredits = transactions.reduce((sum, t) => sum + t.credits, 0);
    const productsReused = transactions.filter(
      (t) => t.action === 'buy_refurbished' || t.action === 'donate_product'
    ).length;

    // CO₂ savings: ~8.4 kg per refurbished device (industry average estimate)
    const co2SavedKg = productsReused * 8.4;
    // Waste: ~1.2 kg average product weight
    const wastePreventedKg = productsReused * 1.2;

    return {
      userId,
      productsReused,
      co2SavedKg: parseFloat(co2SavedKg.toFixed(2)),
      wastePreventedKg: parseFloat(wastePreventedKg.toFixed(2)),
      greenCreditsEarned: totalCredits,
      greenCreditsRedeemed: 0, // Redemption system placeholder
      period: 'all_time',
    };
  }

  private toDTO(transaction: any): GreenCreditTransaction {
    return {
      id: transaction._id.toString(),
      userId: transaction.userId,
      action: transaction.action,
      credits: transaction.credits,
      description: transaction.description,
      relatedEntityId: transaction.relatedEntityId,
      createdAt: transaction.createdAt,
    };
  }
}

export const creditService = new CreditService();
