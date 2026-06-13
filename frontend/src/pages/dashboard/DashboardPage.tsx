import { useEffect } from 'react';
import { Leaf, Recycle, CloudOff, Package, Coins } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchSustainabilityMetrics, fetchMyCredits } from '../../store/slices/creditsSlice';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { sustainability, totalCredits, transactions, isLoading } = useAppSelector((s) => s.credits);
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    dispatch(fetchSustainabilityMetrics());
    dispatch(fetchMyCredits());
  }, [dispatch]);

  if (isLoading) return <LoadingSpinner message="Loading your dashboard..." />;

  const metrics = [
    {
      icon: <Package className="w-6 h-6 text-blue-500" />,
      label: 'Products Reused',
      value: sustainability?.productsReused ?? 0,
      unit: 'items',
      bg: 'bg-blue-50',
    },
    {
      icon: <CloudOff className="w-6 h-6 text-green-600" />,
      label: 'CO₂ Saved',
      value: sustainability?.co2SavedKg ?? 0,
      unit: 'kg',
      bg: 'bg-green-50',
    },
    {
      icon: <Recycle className="w-6 h-6 text-purple-600" />,
      label: 'Waste Prevented',
      value: sustainability?.wastePreventedKg ?? 0,
      unit: 'kg',
      bg: 'bg-purple-50',
    },
    {
      icon: <Coins className="w-6 h-6 text-relife-orange" />,
      label: 'Green Credits',
      value: sustainability?.greenCreditsEarned ?? 0,
      unit: 'pts',
      bg: 'bg-orange-50',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-relife-navy">Sustainability Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back, {user?.name}!</p>
        </div>
        <div className="flex items-center gap-2 bg-relife-green-light text-relife-green text-sm font-semibold px-3 py-2 rounded-full">
          <Leaf className="w-4 h-4" />
          {totalCredits} Green Credits
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric) => (
          <div key={metric.label} className={`card ${metric.bg} border-0`}>
            <div className="flex items-center gap-3 mb-2">
              {metric.icon}
            </div>
            <p className="text-2xl font-bold text-relife-navy">{metric.value}</p>
            <p className="text-xs text-gray-500">{metric.unit}</p>
            <p className="text-sm text-gray-700 font-medium mt-1">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Impact visualization */}
      <div className="card mb-6">
        <h2 className="font-semibold text-relife-navy mb-4">Your Environmental Impact</h2>
        {sustainability ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-32">CO₂ Prevented</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div className="bg-green-500 rounded-full h-3 transition-all" style={{ width: `${Math.min((sustainability.co2SavedKg / 100) * 100, 100)}%` }} />
              </div>
              <span className="text-sm font-semibold text-green-700 w-16 text-right">{sustainability.co2SavedKg} kg</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 w-32">Waste Prevented</span>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div className="bg-purple-500 rounded-full h-3 transition-all" style={{ width: `${Math.min((sustainability.wastePreventedKg / 50) * 100, 100)}%` }} />
              </div>
              <span className="text-sm font-semibold text-purple-700 w-16 text-right">{sustainability.wastePreventedKg} kg</span>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Start buying refurbished products to see your impact!</p>
        )}
      </div>

      {/* Recent transactions */}
      <div className="card">
        <h2 className="font-semibold text-relife-navy mb-4">Recent Green Credits Activity</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-sm">No transactions yet. Buy refurbished to earn credits!</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <p className="text-sm text-gray-700">{tx.description}</p>
                <span className="text-sm font-bold text-relife-green">+{tx.credits}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
