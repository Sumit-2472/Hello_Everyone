import mongoose from 'mongoose';
import { BaseRepository } from '../../../shared/repositories/BaseRepository';
import { RoutingDecisionModel, IRoutingDecision } from '../models/RoutingDecision.model';
import { DisposalRoute } from '../../../shared/types/enums';

export class RoutingDecisionRepository extends BaseRepository<IRoutingDecision> {
  constructor() {
    super(RoutingDecisionModel);
  }

  // ── Domain-specific queries ──────────────────────────────

  async findByPassport(passportId: string): Promise<IRoutingDecision | null> {
    return RoutingDecisionModel.findOne({
      passportId: new mongoose.Types.ObjectId(passportId),
    })
      .lean<IRoutingDecision>()
      .exec();
  }

  async findByProduct(productId: string): Promise<IRoutingDecision[]> {
    return RoutingDecisionModel.find({
      productId: new mongoose.Types.ObjectId(productId),
    })
      .sort({ createdAt: -1 })
      .lean<IRoutingDecision[]>()
      .exec();
  }

  /** Record that the decision was actually executed by warehouse staff */
  async markExecuted(
    decisionId: string,
    executedRoute: DisposalRoute,
    executedBy: string
  ): Promise<IRoutingDecision | null> {
    return RoutingDecisionModel.findByIdAndUpdate(
      decisionId,
      {
        $set: {
          executedRoute,
          executedAt: new Date(),
          executedBy,
        },
      },
      { new: true, runValidators: true }
    )
      .lean<IRoutingDecision>()
      .exec();
  }

  /** Get route distribution for analytics dashboard */
  async getRouteDistribution(): Promise<
    Array<{
      route: DisposalRoute;
      count: number;
      avgRecoveryValue: number;
      totalRecoveryValue: number;
    }>
  > {
    return RoutingDecisionModel.aggregate([
      {
        $group: {
          _id: '$route',
          count:              { $sum: 1 },
          avgRecoveryValue:   { $avg: '$recoveryValue' },
          totalRecoveryValue: { $sum: '$recoveryValue' },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          _id: 0,
          route: '$_id',
          count: 1,
          avgRecoveryValue: { $round: ['$avgRecoveryValue', 2] },
          totalRecoveryValue: 1,
        },
      },
    ]).exec();
  }

  /** Total recovery value in a given date range */
  async getTotalRecoveryValue(from: Date, to: Date): Promise<number> {
    const result = await RoutingDecisionModel.aggregate([
      { $match: { createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: '$recoveryValue' } } },
    ]).exec();
    return result.length > 0 ? result[0].total : 0;
  }

  /** Decisions where recommended ≠ executed — useful for ML feedback loop */
  async getDecisionOverrides(): Promise<IRoutingDecision[]> {
    return RoutingDecisionModel.find({
      executedRoute: { $exists: true, $ne: null },
      $expr: { $ne: ['$route', '$executedRoute'] },
    })
      .lean<IRoutingDecision[]>()
      .exec();
  }
}

export const routingDecisionRepository = new RoutingDecisionRepository();
