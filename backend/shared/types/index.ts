// ============================================================
// Amazon ReLife — Shared Types
// Used across all backend microservices
// ============================================================

// ---------------------------
// Common
// ---------------------------
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
}

// ---------------------------
// User / Auth
// ---------------------------
export type UserRole = 'customer' | 'seller' | 'warehouse_staff' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  greenCredits: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ---------------------------
// Return Prevention
// ---------------------------
export interface ReturnRiskInput {
  productId: string;
  productCategory: string;
  userId: string;
  selectedSize?: string;
  userHeight?: number;    // cm
  userWeight?: number;    // kg
  pastReturnCount: number;
  purchaseHistory?: string[];
}

export interface ReturnRiskOutput {
  returnProbability: number;       // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  explanation: string[];           // human-readable reasons
  sizeRecommendation?: SizeRecommendation;
  compatibilityCheck?: CompatibilityResult;
}

export interface SizeRecommendation {
  recommendedSize: string;
  confidence: number;              // 0-100
  reasoning: string;
}

export interface CompatibilityResult {
  isCompatible: boolean;
  confidence: number;
  details: string;
}

// ---------------------------
// Product Passport
// ---------------------------
export type CosmeticGrade = 'Excellent' | 'Good' | 'Fair' | 'Poor';
export type FunctionalGrade = 'Operational' | 'Minor Issues' | 'Major Issues' | 'Non-Functional';
export type PassportTier = 'visual' | 'mechanical' | 'telemetry';

export interface ProductPassport {
  id: string;
  productId: string;
  returnId: string;
  tier: PassportTier;
  healthScore: number;             // 0-100
  cosmeticGrade: CosmeticGrade;
  functionalGrade: FunctionalGrade;
  batteryHealth?: number;          // 0-100, for electronics
  storageHealth?: number;          // 0-100, for laptops/phones
  defectsDetected: string[];
  repairHistory: RepairRecord[];
  confidenceScore: number;         // 0-100, AI confidence
  aiVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepairRecord {
  date: Date;
  description: string;
  cost: number;
  technician?: string;
}

// ---------------------------
// Routing & Recovery
// ---------------------------
export type DisposalRoute = 'resell' | 'refurbish' | 'donate' | 'recycle' | 'exchange';

export interface RoutingInput {
  passportId: string;
  healthScore: number;
  marketDemand: number;            // 0-100
  repairCost: number;              // INR
  productCategory: string;
  age: number;                     // months
}

export interface RecoveryValues {
  resell: number;
  refurbish: number;
  recycle: number;
  donate: number;                  // tax/ESG equivalent value
  exchange: number;
}

export interface RoutingDecision {
  recommendedRoute: DisposalRoute;
  recoveryValues: RecoveryValues;
  maxRecoveryValue: number;
  sustainabilityScore: number;     // 0-100
  reasoning: string;
}

// ---------------------------
// Marketplace
// ---------------------------
export type ListingStatus = 'active' | 'sold' | 'reserved' | 'removed';

export interface MarketplaceListing {
  id: string;
  productId: string;
  passportId: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  originalPrice: number;
  category: string;
  images: string[];                // S3 URLs
  trustCard: TrustCard;
  status: ListingStatus;
  greenCreditsEarned: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TrustCard {
  healthScore: number;
  cosmeticGrade: CosmeticGrade;
  functionalGrade: FunctionalGrade;
  batteryHealth?: number;
  aiVerified: boolean;
  verifiedAt: Date;
  warrantyMonths: number;
}

// ---------------------------
// Green Credits
// ---------------------------
export type CreditAction =
  | 'buy_refurbished'
  | 'donate_product'
  | 'choose_sustainable_route'
  | 'return_reusable'
  | 'refer_user';

export interface GreenCreditTransaction {
  id: string;
  userId: string;
  action: CreditAction;
  credits: number;
  description: string;
  relatedEntityId?: string;
  createdAt: Date;
}

// ---------------------------
// Sustainability
// ---------------------------
export interface SustainabilityMetrics {
  userId: string;
  productsReused: number;
  co2SavedKg: number;
  wastePreventedKg: number;
  greenCreditsEarned: number;
  greenCreditsRedeemed: number;
  period: 'all_time' | 'monthly' | 'yearly';
}
