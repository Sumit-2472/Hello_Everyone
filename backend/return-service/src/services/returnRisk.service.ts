import { askGeminiJson } from '../../../shared/config/gemini';
import { ReturnRiskInput, ReturnRiskOutput, SizeRecommendation, CompatibilityResult } from '../../../shared/types';
import { ReturnRecordModel } from '../models/ReturnRecord.model';

export class ReturnRiskService {
  /**
   * Predict return probability using Gemini Pro as the reasoning engine.
   * In production, replace with a trained XGBoost/LightGBM model served
   * via AWS Lambda for lower latency and higher throughput.
   */
  async predictReturnRisk(input: ReturnRiskInput): Promise<ReturnRiskOutput> {
    // Fetch user's historical return rate for context
    const historicalReturns = await ReturnRecordModel.find({ userId: input.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const historicalReturnRate =
      historicalReturns.length > 0
        ? (historicalReturns.filter((r) => !r.wasReturnPrevented).length / historicalReturns.length) * 100
        : 0;

    const prompt = `
You are a return risk prediction AI for an e-commerce platform.

Analyze the following purchase context and predict the likelihood of a product return.

Input:
- Product ID: ${input.productId}
- Product Category: ${input.productCategory}
- Selected Size: ${input.selectedSize || 'N/A'}
- User Height: ${input.userHeight || 'N/A'} cm
- User Weight: ${input.userWeight || 'N/A'} kg
- Past Return Count (all time): ${input.pastReturnCount}
- Historical Return Rate (last 10 purchases): ${historicalReturnRate.toFixed(1)}%

Return a JSON object with exactly this shape:
{
  "returnProbability": <number 0-100>,
  "riskLevel": <"low" | "medium" | "high">,
  "explanation": [<array of 2-3 plain-English reasons why this return probability was assigned>]
}

Rules:
- low = probability < 30
- medium = probability 30-65
- high = probability > 65
- Explanations must be specific and actionable (e.g., "Users who selected size M in this category returned 40% of orders")
`;

    const result = await askGeminiJson<{
      returnProbability: number;
      riskLevel: 'low' | 'medium' | 'high';
      explanation: string[];
    }>(prompt);

    // Persist prediction for future model training
    await ReturnRecordModel.create({
      userId: input.userId,
      productId: input.productId,
      productCategory: input.productCategory,
      productName: `Product ${input.productId}`,
      returnProbability: result.returnProbability,
      riskLevel: result.riskLevel,
      explanation: result.explanation,
      sizeSelected: input.selectedSize,
    });

    return {
      returnProbability: result.returnProbability,
      riskLevel: result.riskLevel,
      explanation: result.explanation,
    };
  }

  /**
   * Recommend the correct size based on user body measurements.
   */
  async recommendSize(
    category: string,
    height: number,
    weight: number,
    bodyType?: string
  ): Promise<SizeRecommendation> {
    const prompt = `
You are a size recommendation AI for an e-commerce fashion platform.

Customer profile:
- Category: ${category}
- Height: ${height} cm
- Weight: ${weight} kg
- Body Type: ${bodyType || 'not specified'}

Return a JSON object with exactly this shape:
{
  "recommendedSize": <"XS" | "S" | "M" | "L" | "XL" | "XXL" | or numeric size>,
  "confidence": <number 0-100>,
  "reasoning": <one sentence explaining the recommendation>
}
`;

    return askGeminiJson<SizeRecommendation>(prompt);
  }

  /**
   * Check if a product is compatible with a user's existing device/setup.
   */
  async checkCompatibility(
    productName: string,
    productSpecs: Record<string, string>,
    userDeviceModel: string
  ): Promise<CompatibilityResult> {
    const prompt = `
You are a technical compatibility checker AI.

Product to purchase:
- Name: ${productName}
- Specs: ${JSON.stringify(productSpecs)}

User's existing device: ${userDeviceModel}

Determine if the product is compatible with the user's device.

Return a JSON object with exactly this shape:
{
  "isCompatible": <boolean>,
  "confidence": <number 0-100>,
  "details": <one or two sentences explaining the compatibility verdict>
}
`;

    return askGeminiJson<CompatibilityResult>(prompt);
  }
}

export const returnRiskService = new ReturnRiskService();
