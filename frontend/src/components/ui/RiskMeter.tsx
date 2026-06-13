interface RiskMeterProps {
  probability: number;
  riskLevel: 'low' | 'medium' | 'high';
  explanation: string[];
}

const riskConfig = {
  low: { color: 'bg-green-500', textColor: 'text-green-700', bg: 'bg-green-50', label: 'Low Risk' },
  medium: { color: 'bg-yellow-400', textColor: 'text-yellow-700', bg: 'bg-yellow-50', label: 'Medium Risk' },
  high: { color: 'bg-red-500', textColor: 'text-red-700', bg: 'bg-red-50', label: 'High Risk' },
};

export default function RiskMeter({ probability, riskLevel, explanation }: RiskMeterProps) {
  const config = riskConfig[riskLevel];

  return (
    <div className={`rounded-xl p-5 ${config.bg} border border-current/10`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`font-semibold ${config.textColor}`}>Return Risk</h3>
        <span className={`text-2xl font-bold ${config.textColor}`}>{probability}%</span>
      </div>

      {/* Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
        <div
          className={`${config.color} rounded-full h-3 transition-all duration-700`}
          style={{ width: `${probability}%` }}
          role="progressbar"
          aria-valuenow={probability}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Return risk: ${probability}%`}
        />
      </div>

      <p className={`text-sm font-semibold mb-2 ${config.textColor}`}>{config.label}</p>

      {/* Explanation bullets */}
      <ul className="space-y-1">
        {explanation.map((reason, idx) => (
          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
            {reason}
          </li>
        ))}
      </ul>
    </div>
  );
}
