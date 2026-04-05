import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { positionAPI } from '../api';
import toast from 'react-hot-toast';
import BottomNav from '../components/BottomNav';
import { TrendingUp, TrendingDown, X, Clock, IndianRupee } from 'lucide-react';

export default function PositionsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all'); // all, open, closed

  // Fetch positions
  const { data: positionsData, isLoading, refetch } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const { data } = await positionAPI.getAll();
      return data.data || [];
    },
    refetchInterval: 5000, // Refresh every 5 seconds for live P&L
  });

  // Close position mutation
  const closeMutation = useMutation({
    mutationFn: ({ symbol, data }) => positionAPI.close(symbol, data),
    onSuccess: () => {
      toast.success('Position closed successfully');
      queryClient.invalidateQueries(['positions']);
      queryClient.invalidateQueries(['wallet-balance']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to close position');
    },
  });

  const handleClose = (symbol, quantity) => {
    if (window.confirm(`Are you sure you want to close this position (${quantity} qty)?`)) {
      closeMutation.mutate({ symbol, data: {} });
    }
  };

  const getPositionPnL = (position) => {
    const currentPrice = position.currentPrice || 0;
    const avgPrice = position.averagePrice || 0;
    const qty = position.quantity || 0;
    
    if (position.transactionType === 'BUY') {
      return (currentPrice - avgPrice) * qty;
    } else {
      return (avgPrice - currentPrice) * qty;
    }
  };

  const getPnLPercentage = (position) => {
    const pnl = getPositionPnL(position);
    const investment = position.investmentValue || (position.averagePrice * position.quantity);
    return (pnl / investment) * 100;
  };

  const filteredPositions = positionsData?.filter(pos => {
    if (filter === 'open') return !pos.isClosed;
    if (filter === 'closed') return pos.isClosed;
    return true;
  }) || [];

  // Calculate totals
  const totalInvestment = filteredPositions.reduce((sum, pos) => sum + (pos.investmentValue || 0), 0);
  const totalPnL = filteredPositions.reduce((sum, pos) => sum + getPositionPnL(pos), 0);
  const totalPnLPercent = totalInvestment > 0 ? (totalPnL / totalInvestment) * 100 : 0;

  return (
    <div className="min-h-screen bg-bg-primary pb-24 md:pb-4">
      {/* Header - Compact */}
      <div className="bg-bg-secondary border-b border-border px-3 py-2.5 sticky top-0 z-10 safe-area-top">
        <h1 className="text-sm font-bold text-text-primary">Positions</h1>
      </div>

      {/* Summary Cards - Compact */}
      <div className="p-2 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-bg-card rounded-lg p-2.5 shadow-sm border border-border">
            <div className="text-[10px] text-text-secondary mb-1">Total Investment</div>
            <div className="text-base font-bold text-text-primary">
              ₹{totalInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div className={`rounded-lg p-2.5 shadow-sm border border-border ${
            totalPnL >= 0 
              ? 'bg-green-500/10 border-green-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="text-[10px] text-text-secondary mb-1">Total P&L</div>
            <div className={`text-base font-bold flex items-center gap-1 ${
              totalPnL >= 0 ? 'text-brand-green' : 'text-accent-red'
            }`}>
              {totalPnL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              ₹{Math.abs(totalPnL).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-[9px]">({totalPnLPercent >= 0 ? '+' : ''}{totalPnLPercent.toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs - Compact */}
        <div className="flex gap-1.5">
          {['all', 'open', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-1.5 rounded-lg font-medium text-xs transition-all ${
                filter === f
                  ? 'bg-brand-blue text-white'
                  : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary border border-border'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Positions List - Compact Cards */}
        {isLoading ? (
          <div className="text-center py-8 text-text-secondary text-xs">Loading positions...</div>
        ) : filteredPositions.length > 0 ? (
          <div className="space-y-2">
            {filteredPositions.map((position) => {
              const pnl = getPositionPnL(position);
              const pnlPercent = getPnLPercentage(position);
              
              return (
                <div key={position._id} className="bg-bg-card rounded-lg p-3 shadow-sm border border-border">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm text-text-primary truncate">{position.symbol}</h3>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                          position.productType === 'MIS'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-purple-500/20 text-purple-400'
                        }`}>
                          {position.productType}
                        </span>
                        {position.isClosed && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-gray-500/20 text-gray-400">
                            Closed
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-text-secondary flex items-center gap-2">
                        <span className="font-medium">{position.transactionType}</span>
                        <span>•</span>
                        <span>{position.quantity} qty</span>
                      </div>
                    </div>
                    
                    <div className="text-right ml-2">
                      <div className={`text-sm font-bold flex items-center gap-1 ${
                        pnl >= 0 ? 'text-brand-green' : 'text-accent-red'
                      }`}>
                        {pnl >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        ₹{Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                      <div className={`text-[10px] font-semibold ${
                        pnl >= 0 ? 'text-brand-green' : 'text-accent-red'
                      }`}>
                        {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>

                  {/* Details Grid - Compact */}
                  <div className="grid grid-cols-3 gap-2 mb-2 text-[10px]">
                    <div>
                      <div className="text-text-secondary mb-0.5">Avg Price</div>
                      <div className="text-text-primary font-semibold">₹{position.averagePrice?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary mb-0.5">Current Price</div>
                      <div className="text-text-primary font-semibold">₹{position.currentPrice?.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-text-secondary mb-0.5">Investment</div>
                      <div className="text-text-primary font-semibold">₹{position.investmentValue?.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  {!position.isClosed && (
                    <div className="pt-2 border-t border-border">
                      <button
                        onClick={() => handleClose(position.symbol, position.quantity)}
                        disabled={closeMutation.isPending}
                        className="w-full bg-bg-tertiary hover:bg-bg-secondary text-text-primary py-1.5 rounded-lg font-medium text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 border border-border"
                      >
                        <X size={14} />
                        Close Position
                      </button>
                    </div>
                  )}

                  {position.isClosed && (
                    <div className="text-[10px] text-text-secondary pt-2 border-t border-border">
                      Closed on: {new Date(position.updatedAt).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-bg-card flex items-center justify-center border border-border">
              <IndianRupee size={32} className="text-text-muted" />
            </div>
            <p className="text-text-secondary font-medium text-xs">No positions found</p>
            <p className="text-text-muted text-[10px] mt-1">
              {filter === 'open' 
                ? 'You have no open positions'
                : filter === 'closed'
                  ? 'You have no closed positions'
                  : 'Start trading to see positions'}
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
