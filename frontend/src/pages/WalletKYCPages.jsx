// ─── WALLET PAGE ──────────────────────────────────────────
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletAPI } from '../api';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';

export function WalletPage() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState('add');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [wdAmount, setWdAmount] = useState('');

  const { data: txnRes } = useQuery({ queryKey: ['transactions'], queryFn: () => walletAPI.getTransactions({ limit: 30 }) });
  const { data: wdRes } = useQuery({ queryKey: ['withdrawals'], queryFn: () => walletAPI.getWithdrawals() });

  const addMut = useMutation({
    mutationFn: () => walletAPI.addFunds({ amount: parseFloat(amount), paymentMethod: method }),
    onSuccess: (res) => {
      updateUser({ walletBalance: res.data.data.newBalance });
      qc.invalidateQueries(['transactions']);
      toast.success(`₹${parseFloat(amount).toLocaleString('en-IN')} added!`);
      setAmount('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add funds'),
  });

  const wdMut = useMutation({
    mutationFn: () => walletAPI.withdraw({ amount: parseFloat(wdAmount), bankAccount: { accountNumber: '****3421', ifscCode: 'SBIN0001234', bankName: 'SBI' } }),
    onSuccess: () => { qc.invalidateQueries(['withdrawals']); toast.success('Withdrawal requested'); setWdAmount(''); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const txns = txnRes?.data?.data || [];

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-5 animate-slide-up">
      <div className="space-y-5">
        {/* Wallet card */}
        <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a2a1f, #1a3a2a)', border: '1px solid rgba(0,208,132,0.2)' }}>
          <div className="text-xs text-white/50 mb-1.5">Available Balance</div>
          <div className="text-4xl font-bold text-[#00d084] mb-1">₹{(user?.walletBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="text-xs text-white/40">TradeX Wallet • Updated just now</div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => setTab('add')} className="btn-primary px-5 py-2.5 text-sm">+ Add Funds</button>
            <button onClick={() => setTab('withdraw')} className="btn-ghost px-5 py-2.5 text-sm">Withdraw</button>
          </div>
        </div>

        {/* Transactions */}
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border font-semibold text-sm">Transaction History</div>
          {txns.length === 0 ? <div className="text-center py-8 text-[#4a5580] text-sm">No transactions yet</div> : (
            <table className="data-table">
              <thead><tr><th>Description</th><th>Type</th><th className="text-right">Amount</th><th className="text-right">Date</th></tr></thead>
              <tbody>
                {txns.map(t => (
                  <tr key={t._id}>
                    <td className="text-xs">{t.description}</td>
                    <td><span className={t.direction === 'CREDIT' ? 'badge-green' : 'badge-red'}>{t.direction}</span></td>
                    <td className={`text-right text-xs font-semibold ${t.direction === 'CREDIT' ? 'text-[#00d084]' : 'text-[#ff4f6a]'}`}>
                      {t.direction === 'CREDIT' ? '+' : '-'}₹{t.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="text-right text-[10px] text-[#4a5580]">{new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Fund panel */}
      <div className="card h-fit">
        <div className="flex gap-1 bg-bg-tertiary p-1 rounded-lg mb-5">
          {[['add', 'Add Funds'], ['withdraw', 'Withdraw']].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} className={`flex-1 py-2 text-sm rounded-md transition-all ${tab === v ? 'bg-bg-secondary text-white font-medium' : 'text-[#8b9cc8]'}`}>{l}</button>
          ))}
        </div>
        {tab === 'add' ? (
          <>
            <div className="mb-4"><label className="inp-label">Amount (₹)</label><input className="inp text-lg font-semibold" type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} /></div>
            <div className="flex flex-wrap gap-2 mb-4">
              {[1000,5000,10000,25000,50000].map(a => <button key={a} onClick={() => setAmount(String(a))} className="btn-ghost text-xs px-3 py-1.5">₹{(a/1000).toFixed(0)}K</button>)}
            </div>
            <div className="mb-4"><label className="inp-label">Payment Method</label>
              <select className="inp" value={method} onChange={e => setMethod(e.target.value)}>
                {['UPI', 'NET_BANKING', 'DEBIT_CARD', 'NEFT', 'RTGS'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
              </select>
            </div>
            <button onClick={() => addMut.mutate()} disabled={!amount || parseFloat(amount) < 100 || addMut.isPending} className="btn-primary w-full py-3 text-sm">
              {addMut.isPending ? 'Processing...' : 'Proceed to Pay →'}
            </button>
            <div className="mt-3 text-[10px] text-[#4a5580] text-center">Min ₹100 • Max ₹5,00,000 per transaction</div>
          </>
        ) : (
          <>
            <div className="mb-3"><label className="inp-label">Amount (₹)</label><input className="inp" type="number" placeholder="Enter amount" value={wdAmount} onChange={e => setWdAmount(e.target.value)} /></div>
            <div className="bg-bg-tertiary rounded-lg p-3 mb-4 flex justify-between text-xs"><span className="text-[#8b9cc8]">Available</span><span className="text-[#00d084] font-semibold">₹{(user?.walletBalance || 0).toLocaleString('en-IN')}</span></div>
            <div className="mb-4"><label className="inp-label">Bank Account</label><select className="inp"><option>••••••3421 — SBI Savings</option></select></div>
            <button onClick={() => wdMut.mutate()} disabled={!wdAmount || wdMut.isPending} className="btn-primary w-full py-3 text-sm">{wdMut.isPending ? 'Requesting...' : 'Request Withdrawal →'}</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── KYC PAGE ─────────────────────────────────────────────
import { useRef } from 'react';
import { kycAPI } from '../api';
import { CheckCircle, Circle, Upload } from 'lucide-react';

const KYC_STEPS = ['Personal Details', 'PAN Card', 'Aadhaar', 'Bank Details', 'Selfie'];

export function KYCPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ fullName: user?.fullName || '', dob: '', gender: 'Male', pan: '', aadhaar: '', bankName: '', accountNumber: '', ifscCode: '', accountType: 'savings' });
  const panFileRef = useRef();
  const aadhaarFrontRef = useRef();
  const aadhaarBackRef = useRef();
  const selfieRef = useRef();

  const { data: kycRes } = useQuery({ queryKey: ['kyc'], queryFn: () => kycAPI.getStatus() });
  const kycData = kycRes?.data?.data;

  if (user?.kycStatus === 'approved') return (
    <div className="max-w-xl mx-auto text-center py-16 animate-slide-up">
      <div className="text-6xl mb-4">🎉</div>
      <div className="text-xl font-bold mb-2 text-[#00d084]">KYC Verified!</div>
      <div className="text-sm text-[#8b9cc8] mb-2">Your account is fully verified and trading is enabled.</div>
      <div className="text-xs text-[#4a5580]">Demat Account: {user?.dematAccountNumber}</div>
    </div>
  );

  if (user?.kycStatus === 'pending') return (
    <div className="max-w-xl mx-auto text-center py-16 animate-slide-up">
      <div className="text-6xl mb-4">⏳</div>
      <div className="text-xl font-bold mb-2 text-amber-400">KYC Under Review</div>
      <div className="text-sm text-[#8b9cc8]">Your documents are being verified. This takes 1-2 business days.</div>
    </div>
  );

  const handleNext = async () => {
    try {
      setSubmitting(true);
      if (currentStep === 0) {
        await kycAPI.submitPersonal({ fullName: form.fullName, dateOfBirth: form.dob, gender: form.gender });
      } else if (currentStep === 1) {
        const fd = new FormData(); fd.append('panNumber', form.pan);
        if (panFileRef.current?.files[0]) fd.append('panDocument', panFileRef.current.files[0]);
        await kycAPI.submitPAN(fd);
      } else if (currentStep === 2) {
        const fd = new FormData(); fd.append('aadhaarNumber', form.aadhaar);
        if (aadhaarFrontRef.current?.files[0]) fd.append('aadhaarFront', aadhaarFrontRef.current.files[0]);
        if (aadhaarBackRef.current?.files[0]) fd.append('aadhaarBack', aadhaarBackRef.current.files[0]);
        await kycAPI.submitAadhaar(fd);
      } else if (currentStep === 3) {
        const fd = new FormData();
        ['bankName','accountNumber','ifscCode','accountType'].forEach(k => fd.append(k, form[k]));
        await kycAPI.submitBank(fd);
      } else if (currentStep === 4) {
        if (!selfieRef.current?.files[0]) { toast.error('Please upload a selfie'); setSubmitting(false); return; }
        const fd = new FormData(); fd.append('selfie', selfieRef.current.files[0]);
        await kycAPI.submitSelfie(fd);
        await kycAPI.submitFinal();
        qc.invalidateQueries(['kyc']);
        toast.success('KYC submitted for review!');
        setSubmitting(false);
        return;
      }
      setCurrentStep(s => s + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const FileUpload = ({ label, inputRef, accept = 'image/*,.pdf' }) => (
    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-[#00d084] hover:bg-[#00d084]/[0.02] transition-all" onClick={() => inputRef.current?.click()}>
      <Upload size={24} className="mx-auto mb-2 text-[#4a5580]" />
      <div className="text-sm font-medium mb-1">{label}</div>
      <div className="text-xs text-[#4a5580]">Click to upload JPG, PNG or PDF (max 5MB)</div>
      <input ref={inputRef} type="file" accept={accept} className="hidden" />
    </div>
  );

  const stepContent = [
    <div className="grid grid-cols-2 gap-3">
      <div><label className="inp-label">Full Name (as per PAN)</label><input className="inp" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} /></div>
      <div><label className="inp-label">Date of Birth</label><input className="inp" type="date" value={form.dob} onChange={e => setForm(p => ({ ...p, dob: e.target.value }))} /></div>
      <div><label className="inp-label">Gender</label><select className="inp" value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}><option>Male</option><option>Female</option><option>Other</option></select></div>
      <div><label className="inp-label">Annual Income</label><select className="inp">{['0-1L','1-5L','5-10L','10-25L','25L+'].map(v => <option key={v}>{v}</option>)}</select></div>
    </div>,
    <div className="space-y-4">
      <div><label className="inp-label">PAN Number</label><input className="inp uppercase tracking-widest font-mono" placeholder="ABCDE1234F" maxLength={10} value={form.pan} onChange={e => setForm(p => ({ ...p, pan: e.target.value.toUpperCase() }))} /></div>
      <FileUpload label="Upload PAN Card" inputRef={panFileRef} />
    </div>,
    <div className="space-y-4">
      <div><label className="inp-label">Aadhaar Number</label><input className="inp font-mono tracking-wider" placeholder="XXXX XXXX XXXX" maxLength={12} value={form.aadhaar} onChange={e => setForm(p => ({ ...p, aadhaar: e.target.value.replace(/\D/g, '') }))} /></div>
      <FileUpload label="Upload Aadhaar (Front)" inputRef={aadhaarFrontRef} />
      <FileUpload label="Upload Aadhaar (Back)" inputRef={aadhaarBackRef} />
    </div>,
    <div className="grid grid-cols-2 gap-3">
      <div><label className="inp-label">Bank Name</label><input className="inp" placeholder="State Bank of India" value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} /></div>
      <div><label className="inp-label">Account Number</label><input className="inp" placeholder="Enter account number" value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))} /></div>
      <div><label className="inp-label">IFSC Code</label><input className="inp uppercase font-mono" placeholder="SBIN0001234" value={form.ifscCode} onChange={e => setForm(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))} /></div>
      <div><label className="inp-label">Account Type</label><select className="inp" value={form.accountType} onChange={e => setForm(p => ({ ...p, accountType: e.target.value }))}><option value="savings">Savings</option><option value="current">Current</option></select></div>
    </div>,
    <div className="text-center py-4">
      <div className="w-32 h-32 rounded-full border-2 border-dashed border-border mx-auto mb-4 flex items-center justify-center text-5xl cursor-pointer hover:border-[#00d084] transition-colors" onClick={() => selfieRef.current?.click()}>🤳</div>
      <div className="text-sm font-medium mb-1">Upload a clear selfie</div>
      <div className="text-xs text-[#8b9cc8]">Face centered, good lighting, no glasses</div>
      <input ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden" />
    </div>,
  ];

  return (
    <div className="max-w-2xl animate-slide-up">
      <div className="card">
        {/* Stepper */}
        <div className="flex items-center mb-8">
          {KYC_STEPS.map((step, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${i < currentStep ? 'bg-[#00d084] text-[#022b1d]' : i === currentStep ? 'border-2 border-[#00d084] text-[#00d084]' : 'border border-border text-[#4a5580]'}`}>
                {i < currentStep ? '✓' : i + 1}
              </div>
              {i < KYC_STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 transition-all ${i < currentStep ? 'bg-[#00d084]' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-5">
          <div><div className="text-lg font-bold">{KYC_STEPS[currentStep]}</div><div className="text-xs text-[#8b9cc8] mt-0.5">Step {currentStep + 1} of {KYC_STEPS.length}</div></div>
          <span className="badge-gold text-xs">~5 min</span>
        </div>

        <div className="mb-6">{stepContent[currentStep]}</div>

        <div className="flex justify-between pt-4 border-t border-border">
          <button onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0} className="btn-ghost text-sm px-5 py-2.5 disabled:opacity-30">← Back</button>
          <button onClick={handleNext} disabled={submitting} className="btn-primary text-sm px-6 py-2.5">
            {submitting ? 'Saving...' : currentStep === KYC_STEPS.length - 1 ? 'Submit KYC ✓' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
}
