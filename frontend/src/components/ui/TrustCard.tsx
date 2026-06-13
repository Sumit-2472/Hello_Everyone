import { ShieldCheck, Battery, Star, CheckCircle } from 'lucide-react';

interface TrustCardProps {
  healthScore: number;
  cosmeticGrade: string;
  functionalGrade: string;
  batteryHealth?: number;
  aiVerified: boolean;
  warrantyMonths: number;
}

const getHealthColor = (score: number) => {
  if (score >= 85) return 'text-green-600 bg-green-50';
  if (score >= 70) return 'text-blue-600 bg-blue-50';
  if (score >= 50) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

export default function TrustCard({
  healthScore,
  cosmeticGrade,
  functionalGrade,
  batteryHealth,
  aiVerified,
  warrantyMonths,
}: TrustCardProps) {
  return (
    <div className="border border-relife-green rounded-xl p-4 bg-relife-green-light">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-relife-green font-semibold text-sm">
          <ShieldCheck className="w-4 h-4" />
          ReLife Trust Card
        </div>
        {aiVerified && (
          <span className="badge-verified">
            <CheckCircle className="w-3 h-3" />
            AI Verified
          </span>
        )}
      </div>

      {/* Health Score */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getHealthColor(healthScore)}`}>
          {healthScore}
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium">Health Score</p>
          <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-relife-green rounded-full h-2 transition-all duration-500"
              style={{ width: `${healthScore}%` }}
              role="progressbar"
              aria-valuenow={healthScore}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white rounded-lg p-2">
          <p className="text-gray-500 font-medium">Cosmetic</p>
          <p className="font-semibold text-gray-800">{cosmeticGrade}</p>
        </div>
        <div className="bg-white rounded-lg p-2">
          <p className="text-gray-500 font-medium">Function</p>
          <p className="font-semibold text-gray-800">{functionalGrade}</p>
        </div>
        {batteryHealth && (
          <div className="bg-white rounded-lg p-2 flex items-center gap-1.5">
            <Battery className="w-3 h-3 text-green-600" />
            <div>
              <p className="text-gray-500 font-medium">Battery</p>
              <p className="font-semibold text-gray-800">{batteryHealth}%</p>
            </div>
          </div>
        )}
        <div className="bg-white rounded-lg p-2 flex items-center gap-1.5">
          <Star className="w-3 h-3 text-yellow-500" />
          <div>
            <p className="text-gray-500 font-medium">Warranty</p>
            <p className="font-semibold text-gray-800">{warrantyMonths}mo</p>
          </div>
        </div>
      </div>
    </div>
  );
}
