import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import useAuthStore from '../context/authStore';
import { useSocket } from '../context/SocketContext';
import { stockAPI, tradeAPI, walletAPI } from '../api';

function StatCard({ label, value, sub, subUp, color = 'green' }) {
  const colors = { green: 'rgba(0,208,132,0.07)', red: 'rgba(255,79,106,0.07)', blue: 'rgba(59,130,246,0.07)', gold: 'rgba(245,158,11,0.07)' };
  return (
    <div className="stat-card" style={{ background: colors[color] + ', #111827' }}>
      <div className="text-xs text-[#8b9cc8] mb-1.5">{label}</div>
      <div className="text-xl font-bold mb-1">{value}</div>
      {sub && <div className={`text-xs flex items-center gap-1 ${subUp === true ? 'text-[#00d084]' : subUp === false ? 'text-[#ff4f6a]' : 'text-[#8b9cc8]'}`}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  const socket = useSocket();
  const [stocks, setStocks] = useState([]);

  const { data: stocksRes } = useQuery({
    queryKey: ['stocks-dashboard'],
    queryFn: () => stockAPI.getAll({ limit: 30 }),
    refetchInterval: 10000,
  });

  const { data: holdingsRes } = useQuery({
    queryKey: ['holdings'],
    queryFn: () => tradeAPI.getHoldings(),
    enabled: user?.kycStatus === 'approved',
  });

  const { data: ordersRes } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: () => tradeAPI.getOrders({ limit: 5 }),
    enabled: user?.kycStatus === 'approved',
  });

  useEffect(() => {
    if (stocksRes?.data?.data) setStocks(stocksRes.data.data);
  }, [stocksRes]);

  useEffect(() => {
    if (!socket) return;
    socket.on('price:update', (updates) => {
      const map = {};
      updates.forEach(u => { map[u.symbol] = u; });
      setStocks(prev => prev.map(s => map[s.symbol] ? { ...s, ...map[s.symbol] } : s));
    });
    return () => socket.off('price:update');
  }, [socket]);

  const holdings = holdingsRes?.data?.data;
  const summary = holdings?.summary;
  const recentOrders = ordersRes?.data?.data || [];

  const gainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const losers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);

  const pnl = summary?.totalPnl || 0;
  const pnlPct = summary?.totalPnlPercent || 0;

  return (
    <div className="space-y-5 animate-slide-up">
      {/* KYC Banner */}
      {user?.kycStatus !== 'approved' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-amber-400">Complete your KYC to start trading</div>
            <div className="text-xs text-[#8b9cc8] mt-1">Quick 5-minute process • KYC status: <span className="text-amber-400">{user?.kycStatus || 'not started'}</span></div>
          </div>
          <Link to="/kyc" className="btn-primary text-sm px-4 py-2 whitespace-nowrap">Complete KYC →</Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Invested" value={`₹${(summary?.totalInvested || user?.walletBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub={`${holdings?.holdings?.length || 0} stocks`} color="blue" />
        <StatCard label="Current Value" value={`₹${(summary?.totalCurrentValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub={pnl !== 0 ? `${pnl >= 0 ? '▲' : '▼'} ₹${Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'No positions'} subUp={pnl > 0 ? true : pnl < 0 ? false : undefined} color={pnl >= 0 ? 'green' : 'red'} />
        <StatCard label="Wallet Balance" value={`₹${(user?.walletBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub="Available to trade" color="blue" />
        <StatCard label="Total P&L" value={`₹${Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub={`${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}% all time`} subUp={pnl >= 0} color={pnl >= 0 ? 'green' : 'red'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Gainers/Losers */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Market Movers</h3>
            <Link to="/trading" className="text-xs text-[#00d084] flex items-center gap-1 hover:underline">View all <ArrowUpRight size={12} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-[#4a5580] uppercase tracking-wider mb-3 flex items-center gap-1.5"><TrendingUp size={12} className="text-[#00d084]" /> Top Gainers</div>
              {gainers.map(s => (
                <Link to="/trading" key={s.symbol} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-white/[0.02] rounded px-1 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.logo}</span>
                    <div><div className="text-xs font-medium">{s.symbol}</div><div className="text-[10px] text-[#4a5580]">{s.sector}</div></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold">₹{s.currentPrice?.toFixed(2)}</div>
                    <div className="text-[10px] text-[#00d084]">+{s.changePercent?.toFixed(2)}%</div>
                  </div>
                </Link>
              ))}
            </div>
            <div>
              <div className="text-xs text-[#4a5580] uppercase tracking-wider mb-3 flex items-center gap-1.5"><TrendingDown size={12} className="text-[#ff4f6a]" /> Top Losers</div>
              {losers.map(s => (
                <Link to="/trading" key={s.symbol} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-white/[0.02] rounded px-1 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.logo}</span>
                    <div><div className="text-xs font-medium">{s.symbol}</div><div className="text-[10px] text-[#4a5580]">{s.sector}</div></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold">₹{s.currentPrice?.toFixed(2)}</div>
                    <div className="text-[10px] text-[#ff4f6a]">{s.changePercent?.toFixed(2)}%</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Market Status */}
          <div className="card">
            <h3 className="font-semibold text-sm mb-4">Market Status</h3>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#00d084] market-open-dot"></div>
              <span className="text-xs text-[#00d084] font-medium">Market Open</span>
              <span className="text-[10px] text-[#4a5580] ml-auto">09:15 – 15:30 IST</span>
            </div>
            {[
              { name: 'NIFTY 50', val: '24,352', chg: '+0.42%', up: true },
              { name: 'SENSEX', val: '79,841', chg: '+0.38%', up: true },
              { name: 'BANK NIFTY', val: '51,243', chg: '-0.12%', up: false },
              { name: 'NIFTY IT', val: '38,421', chg: '+1.24%', up: true },
            ].map(i => (
              <div key={i.name} className="flex justify-between text-xs py-1.5">
                <span className="text-[#8b9cc8]">{i.name}</span>
                <span className="font-medium">{i.val} <span className={i.up ? 'text-[#00d084]' : 'text-[#ff4f6a]'}>{i.chg}</span></span>
              </div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Recent Orders</h3>
              <Link to="/orders" className="text-xs text-[#00d084] hover:underline">View all</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="text-center py-4 text-xs text-[#4a5580]">
                No orders yet.<br />
                <Link to="/trading" className="text-[#00d084] hover:underline">Start trading →</Link>
              </div>
            ) : recentOrders.map(o => (
              <div key={o._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <div className="text-xs font-medium">{o.symbol}</div>
                  <div className="text-[10px] text-[#4a5580]">{o.transactionType} · {o.quantity} shares</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold">₹{o.executedPrice?.toFixed(2)}</div>
                  <span className={`text-[10px] ${o.status === 'COMPLETE' ? 'text-[#00d084]' : 'text-amber-400'}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
