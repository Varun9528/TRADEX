import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Briefcase, Star, Wallet } from 'lucide-react';

const NAV_ITEMS = [
  { icon: LayoutDashboard, path: '/dashboard', label: 'Dashboard' },
  { icon: TrendingUp, path: '/trading', label: 'Trade' },
  { icon: Briefcase, path: '/portfolio', label: 'Portfolio' },
  { icon: Star, path: '/watchlist', label: 'Watchlist' },
  { icon: Wallet, path: '/wallet', label: 'Wallet' },
];

export default function MobileBottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-bg-secondary border-t border-border safe-area-bottom z-40">
      <div className="flex justify-around items-center h-14">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full ${
                isActive ? 'text-brand-blue' : 'text-text-secondary'
              }`
            }
          >
            <item.icon size={20} />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
