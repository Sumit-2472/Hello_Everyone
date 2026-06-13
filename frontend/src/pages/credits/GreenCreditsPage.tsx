import { useEffect } from 'react';
import { Leaf, Gift, Coins } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchMyCredits } from '../../store/slices/creditsSlice';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const EARN_ACTIONS = [
  { action: 'Buy Refurbished', credits: '+20', emoji: '🛍️' },
  { action: 'Donate Product', credits: '+100', emoji: '🎁' },
  { action: 'Return Reusable Item', credits: '+50', emoji: '♻️' },
  { action: 'Choose Sustainable Route', credits: '+30', emoji: '🌱' },
  { action: 'Refer a Friend', credits: '+15', emoji: '👥' },
];

const REDEEM_OPTIONS = [
  { label: '100 Credits', value: '₹50 off', emoji: '💰' },
  { label: '500 Credits', value: '₹300 off', emoji: '💳' },
  { label: '1000 Credits', value: '1 Month Prime', emoji: '⭐' },
  { label: '2000 Credits', value: '₹1000 Cashback', emoji: '🏦' },
];

export default function GreenCreditsPage() {
  const dispatch = useAppDispatch();
  const { transactions, totalCredits, isLoading } = useAppSelector((s) => s.credits);
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => { dispatch(fetchMyCredits()); }, [dispatch]);

  if (isLoading) return <LoadingSpinner message="Loading credits..." />;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Balance */}
      <div className="bg-gradient-to-br from-relife-green to-relife-green-dark rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Leaf className="w-5 h-5" />
          <p className="font-medium">Green Credits Balance</p>
        </div>
        <p className="text-5xl font-bold mb-1">{totalCredits}</p>
        <p className="text-sm opacity-80">{user?.name}'s account</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* How to Earn */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-5 h-5 text-relife-green" />
            <h2 className="font-semibold text-relife-navy">How to Earn</h2>
          </div>
          <div className="space-y-2">
            {EARN_ACTIONS.map((item) => (
              <div key={item.action} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  <span>{item.emoji}</span>
                  <span className="text-sm text-gray-700">{item.action}</span>
                </div>
                <span className="text-sm font-bold text-relife-green">{item.credits}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Redeem */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-relife-orange" />
            <h2 className="font-semibold text-relife-navy">Redeem Credits</h2>
          </div>
          <div className="space-y-2">
            {REDEEM_OPTIONS.map((opt) => (
              <div key={opt.label} className="flex items-center justify-between py-2 border border-gray-100 rounded-lg px-3 hover:border-relife-orange transition-colors cursor-pointer">
                <div className="flex items-center gap-2">
                  <span>{opt.emoji}</span>
                  <div>
                    <p className="text-sm font-medium text-relife-navy">{opt.value}</p>
                    <p className="text-xs text-gray-500">{opt.label} required</p>
                  </div>
                </div>
                <button className="text-xs btn-primary py-1 px-3">Redeem</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="card mt-6">
        <h2 className="font-semibold text-relife-navy mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500">No transactions yet. Start earning by making sustainable choices!</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm text-gray-700">{tx.description}</p>
                  <p className="text-xs text-gray-400">{new Date(tx.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <span className="text-sm font-bold text-relife-green">+{tx.credits}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
