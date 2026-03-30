import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketAPI } from '../api';
import { useSocket } from '../context/SocketContext';
import useAuthStore from '../context/authStore';
import ChartPanel from '../components/ChartPanel';
import OrderPanel from '../components/OrderPanel';
import Watchlist from '../components/Watchlist';
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, Activity, DollarSign } from 'lucide-react';

export default function TradingPage() {
  const { user } = useAuthStore();
  const socket = useSocket();
  const [searchParams] = useSearchParams();
  
  // Market type tab: 'STOCK' or 'FOREX'
  const [marketType, setMarketType] = useState('STOCK');
  const [instruments, setInstruments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch market instruments based on type
  const { data: marketData, isLoading, error, refetch } = useQuery({
    queryKey: ['market-instruments', marketType],
    queryFn: async () => {
      try {
        const response = await marketAPI.getByType(marketType);
        return response.data || [];
      } catch (err) {
        console.error('[TradingPage] Market API failed:', err);
        return [];
      }
    },
    refetchInterval: 5000, // Refresh every 5 seconds for live updates
    retry: 2,
  });

  // Initialize instruments from market data
  useEffect(() => {
    const fetchedInstruments = marketData || [];
    if (fetchedInstruments.length > 0) {
      setInstruments(fetchedInstruments);
      console.log(`[TradingPage] Loaded ${fetchedInstruments.length} ${marketType} instruments`);
    } else {
      setInstruments([]);
      console.log('[TradingPage] No instruments available');
    }
    setLoading(false);
  }, [marketData, marketType]);

  // Auto-select first instrument
  useEffect(() => {
    if (instruments.length > 0 && !selected) {
      const urlSymbol = searchParams.get('symbol');
      let instrumentToSelect = null;
      
      if (urlSymbol) {
        instrumentToSelect = instruments.find(inst => inst.symbol === urlSymbol);
      }
      
      if (!instrumentToSelect) {
        instrumentToSelect = instruments[0]; // Always select first instrument
      }
      
      if (instrumentToSelect) {
        setSelected(instrumentToSelect);
        console.log('[TradingPage] Auto-selected:', instrumentToSelect.symbol);
      }
    }
  }, [instruments, selected, searchParams]);

  // Socket.IO price updates
  useEffect(() => {
    if (!socket) return;

    const handlePriceUpdate = (updates) => {
      setInstruments(prevInstruments => {
        const updatedInstruments = prevInstruments.map(inst => {
          const update = updates.find(u => u.symbol === inst.symbol);
          if (update) {
            return {
              ...inst,
              price: update.currentPrice || update.price,
              change: update.change,
              changePercent: update.changePercent,
              trend: update.change >= 0 ? 'UP' : 'DOWN'
            };
          }
          return inst;
        });
        
        // Update selected instrument if it changed
        const selectedUpdate = updates.find(u => u.symbol === selected?.symbol);
        if (selectedUpdate && selected) {
          setSelected(prev => ({
            ...prev,
            price: selectedUpdate.currentPrice || selectedUpdate.price,
            change: selectedUpdate.change,
            changePercent: selectedUpdate.changePercent,
          }));
        }
        
        return updatedInstruments;
      });
    };

    socket.on('price:update', handlePriceUpdate);
    return () => socket.off('price:update', handlePriceUpdate);
  }, [socket, selected]);

  // Show minimal loading only on very first load
  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-bg-primary">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-secondary text-sm">Loading market data...</p>
        </div>
      </div>
    );
  }

  // Use instruments directly (no fallback needed - database always has data)
  const displayInstruments = instruments;
  const displaySelected = selected || (instruments.length > 0 ? instruments[0] : null);

  return (
    <div className="w-full h-screen bg-bg-primary" style={{ minWidth: 0, minHeight: 0 }}>
      {/* Market Type Tabs - Top Bar */}
      <div className="bg-bg-secondary border-b border-border px-4 py-2 flex items-center gap-2">
        <button
          onClick={() => setMarketType('STOCK')}
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
          onClick={() => setMarketType('FOREX')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-all ${
            marketType === 'FOREX'
              ? 'bg-brand-blue text-white shadow-lg'
              : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary border border-border'
          }`}
        >
          <DollarSign size={16} />
          Forex Market
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs text-text-secondary">
          <Activity size={14} />
          <span>{instruments.length} {marketType === 'STOCK' ? 'Stocks' : 'Forex Pairs'}</span>
        </div>
      </div>

      {/* DESKTOP ≥1280px - 3 Column Layout */}
      <div 
        className="hidden xl:block"
        style={{
          height: 'calc(100vh - 120px)',
        }}
      >
        <div 
          className="grid h-full"
          style={{
            gridTemplateColumns: '260px minmax(0,1fr) 320px',
            gap: '8px',
            padding: '8px',
          }}
        >
          {/* Left: Instrument List / Watchlist - Fixed Width */}
          <div className="min-w-0" style={{ minWidth: 0 }}>
            <div className="h-full overflow-y-auto">
              <Watchlist 
                onStockSelect={setSelected} 
                selectedSymbol={displaySelected?.symbol}
                stocks={displayInstruments}
              />
            </div>
          </div>

          {/* Center: Chart - Flexible Grow */}
          <div className="min-w-0 flex flex-col h-full" style={{ minWidth: 0, minHeight: 0 }}>
            <div className="bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full" style={{ flex: 1, minHeight: 0 }}>
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
              
              {/* Chart Container - Auto Expand */}
              <div className="flex-1 w-full" style={{ flex: 1, minWidth: 0, minHeight: 0, backgroundColor: '#0f172a' }}>
                <ChartPanel 
                  symbol={displaySelected?.symbol || 'RELIANCE'} 
                  currentPrice={displaySelected?.price || 0}
                  chartData={displaySelected?.chartData || []}
                />
              </div>
            </div>
          </div>

          {/* Right: Order Panel - Fixed Width */}
          <div className="min-w-0" style={{ minWidth: 0 }}>
            <div className="bg-bg-card border border-border rounded-lg p-3 h-full overflow-y-auto" style={{ height: '100%' }}>
              <OrderPanel stock={displaySelected} />
            </div>
          </div>
        </div>
      </div>

      {/* ... Similar responsive layouts for laptop, tablet, mobile ... */}
      {/* For brevity, keeping existing responsive structure but with updated variable names */}
      
      {/* LAPTOP 1024px–1279px - Reduced 3 Column Layout */}
      <div className="hidden lg:block xl:hidden" style={{ height: 'calc(100vh - 120px)' }}>
        <div className="grid h-full" style={{ gridTemplateColumns: '220px minmax(0,1fr) 280px', gap: '6px', padding: '6px' }}>
          <div className="min-w-0">
            <div className="h-full overflow-y-auto">
              <Watchlist onStockSelect={setSelected} selectedSymbol={displaySelected?.symbol} stocks={displayInstruments} />
            </div>
          </div>
          <div className="min-w-0 flex flex-col h-full">
            <div className="bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full">
              <div className="px-2 py-1.5 border-b border-border text-[11px] font-semibold text-text-primary">
                {displaySelected?.symbol || "Select"}
              </div>
              <div className="flex-1 w-full" style={{ flex: 1, minWidth: 0, minHeight: 0, backgroundColor: '#0f172a' }}>
                <ChartPanel symbol={displaySelected?.symbol || 'RELIANCE'} currentPrice={displaySelected?.price || 0} chartData={displaySelected?.chartData || []} />
              </div>
            </div>
          </div>
          <div className="min-w-0">
            <div className="bg-bg-card border border-border rounded-lg p-2 h-full overflow-y-auto">
              <OrderPanel stock={displaySelected} />
            </div>
          </div>
        </div>
      </div>

      {/* TABLET & MOBILE - Simplified layouts */}
      <div className="lg:hidden flex flex-col gap-2 p-2 h-full overflow-y-auto pb-20">
        <div className="bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col" style={{ height: '45vh' }}>
          <ChartPanel symbol={displaySelected?.symbol || 'RELIANCE'} currentPrice={displaySelected?.price || 0} chartData={displaySelected?.chartData || []} />
        </div>
        <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
          <OrderPanel stock={displaySelected} />
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-2">
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
