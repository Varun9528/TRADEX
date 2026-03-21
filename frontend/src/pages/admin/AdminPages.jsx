// ─── ADMIN DASHBOARD ──────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { Users, TrendingUp, DollarSign, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => adminAPI.getDashboard(), refetchInterval: 30000 });
  const stats = data?.data?.data;

  const kpis = [
    { label: 'Total Users', val: stats?.users?.total?.toLocaleString('en-IN') || '0', sub: `${stats?.users?.active || 0} active`, icon: Users, color: 'blue' },
    { label: 'KYC Pending', val: stats?.users?.kycPending || 0, sub: 'Awaiting review', icon: FileCheck, color: 'gold' },
    { label: "Today's Orders", val: stats?.trading?.todayOrders || 0, sub: `${stats?.trading?.totalOrders || 0} total`, icon: TrendingUp, color: 'green' },
    { label: 'Total Deposits', val: `₹${((stats?.finance?.totalDeposits || 0) / 100000).toFixed(1)}L`, sub: `${stats?.finance?.pendingWithdrawals || 0} pending WD`, icon: DollarSign, color: 'red' },
  ];

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-2 h-2 rounded-full bg-[#ff4f6a]"></div>
        <h2 className="text-sm font-semibold text-[#ff4f6a] uppercase tracking-wider">Admin Panel</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#8b9cc8]">{k.label}</span>
              <k.icon size={14} className="text-[#4a5580]" />
            </div>
            <div className="text-2xl font-bold">{k.val}</div>
            <div className="text-xs text-[#4a5580] mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
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
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const { data } = useQuery({ queryKey: ['admin-users', search, kycFilter], queryFn: () => adminAPI.getUsers({ search, kycStatus: kycFilter || undefined, limit: 30 }) });
  const users = data?.data?.data || [];

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
          <thead><tr><th>User</th><th>Mobile</th><th>Client ID</th><th>KYC</th><th className="text-right">Balance</th><th>Status</th><th className="text-right">Joined</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u._id}>
                <td><div className="text-xs font-medium">{u.fullName}</div><div className="text-[10px] text-[#4a5580]">{u.email}</div></td>
                <td className="text-xs">{u.mobile}</td>
                <td className="text-xs font-mono text-[#8b9cc8]">{u.clientId}</td>
                <td><span className={`text-[10px] ${u.kycStatus === 'approved' ? 'badge-green' : u.kycStatus === 'pending' ? 'badge-gold' : 'badge-gray'}`}>{u.kycStatus}</span></td>
                <td className="text-right text-xs font-medium">₹{(u.walletBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                <td><span className={`text-[10px] ${u.isActive ? 'badge-green' : 'badge-red'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td className="text-right text-[10px] text-[#4a5580]">{new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

// ─── ADMIN STOCKS ─────────────────────────────────────────
import { stockAPI } from '../../api';

export function AdminStocks() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['stocks-admin'], queryFn: () => stockAPI.getAll({ limit: 50 }) });
  const stocks = data?.data?.data || [];
  const [prices, setPrices] = useState({});

  const setPriceMut = useMutation({
    mutationFn: ({ symbol, price }) => adminAPI.setStockPrice(symbol, price),
    onSuccess: (_, { symbol }) => { qc.invalidateQueries(['stocks-admin']); setPrices(p => ({ ...p, [symbol]: '' })); toast.success(`${symbol} price updated`); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="animate-slide-up">
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-border font-semibold text-sm">Stock Price Control ({stocks.length} stocks)</div>
        <table className="data-table">
          <thead><tr><th>Stock</th><th>Sector</th><th className="text-right">Current Price</th><th className="text-right">Change</th><th className="text-right">Override Price</th><th className="text-right">Action</th></tr></thead>
          <tbody>
            {stocks.map(s => (
              <tr key={s.symbol}>
                <td><div className="flex items-center gap-2"><span>{s.logo}</span><span className="font-medium text-xs">{s.symbol}</span></div></td>
                <td><span className="badge-gray text-[10px]">{s.sector}</span></td>
                <td className="text-right font-semibold text-xs">₹{s.currentPrice?.toFixed(2)}</td>
                <td className={`text-right text-xs ${s.changePercent >= 0 ? 'text-[#00d084]' : 'text-[#ff4f6a]'}`}>{s.changePercent >= 0 ? '+' : ''}{s.changePercent?.toFixed(2)}%</td>
                <td className="text-right"><input className="inp text-right text-xs w-28 py-1.5 px-2" type="number" placeholder={s.currentPrice?.toFixed(0)} value={prices[s.symbol] || ''} onChange={e => setPrices(p => ({ ...p, [s.symbol]: e.target.value }))} /></td>
                <td className="text-right"><button onClick={() => { const p = parseFloat(prices[s.symbol]); if (p > 0) setPriceMut.mutate({ symbol: s.symbol, price: p }); }} disabled={!prices[s.symbol]} className="btn-ghost text-xs px-3 py-1.5 disabled:opacity-30">Set</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
