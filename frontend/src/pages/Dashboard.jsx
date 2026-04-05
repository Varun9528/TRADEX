import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import useAuthStore from '../context/authStore';
import { marketAPI, tradeAPI, walletAPI } from '../api';

function StatCard({ label, value, sub, subUp, color = 'green' }) {
  const colors = { green: 'rgba(34,197,94,0.1)', red: 'rgba(239,68,68,0.1)', blue: 'rgba(59,130,246,0.1)', gold: 'rgba(245,158,11,0.1)' };
  return (
    <div className="stat-card" style={{ background: colors[color] }}>
      <div className="text-xs text-text-secondary mb-1.5">{label}</div>
      <div className="text-xl font-bold mb-1 text-text-primary">{value}</div>
      {sub && <div className={`text-xs flex items-center gap-1 ${subUp === true ? 'text-brand-green' : subUp === false ? 'text-accent-red' : 'text-text-secondary'}`}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuthStore();
  
  // Fetch market instruments from database - OPTIMIZED FOR LOGIN SPEED
  // DISABLED: Market data now loads only when Trade page opens (lazy loading)
  // This significantly improves login speed by reducing API calls
  const { data: marketData } = useQuery({
    queryKey: ['market-instruments-dashboard'],
    queryFn: async () => {
      try {
        console.log('[Dashboard] Fetching market instruments (lazy loaded)');
        // Fetch minimal number of stocks for dashboard performance
        const response = await marketAPI.getAll({ status: 'active', limit: 20 }); // Reduced to 20
        return Array.isArray(response?.data) ? response.data : [];
      } catch (err) {
        console.error('[Dashboard] Market API failed:', err.message);
        return [];
      }
    },
    refetchInterval: false, // Disable auto-refetch - user can manually refresh if needed
    staleTime: 300000, // Cache for 5 minutes
    cacheTime: 600000, // Keep in cache for 10 minutes
    enabled: false, // DISABLED: Don't fetch on login. Load only when Trade page opens.
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

  // Use ONLY database instruments - no static data
  const stocks = marketData || [];

  // Sort gainers and losers from DB data only - filter by positive/negative change
  const gainers = [...stocks]
    .filter(s => s.changePercent > 0)
    .sort((a, b) => b.changePercent - a.changePercent)
    .slice(0, 5);
  
  const losers = [...stocks]
    .filter(s => s.changePercent < 0)
    .sort((a, b) => a.changePercent - b.changePercent)
    .slice(0, 5);

  // Safe data extraction from holdings
  const holdings = holdingsRes?.data?.data || {};
  const summary = holdings.summary || {};
  const recentOrders = ordersRes?.data?.data || [];

  // Safe P&L calculation with fallbacks
  const pnl = summary?.totalPnl || 0;
  const pnlPct = summary?.totalPnlPercent || 0;

  return (
    <div className="w-full min-h-screen p-4 pb-20 md:pb-4 space-y-5 animate-slide-up">
      {/* KYC Banner */}
      {user?.kycStatus !== 'approved' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center justify-between w-full">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-amber-400">Complete your KYC to start trading</div>
            <div className="text-xs text-text-secondary mt-1">Quick 5-minute process • KYC status: <span className="text-amber-400">{user?.kycStatus || 'not started'}</span></div>
          </div>
          <Link to="/kyc" className="btn-primary text-sm px-4 py-2 whitespace-nowrap bg-brand-blue hover:bg-brand-blue-dark flex-shrink-0">Complete KYC →</Link>
        </div>
      )}

      {/* Stat Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <StatCard label="Invested" value={`₹${(summary?.totalInvested || user?.walletBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub={`${holdings?.holdings?.length || 0} stocks`} color="blue" />
        <StatCard label="Current Value" value={`₹${(summary?.totalCurrentValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub={pnl !== 0 ? `${pnl >= 0 ? '▲' : '▼'} ₹${Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'No positions'} subUp={pnl > 0 ? true : pnl < 0 ? false : undefined} color={pnl >= 0 ? 'green' : 'red'} />
        <StatCard label="Wallet Balance" value={`₹${(user?.walletBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub="Available to trade" color="blue" />
        <StatCard label="Total P&L" value={`₹${Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} sub={`${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}% all time`} subUp={pnl >= 0} color={pnl >= 0 ? 'green' : 'red'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 w-full">
        {/* Gainers/Losers */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm text-text-primary">Market Movers</h3>
            <Link to="/trading" className="text-xs text-brand-blue flex items-center gap-1 hover:underline">View all <ArrowUpRight size={12} /></Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5"><TrendingUp size={12} className="text-brand-green" /> Top Gainers</div>
              {gainers.length === 0 ? (
                <div className="text-xs text-text-secondary py-4">No gainers available</div>
              ) : gainers.map(s => (
                <Link to="/trading" key={s.symbol} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-bg-tertiary rounded px-1 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.logo}</span>
                    <div><div className="text-xs font-medium text-text-primary">{s.symbol}</div><div className="text-[10px] text-text-secondary">{s.sector}</div></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-text-primary">₹{s.currentPrice?.toFixed(2)}</div>
                    <div className="text-[10px] text-brand-green">+{s.changePercent?.toFixed(2)}%</div>
                  </div>
                </Link>
              ))}
            </div>
            <div>
              <div className="text-xs text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5"><TrendingDown size={12} className="text-accent-red" /> Top Losers</div>
              {losers.length === 0 ? (
                <div className="text-xs text-text-secondary py-4">No losers available</div>
              ) : losers.map(s => (
                <Link to="/trading" key={s.symbol} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:bg-bg-tertiary rounded px-1 transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{s.logo}</span>
                    <div><div className="text-xs font-medium text-text-primary">{s.symbol}</div><div className="text-[10px] text-text-secondary">{s.sector}</div></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-text-primary">₹{s.currentPrice?.toFixed(2)}</div>
                    <div className="text-[10px] text-accent-red">{s.changePercent?.toFixed(2)}%</div>
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
            <h3 className="font-semibold text-sm mb-4 text-text-primary">Market Status</h3>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-brand-green market-open-dot"></div>
              <span className="text-xs text-brand-green font-medium">Market Open</span>
              <span className="text-[10px] text-text-secondary ml-auto">09:15 – 15:30 IST</span>
            </div>
            {[
              { name: 'NIFTY 50', val: '24,352', chg: '+0.42%', up: true },
              { name: 'SENSEX', val: '79,841', chg: '+0.38%', up: true },
              { name: 'BANK NIFTY', val: '51,243', chg: '-0.12%', up: false },
              { name: 'NIFTY IT', val: '38,421', chg: '+1.24%', up: true },
            ].map(i => (
              <div key={i.name} className="flex justify-between text-xs py-1.5">
                <span className="text-text-secondary">{i.name}</span>
                <span className="font-medium text-text-primary">{i.val} <span className={i.up ? 'text-brand-green' : 'text-accent-red'}>{i.chg}</span></span>
              </div>
            ))}
          </div>

          {/* Recent Orders */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-text-primary">Recent Orders</h3>
              <Link to="/orders" className="text-xs text-brand-blue hover:underline">View all</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="text-center py-4 text-xs text-text-secondary">
                No orders yet.<br />
                <Link to="/trading" className="text-brand-blue hover:underline">Start trading →</Link>
              </div>
            ) : recentOrders.map(o => (
              <div key={o._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <div className="text-xs font-medium text-text-primary">{o.symbol}</div>
                  <div className="text-[10px] text-text-secondary">{o.transactionType} · {o.quantity} shares</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-text-primary">₹{o.executedPrice?.toFixed(2)}</div>
                  <span className={`text-[10px] ${o.status === 'COMPLETE' ? 'text-brand-green' : 'text-amber-500'}`}>{o.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
