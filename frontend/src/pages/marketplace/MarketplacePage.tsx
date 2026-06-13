import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Leaf, SlidersHorizontal } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchListings } from '../../store/slices/listingsSlice';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const CATEGORIES = ['All', 'Electronics', 'Phones', 'Laptops', 'Appliances', 'Apparel', 'Books', 'Furniture'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'health_desc', label: 'Best Condition' },
];

export default function MarketplacePage() {
  const dispatch = useAppDispatch();
  const { items, total, isLoading, error } = useAppSelector((state) => state.listings);

  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [minHealthScore, setMinHealthScore] = useState<number | undefined>();

  useEffect(() => {
    dispatch(fetchListings({ category: category || undefined, sortBy, minHealthScore }));
  }, [category, sortBy, minHealthScore, dispatch]);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-relife-navy">Second Life Marketplace</h1>
          <p className="text-sm text-gray-500 mt-1">{total} AI-verified products available</p>
        </div>
        <div className="flex items-center gap-1.5 text-relife-green text-sm font-medium">
          <ShieldCheck className="w-4 h-4" />
          All products AI verified
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-600">Filters:</span>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === 'All' ? '' : cat.toLowerCase())}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  (cat === 'All' && !category) || category === cat.toLowerCase()
                    ? 'bg-relife-navy text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="ml-auto text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-relife-orange"
            aria-label="Sort listings"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Min health score */}
          <select
            value={minHealthScore ?? ''}
            onChange={(e) => setMinHealthScore(e.target.value ? Number(e.target.value) : undefined)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-relife-orange"
            aria-label="Minimum health score"
          >
            <option value="">All Conditions</option>
            <option value="85">Excellent (85+)</option>
            <option value="70">Good (70+)</option>
            <option value="50">Fair (50+)</option>
          </select>
        </div>
      </div>

      {/* Listings grid */}
      {isLoading ? (
        <LoadingSpinner message="Loading marketplace..." />
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No listings found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((listing) => (
            <Link key={listing.id} to={`/marketplace/${listing.id}`} className="card hover:shadow-md transition-shadow group">
              {/* Image placeholder */}
              <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-4xl">
                📦
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-2">
                {listing.trustCard.aiVerified && (
                  <span className="badge-verified">
                    <ShieldCheck className="w-3 h-3" />
                    AI Verified
                  </span>
                )}
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                  {listing.category}
                </span>
              </div>

              <h3 className="font-medium text-relife-navy text-sm mb-1 line-clamp-2 group-hover:text-relife-orange transition-colors">
                {listing.title}
              </h3>

              {/* Health score bar */}
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div className="bg-relife-green rounded-full h-1.5" style={{ width: `${listing.trustCard.healthScore}%` }} />
                </div>
                <span className="text-xs font-semibold text-relife-green">{listing.trustCard.healthScore}</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-relife-navy">₹{listing.price.toLocaleString('en-IN')}</span>
                <span className="text-xs text-gray-400 line-through">₹{listing.originalPrice.toLocaleString('en-IN')}</span>
              </div>

              {/* Savings */}
              <div className="flex items-center gap-1 mt-1 text-xs text-relife-green font-medium">
                <Leaf className="w-3 h-3" />
                +{listing.greenCreditsEarned} Green Credits
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
