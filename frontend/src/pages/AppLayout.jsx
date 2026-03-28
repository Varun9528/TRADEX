import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, TrendingUp, Star, Briefcase, ClipboardList,
  Wallet, FileText, Bell, Gift, User, Settings, LogOut, DollarSign,
  ChevronRight, Menu, X
} from 'lucide-react';
import useAuthStore from '../context/authStore';
import { useSocket } from '../context/SocketContext';
import { stockAPI, notificationAPI } from '../api';
import toast from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';
import MobileBottomNav from '../components/MobileBottomNav';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Trade', icon: TrendingUp, path: '/trading' },
  { label: 'Watchlist', icon: Star, path: '/watchlist' },
  { label: 'Portfolio', icon: Briefcase, path: '/portfolio' },
  { label: 'Orders', icon: ClipboardList, path: '/orders' },
  { label: 'Wallet', icon: Wallet, path: '/wallet' },
  { label: 'KYC / Demat', icon: FileText, path: '/kyc' },
  { label: 'Notifications', icon: Bell, path: '/notifications', badge: true },
  { label: 'Referral', icon: Gift, path: '/referral' },
  { label: 'Profile', icon: User, path: '/profile' },
];

const ADMIN_NAV = [
  { label: 'Admin Dashboard', icon: Settings, path: '/admin' },
  { label: 'Fund Requests', icon: DollarSign, path: '/admin/fund-requests' },
  { label: 'Withdraw Requests', icon: DollarSign, path: '/admin/withdraw-requests' },
  { label: 'Trade Monitor', icon: TrendingUp, path: '/admin/trades' },
  { label: 'KYC Approvals', icon: FileText, path: '/admin/kyc' },
  { label: 'Users', icon: User, path: '/admin/users' },
  { label: 'Wallet Control', icon: Wallet, path: '/admin/wallet' },
  { label: 'Stock Prices', icon: TrendingUp, path: '/admin/stocks' },
];

