import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Filter } from 'lucide-react';
import { stockAPI, tradeAPI } from '../api';
import { useSocket } from '../context/SocketContext';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

const SECTORS = ['All', 'IT', 'Banking', 'Energy', 'FMCG', 'Pharma', 'Auto', 'Finance', 'Telecom', 'Power', 'Metal', 'Cement'];

export default function TradingPage() {
  const { user } = useAuthStore();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const [stocks, setStocks] = useState([]);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [selected, setSelected] = useState(null);
  const [orderType, setOrderType] = useState('BUY');
  const [orderMode, setOrderMode] = useState('MARKET');
  const [qty, setQty] = useState(1);
  const [limitPrice, setLimitPrice] = useState('');

  const { data: stocksRes, isLoading } = useQuery({
    queryKey: ['stocks-trading'],
    queryFn: () => stockAPI.getAll({ limit: 50 }),
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (stocksRes?.data?.data) {
      const s = stocksRes.data.data;
      setStocks(s);
      if (!selected && s.length) setSelected(s[0]);
    }
  }, [stocksRes]);

  useEffect(() => {
    if (!socket) return;
    socket.on('price:update', (updates) => {
      const map = {};
      updates.forEach(u => { map[u.symbol] = u; });
      setStocks(prev => prev.map(s => map[s.symbol] ? { ...s, ...map[s.symbol] } : s));
      setSelected(prev => prev && map[prev.symbol] ? { ...prev, ...map[prev.symbol] } : prev);
    });
    return () => socket.off('price:update');
  }, [socket]);

  const placeMutation = useMutation({
    mutationFn: (data) => tradeAPI.placeOrder(data),
    onSuccess: (res) => {
      toast.success(`${orderType} order executed for ${selected?.symbol}`);
      setQty(1);
      queryClient.invalidateQueries(['holdings']);
      queryClient.invalidateQueries(['recent-orders']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Order failed'),
  });

  const filtered = stocks.filter(s => {
    const matchSearch = !search || s.symbol.toLowerCase().includes(search.toLowerCase()) || s.name.toLowerCase().includes(search.toLowerCase());
    const matchSector = sector === 'All' || s.sector === sector;
    return matchSearch && matchSector;
  });

  const execPrice = orderMode === 'MARKET' ? selected?.currentPrice : parseFloat(limitPrice) || selected?.currentPrice;
  const estAmount = (execPrice || 0) * qty;
  const canTrade = user?.kycStatus === 'approved' && user?.tradingEnabled;

  const handlePlaceOrder = () => {
    if (!canTrade) { toast.error('Complete KYC to start trading'); return; }
    if (!selected) return;
    placeMutation.mutate({
      symbol: selected.symbol,
      transactionType: orderType,
      orderType: orderMode,
      quantity: qty,
      price: orderMode === 'LIMIT' ? parseFloat(limitPrice) : undefined,
    });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-5 animate-slide-up">
      {/* Stock list */}
      <div>
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5580]" />
            <input className="inp pl-9" placeholder="Search stocks..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="inp w-auto px-3 py-2 text-sm" value={sector} onChange={e => setSector(e.target.value)}>
            {SECTORS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Stock</th>
                <th className="hidden sm:table-cell">Sector</th>
                <th className="text-right">LTP</th>
                <th className="text-right">Change</th>
                <th className="text-right hidden md:table-cell">52W H/L</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={6}><div className="h-4 bg-bg-tertiary rounded animate-pulse w-full"></div></td></tr>
                ))
              ) : filtered.map(s => (
                <tr key={s.symbol} onClick={() => setSelected(s)} className={`cursor-pointer ${selected?.symbol === s.symbol ? 'bg-[#00d084]/[0.04]' : ''}`}>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{s.logo}</span>
                      <div>
                        <div className="font-medium text-xs">{s.symbol}</div>
                        <div className="text-[10px] text-[#4a5580] hidden sm:block truncate max-w-[120px]">{s.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="hidden sm:table-cell"><span className="badge-gray text-[10px]">{s.sector}</span></td>
                  <td className="text-right font-semibold text-xs">₹{s.currentPrice?.toFixed(2)}</td>
                  <td className={`text-right text-xs font-medium ${s.changePercent >= 0 ? 'text-[#00d084]' : 'text-[#ff4f6a]'}`}>
                    {s.changePercent >= 0 ? '+' : ''}{s.changePercent?.toFixed(2)}%
                  </td>
                  <td className="text-right text-[10px] text-[#8b9cc8] hidden md:table-cell">
                    ₹{s.weekLow52?.toFixed(0)} / ₹{s.weekHigh52?.toFixed(0)}
                  </td>
                  <td className="text-right">
                    <div className="flex gap-1 justify-end">
                      <button onClick={e => { e.stopPropagation(); setSelected(s); setOrderType('BUY'); }}
                        className="text-[10px] px-2 py-1 rounded bg-[#00d084]/10 text-[#00d084] border border-[#00d084]/20 hover:bg-[#00d084]/20 transition-colors">B</button>
                      <button onClick={e => { e.stopPropagation(); setSelected(s); setOrderType('SELL'); }}
                        className="text-[10px] px-2 py-1 rounded bg-[#ff4f6a]/10 text-[#ff4f6a] border border-[#ff4f6a]/20 hover:bg-[#ff4f6a]/20 transition-colors">S</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-8 text-sm text-[#4a5580]">No stocks found</div>
          )}
        </div>
      </div>

      {/* Order Panel */}
      {selected && (
        <div className="card h-fit sticky top-20">
          {/* Stock info */}
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{selected.logo}</span>
              <div>
                <div className="font-bold">{selected.symbol}</div>
                <div className="text-xs text-[#8b9cc8]">{selected.name}</div>
              </div>
            </div>
            <div className="bg-bg-tertiary rounded-xl p-3 mt-3">
              <div className="flex justify-between mb-1">
                <span className="text-xs text-[#8b9cc8]">LTP</span>
                <span className="text-lg font-bold">₹{selected.currentPrice?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[#8b9cc8]">Change</span>
                <span className={`text-sm font-medium ${selected.changePercent >= 0 ? 'text-[#00d084]' : 'text-[#ff4f6a]'}`}>
                  {selected.changePercent >= 0 ? '+' : ''}{selected.changePercent?.toFixed(2)}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 mt-2 pt-2 border-t border-border">
                {[['Open', selected.openPrice], ['High', selected.dayHigh], ['Low', selected.dayLow], ['Prev', selected.previousClose]].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-[10px] py-0.5">
                    <span className="text-[#4a5580]">{l}</span>
                    <span>₹{v?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BUY / SELL tabs */}
          <div className="flex gap-1.5 mb-4">
            <button onClick={() => setOrderType('BUY')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${orderType === 'BUY' ? 'bg-[#00d084]/15 text-[#00d084] border border-[#00d084]/30' : 'bg-bg-tertiary text-[#4a5580]'}`}>BUY</button>
            <button onClick={() => setOrderType('SELL')} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${orderType === 'SELL' ? 'bg-[#ff4f6a]/15 text-[#ff4f6a] border border-[#ff4f6a]/30' : 'bg-bg-tertiary text-[#4a5580]'}`}>SELL</button>
          </div>

          {/* Order mode */}
          <div className="flex gap-1 bg-bg-tertiary p-1 rounded-lg mb-4">
            {['MARKET', 'LIMIT'].map(m => (
              <button key={m} onClick={() => setOrderMode(m)} className={`flex-1 py-1.5 text-xs rounded-md transition-all ${orderMode === m ? 'bg-bg-secondary text-white font-medium' : 'text-[#8b9cc8]'}`}>{m}</button>
            ))}
          </div>

          {/* Qty */}
          <div className="mb-3">
            <label className="inp-label">Quantity</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 rounded-lg bg-bg-tertiary border border-border text-[#8b9cc8] hover:text-white flex items-center justify-center font-bold transition-colors">−</button>
              <input className="inp text-center" type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
              <button onClick={() => setQty(qty + 1)} className="w-9 h-9 rounded-lg bg-bg-tertiary border border-border text-[#8b9cc8] hover:text-white flex items-center justify-center font-bold transition-colors">+</button>
            </div>
          </div>

          {/* Limit price */}
          {orderMode === 'LIMIT' && (
            <div className="mb-3">
              <label className="inp-label">Limit Price (₹)</label>
              <input className="inp" type="number" placeholder={selected.currentPrice?.toFixed(2)} value={limitPrice} onChange={e => setLimitPrice(e.target.value)} />
            </div>
          )}

          {/* Summary */}
          <div className="bg-bg-tertiary rounded-lg p-3 mb-4 text-xs space-y-1.5">
            <div className="flex justify-between"><span className="text-[#8b9cc8]">Est. Amount</span><span className="font-semibold">₹{estAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span></div>
            <div className="flex justify-between"><span className="text-[#8b9cc8]">Available</span><span className="text-[#00d084]">₹{user?.walletBalance?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</span></div>
          </div>

          {!canTrade && (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mb-3 text-center">
              Complete KYC to start trading
            </div>
          )}

          <button
            onClick={handlePlaceOrder}
            disabled={placeMutation.isPending || !canTrade}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${orderType === 'BUY' ? 'bg-[#00d084] text-[#022b1d] hover:bg-[#00a86b]' : 'bg-[#ff4f6a] text-white hover:opacity-90'} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {placeMutation.isPending ? 'Placing...' : `${orderType} ${selected.symbol}`}
          </button>
        </div>
      )}
    </div>
  );
}
