import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../../api';
import { Search, Upload, Download, Plus, Edit2, Trash2, Power, PowerOff, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export function AdminOptionsManager() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'chain'
  const [selectedExpiry, setSelectedExpiry] = useState('all');
  const [selectedUnderlying, setSelectedUnderlying] = useState('all');
  
  const [formData, setFormData] = useState({
    name: '', symbol: '', underlyingAsset: 'NIFTY', exchange: 'NFO', 
    strikePrice: '', expiryDate: '', optionType: 'CE', lotSize: '50',
    price: '', open: '', high: '', low: '', close: ''
  });

  // Fetch options only
  const { data: optionsData, isLoading } = useQuery({ 
    queryKey: ['admin-options'], 
    queryFn: async () => {
      console.log('[AdminOptions] Fetching options from API...');
      const response = await adminAPI.getInstruments({ type: 'OPTION', limit: 1000 });
      console.log('[AdminOptions] Full API Response:', response);
      console.log('[AdminOptions] response.data:', response.data);
      // Axios returns { data: { success: true, data: [...], count: N } }
      const apiResponse = response.data;
      console.log('[AdminOptions] Extracted data:', apiResponse);
      const options = Array.isArray(apiResponse?.data) ? apiResponse.data : [];
      console.log('[AdminOptions] Options count:', options.length);
      if (options.length > 0) {
        console.log('[AdminOptions] Sample option:', options[0]);
      }
      return options;
    },
    refetchInterval: 5000,
  });

  const allOptions = optionsData || [];
  
  // Get unique expiry dates and underlying assets
  const expiryDates = useMemo(() => {
    const dates = [...new Set(allOptions.map(o => o.expiryDate))].filter(Boolean).sort();
    return dates;
  }, [allOptions]);

  const underlyingAssets = useMemo(() => {
    return [...new Set(allOptions.map(o => o.underlyingAsset || o.symbol.replace(/[0-9]+(CE|PE)/g, '')))].filter(Boolean).sort();
  }, [allOptions]);

  // Filter options
  const filteredOptions = allOptions.filter(opt => {
    const matchesSearch = opt.symbol.toLowerCase().includes(search.toLowerCase()) ||
                         opt.name.toLowerCase().includes(search.toLowerCase());
    const matchesExpiry = selectedExpiry === 'all' || new Date(opt.expiryDate).toISOString().split('T')[0] === selectedExpiry;
    const matchesUnderlying = selectedUnderlying === 'all' || (opt.underlyingAsset || '').includes(selectedUnderlying);
    return matchesSearch && matchesExpiry && matchesUnderlying;
  });

  // Group options by strike for chain view
  const optionChain = useMemo(() => {
    const chain = {};
    filteredOptions.forEach(opt => {
      const strike = opt.strikePrice;
      if (!chain[strike]) {
        chain[strike] = { strike, CE: null, PE: null };
      }
      if (opt.optionType === 'CE') {
        chain[strike].CE = opt;
      } else if (opt.optionType === 'PE') {
        chain[strike].PE = opt;
      }
    });
    return Object.values(chain).sort((a, b) => a.strike - b.strike);
  }, [filteredOptions]);

  // Mutations
  const createMut = useMutation({
    mutationFn: (data) => adminAPI.createInstrument(data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-options']);
      toast.success('Option contract added');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateInstrument(id, data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-options']);
      toast.success('Option updated');
      resetForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => adminAPI.deleteInstrument(id),
    onSuccess: () => {
      qc.invalidateQueries(['admin-options']);
      toast.success('Option deleted');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const toggleStatusMut = useMutation({
    mutationFn: ({ id, isActive }) => adminAPI.updateInstrument(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries(['admin-options']);
      toast.success('Status updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const resetForm = () => {
    setFormData({
      name: '', symbol: '', underlyingAsset: 'NIFTY', exchange: 'NFO', 
      strikePrice: '', expiryDate: '', optionType: 'CE', lotSize: '50',
      price: '', open: '', high: '', low: '', close: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Auto-generate symbol if not provided
    const symbol = formData.symbol || `${formData.underlyingAsset}${formData.strikePrice}${formData.optionType}`;
    const name = formData.name || `${formData.underlyingAsset} ${formData.strikePrice} ${formData.optionType}`;
    
    const payload = {
      ...formData,
      name,
      symbol: symbol.toUpperCase(),
      type: 'OPTION',
      strikePrice: parseFloat(formData.strikePrice),
      expiryDate: new Date(formData.expiryDate),
      lotSize: parseInt(formData.lotSize),
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

  const handleEdit = (option) => {
    setEditingId(option._id);
    setFormData({
      name: option.name,
      symbol: option.symbol,
      underlyingAsset: option.underlyingAsset || option.symbol.replace(/[0-9]+(CE|PE)/g, ''),
      exchange: option.exchange,
      strikePrice: option.strikePrice,
      expiryDate: option.expiryDate ? new Date(option.expiryDate).toISOString().split('T')[0] : '',
      optionType: option.optionType,
      lotSize: option.lotSize,
      price: option.price,
      open: option.open,
      high: option.high,
      low: option.low,
      close: option.close,
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
    const headers = ['Symbol', 'Name', 'Underlying', 'Strike', 'Expiry', 'Type', 'Lot Size', 'Premium', 'Status'];
    const rows = allOptions.map(o => [
      o.symbol, o.name, o.underlyingAsset || '', o.strikePrice, 
      new Date(o.expiryDate).toISOString().split('T')[0], o.optionType, 
      o.lotSize, o.price, o.isActive ? 'Active' : 'Inactive'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'options_contracts.csv';
    a.click();
    toast.success('CSV downloaded');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Options Market Manager</h2>
          <p className="text-xs text-text-secondary">{filteredOptions.length} option contracts loaded</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadCSV} className="btn-ghost text-xs flex items-center gap-1">
            <Download size={14} /> Export CSV
          </button>
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'chain' : 'list')} 
            className="btn-ghost text-xs"
          >
            {viewMode === 'list' ? 'Show Option Chain' : 'Show List'}
          </button>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary text-xs flex items-center gap-1">
            <Plus size={14} /> Add Option
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input 
            className="inp pl-10" 
            placeholder="Search options..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select 
          className="inp" 
          value={selectedUnderlying}
          onChange={e => setSelectedUnderlying(e.target.value)}
        >
          <option value="all">All Underlyings</option>
          {underlyingAssets.map(asset => (
            <option key={asset} value={asset}>{asset}</option>
          ))}
        </select>
        <select 
          className="inp" 
          value={selectedExpiry}
          onChange={e => setSelectedExpiry(e.target.value)}
        >
          <option value="all">All Expiries</option>
          {expiryDates.map(date => (
            <option key={date} value={date}>{new Date(date).toLocaleDateString()}</option>
          ))}
        </select>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card p-4">
          <h3 className="font-semibold mb-3">{editingId ? 'Edit Option' : 'Add New Option Contract'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select className="inp" value={formData.underlyingAsset} onChange={e => setFormData({...formData, underlyingAsset: e.target.value})}>
              <option value="NIFTY">NIFTY</option>
              <option value="BANKNIFTY">BANKNIFTY</option>
              <option value="RELIANCE">RELIANCE</option>
              <option value="TCS">TCS</option>
            </select>
            <input className="inp" type="number" placeholder="Strike Price*" value={formData.strikePrice} onChange={e => setFormData({...formData, strikePrice: e.target.value})} required />
            <input className="inp" type="date" value={formData.expiryDate} onChange={e => setFormData({...formData, expiryDate: e.target.value})} required />
            <select className="inp" value={formData.optionType} onChange={e => setFormData({...formData, optionType: e.target.value})}>
              <option value="CE">Call (CE)</option>
              <option value="PE">Put (PE)</option>
            </select>
            <input className="inp" type="number" placeholder="Lot Size*" value={formData.lotSize} onChange={e => setFormData({...formData, lotSize: e.target.value})} required />
            <input className="inp" type="number" step="0.01" placeholder="Premium Price*" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} required />
            <input className="inp" type="number" step="0.01" placeholder="Open" value={formData.open} onChange={e => setFormData({...formData, open: e.target.value})} />
            <input className="inp" type="number" step="0.01" placeholder="High" value={formData.high} onChange={e => setFormData({...formData, high: e.target.value})} />
            <div className="col-span-2 md:col-span-4 flex gap-2">
              <button type="submit" className="btn-primary flex-1 text-sm">{editingId ? 'Update' : 'Create'} Option</button>
              <button type="button" onClick={resetForm} className="btn-ghost text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Option Chain View */}
      {viewMode === 'chain' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-bg-secondary border-b border-border">
                <tr>
                  <th colSpan="3" className="px-4 py-3 text-center font-semibold text-brand-green border-r border-border">CALLS (CE)</th>
                  <th className="px-4 py-3 text-center font-semibold text-text-secondary">Strike</th>
                  <th colSpan="3" className="px-4 py-3 text-center font-semibold text-accent-red border-l border-border">PUTS (PE)</th>
                </tr>
                <tr className="bg-bg-tertiary">
                  <th className="px-3 py-2 text-right">OI</th>
                  <th className="px-3 py-2 text-right">Premium</th>
                  <th className="px-3 py-2 text-right">Change %</th>
                  <th className="px-3 py-2 text-center font-bold">Price</th>
                  <th className="px-3 py-2 text-right">Change %</th>
                  <th className="px-3 py-2 text-right">Premium</th>
                  <th className="px-3 py-2 text-right">OI</th>
                </tr>
              </thead>
              <tbody>
                {optionChain.map(row => (
                  <tr key={row.strike} className="border-b border-border hover:bg-bg-secondary transition-colors">
                    {/* Call Data */}
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {row.CE?.openInterest?.toLocaleString() || '-'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.CE ? (
                        <input 
                          type="number" 
                          step="0.01"
                          className="w-20 px-1 py-0.5 bg-bg-tertiary border border-border rounded text-right text-xs"
                          defaultValue={row.CE.price}
                          onBlur={(e) => handleQuickPriceUpdate(row.CE._id, e.target.value)}
                        />
                      ) : '-'}
                    </td>
                    <td className={`px-3 py-2 text-right ${row.CE?.changePercent >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
                      {row.CE ? `${row.CE.changePercent >= 0 ? '+' : ''}${row.CE.changePercent?.toFixed(2)}%` : '-'}
                    </td>
                    
                    {/* Strike Price */}
                    <td className="px-3 py-2 text-center font-bold text-text-primary border-x border-border">
                      {row.strike}
                    </td>
                    
                    {/* Put Data */}
                    <td className={`px-3 py-2 text-right ${row.PE?.changePercent >= 0 ? 'text-brand-green' : 'text-accent-red'}`}>
                      {row.PE ? `${row.PE.changePercent >= 0 ? '+' : ''}${row.PE.changePercent?.toFixed(2)}%` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.PE ? (
                        <input 
                          type="number" 
                          step="0.01"
                          className="w-20 px-1 py-0.5 bg-bg-tertiary border border-border rounded text-right text-xs"
                          defaultValue={row.PE.price}
                          onBlur={(e) => handleQuickPriceUpdate(row.PE._id, e.target.value)}
                        />
                      ) : '-'}
                    </td>
                    <td className="px-3 py-2 text-right text-text-secondary">
                      {row.PE?.openInterest?.toLocaleString() || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-bg-secondary border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Symbol</th>
                  <th className="px-4 py-3 text-left font-semibold text-text-secondary">Type</th>
                  <th className="px-4 py-3 text-right font-semibold text-text-secondary">Strike</th>
                  <th className="px-4 py-3 text-center font-semibold text-text-secondary">Expiry</th>
                  <th className="px-4 py-3 text-right font-semibold text-text-secondary">Premium</th>
                  <th className="px-4 py-3 text-center font-semibold text-text-secondary">Lot Size</th>
                  <th className="px-4 py-3 text-center font-semibold text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-center font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOptions.map(option => (
                  <tr key={option._id} className="border-b border-border hover:bg-bg-secondary transition-colors">
                    <td className="px-4 py-3 font-medium text-brand-blue">{option.symbol}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${option.optionType === 'CE' ? 'bg-brand-green/10 text-brand-green' : 'bg-accent-red/10 text-accent-red'}`}>
                        {option.optionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{option.strikePrice}</td>
                    <td className="px-4 py-3 text-center text-text-secondary">
                      {option.expiryDate ? new Date(option.expiryDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input 
                        type="number" 
                        step="0.01"
                        className="w-20 px-2 py-1 bg-bg-tertiary border border-border rounded text-right"
                        defaultValue={option.price}
                        onBlur={(e) => handleQuickPriceUpdate(option._id, e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">{option.lotSize}</td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => toggleStatusMut.mutate({ id: option._id, isActive: !option.isActive })}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${option.isActive ? 'bg-brand-green/10 text-brand-green' : 'bg-text-muted/10 text-text-muted'}`}
                      >
                        {option.isActive ? <Power size={12} /> : <PowerOff size={12} />}
                        {option.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleEdit(option)} className="p-1.5 hover:bg-bg-tertiary rounded text-brand-blue">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteMut.mutate(option._id)} className="p-1.5 hover:bg-bg-tertiary rounded text-accent-red">
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
      )}
    </div>
  );
}
