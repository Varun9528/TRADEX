import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown, Plus, Minus } from 'lucide-react';
import { formatPrice, formatPercent } from '../utils/marketService';
import axios from 'axios';

const SECTORS = ['All', 'IT', 'Banking', 'Energy', 'FMCG', 'Pharma', 'Auto', 'Finance', 'Telecom', 'Power', 'Metal', 'Cement'];

// NO FALLBACK DATA - Admin controls all instruments

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function Watchlist({ onStockSelect, selectedSymbol, stocks, marketType = 'STOCK' }) {
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [localStocks, setLocalStocks] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch market instruments from API - NO FALLBACK DATA
  useEffect(() => {
    const fetchMarketInstruments = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/market`);
        const res = response.data;
        
        // Safe array extraction - NO HARDCODED FALLBACK
        let list = [];
        if (Array.isArray(res)) {
          list = res;
        } else if (Array.isArray(res?.data)) {
          list = res.data;
        } else if (Array.isArray(res?.instruments)) {
          list = res.instruments;
        } else {
          console.warn('[Watchlist] No valid array in response');
          list = []; // Empty array - admin must add instruments
        }
        
        console.log('[Watchlist] Loaded', list.length, 'instruments from API');
        setLocalStocks(list);
      } catch (err) {
        console.error('[Watchlist] Error fetching market:', err.message);
        setLocalStocks([]); // Empty on error - NO demo data
      } finally {
        setIsLoading(false);
      }
    };

    fetchMarketInstruments();
  }, []);

  // Use stocks from props or local state - NO FALLBACK
  useEffect(() => {
    if (stocks && stocks.length > 0) {
      console.log('[Watchlist] Received stocks from props:', stocks.length);
      console.log('[Watchlist] Sample stock:', stocks[0]);
      console.log('[Watchlist] Stock types:', [...new Set(stocks.map(s => s.type))]);
      setLocalStocks(stocks);
      console.log('[Watchlist] Updated with', stocks.length, 'stocks from props');
    } else {
      console.log('[Watchlist] No stocks from props, using local fetch');
    }
    // Do NOT set fallback - only show DB instruments
  }, [stocks]);

  // Auto-select first stock when none selected
  useEffect(() => {
    if (localStocks.length > 0 && !selectedSymbol && onStockSelect) {
      console.log('[Watchlist] Auto-selecting first stock:', localStocks[0].symbol);
      onStockSelect(localStocks[0]);
    }
  }, [localStocks, selectedSymbol, onStockSelect]);

  // Filter stocks - ONLY apply sector filter for STOCK type
  const filteredStocks = localStocks.filter(stock => {
    const matchSearch = !search || 
      stock.symbol.toLowerCase().includes(search.toLowerCase()) || 
      stock.name?.toLowerCase().includes(search.toLowerCase());
    
    // ONLY filter by sector if marketType is STOCK
    // Forex and Options should NOT be filtered by sector
    const matchSector = marketType !== 'STOCK' || sector === 'All' || stock.sector === sector;
    
    return matchSearch && matchSector;
  });

  // Use filtered stocks - no fallback (admin controls all data)
  const displayStocks = filteredStocks;

  // Handle stock click
  const handleStockClick = (stock) => {
    console.log('[Watchlist] Stock clicked:', stock.symbol);
    if (onStockSelect) {
      onStockSelect(stock);
    }
  };

  return (
    <div className="bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-2 md:px-3 py-2 md:py-2.5 border-b border-border bg-bg-secondary">
        <h3 className="font-semibold text-[11px] md:text-xs text-text-primary">
          Market Watch ({displayStocks.length})
        </h3>
      </div>

      {/* Search & Filter - Single Wrapper */}
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
        
        {/* ONLY show sector dropdown for STOCK type */}
        {marketType === 'STOCK' && (
          <select 
            className="w-full border border-border rounded-lg px-2 py-1.5 text-[11px] md:text-xs bg-bg-card text-text-primary focus:border-brand-blue outline-none transition-colors" 
            value={sector} 
            onChange={(e) => setSector(e.target.value)}
          >
            {SECTORS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}
      </div>

      {/* Stock List - Conditional Rendering with Safe Map */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-text-muted text-xs">
            <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p>Loading...</p>
          </div>
        </div>
      ) : displayStocks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <div>
            <div className="text-4xl mb-3">📊</div>
            <p className="text-text-secondary text-sm">No instruments available</p>
            <p className="text-xs text-text-muted mt-1">Please add instruments from admin panel</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 market-list">
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
                          {stock.name || stock.sector || ''}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-1.5 px-2 border-b border-border">
                    <div className="text-[11px] md:text-xs font-semibold text-text-primary">
                      {formatPrice(stock.currentPrice || stock.price || 0)}
                    </div>
                  </td>
                  <td className="text-right py-1.5 px-2 border-b border-border">
                    <div className={`text-[9px] md:text-[10px] font-medium flex items-center justify-end gap-1 ${
                      (stock.changePercent || stock.change_percent || 0) >= 0 ? 'text-brand-green' : 'text-accent-red'
                    }`}>
                      {(stock.changePercent || stock.change_percent || 0) >= 0 ? (
                        <TrendingUp size={7} className="md:w-8" />
                      ) : (
                        <TrendingDown size={7} className="md:w-8" />
                      )}
                      {formatPercent(stock.changePercent || stock.change_percent || 0)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
