import { analyzeImageWithGemini, askGeminiJson } from '../../../shared/config/gemini';
import { uploadToS3 } from '../../../shared/config/s3';
import { PassportModel } from '../models/Passport.model';
import { AppError } from '../../../shared/middleware/errorHandler';
import { ProductPassport, CosmeticGrade, FunctionalGrade, PassportTier } from '../../../shared/types';

interface GeminiPassportResult {
  healthScore: number;
  cosmeticGrade: CosmeticGrade;
  functionalGrade: FunctionalGrade;
  batteryHealth?: number;
  storageHealth?: number;
  defectsDetected: string[];
  confidenceScore: number;
  reasoning: string;
}

interface TelemetryInput {
  batteryHealth: number;
  batteryCapacity?: number;
  storageHealth?: number;
  cpuScore?: number;
  memoryScore?: number;
  overallDeviceScore?: number;
}

export class PassportService {
  /**
   * Tier 1: Visual grading via Gemini Vision.
   * Upload images to S3, then pass base64 to Gemini for analysis.
   */
  async gradeVisual(
    productId: string,
    returnId: string,
    category: string,
    imageBuffers: Array<{ buffer: Buffer; mimeType: string }>
  ): Promise<ProductPassport> {
    if (imageBuffers.length === 0) {
      throw new AppError('At least one image is required for visual grading', 400);
    }

    // Upload images to S3 for storage - Added index to ensure unique filenames
    const uploadPromises = imageBuffers.map((img, index) =>
      uploadToS3(img.buffer, img.mimeType, `passports/${productId}-${Date.now()}-${index}`)
    );
    const uploadResults = await Promise.all(uploadPromises);
    const imageUrls = uploadResults.map((r) => r.url);

    // Use first image for primary Gemini analysis
    const primaryImage = imageBuffers[0];
    const prompt = `
You are an expert product condition assessor for a recommerce platform.

Analyze this ${category} product image and provide a detailed condition assessment.

Return a JSON object with exactly this shape:
{
  "healthScore": <number 0-100, overall product health>,
  "cosmeticGrade": <"Excellent" | "Good" | "Fair" | "Poor">,
  "functionalGrade": <"Operational" | "Minor Issues" | "Major Issues" | "Non-Functional">,
  "defectsDetected": [<array of specific defects like "small scratch on back panel", "torn fabric edge">],
  "confidenceScore": <number 0-100, your confidence in this assessment>,
  "reasoning": <one sentence summarizing your assessment>
}

Grade definitions:
- Excellent: Like new, no visible defects
- Good: Minor wear, still looks great
- Fair: Visible wear and minor damage, still functional
- Poor: Significant damage affecting appearance or function
`;

    const rawAnalysis = await analyzeImageWithGemini(
      primaryImage.buffer,
      primaryImage.mimeType,
      prompt
    );

    let parsed: GeminiPassportResult;
    try {
      // Safer JSON extraction to avoid markdown backtick issues
      const jsonStart = rawAnalysis.indexOf('{');
      const jsonEnd = rawAnalysis.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("No JSON object found in response");
      }
      const jsonString = rawAnalysis.substring(jsonStart, jsonEnd + 1);
      parsed = JSON.parse(jsonString);
    } catch (error) {
      console.error("Gemini Parsing Error:", error);
      console.error("Raw Gemini Output:", rawAnalysis);
      throw new AppError('AI grading failed to produce valid output. Please retry.', 500);
    }

    const passport = await PassportModel.create({
      productId,
      returnId,
      tier: 'visual' as PassportTier,
      healthScore: parsed.healthScore,
      cosmeticGrade: parsed.cosmeticGrade,
      functionalGrade: parsed.functionalGrade,
      defectsDetected: parsed.defectsDetected || [],
      imageUrls,
      confidenceScore: parsed.confidenceScore,
      aiVerified: true,
      aiAnalysisRaw: rawAnalysis,
      repairHistory: [],
    });

    return this.toPassportDTO(passport);
  }

  /**
   * Tier 3: Telemetry grading for phones, laptops, smart devices.
   * Accepts structured diagnostics data directly.
   */
  async gradeTelemetry(
    productId: string,
    returnId: string,
    productName: string,
    telemetry: TelemetryInput
  ): Promise<ProductPassport> {
    const prompt = `
You are a device health assessment AI for a recommerce platform.

Device: ${productName}
Diagnostics data:
${JSON.stringify(telemetry, null, 2)}

Based on these diagnostics, provide a comprehensive health assessment.

Return a JSON object with exactly this shape:
{
  "healthScore": <number 0-100, weighted average of all metrics>,
  "cosmeticGrade": <"Excellent" | "Good" | "Fair" | "Poor">,
  "functionalGrade": <"Operational" | "Minor Issues" | "Major Issues" | "Non-Functional">,
  "batteryHealth": <number 0-100>,
  "storageHealth": <number 0-100, if available>,
  "defectsDetected": [<array of functional issues detected from diagnostics>],
  "confidenceScore": <number 0-100>,
  "reasoning": <one sentence summarizing device health>
}

Use these thresholds for healthScore:
- 85-100: Excellent condition
- 70-84: Good condition  
- 50-69: Fair condition
- Below 50: Poor condition
`;

    const result = await askGeminiJson<GeminiPassportResult>(prompt);

    const passport = await PassportModel.create({
      productId,
      returnId,
      tier: 'telemetry' as PassportTier,
      healthScore: result.healthScore,
      cosmeticGrade: result.cosmeticGrade,
      functionalGrade: result.functionalGrade,
      batteryHealth: result.batteryHealth ?? telemetry.batteryHealth,
      storageHealth: result.storageHealth ?? telemetry.storageHealth,
      defectsDetected: result.defectsDetected || [],
      confidenceScore: result.confidenceScore,
      aiVerified: true,
      aiAnalysisRaw: JSON.stringify(result),
      repairHistory: [],
      imageUrls: [],
    });

    return this.toPassportDTO(passport);
  }

  /**
   * Get passport by returnId
   */
  async getPassportByReturnId(returnId: string): Promise<ProductPassport> {
    const passport = await PassportModel.findOne({ returnId });
    if (!passport) throw new AppError('Passport not found', 404);
    return this.toPassportDTO(passport);
  }

  /**
   * Get passport by passportId
   */
  async getPassportById(id: string): Promise<ProductPassport> {
    const passport = await PassportModel.findById(id);
    if (!passport) throw new AppError('Passport not found', 404);
    return this.toPassportDTO(passport);
  }

  private toPassportDTO(passport: any): ProductPassport {
    return {
      id: passport._id.toString(),
      productId: passport.productId,
      returnId: passport.returnId,
      tier: passport.tier,
      healthScore: passport.healthScore,
      cosmeticGrade: passport.cosmeticGrade,
      functionalGrade: passport.functionalGrade,
      batteryHealth: passport.batteryHealth,
      storageHealth: passport.storageHealth,
      defectsDetected: passport.defectsDetected,
      repairHistory: passport.repairHistory,
      confidenceScore: passport.confidenceScore,
      aiVerified: passport.aiVerified,
      createdAt: passport.createdAt,
      updatedAt: passport.updatedAt,
    };
  }
}

export const passportService = new PassportService();