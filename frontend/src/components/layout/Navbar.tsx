import { Link, useNavigate } from 'react-router-dom';
import { Leaf, ShoppingBag, RotateCcw, BarChart3, Coins, LogOut, LogIn } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../store/slices/authSlice';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <nav className="bg-relife-navy text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Leaf className="text-relife-green w-6 h-6" />
            <span>Amazon <span className="text-relife-orange">ReLife</span></span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link to="/marketplace" className="flex items-center gap-1.5 hover:text-relife-orange transition-colors">
              <ShoppingBag className="w-4 h-4" />
              Marketplace
            </Link>
            <Link to="/returns" className="flex items-center gap-1.5 hover:text-relife-orange transition-colors">
              <RotateCcw className="w-4 h-4" />
              Return Prevention
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="flex items-center gap-1.5 hover:text-relife-orange transition-colors">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link to="/credits" className="flex items-center gap-1.5 hover:text-relife-green transition-colors">
                  <Coins className="w-4 h-4 text-relife-green" />
                  <span className="text-relife-green">{user?.greenCredits ?? 0} Credits</span>
                </Link>
              </>
            )}
          </div>

          {/* Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300 hidden md:block">{user?.name}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm hover:text-red-400 transition-colors"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 btn-primary text-sm"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
