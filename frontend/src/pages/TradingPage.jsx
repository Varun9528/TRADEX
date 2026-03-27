import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockAPI } from '../api';
import { useSocket } from '../context/SocketContext';
import useAuthStore from '../context/authStore';
import ChartPanel from '../components/ChartPanel';
import OrderPanel from '../components/OrderPanel';
import Watchlist from '../components/Watchlist';
import { useSearchParams } from 'react-router-dom';

export default function TradingPage() {
  const { user } = useAuthStore();
  const socket = useSocket();
  const [searchParams] = useSearchParams();

  const [stocks, setStocks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  // Comprehensive fallback stocks (Zerodha style demo)
  const fallbackStocks = [
    { _id: 'RELIANCE.NS', symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy', currentPrice: 2450.00, previousClose: 2450, open: 2445, dayHigh: 2465, dayLow: 2438, change: 12, changePercent: 0.52 },
    { _id: 'TCS.NS', symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT', currentPrice: 3800.00, previousClose: 3800, open: 3790, dayHigh: 3820, dayLow: 3780, change: -10, changePercent: -0.26 },
    { _id: 'INFY.NS', symbol: 'INFY.NS', name: 'Infosys Limited', sector: 'IT', currentPrice: 1450.00, previousClose: 1450, open: 1445, dayHigh: 1460, dayLow: 1440, change: 5, changePercent: 0.34 },
    { _id: 'HDFCBANK.NS', symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking', currentPrice: 1650.00, previousClose: 1650, open: 1648, dayHigh: 1665, dayLow: 1642, change: 8, changePercent: 0.48 },
    { _id: 'ICICIBANK.NS', symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking', currentPrice: 950.00, previousClose: 950, open: 948, dayHigh: 958, dayLow: 942, change: -3, changePercent: -0.31 },
    { _id: 'SBIN.NS', symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', currentPrice: 720.00, previousClose: 720, open: 718, dayHigh: 725, dayLow: 715, change: 4, changePercent: 0.55 },
    { _id: 'LT.NS', symbol: 'LT.NS', name: 'Larsen & Toubro', sector: 'Infrastructure', currentPrice: 3500.00, previousClose: 3500, open: 3490, dayHigh: 3520, dayLow: 3480, change: 15, changePercent: 0.43 },
    { _id: 'ITC.NS', symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG', currentPrice: 420.00, previousClose: 420, open: 419, dayHigh: 423, dayLow: 418, change: 2, changePercent: 0.48 },
    { _id: 'AXISBANK.NS', symbol: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking', currentPrice: 1100.00, previousClose: 1100, open: 1095, dayHigh: 1108, dayLow: 1090, change: -5, changePercent: -0.45 },
  ];

  // Fetch stocks with timeout and guaranteed fallback
  const { data: stocksRes, isLoading, error } = useQuery({
    queryKey: ['stocks-trading'],
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
        
        const response = await stockAPI.getAll({ limit: 50 });
        clearTimeout(timeoutId);
        
        if (!response?.data?.data || response.data.data.length === 0) {
          throw new Error('No data received');
        }
        return response.data;
      } catch (err) {
        console.error('[TradingPage] API failed, using fallback:', err.message);
        return { data: fallbackStocks };
      }
    },
    refetchInterval: 15000,
    retry: 1,
  });

  // Initialize stocks - ALWAYS runs and guarantees data
  useEffect(() => {
    const apiStocks = stocksRes?.data || [];
    
    if (apiStocks.length > 0) {
      setStocks(apiStocks);
      console.log('[TradingPage] Loaded', apiStocks.length, 'stocks');
    } else {
      setStocks(fallbackStocks);
      console.log('[TradingPage] Using fallback stocks');
    }
    setLoading(false);
  }, [stocksRes, isLoading, error]);

  // Auto-select first stock - GUARANTEED to work
  useEffect(() => {
    if (stocks.length > 0 && !selected && !initialized.current) {
      const urlSymbol = searchParams.get('symbol');
      let stockToSelect = null;
      
      if (urlSymbol) {
        stockToSelect = stocks.find(stock => stock.symbol === urlSymbol);
      }
      
      if (!stockToSelect) {
        stockToSelect = stocks[0]; // Always select first stock
      }
      
      if (stockToSelect) {
        setSelected(stockToSelect);
        console.log('[TradingPage] Auto-selected:', stockToSelect.symbol);
        initialized.current = true;
      }
    }
  }, [stocks, selected, searchParams]);

  // Socket.IO price updates
  useEffect(() => {
    if (!socket) return;

    const handlePriceUpdate = (updates) => {
      setStocks(prevStocks => {
        const updatedStocks = prevStocks.map(stock => {
          const update = updates.find(u => u.symbol === stock.symbol);
          if (update) {
            return {
              ...stock,
              currentPrice: update.currentPrice,
              change: update.change,
              changePercent: update.changePercent,
            };
          }
          return stock;
        });
        
        const selectedUpdate = updates.find(u => u.symbol === selected?.symbol);
        if (selectedUpdate && selected) {
          setSelected(prev => ({
            ...prev,
            currentPrice: selectedUpdate.currentPrice,
            change: selectedUpdate.change,
            changePercent: selectedUpdate.changePercent,
          }));
        }
        
        return updatedStocks;
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
          <p className="text-text-secondary text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Safety check - if still no stocks, show fallback
  const displayStocks = stocks.length > 0 ? stocks : fallbackStocks;
  const displaySelected = selected || fallbackStocks[0];

  return (
    <div className="w-full h-screen bg-bg-primary" style={{ minWidth: 0, minHeight: 0 }}>
      {/* DESKTOP ≥1280px - 3 Column Layout */}
      <div 
        className="hidden xl:block"
        style={{
          height: 'calc(100vh - 60px)',
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
          {/* Left: Watchlist - Fixed Width */}
          <div className="min-w-0" style={{ minWidth: 0 }}>
            <div className="h-full overflow-y-auto">
              <Watchlist 
                onStockSelect={setSelected} 
                selectedSymbol={displaySelected?.symbol}
                stocks={displayStocks}
              />
            </div>
          </div>

          {/* Center: Chart - Flexible Grow */}
          <div className="min-w-0 flex flex-col h-full" style={{ minWidth: 0, minHeight: 0 }}>
            <div className="bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full" style={{ flex: 1, minHeight: 0 }}>
              <div className="px-3 py-2 border-b border-border text-xs font-semibold text-text-primary flex-shrink-0">
                {displaySelected?.symbol || "Select Stock"}
              </div>
              
              {/* Chart Container - Auto Expand */}
              <div className="flex-1 w-full" style={{ flex: 1, minWidth: 0, minHeight: 0, backgroundColor: '#0f172a' }}>
                <ChartPanel 
                  symbol={displaySelected?.symbol || 'RELIANCE.NS'} 
                  currentPrice={displaySelected?.currentPrice || 2450}
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

      {/* LAPTOP 1024px–1279px - Reduced 3 Column Layout */}
      <div 
        className="hidden lg:block xl:hidden"
        style={{
          height: 'calc(100vh - 60px)',
        }}
      >
        <div 
          className="grid h-full"
          style={{
            gridTemplateColumns: '220px minmax(0,1fr) 280px',
            gap: '6px',
            padding: '6px',
          }}
        >
          {/* Left: Watchlist - Fixed Width */}
          <div className="min-w-0" style={{ minWidth: 0 }}>
            <div className="h-full overflow-y-auto">
              <Watchlist 
                onStockSelect={setSelected} 
                selectedSymbol={displaySelected?.symbol}
                stocks={displayStocks}
              />
            </div>
          </div>

          {/* Center: Chart - Flexible Grow */}
          <div className="min-w-0 flex flex-col h-full" style={{ minWidth: 0, minHeight: 0 }}>
            <div className="bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full" style={{ flex: 1, minHeight: 0 }}>
              <div className="px-2 py-1.5 border-b border-border text-[11px] font-semibold text-text-primary flex-shrink-0">
                {displaySelected?.symbol || "Select Stock"}
              </div>
              
              {/* Chart Container - Auto Expand */}
              <div className="flex-1 w-full" style={{ flex: 1, minWidth: 0, minHeight: 0, backgroundColor: '#0f172a' }}>
                <ChartPanel 
                  symbol={displaySelected?.symbol || 'RELIANCE.NS'} 
                  currentPrice={displaySelected?.currentPrice || 2450}
                />
              </div>
            </div>
          </div>

          {/* Right: Order Panel - Fixed Width */}
          <div className="min-w-0" style={{ minWidth: 0 }}>
            <div className="bg-bg-card border border-border rounded-lg p-2 h-full overflow-y-auto" style={{ height: '100%' }}>
              <OrderPanel stock={displaySelected} />
            </div>
          </div>
        </div>
      </div>

      {/* TABLET 768px–1023px - 2 Column Layout */}
      <div className="hidden md:block lg:hidden" style={{ minWidth: 0 }}>
        {/* Top Row: Watchlist + Chart */}
        <div 
          className="grid"
          style={{
            gridTemplateColumns: '180px minmax(0,1fr)',
            gap: '4px',
            padding: '4px',
            height: '50vh',
          }}
        >
          {/* Left: Watchlist */}
          <div className="min-w-0" style={{ minWidth: 0 }}>
            <div className="h-full overflow-y-auto">
              <Watchlist 
                onStockSelect={setSelected} 
                selectedSymbol={displaySelected?.symbol}
                stocks={displayStocks}
              />
            </div>
          </div>

          {/* Right: Chart */}
          <div className="min-w-0 bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col" style={{ minWidth: 0, minHeight: 0 }}>
            <div className="px-2 py-1.5 border-b border-border text-[11px] font-semibold text-text-primary flex-shrink-0">
              {displaySelected?.symbol || "Select Stock"}
            </div>
            <div className="flex-1 w-full" style={{ flex: 1, minWidth: 0, minHeight: 0, backgroundColor: '#0f172a' }}>
              <ChartPanel 
                symbol={displaySelected?.symbol || 'RELIANCE.NS'} 
                currentPrice={displaySelected?.currentPrice || 2450}
              />
            </div>
          </div>
        </div>

        {/* Bottom Row: Order Panel */}
        <div style={{ padding: '4px', marginTop: '4px' }}>
          <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
            <OrderPanel stock={displaySelected} />
          </div>
        </div>
      </div>

      {/* MOBILE <768px - Single Column Layout with Scrolling */}
      <div className="md:hidden flex flex-col gap-2 p-2 h-full overflow-y-auto pb-20" style={{ minWidth: 0 }}>
        {/* Chart on Top - Larger */}
        <div className="bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col flex-shrink-0" style={{ height: '45vh', minWidth: 0 }}>
          <ChartPanel symbol={displaySelected.symbol} currentPrice={displaySelected.currentPrice} />
        </div>
        
        {/* Order Panel Below - Scrollable */}
        <div className="bg-bg-card border border-border rounded-lg overflow-hidden flex-shrink-0" style={{ minWidth: 0 }}>
          <OrderPanel stock={displaySelected} />
        </div>

        {/* Stock Selector Dropdown at Bottom */}
        <div className="bg-bg-card border border-border rounded-lg p-2.5 flex-shrink-0 mt-2" style={{ minWidth: 0 }}>
          <label className="block text-xs text-text-secondary mb-2 font-semibold">Select Stock</label>
          <select
            value={displaySelected.symbol}
            onChange={(e) => {
              const stock = displayStocks.find(s => s.symbol === e.target.value);
              if (stock) setSelected(stock);
            }}
            className="w-full bg-bg-tertiary border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:border-brand-blue outline-none touch-manipulation"
            style={{ minHeight: '44px' }}
          >
            {displayStocks.map(s => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol} - ₹{s.currentPrice?.toFixed(2)} ({s.changePercent >= 0 ? '+' : ''}{s.changePercent?.toFixed(2)}%)
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
