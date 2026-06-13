import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Leaf } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchListingById, clearSelectedListing } from '../../store/slices/listingsSlice';
import { marketplaceApi } from '../../api/marketplaceApi';
import TrustCard from '../../components/ui/TrustCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { selectedListing: listing, isLoading } = useAppSelector((state) => state.listings);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (id) dispatch(fetchListingById(id));
    return () => { dispatch(clearSelectedListing()); };
  }, [id, dispatch]);

  const handlePurchase = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!id) return;
    try {
      await marketplaceApi.purchaseListing(id);
      alert('Purchase successful! Green Credits earned.');
      navigate('/marketplace');
    } catch {
      alert('Purchase failed. Please try again.');
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading product..." />;
  if (!listing) return <div className="text-center py-12">Product not found</div>;

  const discount = Math.round(((listing.originalPrice - listing.price) / listing.originalPrice) * 100);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-600 hover:text-relife-navy mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Marketplace
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left: Image */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-8xl mb-4">
            📦
          </div>
        </div>

        {/* Right: Details */}
        <div>
          <h1 className="text-2xl font-bold text-relife-navy mb-2">{listing.title}</h1>
          <p className="text-gray-600 text-sm mb-4">{listing.description}</p>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-relife-navy">₹{listing.price.toLocaleString('en-IN')}</span>
            <span className="text-gray-400 line-through">₹{listing.originalPrice.toLocaleString('en-IN')}</span>
            <span className="text-relife-green font-semibold text-sm">{discount}% off</span>
          </div>

          <div className="flex items-center gap-1 text-sm text-relife-green font-medium mb-6">
            <Leaf className="w-4 h-4" />
            +{listing.greenCreditsEarned} Green Credits on purchase
          </div>

          {/* Trust Card */}
          <TrustCard
            healthScore={listing.trustCard.healthScore}
            cosmeticGrade={listing.trustCard.cosmeticGrade}
            functionalGrade={listing.trustCard.functionalGrade}
            batteryHealth={listing.trustCard.batteryHealth}
            aiVerified={listing.trustCard.aiVerified}
            warrantyMonths={listing.trustCard.warrantyMonths}
          />

          <button
            onClick={handlePurchase}
            disabled={listing.status !== 'active'}
            className="w-full btn-primary mt-6 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {listing.status === 'active' ? 'Buy Now' : 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
