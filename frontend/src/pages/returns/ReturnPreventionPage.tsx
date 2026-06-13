import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { predictReturnRisk, getRecommendedSize, checkCompatibility, clearResults } from '../../store/slices/returnSlice';
import RiskMeter from '../../components/ui/RiskMeter';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

type Tab = 'risk' | 'size' | 'compatibility';

export default function ReturnPreventionPage() {
  const dispatch = useAppDispatch();
  const { riskResult, sizeResult, compatibilityResult, isLoading, error } = useAppSelector((s) => s.return);
  const { user } = useAppSelector((s) => s.auth);

  const [activeTab, setActiveTab] = useState<Tab>('risk');

  // Risk prediction form
  const [riskForm, setRiskForm] = useState({
    productId: '',
    productCategory: 'electronics',
    selectedSize: '',
    userHeight: '',
    userWeight: '',
    pastReturnCount: '0',
  });

  // Size advisor form
  const [sizeForm, setSizeForm] = useState({ category: 'apparel', height: '', weight: '', bodyType: '' });

  // Compatibility form
  const [compatForm, setCompatForm] = useState({ productName: '', userDeviceModel: '', formFactor: '' });

  const handleRiskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearResults());
    dispatch(predictReturnRisk({
      ...riskForm,
      userId: user?.id || 'guest',
      userHeight: riskForm.userHeight ? Number(riskForm.userHeight) : undefined,
      userWeight: riskForm.userWeight ? Number(riskForm.userWeight) : undefined,
      pastReturnCount: Number(riskForm.pastReturnCount),
    }));
  };

  const handleSizeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearResults());
    dispatch(getRecommendedSize({ ...sizeForm, height: Number(sizeForm.height), weight: Number(sizeForm.weight) }));
  };

  const handleCompatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearResults());
    dispatch(checkCompatibility({
      productName: compatForm.productName,
      productSpecs: { formFactor: compatForm.formFactor },
      userDeviceModel: compatForm.userDeviceModel,
    }));
  };

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'risk', label: 'Return Risk', emoji: '⚠️' },
    { id: 'size', label: 'Size Advisor', emoji: '📏' },
    { id: 'compatibility', label: 'Compatibility', emoji: '🔌' },
  ];

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-relife-navy mb-2">Return Prevention Engine</h1>
      <p className="text-gray-600 text-sm mb-6">AI-powered tools to help you buy right the first time.</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); dispatch(clearResults()); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? 'border-relife-orange text-relife-orange'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Risk Prediction */}
      {activeTab === 'risk' && (
        <div className="card">
          <h2 className="font-semibold text-relife-navy mb-4">Predict Return Probability</h2>
          <form onSubmit={handleRiskSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product ID</label>
                <input required value={riskForm.productId} onChange={(e) => setRiskForm({ ...riskForm, productId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. B09XYZ123" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <select value={riskForm.productCategory} onChange={(e) => setRiskForm({ ...riskForm, productCategory: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  {['electronics', 'apparel', 'shoes', 'phones', 'laptops', 'furniture'].map((c) => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Selected Size</label>
                <input value={riskForm.selectedSize} onChange={(e) => setRiskForm({ ...riskForm, selectedSize: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. M, L, 9, 42" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Past Returns</label>
                <input type="number" min="0" value={riskForm.pastReturnCount} onChange={(e) => setRiskForm({ ...riskForm, pastReturnCount: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full btn-primary disabled:opacity-50">
              {isLoading ? 'Analyzing...' : 'Predict Return Risk'}
            </button>
          </form>

          {isLoading && <LoadingSpinner message="AI is analyzing return risk..." />}
          {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
          {riskResult && !isLoading && (
            <div className="mt-4">
              <RiskMeter
                probability={riskResult.returnProbability}
                riskLevel={riskResult.riskLevel}
                explanation={riskResult.explanation}
              />
            </div>
          )}
        </div>
      )}

      {/* Size Advisor */}
      {activeTab === 'size' && (
        <div className="card">
          <h2 className="font-semibold text-relife-navy mb-4">Size Advisor</h2>
          <form onSubmit={handleSizeSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                <input required value={sizeForm.category} onChange={(e) => setSizeForm({ ...sizeForm, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. t-shirt" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Height (cm)</label>
                <input type="number" required value={sizeForm.height} onChange={(e) => setSizeForm({ ...sizeForm, height: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="175" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Weight (kg)</label>
                <input type="number" required value={sizeForm.weight} onChange={(e) => setSizeForm({ ...sizeForm, weight: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="70" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Body Type</label>
                <select value={sizeForm.bodyType} onChange={(e) => setSizeForm({ ...sizeForm, bodyType: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="">Select</option>
                  <option value="slim">Slim</option>
                  <option value="regular">Regular</option>
                  <option value="athletic">Athletic</option>
                  <option value="plus">Plus</option>
                </select>
              </div>
            </div>
            <button type="submit" disabled={isLoading} className="w-full btn-primary disabled:opacity-50">
              {isLoading ? 'Recommending...' : 'Get Size Recommendation'}
            </button>
          </form>

          {isLoading && <LoadingSpinner message="Calculating your ideal size..." />}
          {sizeResult && !isLoading && (
            <div className="mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-sm text-blue-600 font-medium mb-1">Recommended Size</p>
              <p className="text-4xl font-bold text-blue-700 mb-2">{sizeResult.recommendedSize}</p>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-blue-200 rounded-full h-2">
                  <div className="bg-blue-500 rounded-full h-2" style={{ width: `${sizeResult.confidence}%` }} />
                </div>
                <span className="text-sm font-semibold text-blue-700">{sizeResult.confidence}% confident</span>
              </div>
              <p className="text-sm text-gray-600">{sizeResult.reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* Compatibility Checker */}
      {activeTab === 'compatibility' && (
        <div className="card">
          <h2 className="font-semibold text-relife-navy mb-4">Compatibility Checker</h2>
          <form onSubmit={handleCompatSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
              <input required value={compatForm.productName} onChange={(e) => setCompatForm({ ...compatForm, productName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Samsung 970 EVO 1TB NVMe SSD" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Your Device Model</label>
              <input required value={compatForm.userDeviceModel} onChange={(e) => setCompatForm({ ...compatForm, userDeviceModel: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Dell XPS 15 9530" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Product Spec</label>
              <input value={compatForm.formFactor} onChange={(e) => setCompatForm({ ...compatForm, formFactor: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. M.2 2280, PCIe 4.0" />
            </div>
            <button type="submit" disabled={isLoading} className="w-full btn-primary disabled:opacity-50">
              {isLoading ? 'Checking...' : 'Check Compatibility'}
            </button>
          </form>

          {isLoading && <LoadingSpinner message="Checking compatibility..." />}
          {compatibilityResult && !isLoading && (
            <div className={`mt-4 rounded-xl p-4 border ${compatibilityResult.isCompatible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{compatibilityResult.isCompatible ? '✅' : '❌'}</span>
                <p className={`font-bold text-lg ${compatibilityResult.isCompatible ? 'text-green-700' : 'text-red-700'}`}>
                  {compatibilityResult.isCompatible ? 'Compatible' : 'Not Compatible'}
                </p>
              </div>
              <p className="text-sm text-gray-700">{compatibilityResult.details}</p>
              <p className="text-xs text-gray-500 mt-1">AI Confidence: {compatibilityResult.confidence}%</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
