import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletAPI } from '../../api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, AlertCircle, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function AdminWallet() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('fund-requests'); // 'fund-requests' | 'withdraw-requests' | 'transactions'
  
  // Fetch data
  const { data: fundRequestsRes, isLoading: loadingFunds } = useQuery({
    queryKey: ['admin-fund-requests'],
    queryFn: () => Promise.all([
      walletAPI.getFundRequests(),
    ]).then(([res]) => res.data),
  });
  
  const { data: withdrawRequestsRes, isLoading: loadingWithdraws } = useQuery({
    queryKey: ['admin-withdraw-requests'],
    queryFn: () => walletAPI.getWithdrawRequests().then(res => res.data),
  });
  
  const { data: transactionsRes, isLoading: loadingTxns } = useQuery({
    queryKey: ['admin-transactions'],
    queryFn: () => walletAPI.getTransactions({ limit: 50 }).then(res => res.data),
  });

  // Mutations
  const approveFundMut = useMutation({
    mutationFn: (id) => walletAPI.approveFundRequest(id),
    onSuccess: () => {
      toast.success('Fund request approved successfully');
      qc.invalidateQueries(['admin-fund-requests']);
      qc.invalidateQueries(['wallet-balance']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
  });

  const rejectFundMut = useMutation({
    mutationFn: ({ id, reason }) => walletAPI.rejectFundRequest(id, reason),
    onSuccess: () => {
      toast.success('Fund request rejected');
      qc.invalidateQueries(['admin-fund-requests']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
  });

  const approveWithdrawMut = useMutation({
    mutationFn: (id) => walletAPI.approveWithdrawRequest(id),
    onSuccess: () => {
      toast.success('Withdrawal approved successfully');
      qc.invalidateQueries(['admin-withdraw-requests']);
      qc.invalidateQueries(['wallet-balance']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
  });

  const rejectWithdrawMut = useMutation({
    mutationFn: ({ id, reason }) => walletAPI.rejectWithdrawRequest(id, reason),
    onSuccess: () => {
      toast.success('Withdrawal rejected. Amount unblocked.');
      qc.invalidateQueries(['admin-withdraw-requests']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
  });

  const fundRequests = Array.isArray(fundRequestsRes?.data) 
    ? fundRequestsRes.data 
    : [];
  const withdrawRequests = Array.isArray(withdrawRequestsRes?.data) 
    ? withdrawRequestsRes.data 
    : [];
  const transactions = Array.isArray(transactionsRes?.data) 
    ? transactionsRes.data 
    : [];

  const pendingFunds = fundRequests.filter(r => r.status === 'pending');
  const pendingWithdraws = withdrawRequests.filter(r => r.status === 'pending');

  const handleApproveFund = (id) => {
    if (window.confirm('Are you sure you want to approve this fund request?')) {
      approveFundMut.mutate(id);
    }
  };

  const handleRejectFund = (id) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      rejectFundMut.mutate({ id, reason });
    }
  };

  const handleApproveWithdraw = (id) => {
    if (window.confirm('Are you sure you want to approve this withdrawal? Amount will be deducted from user wallet.')) {
      approveWithdrawMut.mutate(id);
    }
  };

  const handleRejectWithdraw = (id) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      rejectWithdrawMut.mutate({ id, reason });
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-amber-400">
          <div className="flex items-center justify-between mb-2">
            <Clock className="text-amber-400" size={24} />
            <span className="text-xs text-[#4a5580]">Pending Approval</span>
          </div>
          <div className="text-3xl font-bold text-white">{pendingFunds.length}</div>
          <div className="text-xs text-[#4a5580]">Fund Requests</div>
        </div>

        <div className="card p-5 border-l-4 border-blue-400">
          <div className="flex items-center justify-between mb-2">
            <ArrowUpRight className="text-blue-400" size={24} />
            <span className="text-xs text-[#4a5580]">Pending Processing</span>
          </div>
          <div className="text-3xl font-bold text-white">{pendingWithdraws.length}</div>
          <div className="text-xs text-[#4a5580]">Withdrawal Requests</div>
        </div>

        <div className="card p-5 border-l-4 border-green-400">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="text-green-400" size={24} />
            <span className="text-xs text-[#4a5580]">Total Transactions</span>
          </div>
          <div className="text-3xl font-bold text-white">{transactions.length}</div>
          <div className="text-xs text-[#4a5580]">All Time</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-bg-tertiary p-1 rounded-lg">
        {[
          { id: 'fund-requests', label: 'Fund Requests', count: pendingFunds.length },
          { id: 'withdraw-requests', label: 'Withdraw Requests', count: pendingWithdraws.length },
          { id: 'transactions', label: 'Transactions' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#00d084] text-black'
                : 'text-[#8b9cc8] hover:text-white'
            }`}
          >
            {tab.label} {tab.count !== undefined && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Fund Requests Tab */}
      {activeTab === 'fund-requests' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border font-semibold text-sm flex items-center justify-between">
            <span>Fund Requests ({fundRequests.length})</span>
            <span className="text-xs text-[#4a5580] font-normal">Manage user fund additions</span>
          </div>
          
          {loadingFunds ? (
            <div className="p-8 text-center text-[#4a5580]">Loading...</div>
          ) : fundRequests.length === 0 ? (
            <div className="p-8 text-center text-[#4a5580] text-sm">No fund requests yet</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Reference/Details</th>
                  <th>Status</th>
                  <th>Requested At</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {fundRequests.map((request) => (
                  <tr key={request._id}>
                    <td>
                      <div className="text-xs font-medium">{request.user?.fullName}</div>
                      <div className="text-[10px] text-[#4a5580]">{request.user?.email}</div>
                    </td>
                    <td>
                      <span className="font-semibold text-sm text-[#00d084]">
                        ₹{request.amount?.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span className="badge-gray text-xs">{request.paymentMethod}</span>
                    </td>
                    <td className="max-w-xs">
                      <div className="text-xs text-[#8b9cc8] truncate">
                        {request.transactionReference || request.upiId || request.accountNumber || 'N/A'}
                      </div>
                    </td>
                    <td>
                      <span className={`text-[10px] px-2 py-1 rounded-full ${
                        request.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                        request.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {request.status === 'approved' ? '✓ Approved' :
                         request.status === 'rejected' ? '✕ Rejected' :
                         '⏳ Pending'}
                      </span>
                    </td>
                    <td className="text-xs text-[#4a5580]">
                      {new Date(request.createdAt).toLocaleDateString('en-IN', { 
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="text-right">
                      {request.status === 'pending' && (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleApproveFund(request._id)}
                            disabled={approveFundMut.isPending}
                            className="text-xs px-3 py-1.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => handleRejectFund(request._id)}
                            disabled={rejectFundMut.isPending}
                            className="text-xs px-3 py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                      {request.status !== 'pending' && (
                        <span className="text-xs text-[#4a5580]">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Withdraw Requests Tab */}
      {activeTab === 'withdraw-requests' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border font-semibold text-sm flex items-center justify-between">
            <span>Withdrawal Requests ({withdrawRequests.length})</span>
            <span className="text-xs text-[#4a5580] font-normal">Process user withdrawals</span>
          </div>
          
          {loadingWithdraws ? (
            <div className="p-8 text-center text-[#4a5580]">Loading...</div>
          ) : withdrawRequests.length === 0 ? (
            <div className="p-8 text-center text-[#4a5580] text-sm">No withdrawal requests yet</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Payment Details</th>
                  <th>Status</th>
                  <th>Requested At</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {withdrawRequests.map((request) => (
                  <tr key={request._id}>
                    <td>
                      <div className="text-xs font-medium">{request.user?.fullName}</div>
                      <div className="text-[10px] text-[#4a5580]">{request.user?.email}</div>
                    </td>
                    <td>
                      <span className="font-semibold text-sm text-[#ff4f6a]">
                        ₹{request.amount?.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td>
                      <span className="badge-gray text-xs">{request.paymentMethod}</span>
                    </td>
                    <td className="max-w-xs">
                      <div className="text-xs text-[#8b9cc8] truncate">
                        {request.paymentMethod === 'UPI' ? (
                          <div>UPI: {request.upiId}</div>
                        ) : (
                          <div>{request.bankName} •••{request.accountNumber?.slice(-4)}</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`text-[10px] px-2 py-1 rounded-full ${
                        request.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                        request.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                        'bg-amber-500/10 text-amber-400'
                      }`}>
                        {request.status === 'approved' ? '✓ Approved' :
                         request.status === 'rejected' ? '✕ Rejected' :
                         '⏳ Pending'}
                      </span>
                    </td>
                    <td className="text-xs text-[#4a5580]">
                      {new Date(request.createdAt).toLocaleDateString('en-IN', { 
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                    <td className="text-right">
                      {request.status === 'pending' && (
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => handleApproveWithdraw(request._id)}
                            disabled={approveWithdrawMut.isPending}
                            className="text-xs px-3 py-1.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={14} />
                          </button>
                          <button
                            onClick={() => handleRejectWithdraw(request._id)}
                            disabled={rejectWithdrawMut.isPending}
                            className="text-xs px-3 py-1.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                            title="Reject"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      )}
                      {request.status !== 'pending' && (
                        <span className="text-xs text-[#4a5580]">
                          {request.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-border font-semibold text-sm flex items-center justify-between">
            <span>All Transactions ({transactions.length})</span>
            <span className="text-xs text-[#4a5580] font-normal">Complete transaction history</span>
          </div>
          
          {loadingTxns ? (
            <div className="p-8 text-center text-[#4a5580]">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-center text-[#4a5580] text-sm">No transactions yet</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn._id}>
                    <td>
                      <div className="text-xs font-medium">{txn.user?.fullName}</div>
                      <div className="text-[10px] text-[#4a5580]">{txn.user?.email}</div>
                    </td>
                    <td>
                      <span className={`text-[10px] px-2 py-1 rounded-full ${
                        txn.type === 'CREDIT' ? 'bg-green-500/10 text-green-400' :
                        txn.type === 'DEBIT' ? 'bg-red-500/10 text-red-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="max-w-xs">
                      <div className="text-xs text-[#8b9cc8] truncate">{txn.description}</div>
                    </td>
                    <td>
                      <span className={`text-sm font-bold ${
                        txn.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount?.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="text-xs text-[#4a5580]">
                      {new Date(txn.createdAt).toLocaleDateString('en-IN', { 
                        day: '2-digit', month: 'short', year: 'numeric' 
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminWallet;
