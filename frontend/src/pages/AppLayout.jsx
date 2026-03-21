import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, TrendingUp, Star, Briefcase, ClipboardList,
  Wallet, FileText, Bell, Gift, User, Settings, LogOut,
  ChevronRight, Menu, X
} from 'lucide-react';
import useAuthStore from '../context/authStore';
import { useSocket } from '../context/SocketContext';
import { stockAPI, notificationAPI } from '../api';
import toast from 'react-hot-toast';

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
  { label: 'KYC Approvals', icon: FileText, path: '/admin/kyc' },
  { label: 'Users', icon: User, path: '/admin/users' },
  { label: 'Wallet Control', icon: Wallet, path: '/admin/wallet' },
  { label: 'Stock Prices', icon: TrendingUp, path: '/admin/stocks' },
];

// Ticker component
function Ticker({ stocks }) {
  if (!stocks?.length) return null;
  const items = [...stocks, ...stocks].map((s, i) => (
    <div key={i} className="flex items-center gap-1.5 flex-shrink-0">
      <span className="text-[#8b9cc8] text-xs">{s.symbol}</span>
      <span className="text-xs font-semibold">₹{s.currentPrice?.toFixed(2)}</span>
      <span className={`text-xs ${s.changePercent >= 0 ? 'text-[#00d084]' : 'text-[#ff4f6a]'}`}>
        {s.changePercent >= 0 ? '+' : ''}{s.changePercent?.toFixed(2)}%
      </span>
    </div>
  ));
  return (
    <div className="bg-bg-secondary border-b border-border overflow-hidden whitespace-nowrap py-1.5">
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
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="text-xl font-bold text-[#00d084] tracking-tight">TradeX</div>
        <div className="text-[10px] text-[#4a5580] tracking-widest uppercase mt-0.5">India</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-4 py-1.5 text-[10px] text-[#4a5580] uppercase tracking-widest">Main</div>
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
              <span className="bg-[#ff4f6a] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="px-4 py-1.5 mt-2 text-[10px] text-[#4a5580] uppercase tracking-widest">Admin</div>
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

      {/* User info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00d084] to-[#3b82f6] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{user?.fullName}</div>
            <div className="text-xs text-[#4a5580]">{isAdmin ? '🛡️ Admin' : user?.clientId}</div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-[#8b9cc8] mb-2">
          <span>Balance</span>
          <span className="text-[#00d084] font-semibold">₹{user?.walletBalance?.toLocaleString('en-IN') || '0'}</span>
        </div>
        <div className="flex justify-between text-xs text-[#8b9cc8] mb-3">
          <span>KYC</span>
          <span className={user?.kycStatus === 'approved' ? 'text-[#00d084]' : 'text-amber-400'}>
            {user?.kycStatus === 'approved' ? '✓ Verified' : user?.kycStatus || 'Not started'}
          </span>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-[#8b9cc8] hover:text-white text-xs py-2 px-3 rounded-lg border border-border hover:bg-bg-tertiary transition-all">
          <LogOut size={13} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-bg-primary">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[220px] bg-bg-secondary border-r border-border fixed top-0 left-0 bottom-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-[220px] bg-bg-secondary border-r border-border h-full z-10">
            <button className="absolute top-4 right-4 text-[#8b9cc8]" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-[220px] flex flex-col min-h-screen">
        {/* Ticker */}
        <Ticker stocks={tickerStocks} />

        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-bg-secondary border-b border-border px-4 lg:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-[#8b9cc8]" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-sm font-semibold hidden sm:block">
              {NAV_ITEMS.find(n => location.pathname.startsWith(n.path))?.label ||
               ADMIN_NAV.find(n => location.pathname.startsWith(n.path))?.label || 'TradeX'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Indices */}
            <div className="hidden md:flex items-center gap-1.5 bg-bg-tertiary px-3 py-1.5 rounded-full text-xs">
              <span className="text-[#8b9cc8]">NIFTY</span>
              <span className="font-semibold">{indices.nifty50.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span className={indices.nifty50.change >= 0 ? 'text-[#00d084]' : 'text-[#ff4f6a]'}>
                {indices.nifty50.change >= 0 ? '+' : ''}{indices.nifty50.change.toFixed(2)}%
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 bg-bg-tertiary px-3 py-1.5 rounded-full text-xs">
              <span className="text-[#8b9cc8]">SENSEX</span>
              <span className="font-semibold">{indices.sensex.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              <span className={indices.sensex.change >= 0 ? 'text-[#00d084]' : 'text-[#ff4f6a]'}>
                {indices.sensex.change >= 0 ? '+' : ''}{indices.sensex.change.toFixed(2)}%
              </span>
            </div>

            <NavLink to="/notifications" className="relative w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-[#8b9cc8] hover:text-white transition-colors">
              <Bell size={15} />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#ff4f6a] rounded-full text-[9px] font-bold text-white flex items-center justify-center">{unreadCount}</span>}
            </NavLink>

            <NavLink to="/profile" className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d084] to-[#3b82f6] flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </NavLink>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
