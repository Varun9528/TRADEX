import { Link, useLocation } from 'react-router-dom';
import { Watchlist, Briefcase, ShoppingCart, User, Wallet, TrendingUp } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { path: '/watchlist', icon: Watchlist, label: 'Watchlist' },
    { path: '/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/positions', icon: TrendingUp, label: 'Positions' },
    { path: '/portfolio', icon: Briefcase, label: 'Portfolio' },
    { path: '/funds', icon: Wallet, label: 'Funds' },
    { path: '/account', icon: User, label: 'Account' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-6 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-3 px-1 transition-colors ${
                isActive 
                  ? 'text-[#00d084]' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
