// ─── ADMIN DASHBOARD ──────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { Users, TrendingUp, DollarSign, FileCheck, BarChart3, Layers, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const { data: dashboardData, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => adminAPI.getDashboard(), refetchInterval: 30000 });
  const { data: marketStatsData } = useQuery({ queryKey: ['market-stats'], queryFn: () => adminAPI.getMarketStats(), refetchInterval: 10000 });
  
  const stats = dashboardData?.data?.data;
  const marketStats = marketStatsData?.data;

  const kpis = [
    { label: 'Total Users', val: stats?.users?.total?.toLocaleString('en-IN') || '0', sub: `${stats?.users?.active || 0} active`, icon: Users, color: 'blue' },
    { label: 'KYC Pending', val: stats?.users?.kycPending || 0, sub: 'Awaiting review', icon: FileCheck, color: 'gold' },
    { label: "Today's Orders", val: stats?.trading?.todayOrders || 0, sub: `${stats?.trading?.totalOrders || 0} total`, icon: TrendingUp, color: 'green' },
    { label: 'Total Deposits', val: `₹${((stats?.finance?.totalDeposits || 0) / 100000).toFixed(1)}L`, sub: `${stats?.finance?.pendingWithdrawals || 0} pending WD`, icon: DollarSign, color: 'red' },
  ];

  return (
    <div className="w-full p-4 space-y-5 animate-slide-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-2 h-2 rounded-full bg-[#ff4f6a] flex-shrink-0"></div>
        <h2 className="text-sm font-semibold text-[#ff4f6a] uppercase tracking-wider truncate">Admin Panel</h2>
      </div>

      {/* Market Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Layers size={16} className="text-brand-blue" />
            <span className="text-xs text-text-secondary">Total Instruments</span>
          </div>
          <div className="text-xl font-bold text-text-primary">{marketStats?.totalInstruments || 0}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={16} className="text-brand-green" />
            <span className="text-xs text-text-secondary">Stocks</span>
          </div>
          <div className="text-xl font-bold text-text-primary">{marketStats?.totalStocks || 0}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={16} className="text-accent-red" />
            <span className="text-xs text-text-secondary">Forex Pairs</span>
          </div>
          <div className="text-xl font-bold text-text-primary">{marketStats?.totalForex || 0}</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-yellow-500" />
            <span className="text-xs text-text-secondary">Active</span>
          </div>
          <div className="text-xl font-bold text-text-primary">{marketStats?.activeInstruments || 0}</div>
        </div>
      </div>

      {/* Quick Links - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        <a href="/admin/fund-requests" className="card hover:bg-bg-tertiary transition-colors cursor-pointer min-w-0">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-brand-green flex-shrink-0" />
            <span className="text-xs font-medium truncate">Fund Requests</span>
          </div>
        </a>
        <a href="/admin/withdraw-requests" className="card hover:bg-bg-tertiary transition-colors cursor-pointer min-w-0">
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-accent-red flex-shrink-0" />
            <span className="text-xs font-medium truncate">Withdraw Requests</span>
          </div>
        </a>
        <a href="/admin/trades" className="card hover:bg-bg-tertiary transition-colors cursor-pointer min-w-0">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-brand-blue flex-shrink-0" />
            <span className="text-xs font-medium truncate">Trade Monitor</span>
          </div>
        </a>
        <a href="/admin/kyc" className="card hover:bg-bg-tertiary transition-colors cursor-pointer min-w-0">
          <div className="flex items-center gap-2">
            <FileCheck size={18} className="text-yellow-500 flex-shrink-0" />
            <span className="text-xs font-medium truncate">KYC Approval</span>
          </div>
        </a>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 w-full">
        <AdminKYCPanel />
        <AdminWithdrawalPanel />
      </div>
    </div>
  );
}

// Quick KYC panel on dashboard
function AdminKYCPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-kyc-pending'], queryFn: () => adminAPI.getKYCList({ status: 'submitted', limit: 5 }) });
  const pending = data?.data?.data || [];

  const reviewMut = useMutation({
    mutationFn: ({ userId, action, reason }) => adminAPI.reviewKYC(userId, { action, reason }),
    onSuccess: (_, { action }) => { qc.invalidateQueries(['admin-kyc-pending']); qc.invalidateQueries(['admin-dashboard']); toast.success(`KYC ${action}d`); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-sm">Pending KYC ({pending.length})</div>
        <a href="/admin/kyc" className="text-xs text-[#00d084] hover:underline">View all</a>
      </div>
      {pending.length === 0 ? <div className="text-center py-6 text-[#4a5580] text-sm">No pending KYC submissions</div> :
        pending.map(k => (
          <div key={k._id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <div className="text-sm font-medium">{k.user?.fullName}</div>
              <div className="text-xs text-[#8b9cc8]">{k.user?.email} · {k.user?.mobile}</div>
              <div className="text-[10px] text-[#4a5580]">Submitted: {new Date(k.submittedAt).toLocaleDateString('en-IN')}</div>
            </div>
            <div className="flex gap-1.5 ml-3">
              <button onClick={() => reviewMut.mutate({ userId: k.user?._id, action: 'approve' })} className="text-xs px-2.5 py-1.5 rounded-lg bg-[#00d084]/10 text-[#00d084] border border-[#00d084]/20 hover:bg-[#00d084]/20 transition-colors">✓</button>
              <button onClick={() => reviewMut.mutate({ userId: k.user?._id, action: 'reject', reason: 'Documents unclear' })} className="text-xs px-2.5 py-1.5 rounded-lg bg-[#ff4f6a]/10 text-[#ff4f6a] border border-[#ff4f6a]/20 hover:bg-[#ff4f6a]/20 transition-colors">✕</button>
            </div>
          </div>
        ))}
    </div>
  );
}

function AdminWithdrawalPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-wd'], queryFn: () => adminAPI.getWithdrawals({ limit: 5 }) });
  const items = data?.data?.data || [];

  const processMut = useMutation({
    mutationFn: ({ id, action }) => adminAPI.processWithdrawal(id, { action, utrNumber: 'UTR' + Date.now() }),
    onSuccess: () => { qc.invalidateQueries(['admin-wd']); toast.success('Withdrawal processed'); },
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-sm">Pending Withdrawals</div>
        <a href="/admin/wallet" className="text-xs text-[#00d084] hover:underline">View all</a>
      </div>
      {items.length === 0 ? <div className="text-center py-6 text-[#4a5580] text-sm">No pending withdrawals</div> :
        items.map(w => (
          <div key={w._id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div>
              <div className="text-sm font-medium">{w.user?.fullName}</div>
              <div className="text-xs text-[#8b9cc8]">₹{w.amount?.toLocaleString('en-IN')} · {w.bankAccount?.bankName}</div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => processMut.mutate({ id: w._id, action: 'approve' })} className="text-xs px-2.5 py-1.5 rounded-lg bg-[#00d084]/10 text-[#00d084] border border-[#00d084]/20">✓</button>
              <button onClick={() => processMut.mutate({ id: w._id, action: 'reject' })} className="text-xs px-2.5 py-1.5 rounded-lg bg-[#ff4f6a]/10 text-[#ff4f6a] border border-[#ff4f6a]/20">✕</button>
            </div>
          </div>
        ))}
    </div>
  );
}

// ─── ADMIN KYC PAGE ───────────────────────────────────────
import { useState } from 'react';

export function AdminKYC() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState(null);
  const { data } = useQuery({ queryKey: ['admin-kyc-all'], queryFn: () => adminAPI.getKYCList({ status: 'submitted', limit: 30 }) });
  const items = data?.data?.data || [];

  const { data: detailRes } = useQuery({ queryKey: ['kyc-detail', selected], queryFn: () => adminAPI.getKYCDetail(selected), enabled: !!selected });
  const detail = detailRes?.data?.data;

  const reviewMut = useMutation({
    mutationFn: ({ userId, action, reason }) => adminAPI.reviewKYC(userId, { action, reason }),
    onSuccess: () => { qc.invalidateQueries(['admin-kyc-all']); setSelected(null); toast.success('KYC reviewed'); },
  });

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-5 animate-slide-up">
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-semibold text-sm">KYC Review Queue ({items.length})</div>
        <table className="data-table">
          <thead><tr><th>User</th><th>Mobile</th><th>Submitted</th><th>Status</th><th className="text-right">Action</th></tr></thead>
          <tbody>
            {items.length === 0 ? <tr><td colSpan={5} className="text-center py-8 text-[#4a5580]">No pending KYC</td></tr> :
              items.map(k => (
                <tr key={k._id} onClick={() => setSelected(k.user?._id)} className={`cursor-pointer ${selected === k.user?._id ? 'bg-[#00d084]/[0.04]' : ''}`}>
                  <td><div className="text-xs font-medium">{k.user?.fullName}</div><div className="text-[10px] text-[#4a5580]">{k.user?.email}</div></td>
                  <td className="text-xs">{k.user?.mobile}</td>
                  <td className="text-xs text-[#8b9cc8]">{k.submittedAt ? new Date(k.submittedAt).toLocaleDateString('en-IN') : '--'}</td>
                  <td><span className="badge-gold text-[10px]">{k.status}</span></td>
                  <td className="text-right"><button onClick={e => { e.stopPropagation(); setSelected(k.user?._id); }} className="btn-ghost text-xs px-3 py-1.5">Review</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selected && detail && (
        <div className="card h-fit">
          <div className="font-semibold text-sm mb-4">KYC Documents</div>
          <div className="text-sm font-medium mb-0.5">{detail.user?.fullName}</div>
          <div className="text-xs text-[#8b9cc8] mb-4">{detail.user?.email}</div>
          {[['PAN', detail.pan?.document?.url], ['Aadhaar Front', detail.aadhaar?.frontDocument?.url], ['Aadhaar Back', detail.aadhaar?.backDocument?.url], ['Selfie', detail.selfie?.url]].filter(([, u]) => u).map(([label, url]) => (
            <div key={label} className="mb-3">
              <div className="text-xs text-[#8b9cc8] mb-1.5">{label}</div>
              <a href={url} target="_blank" rel="noreferrer" className="block bg-bg-tertiary rounded-lg p-3 text-xs text-[#00d084] hover:underline border border-border truncate">{url ? '📎 View Document ↗' : 'Not uploaded'}</a>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
            <button onClick={() => reviewMut.mutate({ userId: selected, action: 'approve' })} className="btn-primary text-sm py-2.5">✓ Approve</button>
            <button onClick={() => reviewMut.mutate({ userId: selected, action: 'reject', reason: 'Documents unclear or invalid' })} className="btn-danger text-sm py-2.5 justify-center">✕ Reject</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN USERS ──────────────────────────────────────────
export function AdminUsers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tradeForm, setTradeForm] = useState({
    symbol: '',
    quantity: 1,
    transactionType: 'BUY',
  });
  
  const { data } = useQuery({ queryKey: ['admin-users', search, kycFilter], queryFn: () => adminAPI.getUsers({ search, kycStatus: kycFilter || undefined, limit: 30 }) });
  const users = data?.data?.data || [];

  // Fetch all market instruments for dropdown
  const { data: instrumentsData } = useQuery({
    queryKey: ['all-instruments'],
    queryFn: async () => {
      try {
        const res = await adminAPI.getInstruments({ limit: 1000 });
        console.log('[Admin Trade] Instruments API response:', res);
        // Backend returns { success: true, data: [...], count: X }
        const instrumentsArray = res.data?.data || res.data || [];
        console.log('[Admin Trade] Instruments extracted:', instrumentsArray.length);
        return Array.isArray(instrumentsArray) ? instrumentsArray : [];
      } catch (err) {
        console.error('[Admin Trade] Failed to fetch instruments:', err);
        return [];
      }
    },
    staleTime: 60000,
    cacheTime: 300000,
    refetchOnWindowFocus: false,
  });
  const instruments = instrumentsData || [];

  // Toggle trading status mutation
  const toggleTradingMut = useMutation({
    mutationFn: ({ userId, tradingEnabled }) => adminAPI.updateUserTradingStatus(userId, tradingEnabled),
    onSuccess: (res, { tradingEnabled }) => {
      qc.invalidateQueries(['admin-users']);
      toast.success(`User trading ${tradingEnabled ? 'enabled' : 'disabled'}`);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  });

  // Place order for user mutation
  const placeOrderMut = useMutation({
    mutationFn: (data) => adminAPI.placeOrderForUser(data),
    onSuccess: (res) => {
      toast.success(`Order placed successfully for ${selectedUser?.fullName}`);
      setTradeModalOpen(false);
      setSelectedUser(null);
      setTradeForm({ symbol: '', quantity: 1, transactionType: 'BUY' });
      
      // Invalidate all related caches to trigger automatic updates
      qc.invalidateQueries(['admin-users']);
      qc.invalidateQueries(['orders']);
      qc.invalidateQueries(['portfolio']);
      qc.invalidateQueries(['holdings']);
      qc.invalidateQueries(['wallet']);
      qc.invalidateQueries(['wallet-balance']);
      qc.invalidateQueries(['positions']);
      qc.invalidateQueries(['recent-orders']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to place order');
    }
  });

  const openTradeModal = (user) => {
    setSelectedUser(user);
    setTradeForm({
      symbol: '',
      quantity: 1,
      transactionType: 'BUY',
    });
    setTradeModalOpen(true);
  };

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (!selectedUser || !tradeForm.symbol || tradeForm.quantity < 1) {
      toast.error('Please fill all required fields');
      return;
    }
    
    placeOrderMut.mutate({
      userId: selectedUser._id,
      symbol: tradeForm.symbol,
      quantity: parseInt(tradeForm.quantity),
      transactionType: tradeForm.transactionType,
    });
  };

  return (
    <div className="animate-slide-up">
      <div className="flex gap-3 mb-4">
        <input className="inp max-w-xs" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="inp w-auto px-3" value={kycFilter} onChange={e => setKycFilter(e.target.value)}>
          <option value="">All KYC</option>
          {['not_started','pending','approved','rejected'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead><tr><th>User</th><th>Mobile</th><th>Client ID</th><th>KYC</th><th className="text-right">Balance</th><th>Trading</th><th>Status</th><th className="text-right">Joined</th><th>Action</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td><div className="text-xs font-medium">{u.fullName}</div><div className="text-[10px] text-[#4a5580]">{u.email}</div></td>
                <td className="text-xs">{u.mobile}</td>
                <td className="text-xs font-mono text-[#8b9cc8]">{u.clientId}</td>
                <td><span className={`text-[10px] ${u.kycStatus === 'approved' ? 'badge-green' : u.kycStatus === 'pending' ? 'badge-gold' : 'badge-gray'}`}>{u.kycStatus}</span></td>
                <td className="text-right text-xs font-medium">₹{(u.walletBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={u.tradingEnabled !== false}
                      onChange={(e) => toggleTradingMut.mutate({ userId: u._id, tradingEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-bg-tertiary rounded-full peer peer-checked:bg-brand-blue transition-colors">
                      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                    </div>
                  </label>
                </td>
                <td><span className={`text-[10px] ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="text-right text-[10px] text-[#4a5580]">{new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
                <td className="text-center">
                  <button
                    onClick={() => openTradeModal(u)}
                    className="px-3 py-1.5 bg-brand-blue text-white text-xs rounded-lg hover:bg-brand-blue/90 transition-colors"
                  >
                    Trade
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Trade for User Modal */}
      {tradeModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setTradeModalOpen(false)}>
          <div className="bg-bg-card border border-border rounded-xl shadow-2xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Trade for User</h3>
                  <p className="text-xs text-text-secondary mt-1">{selectedUser.fullName} ({selectedUser.email})</p>
                </div>
                <button onClick={() => setTradeModalOpen(false)} className="text-text-secondary hover:text-text-primary transition-colors">
                  ✕
                </button>
              </div>

              <form onSubmit={handlePlaceOrder} className="space-y-4">
                {/* Symbol Dropdown - Searchable */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Select Instrument *</label>
                  <select
                    value={tradeForm.symbol}
                    onChange={(e) => setTradeForm({ ...tradeForm, symbol: e.target.value })}
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none text-sm"
                    required
                    disabled={instruments.length === 0}
                  >
                    <option value="">-- Select Instrument --</option>
                    {instruments.map(inst => (
                      <option key={inst._id} value={inst.symbol}>
                        {inst.symbol} - {inst.name || inst.symbol} ({inst.type})
                      </option>
                    ))}
                  </select>
                  {instruments.length === 0 && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] text-accent-red">⚠️ No instruments loaded</p>
                      <p className="text-[9px] text-text-muted">Admin must add instruments first via Admin → Market Management</p>
                    </div>
                  )}
                  {instruments.length > 0 && (
                    <p className="text-[9px] text-text-muted mt-1">{instruments.length} instruments available</p>
                  )}
                </div>

                {/* Transaction Type */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Transaction Type *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTradeForm({ ...tradeForm, transactionType: 'BUY' })}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all border ${
                        tradeForm.transactionType === 'BUY'
                          ? 'bg-brand-green/20 text-brand-green border-brand-green'
                          : 'bg-bg-tertiary text-text-secondary border-border hover:bg-bg-secondary'
                      }`}
                    >
                      BUY
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeForm({ ...tradeForm, transactionType: 'SELL' })}
                      className={`py-2 rounded-lg text-sm font-semibold transition-all border ${
                        tradeForm.transactionType === 'SELL'
                          ? 'bg-accent-red/20 text-accent-red border-accent-red'
                          : 'bg-bg-tertiary text-text-secondary border-border hover:bg-bg-secondary'
                      }`}
                    >
                      SELL
                    </button>
                  </div>
                </div>

                {/* Quantity Input */}
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={tradeForm.quantity}
                    onChange={(e) => setTradeForm({ ...tradeForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    min="1"
                    className="w-full px-3 py-2 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none text-sm"
                    required
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setTradeModalOpen(false)}
                    className="flex-1 py-2.5 bg-bg-tertiary text-text-secondary rounded-lg hover:bg-bg-secondary transition-colors text-sm font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={placeOrderMut.isPending}
                    className="flex-1 py-2.5 bg-brand-blue text-white rounded-lg hover:bg-brand-blue/90 transition-colors text-sm font-semibold disabled:opacity-50"
                  >
                    {placeOrderMut.isPending ? 'Placing...' : 'Place Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ADMIN WALLET ─────────────────────────────────────────
export function AdminWallet() {
  const qc = useQueryClient();
  const [userId, setUserId] = useState('');
  const [adjAmt, setAdjAmt] = useState('');
  const [adjReason, setAdjReason] = useState('');

  const { data: wdRes } = useQuery({ queryKey: ['admin-withdrawals-all'], queryFn: () => adminAPI.getWithdrawals({ status: 'all', limit: 50 }) });
  const { data: txnRes } = useQuery({ queryKey: ['admin-txns'], queryFn: () => adminAPI.getTransactions({ limit: 30 }) });

  const adjMut = useMutation({ mutationFn: (d) => adminAPI.adjustWallet(d), onSuccess: () => { toast.success('Wallet adjusted'); setAdjAmt(''); setAdjReason(''); } });
  const wdMut = useMutation({ mutationFn: ({ id, action }) => adminAPI.processWithdrawal(id, { action, utrNumber: 'UTR' + Date.now() }), onSuccess: () => { qc.invalidateQueries(['admin-withdrawals-all']); toast.success('Done'); } });

  const withdrawals = wdRes?.data?.data || [];
  const txns = txnRes?.data?.data || [];

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="font-semibold text-sm mb-4">Wallet Control</div>
          <div className="mb-3"><label className="inp-label">User ID or Email</label><input className="inp" placeholder="user@email.com" value={userId} onChange={e => setUserId(e.target.value)} /></div>
          <div className="mb-3"><label className="inp-label">Amount (₹)</label><input className="inp" type="number" value={adjAmt} onChange={e => setAdjAmt(e.target.value)} /></div>
          <div className="mb-4"><label className="inp-label">Reason</label><input className="inp" placeholder="Reason for adjustment" value={adjReason} onChange={e => setAdjReason(e.target.value)} /></div>
          <div className="flex gap-2">
            <button onClick={() => adjMut.mutate({ userId, amount: parseFloat(adjAmt), type: 'add', reason: adjReason })} className="btn-primary flex-1 text-sm py-2.5">+ Add Balance</button>
            <button onClick={() => adjMut.mutate({ userId, amount: parseFloat(adjAmt), type: 'deduct', reason: adjReason })} className="btn-danger flex-1 text-sm py-2.5 justify-center">− Deduct</button>
          </div>
        </div>
        <div className="card">
          <div className="font-semibold text-sm mb-4">Recent Transactions</div>
          {txns.slice(0,8).map(t => (
            <div key={t._id} className="flex justify-between py-2 border-b border-border last:border-0 text-xs">
              <div><div className="font-medium">{t.user?.fullName}</div><div className="text-[#4a5580]">{t.description?.slice(0,40)}</div></div>
              <span className={t.direction === 'CREDIT' ? 'text-[#00d084]' : 'text-[#ff4f6a]'}>{t.direction === 'CREDIT' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-semibold text-sm">Withdrawal Requests ({withdrawals.length})</div>
        <table className="data-table">
          <thead><tr><th>User</th><th>Amount</th><th>Bank</th><th>Status</th><th className="text-right">Requested</th><th className="text-right">Action</th></tr></thead>
          <tbody>
            {withdrawals.map(w => (
              <tr key={w._id}>
                <td><div className="text-xs font-medium">{w.user?.fullName}</div><div className="text-[10px] text-[#4a5580]">{w.user?.email}</div></td>
                <td className="font-semibold text-xs">₹{w.amount?.toLocaleString('en-IN')}</td>
                <td className="text-xs text-[#8b9cc8]">{w.bankAccount?.bankName}</td>
                <td><span className={`text-[10px] ${w.status === 'COMPLETED' ? 'badge-green' : w.status === 'PENDING' ? 'badge-gold' : 'badge-red'}`}>{w.status}</span></td>
                <td className="text-right text-[10px] text-[#4a5580]">{new Date(w.requestedAt).toLocaleDateString('en-IN')}</td>
                <td className="text-right">
                  {w.status === 'PENDING' && <div className="flex gap-1 justify-end">
                    <button onClick={() => wdMut.mutate({ id: w._id, action: 'approve' })} className="text-[10px] px-2 py-1 rounded bg-[#00d084]/10 text-[#00d084] border border-[#00d084]/20">✓</button>
                    <button onClick={() => wdMut.mutate({ id: w._id, action: 'reject' })} className="text-[10px] px-2 py-1 rounded bg-[#ff4f6a]/10 text-[#ff4f6a] border border-[#ff4f6a]/20">✕</button>
                  </div>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ADMIN MARKET INSTRUMENTS ─────────────────────────────────────────
import { marketAPI } from '../../api';

export function AdminMarket() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ 
    queryKey: ['market-instruments-admin'], 
    queryFn: async () => {
      try {
        const response = await marketAPI.getAll({ limit: 100 });
        // Ensure data is always an array
        return Array.isArray(response?.data) ? response.data : [];
      } catch (err) {
        console.error('[AdminMarket] API error:', err.message);
        return [];
      }
    },
    refetchInterval: 5000,
  });
  const instruments = data || [];
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    type: 'STOCK',
    exchange: 'NSE',
    price: '',
    open: '',
    high: '',
    low: '',
    close: '',
    volume: '',
    sector: '',
    strikePrice: '',
    expiryDate: '',
    optionType: 'CE',
    lotSize: '',
  });
  const [editingId, setEditingId] = useState(null);

  // Create instrument mutation
  const createMut = useMutation({
    mutationFn: (data) => adminAPI.createInstrument(data),
    onSuccess: () => {
      qc.invalidateQueries(['market-instruments-admin']);
      toast.success('Instrument created');
      setFormData({
        name: '', symbol: '', type: 'STOCK', exchange: 'NSE',
        price: '', open: '', high: '', low: '', close: '',
        volume: '', sector: '', strikePrice: '', expiryDate: '',
        optionType: 'CE', lotSize: '',
      });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  // Update instrument mutation
  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateInstrument(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['market-instruments-admin']);
      toast.success('Instrument updated');
      setEditingId(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  // Delete instrument mutation
  const deleteMut = useMutation({
    mutationFn: (id) => adminAPI.deleteInstrument(id),
    onSuccess: () => {
      qc.invalidateQueries(['market-instruments-admin']);
      toast.success('Instrument deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  // Toggle active status
  const toggleActiveMut = useMutation({
    mutationFn: ({ id, isActive }) => adminAPI.updateInstrument(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries(['market-instruments-admin']);
      toast.success('Status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.symbol || !formData.price) {
      toast.error('Name, Symbol, and Price are required');
      return;
    }

    if (editingId) {
      updateMut.mutate({ 
        id: editingId, 
        data: {
          ...formData,
          price: parseFloat(formData.price),
          open: formData.open ? parseFloat(formData.open) : undefined,
          high: formData.high ? parseFloat(formData.high) : undefined,
          low: formData.low ? parseFloat(formData.low) : undefined,
          close: formData.close ? parseFloat(formData.close) : undefined,
          volume: formData.volume ? parseInt(formData.volume) : undefined,
          strikePrice: formData.strikePrice ? parseFloat(formData.strikePrice) : undefined,
          expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
          optionType: formData.type === 'OPTION' ? formData.optionType : undefined,
          lotSize: formData.lotSize ? parseInt(formData.lotSize) : undefined,
        }
      });
    } else {
      createMut.mutate({
        ...formData,
        price: parseFloat(formData.price),
        open: formData.open ? parseFloat(formData.open) : parseFloat(formData.price),
        high: formData.high ? parseFloat(formData.high) : parseFloat(formData.price),
        low: formData.low ? parseFloat(formData.low) : parseFloat(formData.price),
        close: formData.close ? parseFloat(formData.close) : parseFloat(formData.price),
        volume: formData.volume ? parseInt(formData.volume) : 0,
        strikePrice: formData.strikePrice ? parseFloat(formData.strikePrice) : undefined,
        expiryDate: formData.expiryDate ? new Date(formData.expiryDate) : undefined,
        optionType: formData.type === 'OPTION' ? formData.optionType : undefined,
        lotSize: formData.lotSize ? parseInt(formData.lotSize) : undefined,
      });
    }
  };

  const handleEdit = (inst) => {
    setEditingId(inst._id);
    setFormData({
      name: inst.name,
      symbol: inst.symbol,
      type: inst.type,
      exchange: inst.exchange,
      price: inst.price,
      open: inst.open,
      high: inst.high,
      low: inst.low,
      close: inst.close,
      volume: inst.volume,
      sector: inst.sector || '',
      strikePrice: inst.strikePrice || '',
      expiryDate: inst.expiryDate ? new Date(inst.expiryDate).toISOString().split('T')[0] : '',
      optionType: inst.optionType || 'CE',
      lotSize: inst.lotSize || '',
    });
  };

  return (
    <div className="space-y-5 animate-slide-up">
      {/* Create/Edit Form */}
      <div className="card">
        <div className="font-semibold text-sm mb-4">
          {editingId ? 'Edit Instrument' : 'Add New Instrument'}
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <input 
            className="inp" 
            placeholder="Name*" 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
            required 
          />
          <input 
            className="inp" 
            placeholder="Symbol*" 
            value={formData.symbol} 
            onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})} 
            required 
          />
          <select 
            className="inp" 
            value={formData.type} 
            onChange={e => setFormData({...formData, type: e.target.value})}
          >
            <option value="STOCK">Stock</option>
            <option value="FOREX">Forex</option>
            <option value="OPTION">Option</option>
          </select>
          <select 
            className="inp" 
            value={formData.exchange} 
            onChange={e => setFormData({...formData, exchange: e.target.value})}
          >
            <option value="NSE">NSE</option>
            <option value="BSE">BSE</option>
            <option value="FOREX">FOREX</option>
            <option value="NFO">NFO (Options)</option>
            <option value="CDS">CDS (Currency)</option>
          </select>
          <input 
            className="inp" 
            type="number" 
            step="0.01" 
            placeholder="Price*" 
            value={formData.price} 
            onChange={e => setFormData({...formData, price: e.target.value})} 
            required 
          />
          <input 
            className="inp" 
            type="number" 
            step="0.01" 
            placeholder="Open" 
            value={formData.open} 
            onChange={e => setFormData({...formData, open: e.target.value})} 
          />
          <input 
            className="inp" 
            type="number" 
            step="0.01" 
            placeholder="High" 
            value={formData.high} 
            onChange={e => setFormData({...formData, high: e.target.value})} 
          />
          <input 
            className="inp" 
            type="number" 
            step="0.01" 
            placeholder="Low" 
            value={formData.low} 
            onChange={e => setFormData({...formData, low: e.target.value})} 
          />
          <input 
            className="inp" 
            type="number" 
            step="0.01" 
            placeholder="Close" 
            value={formData.close} 
            onChange={e => setFormData({...formData, close: e.target.value})} 
          />
          <input 
            className="inp" 
            type="number" 
            placeholder="Volume" 
            value={formData.volume} 
            onChange={e => setFormData({...formData, volume: e.target.value})} 
          />
          <input 
            className="inp" 
            placeholder="Sector" 
            value={formData.sector} 
            onChange={e => setFormData({...formData, sector: e.target.value})} 
          />
          {/* Options-specific fields - only show when type is OPTION */}
          {formData.type === 'OPTION' && (
            <>
              <input 
                className="inp" 
                type="number" 
                step="0.01"
                placeholder="Strike Price" 
                value={formData.strikePrice} 
                onChange={e => setFormData({...formData, strikePrice: e.target.value})} 
              />
              <input 
                className="inp" 
                type="date" 
                placeholder="Expiry Date" 
                value={formData.expiryDate} 
                onChange={e => setFormData({...formData, expiryDate: e.target.value})} 
              />
              <select 
                className="inp" 
                value={formData.optionType} 
                onChange={e => setFormData({...formData, optionType: e.target.value})}
              >
                <option value="CE">Call (CE)</option>
                <option value="PE">Put (PE)</option>
              </select>
              <input 
                className="inp" 
                type="number" 
                placeholder="Lot Size" 
                value={formData.lotSize} 
                onChange={e => setFormData({...formData, lotSize: e.target.value})} 
              />
            </>
          )}
          <div className="flex gap-2 col-span-2 lg:col-span-4">
            <button type="submit" className="btn-primary flex-1 text-sm py-2.5">
              {editingId ? 'Update' : 'Create'} Instrument
            </button>
            {editingId && (
              <button 
                type="button" 
                onClick={() => { setEditingId(null); setFormData({
                  name: '', symbol: '', type: 'STOCK', exchange: 'NSE',
                  price: '', open: '', high: '', low: '', close: '',
                  volume: '', sector: '', strikePrice: '', expiryDate: '',
                  optionType: 'CE', lotSize: '',
                }); }} 
                className="btn-ghost text-sm py-2.5"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Instruments List */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-semibold text-sm">
          Market Instruments ({instruments.length})
        </div>
        {isLoading ? (
          <div className="text-center py-8 text-text-secondary">
            <div className="w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading...
          </div>
        ) : instruments.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            No instruments added by admin yet.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Name</th>
                <th>Type</th>
                <th>Exchange</th>
                <th className="text-right">Price</th>
                <th className="text-right">Change %</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {instruments.map(inst => (
                <tr key={inst._id}>
                  <td className="font-medium text-xs">{inst.symbol}</td>
                  <td className="text-xs">{inst.name}</td>
                  <td><span className={`text-[10px] ${inst.type === 'STOCK' ? 'badge-blue' : 'badge-gold'}`}>{inst.type}</span></td>
                  <td className="text-xs text-text-secondary">{inst.exchange}</td>
                  <td className="text-right font-semibold text-xs">₹{inst.price?.toFixed(2)}</td>
                  <td className={`text-right text-xs ${inst.changePercent >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
                    {inst.changePercent >= 0 ? '+' : ''}{inst.changePercent?.toFixed(2)}%
                  </td>
                  <td>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={inst.isActive !== false}
                        onChange={(e) => toggleActiveMut.mutate({ id: inst._id, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="relative w-9 h-5 bg-bg-tertiary rounded-full peer peer-checked:bg-brand-blue transition-colors">
                        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                      </div>
                    </label>
                  </td>
                  <td className="text-right">
                    <button 
                      onClick={() => handleEdit(inst)} 
                      className="text-xs px-2 py-1 rounded bg-brand-blue/10 text-brand-blue border border-brand-blue/20 mr-1"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteMut.mutate(inst._id)} 
                      className="text-xs px-2 py-1 rounded bg-accent-red/10 text-accent-red border border-accent-red/20"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
