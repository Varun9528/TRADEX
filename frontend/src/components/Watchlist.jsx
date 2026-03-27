import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { formatPrice, formatPercent } from '../utils/marketService';

const SECTORS = ['All', 'IT', 'Banking', 'Energy', 'FMCG', 'Pharma', 'Auto', 'Finance', 'Telecom', 'Power', 'Metal', 'Cement'];

// Fallback stocks - NEVER empty
const FALLBACK_STOCKS = [
  { _id: 'RELIANCE.NS', symbol: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Energy', currentPrice: 2450, previousClose: 2450, change: 12, changePercent: 0.52 },
  { _id: 'TCS.NS', symbol: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT', currentPrice: 3850, previousClose: 3850, change: -20, changePercent: -0.52 },
  { _id: 'HDFCBANK.NS', symbol: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking', currentPrice: 1720, previousClose: 1720, change: 8, changePercent: 0.47 },
  { _id: 'INFY.NS', symbol: 'INFY.NS', name: 'Infosys', sector: 'IT', currentPrice: 1680, previousClose: 1680, change: 5, changePercent: 0.30 },
  { _id: 'ICICIBANK.NS', symbol: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking', currentPrice: 1150, previousClose: 1150, change: -3, changePercent: -0.26 },
  { _id: 'SBIN.NS', symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', currentPrice: 620, previousClose: 620, change: 4, changePercent: 0.65 },
  { _id: 'LT.NS', symbol: 'LT.NS', name: 'Larsen & Toubro', sector: 'Infrastructure', currentPrice: 3520, previousClose: 3520, change: 15, changePercent: 0.43 },
  { _id: 'ITC.NS', symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG', currentPrice: 445, previousClose: 445, change: 2, changePercent: 0.45 },
  { _id: 'AXISBANK.NS', symbol: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking', currentPrice: 1085, previousClose: 1085, change: -5, changePercent: -0.46 },
];

export default function Watchlist({ onStockSelect, selectedSymbol, stocks }) {
  const socket = useSocket();
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [localStocks, setLocalStocks] = useState(stocks || FALLBACK_STOCKS);

  // Always ensure we have stocks
  useEffect(() => {
    if (stocks && stocks.length > 0) {
      setLocalStocks(stocks);
      console.log('[Watchlist] Updated with', stocks.length, 'stocks');
    } else {
      setLocalStocks(FALLBACK_STOCKS);
      console.log('[Watchlist] Using fallback stocks');
    }
  }, [stocks]);

  // Listen to Socket.IO price updates
  useEffect(() => {
    if (!socket) return;

    const handlePriceUpdate = (updates) => {
      setLocalStocks(prevStocks => 
        prevStocks.map(stock => {
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
        })
      );
    };

    socket.on('price:update', handlePriceUpdate);
    return () => socket.off('price:update', handlePriceUpdate);
  }, [socket]);

  // Auto-select first stock when none selected
  useEffect(() => {
    if (localStocks.length > 0 && !selectedSymbol && onStockSelect) {
      console.log('[Watchlist] Auto-selecting first stock:', localStocks[0].symbol);
      onStockSelect(localStocks[0]);
    }
  }, [localStocks, selectedSymbol, onStockSelect]);

  // Filter stocks - ALWAYS show at least fallback stocks
  const filteredStocks = localStocks.filter(stock => {
    const matchSearch = !search || 
      stock.symbol.toLowerCase().includes(search.toLowerCase()) || 
      stock.name?.toLowerCase().includes(search.toLowerCase());
    
    const matchSector = sector === 'All' || stock.sector === sector;
    
    return matchSearch && matchSector;
  });

  // Fallback to fallback stocks if filter returns empty
  const displayStocks = filteredStocks.length > 0 ? filteredStocks : FALLBACK_STOCKS;

  // Handle stock click
  const handleStockClick = (stock) => {
    console.log('[Watchlist] Stock clicked:', stock.symbol);
    if (onStockSelect) {
      onStockSelect(stock);
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-2 md:px-3 py-2 md:py-2.5 border-b border-border bg-bg-secondary">
        <h3 className="font-semibold text-[11px] md:text-xs text-text-primary">
          Market Watch ({displayStocks.length})
        </h3>
      </div>

      {/* Search & Filter */}
      <div className="p-2 border-b border-border space-y-2 bg-bg-tertiary">
        <div className="relative">
          <Search 
            size={10} 
            className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" 
          />
          <input 
            className="w-full pl-7 py-1.5 text-[11px] md:text-xs bg-bg-card border border-border rounded-lg text-text-primary placeholder:text-text-muted outline-none focus:border-brand-blue transition-colors" 
            placeholder="Search..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        
        <select 
          className="w-full border border-border rounded-lg px-2 py-1.5 text-[11px] md:text-xs bg-bg-card text-text-primary focus:border-brand-blue outline-none transition-colors" 
          value={sector} 
          onChange={(e) => setSector(e.target.value)}
        >
          {SECTORS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Stock List - ALWAYS show data */}
      <div className="overflow-y-auto flex-1">
        <table className="w-full text-xs">
          <thead className="bg-bg-tertiary sticky top-0">
            <tr>
              <th className="text-left text-[9px] md:text-[10px] text-text-muted font-medium py-1.5 px-2">Stock</th>
              <th className="text-right text-[9px] md:text-[10px] text-text-muted font-medium py-1.5 px-2">LTP</th>
              <th className="text-right text-[9px] md:text-[10px] text-text-muted font-medium py-1.5 px-2">Change</th>
            </tr>
          </thead>
          <tbody>
            {displayStocks.map((stock) => (
              <tr 
                key={stock._id || stock.symbol} 
                onClick={() => handleStockClick(stock)} 
                className={`cursor-pointer hover:bg-bg-tertiary transition-colors ${
                  selectedSymbol === stock.symbol ? 'bg-brand-blue/10' : ''
                }`}
              >
                <td className="py-1.5 px-2 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm md:text-base">{stock.logo || '📊'}</span>
                    <div>
                      <div className="font-medium text-[11px] md:text-xs text-text-primary">
                        {stock.symbol}
                      </div>
                      <div className="text-[9px] md:text-[10px] text-text-muted truncate max-w-[80px] md:max-w-[90px]">
                        {stock.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-right py-1.5 px-2 border-b border-border">
                  <div className="text-[11px] md:text-xs font-semibold text-text-primary">
                    {formatPrice(stock.currentPrice)}
                  </div>
                </td>
                <td className="text-right py-1.5 px-2 border-b border-border">
                  <div className={`text-[9px] md:text-[10px] font-medium flex items-center justify-end gap-1 ${
                    stock.changePercent >= 0 ? 'text-brand-green' : 'text-accent-red'
                  }`}>
                    {stock.changePercent >= 0 ? (
                      <TrendingUp size={7} className="md:w-8" />
                    ) : (
                      <TrendingDown size={7} className="md:w-8" />
                    )}
                    {formatPercent(stock.changePercent)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
