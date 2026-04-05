import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { marketAPI } from '../api';
import useAuthStore from '../context/authStore';
import ChartPanel from '../components/ChartPanel';
import OrderPanel from '../components/OrderPanel';
import Watchlist from '../components/Watchlist';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, Activity, DollarSign } from 'lucide-react';

export default function TradingPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  
  // Check if trading is enabled for user
  const isTradingEnabled = user?.tradingEnabled !== false;
  
  // Market type tab: 'STOCK', 'FOREX', or 'OPTION'
  const [marketType, setMarketType] = useState('STOCK');
  const [instruments, setInstruments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // SIMPLE: Clear instruments AND selected when tab changes
  useEffect(() => {
    console.log('[TradingPage] 🔄 Tab changed to:', marketType);
    setInstruments([]); // Clear old instruments
    setSelected(null); // Clear selected instrument
    setLoading(true);
    // Invalidate and remove ALL cached queries for market-instruments
    queryClient.invalidateQueries(['market-instruments']);
    queryClient.removeQueries(['market-instruments']);
    console.log('[TradingPage] 🗑️  Cleared cache for market-instruments');
  }, [marketType]);

  // Fetch market instruments based on type - REFETCHES ON marketType CHANGE
  const { data: marketData, isLoading, error, refetch } = useQuery({
    queryKey: ['market-instruments', marketType],
    queryFn: async ({ queryKey }) => {
      const [, type] = queryKey;
      try {
        console.log('[TradingPage] 📡 Fetching instruments for type:', type);
        console.log('[TradingPage] 🔑 Query key:', queryKey);
        const response = await marketAPI.getByType(type);
        console.log('[TradingPage] 📦 API Response:', response);
        const list = Array.isArray(response?.data) ? response.data : [];
        console.log('[TradingPage] ✅ Loaded', list.length, type, 'instruments');
        if (list.length > 0) {
          console.log('[TradingPage] 📋 First instrument:', list[0]);
        }
        return list;
      } catch (err) {
        console.error('[TradingPage] ❌ Market API failed:', err.message);
        return [];
      }
    },
    keepPreviousData: false,
    staleTime: 30000, // Cache for 30 seconds
    cacheTime: 60000, // Keep in cache for 1 minute
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchInterval: false, // Disable auto-refetch
    retry: 1,
  });

  // Update instruments when data arrives
  useEffect(() => {
    if (marketData && Array.isArray(marketData)) {
      setInstruments(marketData);
      setLoading(false);
    }
  }, [marketData]);

  // SIMPLE: Auto-select first instrument when instruments load
  useEffect(() => {
    if (instruments.length > 0) {
      console.log('[TradingPage] Auto-selecting:', instruments[0].symbol);
      setSelected(instruments[0]);
    }
  }, [instruments]);

  // Show minimal loading only on very first load
  if (loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary text-sm">Loading market data...</p>
        </div>
      </div>
    );
  }

  // Show loading only during initial fetch
  // Empty array is OK - will show empty watchlist

  // Simple displaySelected - uses selected or falls back to first instrument
  const displayInstruments = instruments;
  const displaySelected = selected || instruments[0] || null;

  return (
    <div className="w-full min-h-screen bg-bg-primary flex flex-col" style={{ minWidth: 0 }}>
      {/* Market Type Tabs - Top Bar */}
      <div className={`bg-bg-secondary border-b border-border px-4 py-2 flex items-center gap-2 flex-shrink-0`}>
        <button
          onClick={() => {
            console.log('[TradingPage] 🔄 Tab clicked: Indian Market (STOCK)');
            setMarketType('STOCK');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all ${
            marketType === 'STOCK'
              ? 'bg-brand-blue text-white shadow-lg'
              : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary border border-border'
          }`}
        >
          <TrendingUp size={16} />
          Indian Market
        </button>
        <button
          onClick={() => {
            console.log('[TradingPage] 🔄 Tab clicked: Forex Market (FOREX)');
            setMarketType('FOREX');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all ${
            marketType === 'FOREX'
              ? 'bg-brand-blue text-white shadow-lg'
              : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary border border-border'
          }`}
        >
          <DollarSign size={16} />
          Forex Market
        </button>
        <button
          onClick={() => {
            console.log('[TradingPage] 🔄 Tab clicked: Options (OPTION)');
            setMarketType('OPTION');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all ${
            marketType === 'OPTION'
              ? 'bg-brand-blue text-white shadow-lg'
              : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary border border-border'
          }`}
        >
          <Activity size={16} />
          Options
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs text-text-secondary">
          <Activity size={14} />
          <span>{instruments.length} {marketType === 'STOCK' ? 'Stocks' : marketType === 'FOREX' ? 'Forex Pairs' : 'Options'}</span>
        </div>
      </div>

      {/* DESKTOP ≥1280px - 3 Column Layout */}
      <div className="hidden xl:block">
        <div 
          className="grid"
          style={{
            gridTemplateColumns: '260px minmax(0,1fr) 320px',
            gap: '8px',
            padding: '8px',
          }}
        >
          {/* Left: Instrument List / Watchlist */}
          <div className="min-w-0">
            <Watchlist 
              onStockSelect={setSelected} 
              selectedSymbol={displaySelected?.symbol}
              stocks={displayInstruments}
              marketType={marketType}
            />
          </div>

          {/* Center: Chart */}
          <div className="min-w-0 flex flex-col">
            <div className="bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="px-3 py-2 border-b border-border text-xs font-semibold text-text-primary flex-shrink-0 flex items-center justify-between">
                <span>
                  {displaySelected?.name || displaySelected?.symbol || "Select Instrument"}
                </span>
                {displaySelected && (
                  <span className={`font-bold ${displaySelected.changePercent >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
                    ₹{displaySelected.price?.toFixed(2)} ({displaySelected.changePercent >= 0 ? '+' : ''}{displaySelected.changePercent?.toFixed(2)}%)
                  </span>
                )}
              </div>
              
              {/* Chart Container - Fixed Height */}
              <div className="w-full chart-container" style={{ backgroundColor: '#0f172a' }}>
                {displaySelected ? (
                  <ChartPanel 
                    symbol={displaySelected.symbol} 
                    currentPrice={displaySelected.price || 0}
                    chartData={displaySelected.chartData || []}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <p>Select an instrument to view chart</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Order Panel */}
          <div className="min-w-0">
            <div className="bg-bg-card border border-border rounded-lg p-3">
              <OrderPanel stock={displaySelected} tradingEnabled={isTradingEnabled} />
            </div>
          </div>
        </div>
      </div>

      {/* ... Similar responsive layouts for laptop, tablet, mobile ... */}
      {/* For brevity, keeping existing responsive structure but with updated variable names */}
      
      {/* LAPTOP 1024px–1279px - Reduced 3 Column Layout */}
      <div className="hidden lg:block xl:hidden">
        <div className="grid" style={{ gridTemplateColumns: '220px minmax(0,1fr) 280px', gap: '6px', padding: '6px' }}>
          <div className="min-w-0">
            <Watchlist onStockSelect={setSelected} selectedSymbol={displaySelected?.symbol} stocks={displayInstruments} marketType={marketType} />
          </div>
          <div className="min-w-0 flex flex-col">
            <div className="bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col">
              <div className="px-2 py-1.5 border-b border-border text-[11px] font-semibold text-text-primary">
                {displaySelected?.symbol || "Select Instrument"}
              </div>
              <div className="w-full chart-container" style={{ backgroundColor: '#0f172a' }}>
                {displaySelected ? (
                  <ChartPanel symbol={displaySelected.symbol} currentPrice={displaySelected.price || 0} chartData={displaySelected.chartData || []} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                    <p>Select an instrument</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <div className="bg-bg-card border border-border rounded-lg p-2">
              <OrderPanel stock={displaySelected} tradingEnabled={isTradingEnabled} />
            </div>
          </div>
        </div>
      </div>

      {/* TABLET & MOBILE - Simplified layouts */}
      <div className="lg:hidden flex flex-col gap-2 p-2 pb-20">
        {/* Chart Section */}
        <div className="bg-bg-card border border-border rounded-lg chart-section">
          {displaySelected ? (
            <ChartPanel symbol={displaySelected.symbol} currentPrice={displaySelected.price || 0} chartData={displaySelected.chartData || []} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted text-xs" style={{ minHeight: '320px' }}>
              <p>Select an instrument</p>
            </div>
          )}
        </div>
        
        {/* Order Panel Section */}
        <div className="bg-bg-card border border-border rounded-lg trade-section">
          <OrderPanel stock={displaySelected} tradingEnabled={isTradingEnabled} />
        </div>
        
        {/* Market Selection Section */}
        <div className="bg-bg-card border border-border rounded-lg p-2 market-section">
          <label className="block text-xs text-text-secondary mb-2 font-semibold">Select {marketType === 'STOCK' ? 'Stock' : 'Pair'}</label>
          <select
            value={displaySelected?.symbol || ''}
            onChange={(e) => {
              const inst = displayInstruments.find(i => i.symbol === e.target.value);
              if (inst) setSelected(inst);
            }}
            className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary outline-none"
          >
            {displayInstruments.map(i => (
              <option key={i.symbol} value={i.symbol}>
                {i.name} - ₹{i.price?.toFixed(2)} ({i.changePercent >= 0 ? '+' : ''}{i.changePercent?.toFixed(2)}%)
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
