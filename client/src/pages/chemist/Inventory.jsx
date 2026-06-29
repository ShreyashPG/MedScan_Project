import { useEffect, useState } from 'react';
import {
  Package, Plus, Edit, Trash2, Search, Download, X, Save, Loader2,
  AlertCircle, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const emptyForm = {
  medicine_name: '', generic_name: '', ingredients: '', category: '',
  quantity: '', unit: 'tablets', price: '', expiry_date: '', manufacturer: '',
};

const InventoryModal = ({ item, onClose, onSave }) => {
  const [form, setForm] = useState(item ? {
    medicine_name: item.medicine_name || '',
    generic_name: item.generic_name || '',
    ingredients: item.ingredients || '',
    category: item.category || '',
    quantity: item.quantity?.toString() || '',
    unit: item.unit || 'tablets',
    price: item.price?.toString() || '',
    expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
    manufacturer: item.manufacturer || '',
  } : { ...emptyForm });

  const [loading, setLoading] = useState(false);
  const isEdit = !!item;

  const handleSave = async () => {
    if (!form.medicine_name.trim()) { toast.error('Medicine name is required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, quantity: parseInt(form.quantity) || 0, price: parseFloat(form.price) || 0 };
      if (isEdit) {
        await api.put(`/chemist/inventory/${item.id}`, payload);
        toast.success('Updated successfully!');
      } else {
        await api.post('/chemist/inventory', payload);
        toast.success('Medicine added to inventory!');
      }
      onClose();
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Medicine' : 'Add Medicine to Inventory'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Medicine Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-input" value={form.medicine_name} onChange={e => setForm({ ...form, medicine_name: e.target.value })} placeholder="e.g. Paracetamol 500mg" />
            </div>
            <div className="form-group">
              <label className="form-label">Generic Name</label>
              <input className="form-input" value={form.generic_name} onChange={e => setForm({ ...form, generic_name: e.target.value })} placeholder="e.g. Acetaminophen" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Active Ingredients</label>
            <input className="form-input" value={form.ingredients} onChange={e => setForm({ ...form, ingredients: e.target.value })} placeholder="e.g. Paracetamol, Caffeine" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                <option>Analgesic</option>
                <option>Antibiotic</option>
                <option>Antacid</option>
                <option>Antifungal</option>
                <option>Antihistamine</option>
                <option>Antiviral</option>
                <option>Cardiovascular</option>
                <option>Diabetes</option>
                <option>Multivitamin</option>
                <option>Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Manufacturer</label>
              <input className="form-input" value={form.manufacturer} onChange={e => setForm({ ...form, manufacturer: e.target.value })} placeholder="Manufacturer name" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input type="number" className="form-input" min="0" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <select className="form-select" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                <option>tablets</option>
                <option>capsules</option>
                <option>bottles</option>
                <option>strips</option>
                <option>vials</option>
                <option>tubes</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input type="number" className="form-input" min="0" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input type="date" className="form-input" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
            {isEdit ? 'Update' : 'Add Medicine'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async (searchTerm = '') => {
    setLoading(true);
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const { data } = await api.get('/chemist/inventory', { params });
      setInventory(data.data || []);
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this medicine from inventory?')) return;
    setDeleting(id);
    try {
      await api.delete(`/chemist/inventory/${id}`);
      setInventory(inv => inv.filter(item => item.id !== id));
      toast.success('Removed from inventory');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const token = localStorage.getItem('medscan_token');
      const response = await fetch('http://localhost:5000/api/pdf/chemist-inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pharmacy_inventory_${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const filteredInventory = search
    ? inventory.filter(i =>
        i.medicine_name.toLowerCase().includes(search.toLowerCase()) ||
        (i.generic_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (i.category || '').toLowerCase().includes(search.toLowerCase())
      )
    : inventory;

  const lowStockCount = inventory.filter(i => i.quantity < 10).length;
  const expiredCount = inventory.filter(i => i.expiry_date && new Date(i.expiry_date) < new Date()).length;

  return (
    <div className="fade-in">
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>Pharmacy Inventory</h2>
          <p>Manage your medicines stock and pricing</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleDownloadPdf} disabled={downloadingPdf || inventory.length === 0}>
            {downloadingPdf ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Download size={16} />}
            Export PDF
          </button>
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setShowModal(true); }}>
            <Plus size={16} /> Add Medicine
          </button>
        </div>
      </div>

      {/* Alerts */}
      {lowStockCount > 0 && (
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} />
          <span><strong>{lowStockCount} medicine(s)</strong> are running low (quantity &lt; 10)</span>
        </div>
      )}
      {expiredCount > 0 && (
        <div className="alert alert-danger" style={{ marginBottom: 16 }}>
          <AlertCircle size={16} />
          <span><strong>{expiredCount} medicine(s)</strong> have expired and should be removed</span>
        </div>
      )}

      {/* Summary stats */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon green"><Package size={22} /></div>
          <div><div className="stat-value">{inventory.length}</div><div className="stat-label">Total Items</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><CheckCircle size={22} /></div>
          <div><div className="stat-value">{inventory.filter(i => i.quantity >= 10).length}</div><div className="stat-label">Well Stocked</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow"><AlertCircle size={22} /></div>
          <div><div className="stat-value">{lowStockCount}</div><div className="stat-label">Low Stock</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertCircle size={22} /></div>
          <div><div className="stat-value">{expiredCount}</div><div className="stat-label">Expired</div></div>
        </div>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-bar" style={{ flex: 1 }}>
            <Search size={16} className="search-icon" />
            <input
              className="form-input"
              placeholder="Search by name, generic, category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="badge badge-primary">{filteredInventory.length} items</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : filteredInventory.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Package size={36} /></div>
            <h3>{search ? 'No Results' : 'Inventory Empty'}</h3>
            <p>{search ? `No medicines match "${search}"` : 'Start by adding medicines to your inventory'}</p>
            {!search && (
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <Plus size={16} /> Add First Medicine
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Generic Name</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map(item => {
                const isLow = item.quantity < 10;
                const isExpired = item.expiry_date && new Date(item.expiry_date) < new Date();
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.medicine_name}</div>
                      {item.manufacturer && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.manufacturer}</div>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.generic_name || '–'}</td>
                    <td>
                      {item.category ? <span className="badge badge-neutral">{item.category}</span> : '–'}
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: isLow ? 'var(--danger)' : 'var(--text)' }}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.price ? `₹${item.price}` : '–'}</td>
                    <td>
                      {item.expiry_date ? (
                        <span style={{ color: isExpired ? 'var(--danger)' : 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {new Date(item.expiry_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      ) : '–'}
                    </td>
                    <td>
                      {isExpired ? (
                        <span className="badge badge-danger">Expired</span>
                      ) : isLow ? (
                        <span className="badge badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => { setEditItem(item); setShowModal(true); }}
                          title="Edit"
                          style={{ color: 'var(--secondary)' }}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={deleting === item.id}
                          title="Delete"
                          style={{ color: 'var(--danger)' }}
                        >
                          {deleting === item.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <InventoryModal
          item={editItem}
          onClose={() => { setShowModal(false); setEditItem(null); }}
          onSave={fetchInventory}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Inventory;
