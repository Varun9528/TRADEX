import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, IndianRupee, User, Calendar, CreditCard, Building, Hash } from 'lucide-react';

export default function AdminFundRequests() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');

  const { data: fundRequests, isLoading } = useQuery({
    queryKey: ['admin-fund-requests', statusFilter],
    queryFn: async () => {
      const { data } = await adminAPI.getFundRequests({ status: statusFilter });
      return data.data || [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await adminAPI.approveFundRequest(id);
      return data;
    },
    onSuccess: () => {
      toast.success('Fund request approved successfully');
      queryClient.invalidateQueries(['admin-fund-requests']);
      queryClient.invalidateQueries(['admin-dashboard']);
      queryClient.invalidateQueries(['wallet']);
      queryClient.invalidateQueries(['notifications']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }) => {
      const { data } = await adminAPI.rejectFundRequest(id, { reason });
      return data;
    },
    onSuccess: () => {
      toast.success('Fund request rejected');
      queryClient.invalidateQueries(['admin-fund-requests']);
      queryClient.invalidateQueries(['notifications']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    },
  });

  const handleApprove = (id) => {
    if (window.confirm('Are you sure you want to approve this fund request?')) {
      approveMutation.mutate(id);
    }
  };

  const handleReject = (id) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason !== null) {
      rejectMutation.mutate({ id, reason });
    }
  };

  const getStatusBadge = (status) => {
    switch(status?.toUpperCase()) {
      case 'APPROVED':
        return <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full"><CheckCircle size={12} /> Approved</span>;
      case 'REJECTED':
        return <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-full"><XCircle size={12} /> Rejected</span>;
      default:
        return <span className="flex items-center gap-1 text-xs font-medium text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full"><Clock size={12} /> Pending</span>;
    }
  };

  const renderPaymentDetails = (req) => {
    const details = [];
    
    if (req.paymentMethod) {
      details.push(
        <div key="method">
          <div className="text-text-secondary text-xs mb-1 flex items-center gap-1">
            <CreditCard size={12} /> Payment Method
          </div>
          <div className="text-text-primary font-medium">{req.paymentMethod}</div>
        </div>
      );
    }

    if (req.upiId) {
      details.push(
        <div key="upi">
          <div className="text-text-secondary text-xs mb-1">UPI ID</div>
          <div className="text-text-primary font-mono text-sm">{req.upiId}</div>
        </div>
      );
    }

    if (req.bankName) {
      details.push(
        <div key="bank">
          <div className="text-text-secondary text-xs mb-1 flex items-center gap-1">
            <Building size={12} /> Bank Name
          </div>
          <div className="text-text-primary font-medium">{req.bankName}</div>
        </div>
      );
    }

    if (req.accountNumber) {
      details.push(
        <div key="account">
          <div className="text-text-secondary text-xs mb-1">Account Number</div>
          <div className="text-text-primary font-mono text-sm">{req.accountNumber}</div>
        </div>
      );
    }

    if (req.ifscCode) {
      details.push(
        <div key="ifsc">
          <div className="text-text-secondary text-xs mb-1">IFSC Code</div>
          <div className="text-text-primary font-mono text-sm">{req.ifscCode}</div>
        </div>
      );
    }

    if (req.cardNumber) {
      details.push(
        <div key="card">
          <div className="text-text-secondary text-xs mb-1">Card Number</div>
          <div className="text-text-primary font-mono text-sm">{req.cardNumber}</div>
        </div>
      );
    }

    if (req.transactionReference) {
      details.push(
        <div key="ref">
          <div className="text-text-secondary text-xs mb-1 flex items-center gap-1">
            <Hash size={12} /> Transaction Reference
          </div>
          <div className="text-text-primary font-mono text-sm">{req.transactionReference}</div>
        </div>
      );
    }

    return details;
  };

  return (
    <div className="min-h-screen bg-bg-primary pb-24 md:pb-4">
      {/* Header */}
      <div className="bg-bg-secondary border-b border-border px-3 md:px-4 py-3 sticky top-0 z-10 safe-area-top">
        <h1 className="text-lg md:text-xl font-bold text-text-primary">Fund Requests</h1>
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
        {fundRequests && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
              <div className="text-xs text-text-secondary mb-1">Total Amount</div>
              <div className="text-lg md:text-xl font-bold text-text-primary">
                ₹{fundRequests.reduce((sum, req) => sum + req.amount, 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-bg-card rounded-lg p-3 md:p-4 shadow-sm border border-border">
              <div className="text-xs text-text-secondary mb-1">Total Requests</div>
              <div className="text-lg md:text-xl font-bold text-text-primary">
                {fundRequests.length}
              </div>
            </div>
          </div>
        )}

        {/* Requests List */}
        {isLoading ? (
          <div className="text-center py-8 text-text-secondary">Loading...</div>
        ) : fundRequests && fundRequests.length > 0 ? (
          <div className="space-y-3">
            {fundRequests.map((req) => (
              <div key={req._id} className="bg-bg-card rounded-lg p-4 shadow-sm border border-border">
                {/* User Info & Amount */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-brand-blue/20 flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-brand-blue" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-text-primary truncate">{req.user?.fullName || 'N/A'}</div>
                      <div className="text-xs text-text-secondary truncate">{req.user?.email}</div>
                      {req.user?.clientId && (
                        <div className="text-xs text-text-secondary">ID: {req.user.clientId}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-xl font-bold text-brand-green">₹{req.amount.toLocaleString()}</div>
                    <div className="mt-1">{getStatusBadge(req.status)}</div>
                  </div>
                </div>

                {/* Payment Details Grid */}
                <div className="bg-bg-tertiary rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {renderPaymentDetails(req)}
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
                  <Calendar size={12} />
                  <span>{new Date(req.createdAt).toLocaleString()}</span>
                </div>

                {/* Action Buttons */}
                {req.status?.toUpperCase() === 'PENDING' && (
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

                {/* Approval Info */}
                {req.status?.toUpperCase() === 'APPROVED' && req.approvedBy && (
                  <div className="text-xs text-text-secondary pt-3 border-t border-border">
                    Approved by: {req.approvedBy?.fullName || 'Admin'} • {new Date(req.approvedAt).toLocaleString()}
                  </div>
                )}

                {/* Rejection Reason */}
                {req.status?.toUpperCase() === 'REJECTED' && req.adminNotes && (
                  <div className="text-xs text-accent-red pt-3 border-t border-border">
                    <div className="font-medium mb-1">Rejection Reason:</div>
                    {req.adminNotes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-secondary">
            No fund requests found
          </div>
        )}
      </div>
    </div>
  );
}
