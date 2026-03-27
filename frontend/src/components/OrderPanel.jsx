import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tradeAPI, walletAPI } from '../api';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';
import { Info, Wallet } from 'lucide-react';

export default function OrderPanel({ stock }) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  const [orderType, setOrderType] = useState('BUY');
  const [orderMode, setOrderMode] = useState('MARKET');
  const [productType, setProductType] = useState('MIS');
  const [qty, setQty] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');

  // Safety check - prevent crashes
  if (!stock) {
    return (
      <div className="p-3 text-center text-xs text-text-secondary">
        Select a stock to trade
      </div>
    );
  }

  // Fetch wallet balance
  const { data: walletData, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      try {
        const { data } = await walletAPI.getBalance();
        return data.data;
      } catch (err) {
        console.error('[OrderPanel] Wallet fetch error:', err);
        return null;
      }
    },
    refetchInterval: 5000,
  });

  const placeMutation = useMutation({
    mutationFn: (data) => {
      console.log('[OrderPanel] Placing order:', data);
      return tradeAPI.placeOrder(data);
    },
    onSuccess: (res) => {
      console.log('[OrderPanel] Order success:', res);
      toast.success(`${orderType} order placed for ${stock.symbol}`);
      setQty(1);
      setLimitPrice('');
      queryClient.invalidateQueries(['holdings']);
      queryClient.invalidateQueries(['recent-orders']);
      queryClient.invalidateQueries(['orders']);
      queryClient.invalidateQueries(['positions']);
      queryClient.invalidateQueries(['wallet-balance']);
      refetchWallet();
      queryClient.refetchQueries(['positions']);
    },
    onError: (err) => {
      console.error('[OrderPanel] Order failed:', err);
      toast.error(err.response?.data?.message || 'Order placement failed');
    },
  });

  const execPrice = orderMode === 'MARKET' ? stock.currentPrice : parseFloat(limitPrice) || stock.currentPrice;
  const estAmount = (execPrice || 0) * qty;
  const canTrade = user?.kycStatus === 'approved' && user?.tradingEnabled;

  const getRequiredMargin = () => {
    if (productType === 'MIS') {
      return estAmount * 0.2;
    }
    return estAmount;
  };

  const handlePlaceOrder = () => {
    if (!canTrade) {
      toast.error('Complete KYC to start trading');
      return;
    }
    
    console.log('[OrderPanel] Handle place order clicked');
    
    placeMutation.mutate({
      symbol: stock.symbol,
      transactionType: orderType,
      orderType: orderMode,
      productType: productType,
      quantity: qty,
      price: orderMode === 'LIMIT' ? parseFloat(limitPrice) : undefined,
    });
  };

  return (
    <div className="bg-bg-card border border-border rounded-lg h-full overflow-y-auto" style={{ maxHeight: 'calc(100vh - 80px)' }}>
      {/* Stock Info Header */}
      <div className="px-3 py-3 border-b border-border bg-bg-secondary sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-text-primary">{stock.symbol}</h3>
            <p className="text-[10px] text-text-secondary truncate">{stock.name}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-base font-bold text-text-primary">₹{(stock.currentPrice || 0).toFixed(2)}</div>
            <div className={`text-xs font-semibold ${stock.changePercent >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
              {stock.changePercent >= 0 ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Market Stats */}
        <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-border">
          {[
            { label: 'Open', value: stock.open || stock.openPrice },
            { label: 'High', value: stock.dayHigh },
            { label: 'Low', value: stock.dayLow },
            { label: 'Prev Close', value: stock.previousClose },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-[9px] text-text-secondary">{stat.label}</div>
              <div className="text-[10px] font-semibold text-text-primary">
                ₹{(stat.value || 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BUY / SELL Tabs - Larger & Touch-Friendly */}
      <div className="flex gap-2 mx-3 my-3">
        <button
          onClick={() => {
            console.log('[OrderPanel] BUY clicked');
            setOrderType('BUY');
          }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all touch-manipulation ${
            orderType === 'BUY'
              ? 'bg-brand-green/20 text-brand-green border-2 border-brand-green shadow-lg shadow-brand-green/20'
              : 'bg-bg-tertiary text-text-secondary border border-border hover:bg-bg-secondary'
          }`}
          style={{ minHeight: '44px' }}
        >
          BUY
        </button>
        <button
          onClick={() => {
            console.log('[OrderPanel] SELL clicked');
            setOrderType('SELL');
          }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all touch-manipulation ${
            orderType === 'SELL'
              ? 'bg-accent-red/20 text-accent-red border-2 border-accent-red shadow-lg shadow-accent-red/20'
              : 'bg-bg-tertiary text-text-secondary border border-border hover:bg-bg-secondary'
          }`}
          style={{ minHeight: '44px' }}
        >
          SELL
        </button>
      </div>

      {/* Product Type Selector - Compact */}
      <div className="mx-3 mb-2">
        <label className="block text-[10px] font-medium text-text-secondary mb-1">
          Product Type
        </label>
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setProductType('MIS')}
            className={`py-1 rounded-lg text-[10px] font-semibold transition-all border ${
              productType === 'MIS'
                ? 'bg-brand-blue/20 text-brand-blue border-brand-blue'
                : 'bg-bg-tertiary text-text-secondary border-border hover:bg-bg-secondary'
            }`}
          >
            MIS
          </button>
          <button
            onClick={() => setProductType('CNC')}
            className={`py-1 rounded-lg text-[10px] font-semibold transition-all border ${
              productType === 'CNC'
                ? 'bg-brand-blue/20 text-brand-blue border-brand-blue'
                : 'bg-bg-tertiary text-text-secondary border-border hover:bg-bg-secondary'
            }`}
          >
            CNC
          </button>
        </div>
      </div>

      {/* Order Mode Selector - Compact */}
      <div className="mx-3 mb-2">
        <label className="block text-[10px] font-medium text-text-secondary mb-1">
          Order Type
        </label>
        <div className="flex gap-1">
          <button
            onClick={() => setOrderMode('MARKET')}
            className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
              orderMode === 'MARKET'
                ? 'bg-brand-blue/20 text-brand-blue border-brand-blue'
                : 'bg-bg-tertiary text-text-secondary border-border hover:bg-bg-secondary'
            }`}
          >
            Market
          </button>
          <button
            onClick={() => setOrderMode('LIMIT')}
            className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all border ${
              orderMode === 'LIMIT'
                ? 'bg-brand-blue/20 text-brand-blue border-brand-blue'
                : 'bg-bg-tertiary text-text-secondary border-border hover:bg-bg-secondary'
            }`}
          >
            Limit
          </button>
        </div>
      </div>

      {/* Quantity Input - Compact */}
      <div className="mx-3 mb-2">
        <label className="block text-[10px] font-medium text-text-secondary mb-1">
          Quantity
        </label>
        <input
          type="number"
          value={qty}
          onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 0))}
          className="w-full px-2 py-1.5 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none text-xs"
          min="1"
        />
      </div>

      {/* Limit Price Input - Compact */}
      {orderMode === 'LIMIT' && (
        <div className="mx-3 mb-2">
          <label className="block text-[10px] font-medium text-text-secondary mb-1">
            Limit Price
          </label>
          <input
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder="Enter limit price"
            className="w-full px-2 py-1.5 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none text-xs"
            step="0.05"
          />
        </div>
      )}

      {/* Order Summary - Compact */}
      <div className="mx-3 mb-2 bg-bg-tertiary rounded-lg p-2 border border-border">
        <div className="text-xs font-semibold text-text-primary mb-1">Order Summary</div>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between text-text-secondary">
            <span>Qty:</span>
            <span className="text-text-primary">{qty}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Avg:</span>
            <span className="text-text-primary">₹{execPrice?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Amount:</span>
            <span className="text-text-primary">₹{estAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-text-secondary pt-1 border-t border-border">
            <span>Margin:</span>
            <span className="text-brand-blue font-bold">₹{getRequiredMargin().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Available Balance Display - Compact */}
      <div className="mx-3 mb-2 bg-gradient-to-r from-brand-blue/10 to-blue-600/10 border border-brand-blue/20 rounded-lg p-2">
        <div className="flex items-center gap-1 mb-0.5">
          <Wallet size={10} className="text-brand-blue" />
          <span className="text-[10px] font-medium text-text-secondary">Balance</span>
        </div>
        <div className="text-base font-bold text-brand-blue">
          ₹{(walletData?.availableBalance || user?.availableBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Place Order Button - Compact */}
      <button
        onClick={(e) => {
          e.preventDefault();
          console.log('[OrderPanel] Place Order button clicked');
          handlePlaceOrder();
        }}
        disabled={placeMutation.isPending || !canTrade}
        className={`w-full mx-3 py-2 rounded-lg font-bold text-white text-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          orderType === 'BUY'
            ? 'bg-brand-green hover:bg-brand-green/90 active:scale-98'
            : 'bg-accent-red hover:bg-accent-red/90 active:scale-98'
        }`}
      >
        {placeMutation.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Placing...
          </span>
        ) : (
          `Place ${orderType} Order`
        )}
      </button>

      {!canTrade && (
        <div className="mx-3 mt-1 mb-2 text-[9px] text-accent-red text-center">
          {!user.tradingEnabled ? 'Trading disabled' : 'Complete KYC to trade'}
        </div>
      )}
    </div>
  );
}
