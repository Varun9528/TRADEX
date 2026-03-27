import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletAPI } from '../api';
import useAuthStore from '../context/authStore';
import toast from 'react-hot-toast';
import { Wallet, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle, ArrowUpRight, ArrowDownRight, CreditCard, Building, Smartphone, Landmark } from 'lucide-react';

export function WalletPage() {
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('add'); // 'add' | 'withdraw'
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  
  // Form states
  const [addAmount, setAddAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Payment details forms
  const [upiDetails, setUpiDetails] = useState({ upiId: '', accountHolderName: '' });
  const [bankDetails, setBankDetails] = useState({ 
    accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', branch: '' 
  });
  const [cardDetails, setCardDetails] = useState({ 
    cardHolderName: '', cardNumber: '', expiry: '', cvv: '' 
  });
  const [manualDetails, setManualDetails] = useState({
    accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', transactionReference: ''
  });

  // Queries
  const { data: balanceData } = useQuery({ 
    queryKey: ['wallet-balance'], 
    queryFn: () => walletAPI.getBalance() 
  });
  
  const { data: txnRes } = useQuery({ 
    queryKey: ['transactions'], 
    queryFn: () => walletAPI.getTransactions({ limit: 50 }) 
  });
  
  const { data: fundRequests } = useQuery({ 
    queryKey: ['fund-requests'], 
    queryFn: () => walletAPI.getFundRequests() 
  });
  
  const { data: withdrawRequests } = useQuery({ 
    queryKey: ['withdraw-requests'], 
    queryFn: () => walletAPI.getWithdrawRequests() 
  });

  // Mutations
  const addFundsMut = useMutation({
    mutationFn: (data) => walletAPI.fundRequest(data),
    onSuccess: (res) => {
      toast.success(`₹${parseFloat(addAmount).toLocaleString('en-IN')} added successfully!`);
      qc.invalidateQueries(['wallet-balance']);
      qc.invalidateQueries(['fund-requests']);
      setAddAmount('');
      resetPaymentForms();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add funds'),
  });

  const withdrawMut = useMutation({
    mutationFn: (data) => walletAPI.withdrawRequest(data),
    onSuccess: () => {
      toast.success('Withdrawal request submitted successfully!');
      qc.invalidateQueries(['wallet-balance']);
      qc.invalidateQueries(['withdraw-requests']);
      setWithdrawAmount('');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to withdraw'),
  });

  const balance = balanceData?.data?.data || {};
  const transactions = txnRes?.data?.data || [];
  
  // Safely normalize API responses to arrays
  const fundRequestList = Array.isArray(fundRequests?.data)
    ? fundRequests.data
    : Array.isArray(fundRequests?.data?.requests)
    ? fundRequests.data.requests
    : [];
  
  const withdrawRequestList = Array.isArray(withdrawRequests?.data)
    ? withdrawRequests.data
    : Array.isArray(withdrawRequests?.data?.requests)
    ? withdrawRequests.data.requests
    : [];
  
  const pendingFunds = fundRequestList.filter(r => r.status === 'pending').length || 0;
  const pendingWithdraws = withdrawRequestList.filter(r => r.status === 'pending').length || 0;

  const handleAddFunds = () => {
    if (!addAmount || parseFloat(addAmount) < 100) {
      toast.error('Minimum amount is ₹100');
      return;
    }

    let payload = {
      amount: parseFloat(addAmount),
      paymentMethod,
    };

    // Add payment method specific details
    switch (paymentMethod) {
      case 'UPI':
        payload = { ...payload, ...upiDetails };
        break;
      case 'Net Banking':
        payload = { ...payload, ...bankDetails };
        break;
      case 'Card':
        payload = { ...payload, ...cardDetails };
        break;
      case 'NEFT/RTGS':
      case 'Manual Transfer':
        payload = { ...payload, ...manualDetails };
        break;
      default:
        payload = { ...payload, ...upiDetails };
    }

    addFundsMut.mutate(payload);
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) < 100) {
      toast.error('Minimum withdrawal amount is ₹100');
      return;
    }

    if (parseFloat(withdrawAmount) > (balance.walletBalance || 0)) {
      toast.error('Insufficient wallet balance');
      return;
    }

    const payload = {
      amount: parseFloat(withdrawAmount),
      paymentMethod: 'UPI', // Default to UPI for simplicity
      upiId: upiDetails.upiId,
      accountHolderName: upiDetails.accountHolderName,
    };

    withdrawMut.mutate(payload);
  };

  const resetPaymentForms = () => {
    setUpiDetails({ upiId: '', accountHolderName: '' });
    setBankDetails({ accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', branch: '' });
    setCardDetails({ cardHolderName: '', cardNumber: '', expiry: '', cvv: '' });
    setManualDetails({ accountHolderName: '', bankName: '', accountNumber: '', ifscCode: '', transactionReference: '' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: Clock, label: 'Pending' },
      approved: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle, label: 'Approved' },
      rejected: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle, label: 'Rejected' },
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={12} /> {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="card p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a2a1f, #1a3a2a)', border: '1px solid rgba(0,208,132,0.2)' }}>
          <div className="flex items-center justify-between mb-2">
            <Wallet className="text-[#00d084]" size={24} />
            <span className="text-xs text-white/50">Real-time</span>
          </div>
          <div className="text-3xl font-bold text-[#00d084] mb-1">
            ₹{(balance.availableBalance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-white/60">Available Balance</div>
        </div>

        {/* Total Invested */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-blue-400" size={24} />
            <span className="text-xs text-[#4a5580]">Active Positions</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            ₹{(balance.totalInvestment || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-[#4a5580]">Total Invested</div>
        </div>

        {/* Total Profit/Loss */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-2">
            {balance.totalBalance >= balance.openingBalance ? (
              <TrendingUp className="text-green-400" size={24} />
            ) : (
              <TrendingDown className="text-red-400" size={24} />
            )}
            <span className="text-xs text-[#4a5580]">Overall P&L</span>
          </div>
          <div className={`text-3xl font-bold mb-1 ${balance.totalBalance >= balance.openingBalance ? 'text-green-400' : 'text-red-400'}`}>
            {balance.totalBalance >= balance.openingBalance ? '+' : '-'}₹{Math.abs(balance.totalBalance - balance.openingBalance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-[#4a5580]">Total Profit/Loss</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Add Funds / Withdraw Card */}
          <div className="card p-6">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveTab('add')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'add'
                    ? 'bg-[#00d084] text-black'
                    : 'bg-bg-tertiary text-[#8b9cc8] hover:text-white'
                }`}
              >
                <ArrowDownRight className="inline mr-2" size={16} />
                Add Funds
              </button>
              <button
                onClick={() => setActiveTab('withdraw')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'withdraw'
                    ? 'bg-[#00d084] text-black'
                    : 'bg-bg-tertiary text-[#8b9cc8] hover:text-white'
                }`}
              >
                <ArrowUpRight className="inline mr-2" size={16} />
                Withdraw
              </button>
            </div>

            {activeTab === 'add' ? (
              <div className="space-y-5">
                {/* Amount Input */}
                <div>
                  <label className="inp-label mb-2 block">Amount (₹)</label>
                  <input
                    className="inp text-lg font-semibold"
                    type="number"
                    placeholder="Enter amount"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    min="100"
                    max="500000"
                  />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {[1000, 5000, 10000, 25000, 50000, 100000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setAddAmount(String(amt))}
                        className="btn-ghost text-xs px-3 py-1.5 rounded-md"
                      >
                        +₹{(amt / 1000).toFixed(0)}K
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <label className="inp-label mb-3 block">Payment Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'UPI', icon: Smartphone, label: 'UPI' },
                      { id: 'Net Banking', icon: Building, label: 'Net Banking' },
                      { id: 'Card', icon: CreditCard, label: 'Debit/Credit Card' },
                      { id: 'NEFT/RTGS', icon: Landmark, label: 'NEFT/RTGS' },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`p-4 rounded-lg border transition-all text-left ${
                          paymentMethod === method.id
                            ? 'border-[#00d084] bg-[#00d084]/10'
                            : 'border-border bg-bg-tertiary hover:border-[#00d084]/50'
                        }`}
                      >
                        <method.icon size={20} className="mb-2 text-[#00d084]" />
                        <div className="text-sm font-medium text-white">{method.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Payment Form */}
                {paymentMethod === 'UPI' && (
                  <div className="space-y-3 p-4 rounded-lg bg-bg-tertiary">
                    <div>
                      <label className="inp-label text-xs">UPI ID</label>
                      <input
                        className="inp text-sm"
                        type="text"
                        placeholder="example@upi"
                        value={upiDetails.upiId}
                        onChange={(e) => setUpiDetails({ ...upiDetails, upiId: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="inp-label text-xs">Account Holder Name</label>
                      <input
                        className="inp text-sm"
                        type="text"
                        placeholder="Full Name"
                        value={upiDetails.accountHolderName}
                        onChange={(e) => setUpiDetails({ ...upiDetails, accountHolderName: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'Net Banking' && (
                  <div className="space-y-3 p-4 rounded-lg bg-bg-tertiary">
                    <div>
                      <label className="inp-label text-xs">Account Holder Name</label>
                      <input
                        className="inp text-sm"
                        type="text"
                        placeholder="Full Name"
                        value={bankDetails.accountHolderName}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="inp-label text-xs">Bank Name</label>
                      <input
                        className="inp text-sm"
                        type="text"
                        placeholder="HDFC Bank"
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="inp-label text-xs">Account Number</label>
                        <input
                          className="inp text-sm"
                          type="text"
                          placeholder="1234567890"
                          value={bankDetails.accountNumber}
                          onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="inp-label text-xs">IFSC Code</label>
                        <input
                          className="inp text-sm"
                          type="text"
                          placeholder="HDFC0001234"
                          value={bankDetails.ifscCode}
                          onChange={(e) => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {paymentMethod === 'Card' && (
                  <div className="space-y-3 p-4 rounded-lg bg-bg-tertiary">
                    <div>
                      <label className="inp-label text-xs">Card Holder Name</label>
                      <input
                        className="inp text-sm"
                        type="text"
                        placeholder="Name on card"
                        value={cardDetails.cardHolderName}
                        onChange={(e) => setCardDetails({ ...cardDetails, cardHolderName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="inp-label text-xs">Card Number</label>
                      <input
                        className="inp text-sm"
                        type="text"
                        placeholder="1234 5678 9012 3456"
                        value={cardDetails.cardNumber}
                        onChange={(e) => setCardDetails({ ...cardDetails, cardNumber: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="inp-label text-xs">Expiry Date</label>
                        <input
                          className="inp text-sm"
                          type="text"
                          placeholder="MM/YY"
                          value={cardDetails.expiry}
                          onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="inp-label text-xs">CVV</label>
                        <input
                          className="inp text-sm"
                          type="password"
                          placeholder="123"
                          maxLength="3"
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(paymentMethod === 'NEFT/RTGS' || paymentMethod === 'Manual Transfer') && (
                  <div className="space-y-3 p-4 rounded-lg bg-bg-tertiary">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-3">
                      <div className="text-xs text-blue-400">
                        <strong>Bank Details for Transfer:</strong>
                        <br />
                        Account: XXXXXXXX1234
                        <br />
                        IFSC: HDFC0001234
                        <br />
                        Bank: HDFC Bank
                        <br />
                        <strong className="mt-2 block">⚠️ Add transaction reference after payment</strong>
                      </div>
                    </div>
                    <div>
                      <label className="inp-label text-xs">Transaction Reference/UTR</label>
                      <input
                        className="inp text-sm"
                        type="text"
                        placeholder="e.g., UTR number"
                        value={manualDetails.transactionReference}
                        onChange={(e) => setManualDetails({ ...manualDetails, transactionReference: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  onClick={handleAddFunds}
                  disabled={!addAmount || parseFloat(addAmount) < 100 || addFundsMut.isPending}
                  className="btn-primary w-full py-3.5 text-sm disabled:opacity-50"
                >
                  {addFundsMut.isPending ? 'Processing...' : `Proceed to Pay ₹${parseFloat(addAmount || 0).toLocaleString('en-IN')}`}
                </button>

                <div className="text-center text-xs text-[#4a5580]">
                  🔒 Secure Payment • Min ₹100 • Max ₹5,00,000
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Amount Input */}
                <div>
                  <label className="inp-label mb-2 block">Withdrawal Amount (₹)</label>
                  <input
                    className="inp text-lg font-semibold"
                    type="number"
                    placeholder="Enter amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="100"
                    max={balance.walletBalance || 0}
                  />
                </div>

                {/* Available Balance Display */}
                <div className="bg-bg-tertiary rounded-lg p-4 flex justify-between items-center">
                  <span className="text-sm text-[#8b9cc8]">Available Balance</span>
                  <span className="text-lg font-bold text-[#00d084]">
                    ₹{(balance.walletBalance || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                {/* UPI Details for Withdrawal */}
                <div className="space-y-3 p-4 rounded-lg bg-bg-tertiary">
                  <div>
                    <label className="inp-label text-xs">UPI ID (for receiving funds)</label>
                    <input
                      className="inp text-sm"
                      type="text"
                      placeholder="yourname@upi"
                      value={upiDetails.upiId}
                      onChange={(e) => setUpiDetails({ ...upiDetails, upiId: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="inp-label text-xs">Account Holder Name</label>
                    <input
                      className="inp text-sm"
                      type="text"
                      placeholder="Full Name"
                      value={upiDetails.accountHolderName}
                      onChange={(e) => setUpiDetails({ ...upiDetails, accountHolderName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-amber-400 mt-0.5" size={18} />
                    <div className="text-xs text-amber-400">
                      <strong>Withdrawal Information:</strong>
                      <ul className="mt-2 space-y-1">
                        <li>• Minimum withdrawal: ₹100</li>
                        <li>• Processing time: Within 24 hours</li>
                        <li>• Ensure UPI ID is correct</li>
                        <li>• KYC must be completed</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleWithdraw}
                  disabled={!withdrawAmount || parseFloat(withdrawAmount) < 100 || withdrawMut.isPending}
                  className="btn-primary w-full py-3.5 text-sm disabled:opacity-50"
                >
                  {withdrawMut.isPending ? 'Processing...' : `Request Withdrawal of ₹${parseFloat(withdrawAmount || 0).toLocaleString('en-IN')}`}
                </button>
              </div>
            )}
          </div>

          {/* Pending Requests Status */}
          {(pendingFunds > 0 || pendingWithdraws > 0) && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4">Pending Requests</h3>
              <div className="space-y-3">
                {pendingFunds > 0 && (
                  <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="text-amber-400" size={18} />
                      <span className="text-sm text-amber-400">{pendingFunds} Fund Request(s) Pending</span>
                    </div>
                    <span className="text-xs text-amber-400">Under Review</span>
                  </div>
                )}
                {pendingWithdraws > 0 && (
                  <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="text-amber-400" size={18} />
                      <span className="text-sm text-amber-400">{pendingWithdraws} Withdrawal Request(s) Pending</span>
                    </div>
                    <span className="text-xs text-amber-400">Processing</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Transaction History */}
        <div className="lg:col-span-1">
          <div className="card p-5 h-fit">
            <h3 className="text-sm font-semibold mb-4">Recent Transactions</h3>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-[#4a5580] text-sm">No transactions yet</div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {transactions.slice(0, 20).map((txn) => (
                  <div key={txn._id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${txn.type === 'CREDIT' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {txn.type === 'CREDIT' ? (
                          <ArrowDownRight className="text-green-400" size={16} />
                        ) : (
                          <ArrowUpRight className="text-red-400" size={16} />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-medium text-white truncate max-w-[150px]">
                          {txn.description?.split('.')[0]}
                        </div>
                        <div className="text-[10px] text-[#4a5580]">
                          {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs font-bold ${txn.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                      {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default WalletPage;
