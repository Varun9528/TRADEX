import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { marketAPI, watchlistAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import BottomNav from '../components/BottomNav';
import { TrendingUp, TrendingDown, X, Search, ChevronDown } from 'lucide-react';

export default function WatchlistPage() {
  const navigate = useNavigate();
  const [group, setGroup] = useState('all'); // all, gainers, losers
  const [search, setSearch] = useState('');

  const { data: watchlistData, isLoading, refetch } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      try {
        const { data } = await watchlistAPI.get();
        return data.data || [];
      } catch (err) {
        console.error('[WatchlistPage] API error:', err.message);
        return [];
      }
    },
    refetchInterval: 5000,
  });

  const watchlist = Array.isArray(watchlistData) ? watchlistData : [];

  // Group stocks by index
  const indices = ['Nifty 50', 'Nifty Bank', 'Major Indices'];
  const [activeIndex, setActiveIndex] = useState('Nifty 50');

  const addToWatchlist = useMutation({
    mutationFn: async (symbol) => {
      const { data } = await watchlistAPI.add(symbol);
      return data;
    },
    onSuccess: () => {
      toast.success('Added to watchlist');
      refetch();
    },
  });

  const removeFromWatchlist = useMutation({
    mutationFn: async (symbol) => {
      const { data } = await watchlistAPI.remove(symbol);
      return data;
    },
    onSuccess: () => {
      toast.success('Removed from watchlist');
      refetch();
    },
  });

  // Group stocks
  const filteredStocks = watchlist.filter(stock => {
    if (group === 'gainers') return stock.changePercent > 0;
    if (group === 'losers') return stock.changePercent < 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-bg-primary pb-20 md:pb-4">
      {/* Header - Zerodha Mobile Style */}
      <div className="bg-bg-secondary border-b border-border sticky top-0 z-10 safe-area-top">
        {/* Top Bar */}
        <div className="px-3 py-2.5 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-text-primary">Watchlist</h1>
          <button className="p-1.5 hover:bg-bg-tertiary rounded transition-colors">
            <ChevronDown size={16} className="text-text-secondary" />
          </button>
        </div>

        {/* Index Tabs - Horizontal Scroll */}
        <div className="flex gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-hide border-b border-border">
          {indices.map((index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all ${
                activeIndex === index
                  ? 'bg-brand-blue text-white'
                  : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary'
              }`}
            >
              {index}
            </button>
          ))}
        </div>

        {/* Compact Search Bar */}
        <div className="px-3 py-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by symbol or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-bg-card border border-border rounded-lg text-xs text-text-primary placeholder:text-text-muted outline-none focus:border-brand-blue transition-colors"
            />
          </div>
        </div>
      </div>
  
      {/* Stock List - Compact Zerodha Style */}
      <div className="p-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-text-muted text-xs mb-2">No stocks found</div>
            <button 
              onClick={() => navigate('/trading')}
              className="text-brand-blue text-xs font-medium hover:underline"
            >
              Browse Stocks
            </button>
          </div>
        ) : (
          <div className="bg-bg-card border border-border rounded-lg overflow-hidden divide-y divide-border">
            {/* Stock Items */}
            {filteredStocks.map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between px-3 py-2 hover:bg-bg-tertiary transition-colors cursor-pointer"
                onClick={() => {
                  console.log('[WatchlistPage] Navigating with symbol:', stock.symbol);
                  navigate(`/trading?symbol=${stock.symbol}`);
                }}
              >
                {/* Left: Symbol Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-text-primary truncate">{stock.symbol}</div>
                  <div className="text-[10px] text-text-muted truncate mt-0.5">{stock.name}</div>
                </div>

                {/* Right: Price & Change */}
                <div className="text-right ml-3">
                  <div className="text-xs font-bold text-text-primary">
                    ₹{stock.currentPrice?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className={`text-[10px] font-medium mt-0.5 flex items-center justify-end gap-1 ${
                    stock.changePercent >= 0 ? 'text-brand-green' : 'text-accent-red'
                  }`}>
                    {stock.changePercent >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    <span>{stock.changePercent?.toFixed(2)}%</span>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromWatchlist.mutate(stock.symbol);
                  }}
                  className="ml-2 text-text-muted hover:text-accent-red p-1"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
  
      <BottomNav />
    </div>
  );
}
