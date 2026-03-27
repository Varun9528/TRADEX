import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, User, Calendar, Banknote } from 'lucide-react';

export default function AdminWithdrawRequests() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');

  const { data: withdrawRequests, isLoading } = useQuery({
    queryKey: ['admin-withdraw-requests', statusFilter],
    queryFn: async () => {
      const { data } = await adminAPI.getWithdrawRequests({ status: statusFilter });
      return data.data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await adminAPI.approveWithdrawRequest(id);
      return data;
    },
    onSuccess: () => {
      toast.success('Withdrawal request approved successfully');
      queryClient.invalidateQueries(['admin-withdraw-requests']);
      queryClient.invalidateQueries(['admin-dashboard']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await adminAPI.rejectWithdrawRequest(id);
      return data;
    },
    onSuccess: () => {
      toast.success('Withdrawal request rejected');
      queryClient.invalidateQueries(['admin-withdraw-requests']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    },
  });

  const handleApprove = (id) => {
    if (window.confirm('Are you sure you want to approve this withdrawal request?')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id) => {
    if (window.confirm('Are you sure you want to reject this withdrawal request?')) {
      rejectMutation.mutate(id);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved':
        return <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full"><CheckCircle size={12} /> Approved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-full"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full"><Clock size={12} /> Pending</span>;
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary pb-20 md:pb-4">
      {/* Header */}
      <div className="bg-bg-secondary border-b border-border px-3 md:px-4 py-3 sticky top-0 z-10 safe-area-top">
        <h1 className="text-lg md:text-xl font-bold text-text-primary">Withdrawal Requests</h1>
      </div>

      {/* Filters */}
      <div className="p-3 md:p-4">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-brand-blue text-white'
                  : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary border border-border'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        {withdrawRequests && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
              <div className="text-xs text-text-secondary mb-1">Total Amount</div>
              <div className="text-lg md:text-xl font-bold text-text-primary">
                ₹{withdrawRequests.reduce((sum, req) => sum + req.amount, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
              <div className="text-xs text-text-secondary mb-1">Total Requests</div>
              <div className="text-lg md:text-xl font-bold text-text-primary">
                {withdrawRequests.length}
              </div>
            </div>
          </div>
        )}

        {/* Requests List */}
        {isLoading ? (
          <div className="text-center py-8 text-text-secondary">Loading...</div>
        ) : withdrawRequests && withdrawRequests.length > 0 ? (
          <div className="space-y-3">
            {withdrawRequests.map((req) => (
              <div key={req._id} className="bg-bg-card rounded-lg p-4 shadow-sm border border-border">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center flex-shrink-0">
                      <Banknote size={20} className="text-accent-red" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-text-primary">{req.user?.fullName || 'N/A'}</div>
                      <div className="text-xs text-text-secondary">{req.user?.email}</div>
                      <div className="text-xs text-text-secondary">{req.user?.clientId}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-accent-red">₹{req.amount.toLocaleString()}</div>
                    <div className="text-xs text-text-secondary">{getStatusBadge(req.status)}</div>
                  </div>
                </div>

                <div className="mb-3 text-sm">
                  <div className="text-text-secondary text-xs mb-1">Payment Method</div>
                  <div className="text-text-primary font-medium">{req.paymentMethod}</div>
                </div>

                {/* Bank Details */}
                <div className="bg-bg-tertiary rounded-lg p-3 mb-3 border border-border">
                  <div className="text-xs text-text-secondary mb-2">Bank Details</div>
                  {req.paymentMethod === 'UPI' ? (
                    <div className="text-sm text-text-primary">
                      <div className="mb-1">UPI ID: <span className="font-mono">{req.upiId}</span></div>
                    </div>
                  ) : (
                    <div className="text-sm text-text-primary space-y-1">
                      <div>Bank: <span className="font-medium">{req.bankName}</span></div>
                      <div>Account: <span className="font-mono">{req.accountNumber}</span></div>
                      <div>IFSC: <span className="font-mono">{req.ifscCode}</span></div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
                  <Calendar size={12} />
                  <span>{new Date(req.createdAt).toLocaleString()}</span>
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-2 pt-3 border-t border-border">
                    <button
                      onClick={() => handleApprove(req._id)}
                      disabled={approveMutation.isPending}
                      className="flex-1 bg-brand-green hover:bg-brand-green-dark text-white py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(req._id)}
                      disabled={rejectMutation.isPending}
                      className="flex-1 bg-accent-red hover:opacity-90 text-white py-2 rounded-lg font-medium text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <XCircle size={16} />
                      Reject
                    </button>
                  </div>
                )}

                {req.status === 'approved' && req.approvedBy && (
                  <div className="text-xs text-text-secondary pt-3 border-t border-border">
                    Approved by: {req.approvedBy?.fullName || 'Admin'} • {new Date(req.approvedAt).toLocaleString()}
                  </div>
                )}

                {req.status === 'rejected' && req.rejectionReason && (
                  <div className="text-xs text-accent-red pt-3 border-t border-border">
                    Reason: {req.rejectionReason}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-secondary">
            No withdrawal requests found
          </div>
        )}
      </div>
    </div>
  );
}
