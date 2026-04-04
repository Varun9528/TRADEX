import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { Search, Upload, Download, Plus, Edit2, Trash2, Power, PowerOff, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminStocksManager() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', symbol: '', exchange: 'NSE', price: '', open: '', high: '', low: '', close: '', volume: '', sector: ''
  });

  // Fetch stocks only
  const { data: stocksData, isLoading } = useQuery({ 
    queryKey: ['admin-stocks'], 
    queryFn: async () => {
      const response = await adminAPI.getInstruments({ type: 'STOCK', limit: 500 });
      console.log('[AdminStocks] Full API Response:', response);
      console.log('[AdminStocks] response.data:', response.data);
      // Axios returns { data: { success: true, data: [...], count: N } }
      // So we need response.data.data to get the array
      const apiResponse = response.data;
      console.log('[AdminStocks] Extracted data:', apiResponse);
      return Array.isArray(apiResponse?.data) ? apiResponse.data : [];
    },
    refetchInterval: 5000,
  });

  const stocks = stocksData || [];
  const filteredStocks = stocks.filter(s => 
    s.symbol.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  // Mutations
  const createMut = useMutation({
    mutationFn: (data) => adminAPI.createInstrument(data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-stocks']);
      toast.success('Stock added successfully');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateInstrument(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-stocks']);
      toast.success('Stock updated');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminAPI.deleteInstrument(id),
    onSuccess: () => {
      qc.invalidateQueries(['admin-stocks']);
      toast.success('Stock deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const toggleStatusMut = useMutation({
    mutationFn: ({ id, isActive }) => adminAPI.updateInstrument(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries(['admin-stocks']);
      toast.success('Status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const resetForm = () => {
    setFormData({ name: '', symbol: '', exchange: 'NSE', price: '', open: '', high: '', low: '', close: '', volume: '', sector: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      type: 'STOCK',
      price: parseFloat(formData.price),
      open: formData.open ? parseFloat(formData.open) : parseFloat(formData.price),
      high: formData.high ? parseFloat(formData.high) : parseFloat(formData.price),
      low: formData.low ? parseFloat(formData.low) : parseFloat(formData.price),
      close: formData.close ? parseFloat(formData.close) : parseFloat(formData.price),
      volume: formData.volume ? parseInt(formData.volume) : 0,
    };

    if (editingId) {
      updateMut.mutate({ id: editingId, data: payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const handleEdit = (stock) => {
    setEditingId(stock._id);
    setFormData({
      name: stock.name,
      symbol: stock.symbol,
      exchange: stock.exchange,
      price: stock.price,
      open: stock.open,
      high: stock.high,
      low: stock.low,
      close: stock.close,
      volume: stock.volume,
      sector: stock.sector || '',
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
    const headers = ['Symbol', 'Name', 'Exchange', 'Price', 'Open', 'High', 'Low', 'Close', 'Volume', 'Sector', 'Status'];
    const rows = stocks.map(s => [
      s.symbol, s.name, s.exchange, s.price, s.open, s.high, s.low, s.close, s.volume, s.sector || '', s.isActive ? 'Active' : 'Inactive'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stocks.csv';
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
              type: 'STOCK',
              exchange: obj.exchange || 'NSE',
              price: parseFloat(obj.price),
              open: parseFloat(obj.open || obj.price),
              high: parseFloat(obj.high || obj.price),
              low: parseFloat(obj.low || obj.price),
              close: parseFloat(obj.close || obj.price),
              volume: parseInt(obj.volume || 0),
              sector: obj.sector || '',
              isActive: true,
            });
          }
        }

        // Bulk create
        Promise.all(instruments.map(inst => adminAPI.createInstrument(inst)))
          .then(() => {
            qc.invalidateQueries(['admin-stocks']);
            toast.success(`Successfully imported ${instruments.length} stocks`);
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
          <h2 className="text-lg font-bold text-text-primary">Indian Stocks Manager</h2>
          <p className="text-xs text-text-secondary">{filteredStocks.length} stocks loaded</p>
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
            <Plus size={14} /> Add Stock
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3">{editingId ? 'Edit Stock' : 'Add New Stock'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input className="inp" placeholder="Name*" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            <input className="inp" placeholder="Symbol*" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})} required />
            <select className="inp" value={formData.exchange} onChange={e => setFormData({...formData, exchange: e.target.value})}>
              <option value="NSE">NSE</option>
              <option value="BSE">BSE</option>
            </select>
            <input className="inp" placeholder="Sector" value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} />
            <input className="inp" type="number" step="0.01" placeholder="Price*" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            <input className="inp" type="number" step="0.01" placeholder="Open" value={formData.open} onChange={e => setFormData({...formData, open: e.target.value})} />
            <input className="inp" type="number" step="0.01" placeholder="High" value={formData.high} onChange={e => setFormData({...formData, high: e.target.value})} />
            <input className="inp" type="number" step="0.01" placeholder="Low" value={formData.low} onChange={e => setFormData({...formData, low: e.target.value})} />
            <input className="inp" type="number" step="0.01" placeholder="Close" value={formData.close} onChange={e => setFormData({...formData, close: e.target.value})} />
            <input className="inp" type="number" placeholder="Volume" value={formData.volume} onChange={e => setFormData({...formData, volume: e.target.value})} />
            <div className="col-span-2 md:col-span-4 flex gap-2">
              <button type="submit" className="btn-primary flex-1 text-sm">{editingId ? 'Update' : 'Create'} Stock</button>
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
          placeholder="Search by symbol or name..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Stocks Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-bg-secondary border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Symbol</th>
                <th className="px-4 py-3 text-left font-semibold text-text-secondary">Name</th>
                <th className="px-4 py-3 text-right font-semibold text-text-secondary">Price</th>
                <th className="px-4 py-3 text-right font-semibold text-text-secondary">Change %</th>
                <th className="px-4 py-3 text-center font-semibold text-text-secondary">Volume</th>
                <th className="px-4 py-3 text-center font-semibold text-text-secondary">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map(stock => (
                <tr key={stock._id} className="border-b border-border hover:bg-bg-secondary transition-colors">
                  <td className="px-4 py-3 font-medium text-brand-blue">{stock.symbol}</td>
                  <td className="px-4 py-3 text-text-primary">{stock.name}</td>
                  <td className="px-4 py-3 text-right">
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-24 px-2 py-1 bg-bg-tertiary border border-border rounded text-right"
                      defaultValue={stock.price}
                      onBlur={(e) => handleQuickPriceUpdate(stock._id, e.target.value)}
                    />
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${stock.changePercent >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-center text-text-secondary">{stock.volume?.toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <button 
                      onClick={() => toggleStatusMut.mutate({ id: stock._id, isActive: !stock.isActive })}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${stock.isActive ? 'bg-brand-green/10 text-brand-green' : 'bg-text-muted/10 text-text-muted'}`}
                    >
                      {stock.isActive ? <Power size={12} /> : <PowerOff size={12} />}
                      {stock.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(stock)} className="p-1.5 hover:bg-bg-tertiary rounded text-brand-blue">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteMut.mutate(stock._id)} className="p-1.5 hover:bg-bg-tertiary rounded text-accent-red">
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
