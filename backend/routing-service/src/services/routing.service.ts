import { RoutingInput, RoutingDecision, RecoveryValues, DisposalRoute } from '../../../shared/types';
import { RoutingDecisionModel } from '../models/RoutingDecision.model';

/**
 * Recovery Value Optimizer + Intelligent Routing Engine
 *
 * Algorithm:
 * 1. Calculate recovery value for each disposal route
 * 2. Apply sustainability weighting
 * 3. Select route with maximum weighted value
 *
 * This is a deterministic rule-based engine that can be replaced with
 * a trained XGBoost model when labeled routing outcome data is available.
 */
export class RoutingService {
  /**
   * Calculate estimated recovery values for all disposal routes (in INR).
   */
  calculateRecoveryValues(input: RoutingInput): RecoveryValues {
    const { healthScore, marketDemand, repairCost, productCategory } = input;

    // Base market value estimation using health score (simplified model)
    // In production: fetch from a pricing API or trained regression model
    const categoryBasePrice = this.getCategoryBasePrice(productCategory);
    const healthMultiplier = healthScore / 100;
    const demandMultiplier = marketDemand / 100;

    const resell = Math.round(
      categoryBasePrice * healthMultiplier * demandMultiplier * 0.85
    );

    const refurbishRevenue = Math.round(
      categoryBasePrice * Math.min(healthMultiplier * 1.15, 1) * demandMultiplier * 0.9
    );
    const refurbish = Math.max(0, refurbishRevenue - repairCost);

    const recycle = Math.round(categoryBasePrice * 0.05 * healthMultiplier);

    // Donate: no direct revenue, but calculated as ESG/tax equivalent value
    const donate = Math.round(categoryBasePrice * 0.1);

    const exchange = Math.round(categoryBasePrice * healthMultiplier * 0.7);

    return { resell, refurbish, recycle, donate, exchange };
  }

  /**
   * Determine optimal disposal route based on recovery values and sustainability.
   */
  async decideRoute(input: RoutingInput): Promise<RoutingDecision> {
    const recoveryValues = this.calculateRecoveryValues(input);

    // Apply sustainability bonus: prefer refurbish/donate over recycle
    const weightedValues: Record<DisposalRoute, number> = {
      resell: recoveryValues.resell,
      refurbish: recoveryValues.refurbish * 1.05,      // 5% sustainability bonus
      donate: recoveryValues.donate * 1.2,              // 20% ESG bonus
      recycle: recoveryValues.recycle,
      exchange: recoveryValues.exchange * 0.95,
    };

    // Hard rules based on health score thresholds
    let recommendedRoute: DisposalRoute;
    if (input.healthScore >= 80 && input.marketDemand >= 60) {
      // High health + high demand: direct resell or refurbish
      recommendedRoute = weightedValues.refurbish >= weightedValues.resell ? 'refurbish' : 'resell';
    } else if (input.healthScore >= 50) {
      // Mid health: compare refurbish vs resell
      const best = this.getBestRoute(weightedValues);
      recommendedRoute = best === 'recycle' ? 'donate' : best;
    } else if (input.healthScore >= 20) {
      // Low health: donate or recycle
      recommendedRoute = recoveryValues.donate >= recoveryValues.recycle ? 'donate' : 'recycle';
    } else {
      // Very poor health: recycle
      recommendedRoute = 'recycle';
    }

    const maxRecoveryValue = recoveryValues[recommendedRoute];
    const sustainabilityScore = this.calculateSustainabilityScore(recommendedRoute, input.healthScore);
    const reasoning = this.generateReasoning(recommendedRoute, recoveryValues, input);

    // Persist decision
    await RoutingDecisionModel.create({
      passportId: input.passportId,
      productId: `product_${input.passportId}`,
      recommendedRoute,
      recoveryValues,
      maxRecoveryValue,
      sustainabilityScore,
      reasoning,
    });

    return { recommendedRoute, recoveryValues, maxRecoveryValue, sustainabilityScore, reasoning };
  }

  private getBestRoute(weightedValues: Record<DisposalRoute, number>): DisposalRoute {
    return (Object.entries(weightedValues) as [DisposalRoute, number][]).reduce(
      (best, [route, value]) => (value > best[1] ? [route, value] : best),
      ['recycle', 0] as [DisposalRoute, number]
    )[0];
  }

  private getCategoryBasePrice(category: string): number {
    // Approximate base prices per category (INR)
    const prices: Record<string, number> = {
      electronics: 25000,
      laptops: 60000,
      phones: 20000,
      appliances: 15000,
      furniture: 10000,
      apparel: 2000,
      books: 500,
      tools: 3000,
    };
    return prices[category.toLowerCase()] ?? 5000;
  }

  private calculateSustainabilityScore(route: DisposalRoute, healthScore: number): number {
    const routeScores: Record<DisposalRoute, number> = {
      refurbish: 90,
      resell: 80,
      donate: 85,
      exchange: 75,
      recycle: 60,
    };
    return Math.round(routeScores[route] * (healthScore / 100) + routeScores[route] * 0.3);
  }

  private generateReasoning(
    route: DisposalRoute,
    values: RecoveryValues,
    input: RoutingInput
  ): string {
    const valueStr = `₹${values[route].toLocaleString('en-IN')}`;
    const reasons: Record<DisposalRoute, string> = {
      resell: `Health score ${input.healthScore}/100 with ${input.marketDemand}% market demand supports direct resale at ${valueStr} recovery.`,
      refurbish: `Refurbishing yields ${valueStr} after ₹${input.repairCost} repair cost, exceeding direct resale due to high demand.`,
      donate: `Health score ${input.healthScore}/100 makes donation (${valueStr} ESG value) optimal over low recycle value.`,
      recycle: `Health score ${input.healthScore}/100 is too low for resale. Recycling recovers ${valueStr} from raw materials.`,
      exchange: `Exchange program at ${valueStr} provides best value given current market conditions.`,
    };
    return reasons[route];
  }
}

export const routingService = new RoutingService();
