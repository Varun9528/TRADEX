import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

export default function AdminTradeForm({ onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    userId: '',
    symbol: '',
    quantity: 1,
    price: '',
    transactionType: 'BUY',
    productType: 'CNC'
  });

  // Fetch all users for dropdown
  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data } = await adminAPI.getUsers({ limit: 100 });
      return data.data || [];
    }
  });

  // Place trade mutation
  const placeTradeMutation = useMutation({
    mutationFn: (data) => adminAPI.placeTradeForUser(data),
    onSuccess: (res) => {
      console.log('[AdminTradeForm] Trade placed:', res);
      toast.success(`Trade placed successfully for ${res.data.order.user.fullName}`);
      queryClient.invalidateQueries(['admin-trades']);
      queryClient.invalidateQueries(['admin-positions']);
      onClose?.();
    },
    onError: (err) => {
      console.error('[AdminTradeForm] Error:', err);
      toast.error(err.response?.data?.message || 'Failed to place trade');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.symbol || formData.quantity < 1) {
      toast.error('Please fill all required fields');
      return;
    }

    placeTradeMutation.mutate({
      userId: formData.userId,
      symbol: formData.symbol.toUpperCase(),
      quantity: parseInt(formData.quantity),
      price: formData.price ? parseFloat(formData.price) : undefined,
      transactionType: formData.transactionType,
      productType: formData.productType
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border rounded-lg max-w-md w-full p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-text-primary">Place Trade for User</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select User */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Select User *
            </label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none text-sm"
              required
            >
              <option value="">Choose a user...</option>
              {usersData?.map(user => (
                <option key={user._id} value={user._id}>
                  {user.fullName} ({user.email}) - {user.clientId}
                </option>
              ))}
            </select>
          </div>

          {/* Symbol Input */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Stock Symbol *
            </label>
            <input
              type="text"
              value={formData.symbol}
              onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
              placeholder="RELIANCE, TCS, etc."
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none text-sm uppercase"
              required
            />
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Quantity *
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              min="1"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none text-sm"
              required
            />
          </div>

          {/* Price Input (Optional) */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Price (Optional - Market if empty)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Leave empty for market price"
              step="0.05"
              className="w-full px-3 py-2 bg-bg-tertiary border border-border-strong rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent text-text-primary outline-none text-sm"
            />
          </div>

          {/* Transaction Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, transactionType: 'BUY' })}
                className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                  formData.transactionType === 'BUY'
                    ? 'bg-brand-green/20 text-brand-green border-brand-green'
                    : 'bg-bg-tertiary text-text-secondary border-border hover:bg-bg-secondary'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, transactionType: 'SELL' })}
                className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                  formData.transactionType === 'SELL'
                    ? 'bg-accent-red/20 text-accent-red border-accent-red'
                    : 'bg-bg-tertiary text-text-secondary border-border hover:bg-bg-secondary'
                }`}
              >
                SELL
              </button>
            </div>
          </div>

          {/* Product Type Toggle */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-2">
              Product Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, productType: 'MIS' })}
                className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                  formData.productType === 'MIS'
                    ? 'bg-brand-blue/20 text-brand-blue border-brand-blue'
                    : 'bg-bg-tertiary text-text-secondary border-border hover:bg-bg-secondary'
                }`}
              >
                MIS (Intraday)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, productType: 'CNC' })}
                className={`py-2 rounded-lg text-xs font-semibold transition-all border ${
                  formData.productType === 'CNC'
                    ? 'bg-brand-blue/20 text-brand-blue border-brand-blue'
                    : 'bg-bg-tertiary text-text-secondary border-border hover:bg-bg-secondary'
                }`}
              >
                CNC (Delivery)
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={placeTradeMutation.isPending}
            className="w-full py-3 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold text-sm rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {placeTradeMutation.isPending ? 'Placing...' : 'Place Trade'}
          </button>
        </form>
      </div>
    </div>
  );
}