// Ticker component - Zerodha style
function Ticker({ stocks }) {
  if (!stocks?.length) return null;
  const items = [...stocks, ...stocks].map((s, i) => (
    <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
      <span className="text-text-secondary text-xs font-medium">{s.symbol}</span>
      <span className="text-xs font-semibold text-text-primary">₹{s.currentPrice?.toFixed(2)}</span>
      <span className={`text-xs font-medium ${s.changePercent >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
        {s.changePercent >= 0 ? '+' : ''}{s.changePercent?.toFixed(2)}%
      </span>
    </div>
  ));
  return (
    <div className="bg-bg-secondary border-b border-border overflow-hidden whitespace-nowrap py-2">
      <div className="flex gap-8 ticker-track px-4">{items}</div>
    </div>
  );
}

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tickerStocks, setTickerStocks] = useState([]);
  const [indices, setIndices] = useState({ nifty50: { value: 24352, change: 0.42 }, sensex: { value: 79841, change: 0.38 } });

  // Fetch stocks for ticker
  const { data: stocksData } = useQuery({
    queryKey: ['stocks-ticker'],
    queryFn: () => stockAPI.getAll({ limit: 15 }),
    refetchInterval: 10000,
  });

  // Fetch unread notification count
  const { data: notifData } = useQuery({
    queryKey: ['notifications-count'],
    queryFn: () => notificationAPI.getAll({ limit: 1 }),
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (stocksData?.data?.data) setTickerStocks(stocksData.data.data);
  }, [stocksData]);

  // Socket: live price updates for ticker
  useEffect(() => {
    if (!socket) return;
    socket.on('price:update', (updates) => {
      setTickerStocks(prev => {
        const map = {};
        updates.forEach(u => { map[u.symbol] = u; });
        return prev.map(s => map[s.symbol] ? { ...s, ...map[s.symbol] } : s);
      });
    });
    // Listen for user-specific events
    socket.on('kyc:status_update', ({ status }) => {
      toast(status === 'approved' ? '🎉 KYC Approved! You can now trade.' : '❌ KYC Rejected. Check notifications.', {
        icon: status === 'approved' ? '✅' : '❌',
      });
    });
    socket.on('order:executed', ({ order }) => {
      toast.success(`Order executed: ${order.transactionType} ${order.executedQuantity} ${order.symbol}`);
    });
    return () => {
      socket.off('price:update');
      socket.off('kyc:status_update');
      socket.off('order:executed');
    };
  }, [socket]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const unreadCount = notifData?.data?.unreadCount || 0;
  const initials = user?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const isAdmin = user?.role === 'admin';

  const SidebarContent = () => (
    <>
      {/* Logo - Zerodha style */}
      <div className="px-5 py-5 border-b border-border">
        <div className="text-xl font-bold text-brand-blue tracking-tight">TradeX</div>
        <div className="text-[10px] text-text-secondary tracking-widest uppercase mt-0.5">India</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-4 py-1.5 text-[10px] text-text-secondary uppercase tracking-widest">Main</div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={16} />
            <span className="flex-1">{item.label}</span>
            {item.badge && unreadCount > 0 && (
              <span className="ml-auto bg-accent-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            <ChevronRight size={14} className="chevron" />
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="px-4 py-1.5 mt-2 text-[10px] text-text-secondary uppercase tracking-widest">Admin</div>
            {ADMIN_NAV.map(item => (
              <NavLink key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User info - Zerodha style */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-blue to-blue-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate text-text-primary">{user?.fullName}</div>
            <div className="text-xs text-text-secondary">{isAdmin ? '🛡️ Admin' : user?.clientId}</div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-text-secondary mb-2">
          <span>Balance</span>
          <span className="text-brand-green font-semibold">₹{user?.walletBalance?.toLocaleString('en-IN') || '0'}</span>
        </div>
        <div className="flex justify-between text-xs text-text-secondary mb-3">
          <span>KYC</span>
          <span className={user?.kycStatus === 'approved' ? 'text-brand-green' : 'text-amber-500'}>
            {user?.kycStatus === 'approved' ? '✓ Verified' : user?.kycStatus || 'Not started'}
          </span>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-text-secondary hover:text-text-primary text-xs py-2 px-3 rounded-lg border border-border hover:bg-bg-tertiary transition-all">
          <LogOut size={13} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-bg-primary w-full" style={{ minWidth: 0 }}>
      {/* Desktop sidebar - Fixed width */}
      <aside className="hidden lg:flex flex-col w-[240px] bg-bg-secondary border-r border-border fixed top-0 left-0 bottom-0 z-40 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" style={{ pointerEvents: 'auto' }}>
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} style={{ pointerEvents: 'auto' }} />
          <aside className="relative flex flex-col w-[240px] bg-bg-secondary border-r border-border h-full z-10 flex-shrink-0">
            <button className="absolute top-4 right-4 text-text-secondary" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content wrapper - Flexible width with scrolling */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen w-full min-w-0" style={{ pointerEvents: 'auto' }}>
        {/* Ticker - Full width */}
        <Ticker stocks={tickerStocks} />

        {/* Topbar - Sticky header */}
        <header className="sticky top-0 z-30 bg-bg-secondary border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between w-full flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden text-text-secondary flex-shrink-0" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-semibold text-text-primary hidden sm:block truncate">
              {NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.label ||
               ADMIN_NAV.find(n => location.pathname.startsWith(n.path))?.label || 'TradeX'}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Indices - Responsive */}
            <div className="hidden md:flex items-center gap-1.5 bg-bg-card px-3 py-1.5 rounded-lg text-xs border border-border flex-shrink-0">
              <span className="text-text-secondary font-medium">NIFTY</span>
              <span className="font-semibold text-text-primary whitespace-nowrap">{indices.nifty50.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span className={indices.nifty50.change >= 0 ? 'text-brand-green' : 'text-accent-red'}>
                {indices.nifty50.change >= 0 ? '+' : ''}{indices.nifty50.change.toFixed(2)}%
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-bg-card px-3 py-1.5 rounded-lg text-xs border border-border flex-shrink-0">
              <span className="text-text-secondary font-medium">SENSEX</span>
              <span className="font-semibold text-text-primary whitespace-nowrap">{indices.sensex.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span className={indices.sensex.change >= 0 ? 'text-brand-green' : 'text-accent-red'}>
                {indices.sensex.change >= 0 ? '+' : ''}{indices.sensex.change.toFixed(2)}%
              </span>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            <NavLink to="/profile" className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-blue-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {initials}
            </NavLink>
          </div>
        </header>

        {/* Page content - Scrollable area */}
        <main 
          className="flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto min-h-0 pb-14 lg:pb-4" 
          style={{ 
            pointerEvents: 'auto',
            minHeight: 'calc(100vh - 60px)',
          }}
        >
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
