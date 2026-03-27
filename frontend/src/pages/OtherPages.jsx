// ─── PORTFOLIO PAGE ───────────────────────────────────────
import { useQuery } from '@tanstack/react-query';
import { tradeAPI } from '../api';
import BottomNav from '../components/BottomNav';

export function PortfolioPage() {
  const { data, isLoading, error } = useQuery({ 
    queryKey: ['portfolio'], 
    queryFn: async () => {
      try {
        const { data } = await tradeAPI.getPortfolio();
        return data;
      } catch (err) {
        console.error('[Portfolio] Error:', err);
        throw err;
      }
    },
    refetchInterval: 3000, // Update every 3 seconds
  });
  
  const holdings = data?.data?.holdings || [];
  const summary = data?.data?.summary;
  const pnl = summary?.totalPnl || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary text-sm">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-accent-red mb-4">Failed to load portfolio</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary px-6 py-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20 md:pb-4 space-y-4 md:space-y-5 animate-slide-up">
      {/* Summary Cards - Zerodha Style */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3 px-2 md:px-0">
        {[
          { label: 'Invested', val: `₹${(summary?.totalInvested || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
          { label: 'Current Value', val: `₹${(summary?.totalCurrentValue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
          { label: 'Total P&L', val: `${pnl >= 0 ? '+' : ''}₹${Math.abs(pnl).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, pnl },
        ].map(c => (
          <div key={c.label} className="bg-bg-card rounded-lg p-3 md:p-5 shadow-sm border border-border">
            <div className="text-[10px] md:text-xs text-text-secondary mb-1">{c.label}</div>
            <div className={`text-lg md:text-xl font-bold ${c.pnl !== undefined ? (c.pnl >= 0 ? 'text-brand-green' : 'text-accent-red') : ''}`}>
              {c.val}
            </div>
            {c.pnl !== undefined && (
              <div className={`text-[10px] md:text-xs mt-1 ${c.pnl >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
                {(summary?.totalPnlPercent || 0).toFixed(2)}% all time
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Holdings List */}
      <div className="px-2 md:px-0">
        <div className="bg-bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="px-3 md:px-5 py-3 md:py-4 border-b border-border">
            <span className="font-semibold text-sm md:text-base text-text-primary">Holdings ({holdings.length})</span>
          </div>
          
          {holdings.length === 0 ? (
            <div className="text-center py-12 text-text-muted text-sm">
              No holdings yet. <a href="/trading" className="text-brand-blue hover:underline">Start trading →</a>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {holdings.map(h => (
                <div key={h.symbol} className="p-3 md:p-4">
                  {/* Mobile Card Layout - Default */}
                  <div className="md:hidden">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-base text-text-primary">{h.symbol}</h3>
                        <div className="text-xs text-text-secondary">Qty: {h.quantity}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-text-primary">₹{Number(h.currentPrice || 0).toFixed(2)}</div>
                        <div className={`text-xs font-semibold ${h.pnl >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
                          {h.pnl >= 0 ? '+' : ''}₹{Math.abs(h.pnl || 0).toFixed(0)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                      <div>
                        <span className="text-text-secondary">Avg Price:</span>
                        <div className="font-medium text-text-primary">₹{Number(h.avgBuyPrice || 0).toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Current Value:</span>
                        <div className="font-medium text-text-primary">₹{h.currentValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                      </div>
                      <div>
                        <span className="text-text-secondary">Returns:</span>
                        <div className={`font-medium ${h.pnlPercent >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
                          {(h.pnlPercent || 0).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Table Layout - Hidden on mobile */}
                  <div className="hidden md:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-text-muted">
                          <th className="pb-3 font-medium">Stock</th>
                          <th className="pb-3 text-right font-medium">Qty</th>
                          <th className="pb-3 text-right font-medium">Avg Price</th>
                          <th className="pb-3 text-right font-medium">LTP</th>
                          <th className="pb-3 text-right font-medium">Current Value</th>
                          <th className="pb-3 text-right font-medium">P&L</th>
                          <th className="pb-3 text-right font-medium">Returns</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-3">
                            <span className="font-medium text-text-primary">{h.symbol}</span>
                          </td>
                          <td className="py-3 text-right text-text-primary">{h.quantity}</td>
                          <td className="py-3 text-right text-text-primary">₹{Number(h.avgBuyPrice || 0).toFixed(2)}</td>
                          <td className="py-3 text-right font-semibold text-text-primary">₹{Number(h.currentPrice || 0).toFixed(2)}</td>
                          <td className="py-3 text-right text-text-primary">₹{h.currentValue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                          <td className="py-3 text-right">
                            <div className={`font-medium ${h.pnl >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
                              {h.pnl >= 0 ? '+' : ''}₹{Math.abs(h.pnl || 0).toFixed(0)}
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${h.pnlPercent >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {h.pnlPercent >= 0 ? '+' : ''}{(h.pnlPercent || 0).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

// ─── ORDERS PAGE ───────────────────────────────────────────
import { useState } from 'react';
import { orderAPI } from '../api';

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: () => orderAPI.getAll({ status: statusFilter || undefined }),
    refetchInterval: 15000,
  });
  const orders = data?.data?.data || [];

  if (!data) {
    return (
      <div className="min-h-screen bg-bg-primary pb-20 md:pb-4 animate-slide-up">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary pb-20 md:pb-4 animate-slide-up">
      {/* Header - Zerodha Style */}
      <div className="bg-bg-card border-b border-border px-3 md:px-4 py-3 sticky top-0 z-10 safe-area-top">
        <h1 className="text-lg md:text-xl font-bold text-text-primary mb-3">Orders</h1>
        
        {/* Filter Tabs */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {[
            ['', 'All'], 
            ['COMPLETE', 'Done'], 
            ['PENDING', 'Pending'], 
            ['CANCELLED', 'Cancelled']
          ].map(([v, l]) => (
            <button 
              key={v} 
              onClick={() => setStatusFilter(v)} 
              className={`px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${
                statusFilter === v 
                  ? 'bg-brand-blue text-white' 
                  : 'bg-gray-50 text-text-secondary hover:bg-gray-100 border border-border'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="p-2 md:p-4 space-y-2 md:space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-text-muted text-sm mb-2">No orders found</div>
            <button 
              onClick={() => window.location.href = '/stocks'}
              className="text-brand-blue font-medium text-sm hover:underline"
            >
              Start Trading
            </button>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {(orders || []).map(o => (
              <div key={o._id} className="bg-bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base md:text-lg text-text-primary">{o.symbol}</h3>
                      <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${
                        o.transactionType === 'BUY' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {o.transactionType}
                      </span>
                      <span className={`text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full ${
                        o.status === 'COMPLETE' ? 'badge-green' : 
                        o.status === 'PENDING' ? 'badge-gold' : 'badge-gray'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary mt-1">
                      {new Date(o.createdAt || Date.now()).toLocaleString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        day: '2-digit',
                        month: 'short'
                      })}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-base md:text-lg font-bold text-text-primary">
                      ₹{Number(o.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {o.quantity || 0} @ ₹{Number(o.executedPrice || 0).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Order Details Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs md:text-sm pt-2 border-t border-border">
                  <div>
                    <span className="text-text-secondary">Order ID:</span>
                    <span className="ml-2 font-mono text-[10px] md:text-xs text-text-primary">{o.orderId?.slice(-8)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-text-secondary">Product:</span>
                    <span className="ml-2 font-medium text-text-primary">{o.productType || 'CNC'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

// ─── WATCHLIST PAGE ────────────────────────────────────────
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { watchlistAPI, stockAPI as stkAPI } from '../api';
import { Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export function WatchlistPage() {
  const qc = useQueryClient();
  const [searchAdd, setSearchAdd] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const { data } = useQuery({ queryKey: ['watchlist'], queryFn: () => watchlistAPI.get(), refetchInterval: 5000 });
  const items = data?.data?.data || [];

  const addMut = useMutation({ mutationFn: (sym) => watchlistAPI.add(sym), onSuccess: () => { qc.invalidateQueries(['watchlist']); toast.success('Added to watchlist'); } });
  const removeMut = useMutation({ mutationFn: (sym) => watchlistAPI.remove(sym), onSuccess: () => { qc.invalidateQueries(['watchlist']); toast.success('Removed from watchlist'); } });

  const handleSearch = async (q) => {
    setSearchAdd(q);
    if (q.length < 1) { setSearchResults([]); return; }
    const res = await stkAPI.getAll({ search: q, limit: 8 });
    setSearchResults(res.data.data);
  };

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-5 animate-slide-up">
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-semibold text-sm">My Watchlist ({items.length})</div>
        <table className="data-table">
          <thead><tr><th>Stock</th><th className="text-right">LTP</th><th className="text-right">Change</th><th className="text-right hidden md:table-cell">52W H/L</th><th className="text-right">Action</th></tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-[#4a5580] text-sm">Add stocks to your watchlist</td></tr> :
              items.map(ws => {
                const s = ws.stockData;
                return (
                  <tr key={ws.symbol}>
                    <td><div className="flex items-center gap-2"><span className="text-base">{s?.logo}</span><div><div className="font-medium text-xs">{ws.symbol}</div><div className="text-[10px] text-[#4a5580]">{s?.name}</div></div></div></td>
                    <td className="text-right font-semibold text-xs">₹{s?.currentPrice?.toFixed(2) || '--'}</td>
                    <td className={`text-right text-xs ${(s?.changePercent || 0) >= 0 ? 'text-[#00d084]' : 'text-[#ff4f6a]'}`}>{(s?.changePercent || 0) >= 0 ? '+' : ''}{(s?.changePercent || 0).toFixed(2)}%</td>
                    <td className="text-right text-[10px] text-[#8b9cc8] hidden md:table-cell">₹{s?.weekLow52?.toFixed(0)} / ₹{s?.weekHigh52?.toFixed(0)}</td>
                    <td className="text-right"><button onClick={() => removeMut.mutate(ws.symbol)} className="text-[#4a5580] hover:text-[#ff4f6a] transition-colors"><X size={14} /></button></td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div className="card">
        <div className="font-semibold text-sm mb-4">Add Stocks</div>
        <div className="relative mb-3">
          <input className="inp" placeholder="Search by name or symbol..." value={searchAdd} onChange={e => handleSearch(e.target.value)} />
        </div>
        {searchResults.map(s => (
          <div key={s.symbol} className="flex items-center justify-between py-2.5 border-b border-border">
            <div className="flex items-center gap-2"><span>{s.logo}</span><div><div className="text-xs font-medium">{s.symbol}</div><div className="text-[10px] text-[#4a5580]">{s.name}</div></div></div>
            <button onClick={() => { addMut.mutate(s.symbol); setSearchResults([]); setSearchAdd(''); }} className="btn-primary text-xs px-3 py-1.5 !rounded-lg"><Plus size={12} /> Add</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NOTIFICATIONS PAGE ────────────────────────────────────
import { notificationAPI } from '../api';
import { Bell } from 'lucide-react';

export function NotificationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['notifications'], queryFn: () => notificationAPI.getAll() });
  const notifications = data?.data?.data || [];

  const markAllMut = useMutation({ mutationFn: () => notificationAPI.markAllRead(), onSuccess: () => { qc.invalidateQueries(['notifications']); qc.invalidateQueries(['notifications-count']); } });

  const iconMap = { KYC_APPROVED: '✅', KYC_REJECTED: '❌', ORDER_EXECUTED: '📈', DEPOSIT_SUCCESS: '💳', WITHDRAWAL_SUCCESS: '💸', SYSTEM: '🔔', REFERRAL_BONUS: '🎁' };
  const colorMap = { KYC_APPROVED: 'text-[#00d084]', KYC_REJECTED: 'text-[#ff4f6a]', ORDER_EXECUTED: 'text-[#3b82f6]', DEPOSIT_SUCCESS: 'text-[#f59e0b]', SYSTEM: 'text-[#8b9cc8]' };

  return (
    <div className="max-w-2xl animate-slide-up">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div className="font-semibold text-sm flex items-center gap-2"><Bell size={16} /> Notifications</div>
          <button onClick={() => markAllMut.mutate()} className="btn-ghost text-xs px-3 py-1.5">Mark all read</button>
        </div>
        {isLoading ? <div className="text-center py-8 text-[#4a5580]">Loading...</div> :
          notifications.length === 0 ? <div className="text-center py-8 text-[#4a5580]">No notifications</div> :
            notifications.map(n => (
              <div key={n._id} className={`flex gap-3 py-3.5 border-b border-border last:border-0 ${!n.isRead ? 'opacity-100' : 'opacity-60'}`}>
                <div className="text-xl mt-0.5 flex-shrink-0">{iconMap[n.type] || '🔔'}</div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${!n.isRead ? '' : 'text-[#8b9cc8]'}`}>{n.title}</div>
                  <div className="text-xs text-[#8b9cc8] mt-0.5 leading-relaxed">{n.message}</div>
                  <div className="text-[10px] text-[#4a5580] mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</div>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#3b82f6] flex-shrink-0 mt-1.5"></div>}
              </div>
            ))}
      </div>
    </div>
  );
}

// ─── REFERRAL PAGE ────────────────────────────────────────
import { userAPI } from '../api';
import { Copy } from 'lucide-react';

export function ReferralPage() {
  const { data } = useQuery({ queryKey: ['referral'], queryFn: () => userAPI.getReferral() });
  const ref = data?.data?.data;

  const copyCode = () => { navigator.clipboard.writeText(ref?.referralCode || ''); toast.success('Referral code copied!'); };
  const copyLink = () => { navigator.clipboard.writeText(`${window.location.origin}/register?ref=${ref?.referralCode}`); toast.success('Referral link copied!'); };

  return (
    <div className="max-w-2xl space-y-5 animate-slide-up">
      <div className="card text-center" style={{ background: 'linear-gradient(135deg, #0a1a2e, #0a2a1f)' }}>
        <div className="text-4xl mb-3">🎁</div>
        <div className="text-xl font-bold mb-2">Refer & Earn</div>
        <div className="text-sm text-[#8b9cc8] mb-6">Earn ₹500 for every friend who opens a Demat account</div>
        <div className="bg-bg-secondary rounded-xl p-4 mb-5 border border-border">
          <div className="text-xs text-[#8b9cc8] mb-2">Your Referral Code</div>
          <div className="text-3xl font-black tracking-widest text-[#00d084] mb-3">{ref?.referralCode || '---'}</div>
          <div className="flex gap-2 justify-center">
            <button onClick={copyCode} className="btn-ghost text-xs px-4 py-2"><Copy size={12} /> Copy Code</button>
            <button onClick={copyLink} className="btn-primary text-xs px-4 py-2">Share Link</button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[['Referrals', ref?.count || 0], ['Earned', `₹${(ref?.earnings || 0).toLocaleString('en-IN')}`], ['Pending', '₹500']].map(([l, v]) => (
            <div key={l}><div className="text-xl font-bold text-[#00d084]">{v}</div><div className="text-xs text-[#8b9cc8] mt-0.5">{l}</div></div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="font-semibold text-sm mb-4">How it works</div>
        {[['1. Share your code', 'Send your unique link to friends & family'],['2. They sign up', 'Your friend creates a free TradeX account'],['3. They complete KYC', 'Friend opens a Demat account and verifies'],['4. You earn ₹500', 'Reward credited within 7 business days']].map(([t, d]) => (
          <div key={t} className="flex gap-3 py-2.5 border-b border-border last:border-0">
            <div className="w-7 h-7 rounded-full bg-[#00d084]/10 border border-[#00d084]/20 flex items-center justify-center text-xs text-[#00d084] flex-shrink-0 font-bold">{t[0]}</div>
            <div><div className="text-sm font-medium">{t}</div><div className="text-xs text-[#8b9cc8] mt-0.5">{d}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PROFILE PAGE ─────────────────────────────────────────
import useAuthStore from '../context/authStore';

export function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [form, setForm] = useState({ fullName: user?.fullName || '', mobile: user?.mobile || '', email: user?.email || '' });

  const updateMut = useMutation({ mutationFn: (d) => userAPI.updateProfile(d), onSuccess: (res) => { updateUser(res.data.data); toast.success('Profile updated'); } });

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-5 max-w-4xl animate-slide-up">
      <div className="card text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00d084] to-[#3b82f6] flex items-center justify-center text-3xl font-bold text-white mx-auto mb-3">
          {user?.fullName?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="font-semibold">{user?.fullName}</div>
        <div className="text-xs text-[#8b9cc8] mt-1">{user?.email}</div>
        <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${user?.kycStatus === 'approved' ? 'badge-green' : 'badge-gold'}`}>{user?.kycStatus === 'approved' ? '✓ KYC Verified' : 'KYC Pending'}</span>
        <div className="mt-4 pt-4 border-t border-border text-left space-y-2">
          {[['Client ID', user?.clientId], ['Demat A/c', user?.dematAccountNumber || 'Pending KYC'], ['Member Since', new Date(user?.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })]].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs"><span className="text-[#8b9cc8]">{k}</span><span className="font-medium truncate max-w-[120px]">{v}</span></div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="card">
          <div className="font-semibold text-sm mb-4">Personal Information</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><label className="inp-label">Full Name</label><input className="inp" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} /></div>
            <div><label className="inp-label">Mobile</label><input className="inp" value={form.mobile} readOnly /></div>
            <div><label className="inp-label">Email</label><input className="inp" value={form.email} readOnly /></div>
            <div><label className="inp-label">Annual Income</label>
              <select className="inp" value={user?.annualIncome || ''} onChange={e => updateUser({ annualIncome: e.target.value })}>
                {['0-1L','1-5L','5-10L','10-25L','25L+'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
          <button onClick={() => updateMut.mutate(form)} className="btn-primary text-sm px-4 py-2" disabled={updateMut.isPending}>Save Changes</button>
        </div>
        <div className="card">
          <div className="font-semibold text-sm mb-4">Security</div>
          <div className="space-y-3">
            {[['Two-Factor Authentication', 'Extra layer of account security'], ['Change Password', 'Last changed 30 days ago'], ['Active Sessions', '1 device logged in']].map(([t, d]) => (
              <div key={t} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                <div><div className="text-sm">{t}</div><div className="text-xs text-[#4a5580]">{d}</div></div>
                <button onClick={() => toast.success(`${t} — coming soon`)} className="btn-ghost text-xs px-3 py-1.5">Manage</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
