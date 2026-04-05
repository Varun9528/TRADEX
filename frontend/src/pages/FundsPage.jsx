import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletAPI } from '../api';
import toast from 'react-hot-toast';
import BottomNav from '../components/BottomNav';
import { Plus, Minus, TrendingUp, Clock, CheckCircle, XCircle, Upload } from 'lucide-react';

export default function FundsPage() {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [actionType, setActionType] = useState('add'); // add or withdraw
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [transactionRef, setTransactionRef] = useState('');
  
  // Withdraw fields
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  const { data: balanceData, isLoading: balanceLoading } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const { data } = await walletAPI.getBalance();
      return data.data;
    },
  });

  // Fund request mutation
  const addFundsMutation = useMutation({
    mutationFn: async (fundData) => {
      console.log('[FundsPage] Submitting fund request:', fundData);
      const { data } = await walletAPI.fundRequest(fundData);
      console.log('[FundsPage] Fund request response:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('Fund request submitted! Admin will approve soon.');
      setAmount('');
      setTransactionRef('');
      queryClient.invalidateQueries(['fund-requests']);
    },
    onError: (err) => {
      console.error('[FundsPage] Fund request error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit fund request');
    },
  });

  // Withdraw request mutation
  const withdrawMutation = useMutation({
    mutationFn: async (withdrawData) => {
      console.log('[FundsPage] Submitting withdraw request:', withdrawData);
      const { data } = await walletAPI.withdrawRequest(withdrawData);
      console.log('[FundsPage] Withdraw request response:', data);
      return data;
    },
    onSuccess: () => {
      toast.success('Withdrawal request submitted! Admin will process it soon.');
      setAmount('');
      setAccountNumber('');
      setIfscCode('');
      setUpiId('');
      queryClient.invalidateQueries(['withdraw-requests']);
      queryClient.invalidateQueries(['wallet-balance']);
    },
    onError: (err) => {
      console.error('[FundsPage] Withdraw request error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit withdrawal request');
    },
  });

  // Get fund requests history
  const { data: fundRequests } = useQuery({
    queryKey: ['fund-requests'],
    queryFn: async () => {
      const { data } = await walletAPI.getFundRequests();
      return data.data || [];
    },
  });

  // Get withdraw requests history
  const { data: withdrawRequests } = useQuery({
    queryKey: ['withdraw-requests'],
    queryFn: async () => {
      const { data } = await walletAPI.getWithdrawRequests();
      return data.data || [];
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (actionType === 'add') {
      if (!transactionRef) {
        toast.error('Transaction reference is required');
        return;
      }
      addFundsMutation.mutate({
        amount: parseFloat(amount),
        paymentMethod,
        transactionReference: transactionRef,
      });
    } else {
      if (paymentMethod === 'UPI' && !upiId) {
        toast.error('UPI ID is required');
        return;
      }
      if (paymentMethod === 'Bank Transfer' && (!accountNumber || !ifscCode)) {
        toast.error('Bank details are required');
        return;
      }
      
      withdrawMutation.mutate({
        amount: parseFloat(amount),
        paymentMethod,
        bankName: paymentMethod === 'Bank Transfer' ? bankName : undefined,
        accountNumber: paymentMethod === 'Bank Transfer' ? accountNumber : undefined,
        ifscCode: paymentMethod === 'Bank Transfer' ? ifscCode : undefined,
        upiId: paymentMethod === 'UPI' ? upiId : undefined,
      });
    }
  };

  const balance = balanceData?.balance || 0;
  const availableBalance = balanceData?.availableBalance || balanceData?.walletBalance || 0;
  const usedMargin = balanceData?.usedMargin || 0;

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="flex items-center gap-1 text-xs font-medium text-green-400"><CheckCircle size={12} /> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-xs font-medium text-red-400"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="flex items-center gap-1 text-xs font-medium text-yellow-400"><Clock size={12} /> Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary pb-24 md:pb-4">
      {/* Header */}
      <div className="bg-bg-secondary border-b border-border px-3 md:px-4 py-3 sticky top-0 z-10 safe-area-top">
        <h1 className="text-lg md:text-xl font-bold text-text-primary">Funds</h1>
      </div>

      {/* Balance Summary Cards */}
      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        {/* Total Balance Card */}
        <div className="bg-gradient-to-r from-brand-blue to-blue-600 rounded-lg p-4 md:p-6 text-white shadow-lg">
          <div className="text-sm md:text-base opacity-90 mb-1">Total Balance</div>
          <div className="text-3xl md:text-4xl font-bold mb-3">
            ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm opacity-90">
            <TrendingUp size={16} />
            <span>Available: ₹{availableBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Balance Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
            <div className="text-xs text-text-secondary mb-1">Available Cash</div>
            <div className="text-lg md:text-xl font-bold text-text-primary">
              ₹{availableBalance.toLocaleString()}
            </div>
          </div>
          <div className="bg-bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
            <div className="text-xs text-text-secondary mb-1">Used Margin</div>
            <div className="text-lg md:text-xl font-bold text-accent-red">
              ₹{usedMargin.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Request Form */}
        <div className="bg-bg-card rounded-lg p-4 md:p-5 shadow-sm border border-border">
          <h3 className="font-semibold text-base md:text-lg mb-4 text-text-primary">
            {actionType === 'add' ? 'Add Funds Request' : 'Withdraw Funds Request'}
          </h3>

          {/* Action Type Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActionType('add')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                actionType === 'add'
                  ? 'bg-brand-green text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary border border-border'
              }`}
            >
              <Plus size={18} />
              Add
            </button>
            <button
              onClick={() => setActionType('withdraw')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                actionType === 'withdraw'
                  ? 'bg-accent-red text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-secondary border border-border'
              }`}
            >
              <Minus size={18} />
              Withdraw
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-lg text-text-primary outline-none"
                min="100"
                step="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none"
              >
                {actionType === 'add' ? (
                  <>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="QR Payment">QR Payment</option>
                  </>
                ) : (
                  <>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </>
                )}
              </select>
            </div>

            {actionType === 'add' ? (
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Transaction Reference / UTR Number
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="Enter transaction reference"
                  className="w-full px-4 py-3 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none"
                />
                <p className="text-xs text-text-muted mt-1">
                  After initiating payment, enter the UTR/Reference number
                </p>
              </div>
            ) : (
              <>
                {paymentMethod === 'UPI' ? (
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="example@upi"
                      className="w-full px-4 py-3 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none"
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g., HDFC Bank"
                        className="w-full px-4 py-3 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Enter account number"
                        className="w-full px-4 py-3 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-2">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        placeholder="e.g., HDFC0001234"
                        className="w-full px-4 py-3 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={addFundsMutation.isPending || withdrawMutation.isPending}
              className={`w-full py-3 rounded-lg font-semibold text-white text-base transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                actionType === 'add'
                  ? 'bg-brand-green hover:bg-brand-green-dark'
                  : 'bg-accent-red hover:opacity-90'
              }`}
            >
              {addFundsMutation.isPending || withdrawMutation.isPending 
                ? 'Submitting...' 
                : actionType === 'add' 
                  ? 'Submit Fund Request' 
                  : 'Submit Withdrawal Request'}
            </button>

            {/* Info Text */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-xs text-blue-300">
                {actionType === 'add' 
                  ? '💡 Funds will be credited after admin approval (usually within 24 hours)'
                  : '💡 Withdrawals are processed within 1-2 business days after approval'}
              </p>
            </div>
          </form>
        </div>

        {/* Fund Requests History */}
        {fundRequests && fundRequests.length > 0 && (
          <div className="bg-bg-card rounded-lg p-4 md:p-5 shadow-sm border border-border">
            <h3 className="font-semibold text-base md:text-lg mb-3 text-text-primary">
              Fund Request History
            </h3>
            <div className="space-y-2">
              {fundRequests.slice(0, 5).map((req) => (
                <div key={req._id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg border border-border">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">₹{req.amount.toLocaleString()}</div>
                    <div className="text-xs text-text-secondary">{req.paymentMethod} • {new Date(req.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>{getStatusBadge(req.status)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Withdraw Requests History */}
        {withdrawRequests && withdrawRequests.length > 0 && (
          <div className="bg-bg-card rounded-lg p-4 md:p-5 shadow-sm border border-border">
            <h3 className="font-semibold text-base md:text-lg mb-3 text-text-primary">
              Withdrawal Request History
            </h3>
            <div className="space-y-2">
              {withdrawRequests.slice(0, 5).map((req) => (
                <div key={req._id} className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg border border-border">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">₹{req.amount.toLocaleString()}</div>
                    <div className="text-xs text-text-secondary">{req.paymentMethod} • {new Date(req.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div>{getStatusBadge(req.status)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
