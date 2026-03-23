import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './context/authStore';
import { SocketProvider } from './context/SocketContext';

// Pages
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import PricingPage from './pages/PricingPage';
import AboutPage from './pages/AboutPage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import SecurityPage from './pages/SecurityPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AppLayout from './pages/AppLayout';
import Dashboard from './pages/Dashboard';
import TradingPage from './pages/TradingPage';
import WatchlistPage from './pages/WatchlistPage';
import PortfolioPage from './pages/PortfolioPage';
import OrdersPage from './pages/OrdersPage';
import WalletPage from './pages/WalletPage';
import KYCPage from './pages/KYCPage';
import NotificationsPage from './pages/NotificationsPage';
import ReferralPage from './pages/ReferralPage';
import ProfilePage from './pages/ProfilePage';
import PositionsPage from './pages/PositionsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminKYC from './pages/admin/AdminKYC';
import AdminUsers from './pages/admin/AdminUsers';
import AdminWallet from './pages/admin/AdminWallet';
import AdminStocks from './pages/admin/AdminStocks';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000, refetchOnWindowFocus: false },
  }
});

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  if (isLoading) return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-brand-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-[#8b9cc8] text-sm">Loading TradeX...</p>
      </div>
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { initialize } = useAuthStore();
  useEffect(() => { initialize(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

            {/* Protected App */}
            <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="trading" element={<TradingPage />} />
              <Route path="watchlist" element={<WatchlistPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="positions" element={<PositionsPage />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="kyc" element={<KYCPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="referral" element={<ReferralPage />} />
              <Route path="profile" element={<ProfilePage />} />

              {/* Admin */}
              <Route path="admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
              <Route path="admin/kyc" element={<ProtectedRoute adminOnly><AdminKYC /></ProtectedRoute>} />
              <Route path="admin/users" element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
              <Route path="admin/wallet" element={<ProtectedRoute adminOnly><AdminWallet /></ProtectedRoute>} />
              <Route path="admin/stocks" element={<ProtectedRoute adminOnly><AdminStocks /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>

        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#1a2235', color: '#f0f4ff', border: '1px solid rgba(255,255,255,0.1)', fontSize: '13px' },
            success: { iconTheme: { primary: '#00d084', secondary: '#022b1d' } },
            error: { iconTheme: { primary: '#ff4f6a', secondary: '#fff' } },
          }}
        />
      </SocketProvider>
    </QueryClientProvider>
  );
}
