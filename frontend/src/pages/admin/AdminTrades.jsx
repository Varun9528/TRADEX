import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { Activity, User, Calendar, TrendingUp, TrendingDown } from 'lucide-react';

export default function AdminTrades() {
  const [filter, setFilter] = useState('all'); // all, open, closed

  // ALL HOOKS MUST BE AT TOP LEVEL - before any returns
  const { data: tradesData, isLoading } = useQuery({
    queryKey: ['admin-trades', filter],
    queryFn: async () => {
      const { data } = await adminAPI.getTrades({ status: filter !== 'all' ? filter : undefined });
      return data.data || [];
    },
  });

  const { data: positionsData } = useQuery({
    queryKey: ['admin-positions'],
    queryFn: async () => {
      const { data } = await adminAPI.getPositions();
      return data.data || [];
    },
  });

  // Handle loading state - AFTER all hooks
  if (!tradesData) {
    return (
      <div className="min-h-screen bg-bg-primary pb-24 md:pb-4">
        <div className="flex items-center justify-center h-64 text-text-secondary">
          Loading trades...
        </div>
      </div>
    );
  }

  const getTradeTypeBadge = (type) => {
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
        type === 'BUY'
          ? 'bg-brand-green/20 text-brand-green'
          : 'bg-accent-red/20 text-accent-red'
      }`}>
        {type}
      </span>
    );
  };

  const getProductTypeBadge = (productType) => {
    return (
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
        productType === 'MIS'
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-purple-500/20 text-purple-400'
      }`}>
        {productType}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-bg-primary pb-24 md:pb-4">
      {/* Header */}
      <div className="bg-bg-secondary border-b border-border px-3 md:px-4 py-3 sticky top-0 z-10 safe-area-top">
        <h1 className="text-lg md:text-xl font-bold text-text-primary">Trade Monitor</h1>
      </div>

      {/* Stats Cards */}
      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={18} className="text-brand-blue" />
              <div className="text-xs text-text-secondary">Total Trades</div>
            </div>
            <div className="text-2xl font-bold text-text-primary">{tradesData?.length || 0}</div>
          </div>
          <div className="bg-bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-brand-green" />
              <div className="text-xs text-text-secondary">Open Positions</div>
            </div>
            <div className="text-2xl font-bold text-text-primary">
              {positionsData?.filter(p => !p.isClosed).length || 0}
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['all', 'open', 'closed'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === f
                  ? 'bg-brand-blue text-white'
                  : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary border border-border'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Trades List */}
        {isLoading ? (
          <div className="text-center py-8 text-text-secondary">Loading trades...</div>
        ) : (tradesData || []).length === 0 ? (
          <div className="bg-bg-card rounded-lg p-8 shadow-sm border border-border">
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-bg-tertiary flex items-center justify-center border border-border">
                <Activity size={32} className="text-text-muted" />
              </div>
              <p className="text-text-secondary font-medium text-sm">No trades found</p>
              <p className="text-text-muted text-xs mt-1">
                {filter === 'all' 
                  ? 'Start trading to see your trades'
                  : filter === 'open'
                    ? 'You have no open trades'
                    : 'You have no closed trades'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {(tradesData || []).map((trade) => (
              <div key={trade._id} className="bg-bg-card rounded-lg p-4 shadow-sm border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-brand-blue" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">{trade.user?.fullName || 'N/A'}</div>
                      <div className="text-xs text-text-secondary">{trade.user?.email || 'N/A'}</div>
                      <div className="text-xs text-text-secondary">{trade.user?.clientId || 'N/A'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-text-primary mb-1">{trade.symbol || 'N/A'}</div>
                    <div className="flex items-center gap-1 justify-end">
                      {getTradeTypeBadge(trade.transactionType || 'BUY')}
                      {getProductTypeBadge(trade.productType || 'CNC')}
                    </div>
                  </div>
                </div>
              
                <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                  <div>
                    <div className="text-text-secondary text-xs mb-1">Quantity</div>
                    <div className="text-text-primary font-semibold">{trade.quantity || 0}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-1">Price</div>
                    <div className="text-text-primary font-semibold">₹{Number(trade.price || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-text-secondary text-xs mb-1">Amount</div>
                    <div className="text-text-primary font-semibold">₹{Number((trade.price || 0) * (trade.quantity || 0)).toLocaleString()}</div>
                  </div>
                </div>
              
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <Calendar size={12} />
                  <span>{new Date(trade.createdAt || Date.now()).toLocaleString()}</span>
                </div>
              </div>
              ))}
            </div>
        )}

        {/* All Positions Section */}
        {positionsData && (positionsData || []).length > 0 && (
          <>
            <div className="border-t border-border pt-4 mt-4">
              <h3 className="font-bold text-lg text-text-primary mb-3">All Positions</h3>
              <div className="space-y-3">
                {(positionsData || []).map((position) => (
                  <div key={position._id} className="bg-bg-card rounded-lg p-4 shadow-sm border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-bold text-text-primary">{position.symbol || 'N/A'}</div>
                        <div className="text-xs text-text-secondary flex items-center gap-2">
                          <span>{position.user?.fullName || 'N/A'}</span>
                          <span>•</span>
                          <span>{position.transactionType || 'N/A'}</span>
                          <span>•</span>
                          <span>{position.quantity || 0} qty</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-text-primary">₹{Number(position.averagePrice || 0).toFixed(2)}</div>
                        <div className="text-xs text-text-secondary">Avg Price</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span>{position.productType || 'CNC'}</span>
                      <span>•</span>
                      <span>Status: {position.isClosed ? 'Closed' : 'Open'}</span>
                      <span>•</span>
                      <span>P&L: ₹{Number(position.totalPnl || 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
