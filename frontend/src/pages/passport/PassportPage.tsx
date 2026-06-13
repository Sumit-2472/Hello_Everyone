import { ShieldCheck, Upload, Cpu, Eye } from 'lucide-react';

export default function PassportPage() {
  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-relife-navy mb-2">AI Product Passport</h1>
      <p className="text-gray-600 text-sm mb-6">
        Every returned product receives a digital health certificate — graded by Gemini Vision AI.
      </p>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: <Eye className="w-6 h-6 text-blue-500" />, tier: 'Tier 1', label: 'Visual Grading', desc: 'Upload photos — AI detects tears, stains, damage, missing parts', bg: 'bg-blue-50' },
          { icon: <Upload className="w-6 h-6 text-purple-500" />, tier: 'Tier 2', label: 'Mechanical Grading', desc: '5-sec video/audio analysis for motors, vibrations, anomalies', bg: 'bg-purple-50' },
          { icon: <Cpu className="w-6 h-6 text-green-600" />, tier: 'Tier 3', label: 'Telemetry Grading', desc: 'Device diagnostics — battery health, SSD health, performance', bg: 'bg-green-50' },
        ].map((tier) => (
          <div key={tier.tier} className={`card ${tier.bg} border-0`}>
            <div className="flex items-center gap-2 mb-2">
              {tier.icon}
              <span className="text-xs font-bold text-gray-500 uppercase">{tier.tier}</span>
            </div>
            <h3 className="font-semibold text-relife-navy mb-1">{tier.label}</h3>
            <p className="text-xs text-gray-600">{tier.desc}</p>
          </div>
        ))}
      </div>

      {/* Passport output example */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-relife-green" />
          <h2 className="font-semibold text-relife-navy">Sample Passport Output</h2>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm text-gray-700">
          <pre>{JSON.stringify({
            health_score: 92,
            cosmetic_grade: "Excellent",
            functional_grade: "Operational",
            battery_health: 91,
            defects_detected: [],
            confidence_score: 95,
            ai_verified: true
          }, null, 2)}</pre>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Passport grading is performed by warehouse staff using the admin interface.
          Contact your warehouse manager to initiate product grading.
        </p>
      </div>
    </div>
  );
}
