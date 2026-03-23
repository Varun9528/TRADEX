import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { stockAPI, watchlistAPI } from '../api';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import BottomNav from '../components/BottomNav';
import { TrendingUp, TrendingDown, Plus, X } from 'lucide-react';

export default function WatchlistPage() {
  const [group, setGroup] = useState('all'); // all, gainers, losers
  const socket = useSocket();

  const { data: watchlistData, isLoading, refetch } = useQuery({
    queryKey: ['watchlist'],
    queryFn: async () => {
      const { data } = await watchlistAPI.get();
      return data.data || [];
    },
    refetchInterval: 5000,
  });

  const watchlist = Array.isArray(watchlistData) ? watchlistData : [];

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
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      {/* Header - Sticky on mobile */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 safe-area-top">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-gray-900">Watchlist</h1>
          
          {/* Tabs - Swipeable */}
          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
            {[
              { id: 'all', label: 'All' },
              { id: 'gainers', label: 'Gainers' },
              { id: 'losers', label: 'Losers' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setGroup(tab.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
                  group === tab.id
                    ? 'bg-[#00d084] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stock List - 2 column grid on mobile */}
      <div className="p-3 md:p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[#00d084] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">No stocks in watchlist</div>
            <button 
              onClick={() => window.location.href = '/stocks'}
              className="text-[#00d084] font-medium"
            >
              Browse Stocks
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStocks.map((stock) => (
              <div
                key={stock.symbol}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Stock Header */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base md:text-lg">{stock.symbol}</h3>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{stock.name}</p>
                  </div>
                  <button
                    onClick={() => removeFromWatchlist.mutate(stock.symbol)}
                    className="text-gray-400 hover:text-red-500 p-1 active:scale-125 transition-transform"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Price Info */}
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">
                      ₹{stock.price?.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-semibold ${
                      stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stock.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>₹{stock.change?.toFixed(2)} ({stock.changePercent?.toFixed(2)}%)</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions - Hide on small mobile */}
                <div className="flex gap-2 mt-3 hidden sm:flex">
                  <button
                    onClick={() => {/* Add buy logic */}}
                    className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors active:scale-95"
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => {/* Add sell logic */}}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-medium transition-colors active:scale-95"
                  >
                    Sell
                  </button>
                </div>

                {/* Mobile Quick View */}
                <div className="sm:hidden mt-2">
                  <button
                    onClick={() => window.location.href = `/trading?symbol=${stock.symbol}`}
                    className="w-full bg-[#00d084]/10 text-[#00d084] py-1.5 rounded-lg font-medium text-sm active:scale-95"
                  >
                    Trade
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
