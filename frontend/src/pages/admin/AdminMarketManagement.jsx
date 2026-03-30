import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, TrendingUp, DollarSign, Activity, CheckCircle, XCircle } from 'lucide-react';

export default function AdminMarketManagement() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState(null);
  const [priceEditId, setPriceEditId] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  // Fetch all market instruments
  const { data: instrumentsData, isLoading } = useQuery({
    queryKey: ['admin-market-instruments', selectedType],
    queryFn: async () => {
      const params = selectedType !== 'all' ? { type: selectedType } : {};
      const { data } = await adminAPI.getMarketInstruments(params);
      return data.data || [];
    },
    refetchInterval: 5000,
  });

  // Fetch dashboard stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-market-stats'],
    queryFn: async () => {
      const { data } = await adminAPI.getMarketStats();
      return data.data || {};
    },
    refetchInterval: 10000,
  });

  const instruments = instrumentsData || [];

  // Create instrument mutation
  const createMutation = useMutation({
    mutationFn: (data) => adminAPI.createInstrument(data),
    onSuccess: () => {
      toast.success('Instrument created successfully');
      queryClient.invalidateQueries(['admin-market-instruments']);
      queryClient.invalidateQueries(['admin-market-stats']);
      setShowAddModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create instrument');
    },
  });

  // Update instrument mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateInstrument(id, data),
    onSuccess: () => {
      toast.success('Instrument updated successfully');
      queryClient.invalidateQueries(['admin-market-instruments']);
      setEditingInstrument(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update instrument');
    },
  });

  // Delete instrument mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => adminAPI.deleteInstrument(id),
    onSuccess: () => {
      toast.success('Instrument deleted successfully');
      queryClient.invalidateQueries(['admin-market-instruments']);
      queryClient.invalidateQueries(['admin-market-stats']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete instrument');
    },
  });

  // Update price mutation
  const updatePriceMutation = useMutation({
    mutationFn: ({ id, price }) => adminAPI.updatePrice(id, price),
    onSuccess: (_, { id }) => {
      toast.success('Price updated successfully');
      queryClient.invalidateQueries(['admin-market-instruments']);
      setPriceEditId(null);
      setNewPrice('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update price');
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this instrument?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePriceUpdate = (id) => {
    if (newPrice && parseFloat(newPrice) > 0) {
      updatePriceMutation.mutate({ id, price: parseFloat(newPrice) });
    }
  };

  const getStatusBadge = (isActive) => (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
      isActive 
        ? 'bg-brand-green/10 text-brand-green' 
        : 'bg-gray-500/10 text-gray-400'
    }`}>
      {isActive ? '✓ Active' : '✕ Inactive'}
    </span>
  );

  const getTypeBadge = (type) => {
    const colors = {
      STOCK: 'bg-blue-500/10 text-blue-400',
      FOREX: 'bg-green-500/10 text-green-400',
      CRYPTO: 'bg-purple-500/10 text-purple-400',
      COMMODITY: 'bg-yellow-500/10 text-yellow-400',
      INDEX: 'bg-pink-500/10 text-pink-400',
    };
    return (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${colors[type] || 'bg-gray-500/10 text-gray-400'}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="w-full p-4 space-y-4 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Market Management</h1>
          <p className="text-xs text-text-secondary mt-1">Control all market instruments manually</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add Instrument
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={18} className="text-brand-blue" />
            <div className="text-xs text-text-secondary">Total Instruments</div>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {statsData?.totalInstruments || 0}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={18} className="text-brand-green" />
            <div className="text-xs text-text-secondary">Stocks</div>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {statsData?.stocksCount || 0}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={18} className="text-accent-red" />
            <div className="text-xs text-text-secondary">Forex Pairs</div>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {statsData?.forexCount || 0}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={18} className="text-yellow-500" />
            <div className="text-xs text-text-secondary">Active</div>
          </div>
          <div className="text-2xl font-bold text-text-primary">
            {statsData?.activeInstruments || 0}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'STOCK', 'FOREX', 'CRYPTO', 'COMMODITY', 'INDEX'].map((type) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              selectedType === type
                ? 'bg-brand-blue text-white'
                : 'bg-bg-card text-text-secondary hover:bg-bg-tertiary border border-border'
            }`}
          >
            {type === 'all' ? 'All' : type}
          </button>
        ))}
      </div>

      {/* Instruments Table */}
      <div className="card p-0 overflow-hidden">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="text-left">Symbol</th>
              <th className="text-left">Name</th>
              <th>Type</th>
              <th>Exchange</th>
              <th className="text-right">Price</th>
              <th className="text-right">Change %</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {instruments.map((inst) => (
              <tr key={inst._id}>
                <td>
                  <div className="font-bold text-text-primary">{inst.symbol}</div>
                </td>
                <td>
                  <div className="text-sm font-medium text-text-primary">{inst.name}</div>
                  {inst.sector && <div className="text-xs text-text-secondary">{inst.sector}</div>}
                </td>
                <td>{getTypeBadge(inst.type)}</td>
                <td className="text-xs text-text-secondary">{inst.exchange}</td>
                <td className="text-right">
                  {priceEditId === inst._id ? (
                    <div className="flex items-center gap-1 justify-end">
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-24 inp text-right"
                        placeholder="Price"
                        autoFocus
                      />
                      <button
                        onClick={() => handlePriceUpdate(inst._id)}
                        className="text-brand-green hover:text-brand-blue"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => {
                          setPriceEditId(null);
                          setNewPrice('');
                        }}
                        className="text-accent-red hover:text-gray-400"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 justify-end">
                      <div className={`font-semibold ${inst.changePercent >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
                        ₹{inst.price?.toFixed(2)}
                      </div>
                      <button
                        onClick={() => {
                          setPriceEditId(inst._id);
                          setNewPrice(inst.price?.toString() || '');
                        }}
                        className="text-xs text-brand-blue hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </td>
                <td className={`text-right font-semibold ${inst.changePercent >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
                  {inst.changePercent >= 0 ? '+' : ''}{inst.changePercent?.toFixed(2)}%
                </td>
                <td>{getStatusBadge(inst.isActive)}</td>
                <td className="text-right">
                  <div className="flex gap-1 justify-end">
                    <button
                      onClick={() => setEditingInstrument(inst)}
                      className="p-1.5 hover:bg-bg-tertiary rounded text-text-secondary hover:text-brand-blue"
                      title="Edit Instrument"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(inst._id)}
                      className="p-1.5 hover:bg-bg-tertiary rounded text-text-secondary hover:text-accent-red"
                      title="Delete Instrument"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Instrument Modal */}
      {showAddModal && (
        <AddInstrumentModal
          onClose={() => setShowAddModal(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
        />
      )}

      {/* Edit Instrument Modal */}
      {editingInstrument && (
        <EditInstrumentModal
          instrument={editingInstrument}
          onClose={() => setEditingInstrument(null)}
          onSubmit={(data) => updateMutation.mutate({ id: editingInstrument._id, data })}
          isLoading={updateMutation.isPending}
        />
      )}
    </div>
  );
}

// Add Instrument Modal Component
function AddInstrumentModal({ onClose, onSubmit, isLoading }) {
  const [form, setForm] = useState({
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
    isActive: true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      price: parseFloat(form.price),
      open: parseFloat(form.open) || parseFloat(form.price),
      high: parseFloat(form.high) || parseFloat(form.price),
      low: parseFloat(form.low) || parseFloat(form.price),
      close: parseFloat(form.close) || parseFloat(form.price),
      volume: parseInt(form.volume) || 0,
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">Add New Instrument</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="inp-label">Name *</label>
              <input
                className="inp"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="Reliance Industries"
              />
            </div>
            <div>
              <label className="inp-label">Symbol *</label>
              <input
                className="inp"
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                required
                placeholder="RELIANCE"
              />
            </div>
            <div>
              <label className="inp-label">Type *</label>
              <select
                className="inp"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="STOCK">Stock</option>
                <option value="FOREX">Forex</option>
                <option value="CRYPTO">Crypto</option>
                <option value="COMMODITY">Commodity</option>
                <option value="INDEX">Index</option>
              </select>
            </div>
            <div>
              <label className="inp-label">Exchange *</label>
              <select
                className="inp"
                value={form.exchange}
                onChange={(e) => setForm({ ...form, exchange: e.target.value })}
              >
                <option value="NSE">NSE</option>
                <option value="BSE">BSE</option>
                <option value="FOREX">FOREX</option>
                <option value="CRYPTO">CRYPTO</option>
                <option value="MCX">MCX</option>
              </select>
            </div>
            <div>
              <label className="inp-label">Price *</label>
              <input
                className="inp"
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
                placeholder="2456.75"
              />
            </div>
            <div>
              <label className="inp-label">Open</label>
              <input
                className="inp"
                type="number"
                step="0.01"
                value={form.open}
                onChange={(e) => setForm({ ...form, open: e.target.value })}
                placeholder="2450.00"
              />
            </div>
            <div>
              <label className="inp-label">High</label>
              <input
                className="inp"
                type="number"
                step="0.01"
                value={form.high}
                onChange={(e) => setForm({ ...form, high: e.target.value })}
                placeholder="2470.00"
              />
            </div>
            <div>
              <label className="inp-label">Low</label>
              <input
                className="inp"
                type="number"
                step="0.01"
                value={form.low}
                onChange={(e) => setForm({ ...form, low: e.target.value })}
                placeholder="2440.00"
              />
            </div>
            <div>
              <label className="inp-label">Volume</label>
              <input
                className="inp"
                type="number"
                value={form.volume}
                onChange={(e) => setForm({ ...form, volume: e.target.value })}
                placeholder="1000000"
              />
            </div>
            <div>
              <label className="inp-label">Sector</label>
              <input
                className="inp"
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                placeholder="Oil & Gas"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t border-border">
            <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Instrument'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Instrument Modal Component
function EditInstrumentModal({ instrument, onClose, onSubmit, isLoading }) {
  const [form, setForm] = useState({
    name: instrument.name,
    symbol: instrument.symbol,
    type: instrument.type,
    exchange: instrument.exchange,
    price: instrument.price,
    open: instrument.open,
    high: instrument.high,
    low: instrument.low,
    close: instrument.close,
    volume: instrument.volume,
    sector: instrument.sector,
    isActive: instrument.isActive,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...form,
      price: parseFloat(form.price),
      open: parseFloat(form.open),
      high: parseFloat(form.high),
      low: parseFloat(form.low),
      close: parseFloat(form.close),
      volume: parseInt(form.volume),
    };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-text-primary">Edit Instrument</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Same form fields as AddInstrumentModal */}
            <div>
              <label className="inp-label">Name *</label>
              <input className="inp" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div>
              <label className="inp-label">Symbol *</label>
              <input className="inp" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} required />
            </div>
            {/* ... other fields ... */}
          </div>
          <div className="flex gap-3 pt-4 border-t border-border">
            <button type="submit" className="btn-primary flex-1" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Update Instrument'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
