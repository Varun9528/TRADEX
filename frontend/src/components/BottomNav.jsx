import { Link, useLocation } from 'react-router-dom';
import {
  LayoutGrid,
  Activity,
  Briefcase,
  BarChart3,
  Wallet,
  User
} from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/watchlist', icon: LayoutGrid, label: 'Watchlist' },
    { path: '/orders', icon: Activity, label: 'Orders' },
    { path: '/positions', icon: BarChart3, label: 'Positions' },
    { path: '/portfolio', icon: Briefcase, label: 'Portfolio' },
    { path: '/funds', icon: Wallet, label: 'Funds' },
    { path: '/account', icon: User, label: 'Account' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden safe-area-bottom">
      <div className="grid grid-cols-6 gap-0">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2.5 px-0.5 transition-all active:scale-95 touch-manipulation ${
                isActive 
                  ? 'text-[#00d084]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="mb-0.5" />
              <span className="text-[9px] leading-tight font-medium truncate w-full text-center">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
