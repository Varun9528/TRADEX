import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { walletAPI } from '../api';
import toast from 'react-hot-toast';
import BottomNav from '../components/BottomNav';
import { Plus, Minus, TrendingUp } from 'lucide-react';

export default function FundsPage() {
  const [amount, setAmount] = useState('');
  const [actionType, setActionType] = useState('add'); // add or withdraw

  const { data: balanceData, isLoading, refetch } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const { data } = await walletAPI.getBalance();
      return data.data;
    },
  });

  const addFunds = useMutation({
    mutationFn: async (data) => {
      const { data: response } = await walletAPI.addFunds(data);
      return response;
    },
    onSuccess: () => {
      toast.success('Funds added successfully');
      setAmount('');
      refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add funds');
    },
  });

  const withdrawFunds = useMutation({
    mutationFn: async (data) => {
      const { data: response } = await walletAPI.withdraw(data);
      return response;
    },
    onSuccess: () => {
      toast.success('Withdrawal request submitted');
      setAmount('');
      refetch();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to withdraw');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (actionType === 'add') {
      addFunds.mutate({ amount: parseFloat(amount) });
    } else {
      withdrawFunds.mutate({ amount: parseFloat(amount) });
    }
  };

  const balance = balanceData?.balance || 0;
  const availableBalance = balanceData?.availableBalance || 0;
  const usedMargin = balanceData?.usedMargin || 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-4">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-4 py-3 sticky top-0 z-10 safe-area-top">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">Funds</h1>
      </div>

      {/* Balance Summary Cards */}
      <div className="p-3 md:p-4 space-y-3 md:space-y-4">
        {/* Total Balance Card */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 md:p-6 text-white shadow-lg">
          <div className="text-sm md:text-base opacity-90 mb-1">Total Balance</div>
          <div className="text-3xl md:text-4xl font-bold mb-3">
            ₹{balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm opacity-90">
            <TrendingUp size={16} />
            <span>Available for trading: ₹{availableBalance.toLocaleString()}</span>
          </div>
        </div>

        {/* Balance Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Available Cash</div>
            <div className="text-lg md:text-xl font-bold text-gray-900">
              ₹{availableBalance.toLocaleString()}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Used Margin</div>
            <div className="text-lg md:text-xl font-bold text-orange-600">
              ₹{usedMargin.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Add/Withdraw Funds Form */}
        <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-base md:text-lg mb-4 text-gray-900">
            {actionType === 'add' ? 'Add Funds' : 'Withdraw Funds'}
          </h3>

          {/* Action Type Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActionType('add')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                actionType === 'add'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Plus size={18} />
              Add
            </button>
            <button
              onClick={() => setActionType('withdraw')}
              className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                actionType === 'withdraw'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Minus size={18} />
              Withdraw
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                min="1"
                step="100"
              />
            </div>

            <button
              type="submit"
              disabled={addFunds.isPending || withdrawFunds.isPending}
              className={`w-full py-3 rounded-lg font-semibold text-white text-base transition-all active:scale-95 ${
                actionType === 'add'
                  ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-300'
                  : 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
              }`}
            >
              {addFunds.isPending || withdrawFunds.isPending ? 'Processing...' : 
               actionType === 'add' ? 'Add Funds' : 'Withdraw Funds'}
            </button>
          </form>

          {/* Info Text */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              {actionType === 'add' 
                ? '💡 Funds will be available immediately for trading'
                : '💡 Withdrawals are processed within 24 hours'}
            </p>
          </div>
        </div>

        {/* Transaction History Preview */}
        <div className="bg-white rounded-lg p-4 md:p-5 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-base md:text-lg mb-3 text-gray-900">
            Recent Transactions
          </h3>
          <div className="text-center py-8 text-gray-400 text-sm">
            No recent transactions
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
