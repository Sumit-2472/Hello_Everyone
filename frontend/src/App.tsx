import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './store/hooks';

// Layout
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import ListingDetailPage from './pages/marketplace/ListingDetailPage';
import ReturnPreventionPage from './pages/returns/ReturnPreventionPage';
import PassportPage from './pages/passport/PassportPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import GreenCreditsPage from './pages/credits/GreenCreditsPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route Wrapper with Loading State
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  // 1. Always check for loading first so you don't redirect while checking tokens
  if (isLoading) return <div>Loading...</div>; 

  // 2. Redirect if not authenticated
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Routes with main layout */}
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="marketplace/:id" element={<ListingDetailPage />} />

        {/* Protected routes wrapped in one block for cleaner code */}
        <Route path="returns" element={<ProtectedRoute><ReturnPreventionPage /></ProtectedRoute>} />
        <Route path="passport" element={<ProtectedRoute><PassportPage /></ProtectedRoute>} />
        <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="credits" element={<ProtectedRoute><GreenCreditsPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}