import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { Search, Upload, Download, Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminForexManager() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', symbol: '', exchange: 'FOREX', price: '', open: '', high: '', low: '', close: ''
  });

  // Fetch forex pairs only
  const { data: forexData, isLoading } = useQuery({ 
    queryKey: ['admin-forex'], 
    queryFn: async () => {
      const response = await adminAPI.getInstruments({ type: 'FOREX', limit: 200 });
      console.log('[AdminForex] Full API Response:', response);
      console.log('[AdminForex] response.data:', response.data);
      // Axios returns { data: { success: true, data: [...], count: N } }
      const apiResponse = response.data;
      console.log('[AdminForex] Extracted data:', apiResponse);
      return Array.isArray(apiResponse?.data) ? apiResponse.data : [];
    },
    refetchInterval: 5000,
  });

  const forexPairs = forexData || [];
  const filteredPairs = forexPairs.filter(f => 
    f.symbol.toLowerCase().includes(search.toLowerCase()) ||
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const createMut = useMutation({
    mutationFn: (data) => adminAPI.createInstrument(data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-forex']);
      toast.success('Forex pair added');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateInstrument(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-forex']);
      toast.success('Forex pair updated');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminAPI.deleteInstrument(id),
    onSuccess: () => {
      qc.invalidateQueries(['admin-forex']);
      toast.success('Forex pair deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const toggleStatusMut = useMutation({
    mutationFn: ({ id, isActive }) => adminAPI.updateInstrument(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries(['admin-forex']);
      toast.success('Status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const resetForm = () => {
    setFormData({ name: '', symbol: '', exchange: 'FOREX', price: '', open: '', high: '', low: '', close: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      type: 'FOREX',
      price: parseFloat(formData.price),
      open: formData.open ? parseFloat(formData.open) : parseFloat(formData.price),
      high: formData.high ? parseFloat(formData.high) : parseFloat(formData.price),
      low: formData.low ? parseFloat(formData.low) : parseFloat(formData.price),
      close: formData.close ? parseFloat(formData.close) : parseFloat(formData.price),
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const handleEdit = (pair) => {
    setEditingId(pair._id);
    setFormData({
      name: pair.name,
      symbol: pair.symbol,
      exchange: pair.exchange,
      price: pair.price,
      open: pair.open,
      high: pair.high,
      low: pair.low,
      close: pair.close,
    });
    setShowForm(true);
  };

  const handleQuickPriceUpdate = (id, newPrice) => {
    updateMut.mutate({ 
      id, 
      data: { 
        price: parseFloat(newPrice),
        close: parseFloat(newPrice)
      } 
    });
  };

  // CSV Download
  const downloadCSV = () => {
    const headers = ['Symbol', 'Name', 'Price', 'Open', 'High', 'Low', 'Close', 'Status'];
    const rows = forexPairs.map(f => [
      f.symbol, f.name, f.price, f.open, f.high, f.low, f.close, f.isActive ? 'Active' : 'Inactive'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forex_pairs.csv';
    a.click();
    toast.success('CSV downloaded');
  };

  // CSV Upload
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const instruments = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const obj = {};
          headers.forEach((header, idx) => {
            obj[header] = values[idx];
          });

          if (obj.symbol && obj.name && obj.price) {
            instruments.push({
              name: obj.name,
              symbol: obj.symbol.toUpperCase(),
              type: 'FOREX',
              exchange: 'FOREX',
              price: parseFloat(obj.price),
              open: parseFloat(obj.open || obj.price),
              high: parseFloat(obj.high || obj.price),
              low: parseFloat(obj.low || obj.price),
              close: parseFloat(obj.close || obj.price),
              isActive: true,
            });
          }
        }

        Promise.all(instruments.map(inst => adminAPI.createInstrument(inst)))
          .then(() => {
            qc.invalidateQueries(['admin-forex']);
            toast.success(`Successfully imported ${instruments.length} forex pairs`);
          })
          .catch(err => toast.error('Import failed: ' + err.message));
      } catch (err) {
        toast.error('Failed to parse CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Forex Market Manager</h2>
          <p className="text-xs text-text-secondary">{filteredPairs.length} currency pairs loaded</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="btn-ghost text-xs flex items-center gap-1">
            <Download size={14} /> Export CSV
          </button>
          <label className="btn-ghost text-xs flex items-center gap-1 cursor-pointer">
            <Upload size={14} /> Import CSV
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs flex items-center gap-1">
            <Plus size={14} /> Add Pair
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3">{editingId ? 'Edit Forex Pair' : 'Add New Currency Pair'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input className="inp" placeholder="Pair Name*" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input className="inp" placeholder="Symbol* (e.g. EURUSD)" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})} required />
            <input className="inp" type="number" step="0.0001" placeholder="Price*" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            <input className="inp" type="number" step="0.0001" placeholder="Open" value={formData.open} onChange={e => setFormData({...formData, open: e.target.value})} />
            <input className="inp" type="number" step="0.0001" placeholder="High" value={formData.high} onChange={e => setFormData({...formData, high: e.target.value})} />
            <input className="inp" type="number" step="0.0001" placeholder="Low" value={formData.low} onChange={e => setFormData({...formData, low: e.target.value})} />
            <input className="inp" type="number" step="0.0001" placeholder="Close" value={formData.close} onChange={e => setFormData({...formData, close: e.target.value})} />
            <div className="col-span-2 md:col-span-4 flex gap-2">
              <button type="submit" className="btn-primary flex-1 text-sm">{editingId ? 'Update' : 'Create'} Pair</button>
              <button type="button" onClick={resetForm} className="btn-ghost text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
        <input 
          className="inp pl-10" 
          placeholder="Search by symbol or pair name..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Forex Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-bg-secondary border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Pair</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Name</th>
                <th className="px-4 py-3 text-right font-semibold text-text-secondary">Price</th>
                <th className="px-4 py-3 text-right font-semibold text-text-secondary">Change %</th>
                <th className="px-4 py-3 text-center font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPairs.map(pair => (
                <tr key={pair._id} className="border-b border-border hover:bg-bg-secondary transition-colors">
                  <td className="px-4 py-3 font-medium text-brand-blue">{pair.symbol}</td>
                  <td className="px-4 py-3 text-text-primary">{pair.name}</td>
                  <td className="px-4 py-3 text-right">
                    <input 
                      type="number" 
                      step="0.0001"
                      className="w-28 px-2 py-1 bg-bg-tertiary border border-border rounded text-right"
                      defaultValue={pair.price}
                      onBlur={(e) => handleQuickPriceUpdate(pair._id, e.target.value)}
                    />
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${pair.changePercent >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
                    {pair.changePercent >= 0 ? '+' : ''}{pair.changePercent?.toFixed(3)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => toggleStatusMut.mutate({ id: pair._id, isActive: !pair.isActive })}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${pair.isActive ? 'bg-brand-green/10 text-brand-green' : 'bg-text-muted/10 text-text-muted'}`}
                    >
                      {pair.isActive ? <Power size={12} /> : <PowerOff size={12} />}
                      {pair.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(pair)} className="p-1.5 hover:bg-bg-tertiary rounded text-brand-blue">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteMut.mutate(pair._id)} className="p-1.5 hover:bg-bg-tertiary rounded text-accent-red">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
