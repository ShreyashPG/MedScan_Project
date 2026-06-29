import { useEffect, useState } from 'react';
import { History, Search, Filter, Trash2, Download, ChevronDown, ChevronUp, Calendar, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const ScanHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [filterDoctor, setFilterDoctor] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [expanded, setExpanded] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchHistory();
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchHistory(filterDoctor);
  }, [filterDoctor]);

  const fetchHistory = async (doctor = '') => {
    setLoading(true);
    try {
      const params = doctor ? { doctor } : {};
      const { data } = await api.get('/patient/history', { params });
      setHistory(data.data || []);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const { data } = await api.get('/patient/doctors');
      setDoctors(data.data || []);
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    setDeleting(id);
    try {
      await api.delete(`/patient/history/${id}`);
      setHistory(h => h.filter(item => item.id !== id));
      toast.success('Record deleted');
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
      const params = filterDoctor ? `?doctor=${encodeURIComponent(filterDoctor)}` : '';
      const response = await fetch(`http://localhost:5000/api/pdf/patient-history${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('PDF generation failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical_history${filterDoctor ? `_${filterDoctor}` : ''}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const toggleExpand = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }));

  const filteredHistory = searchInput
    ? history.filter(h =>
        (h.doctor_name || '').toLowerCase().includes(searchInput.toLowerCase()) ||
        (h.diagnosis || '').toLowerCase().includes(searchInput.toLowerCase()) ||
        (h.medicines_json || []).some(m => m.name?.toLowerCase().includes(searchInput.toLowerCase()))
      )
    : history;

  return (
    <div className="fade-in">
      <div className="page-header-row">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>My Scan History</h2>
          <p>View and manage your prescription scan records</p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleDownloadPdf}
          disabled={downloadingPdf || history.length === 0}
        >
          {downloadingPdf ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Download size={16} />}
          Download PDF
        </button>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginTop: 20, marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', padding: '16px 20px' }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={16} className="search-icon" />
            <input
              className="form-input"
              placeholder="Search by medicine, diagnosis..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="form-select"
              value={filterDoctor}
              onChange={e => setFilterDoctor(e.target.value)}
              style={{ minWidth: 180 }}
            >
              <option value="">All Doctors</option>
              {doctors.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            {filterDoctor && (
              <button className="btn btn-ghost btn-sm" onClick={() => setFilterDoctor('')}>
                <X size={14} /> Clear
              </button>
            )}
          </div>
          <span className="badge badge-primary">{filteredHistory.length} records</span>
        </div>
      </div>

      {loading ? (
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading history...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><History size={36} /></div>
            <h3>No Records Found</h3>
            <p>{filterDoctor ? `No records from Dr. ${filterDoctor}` : 'No scan history yet. Scan a prescription to get started.'}</p>
          </div>
        </div>
      ) : (
        <div className="timeline">
          {filteredHistory.map((record) => {
            const medicines = record.medicines_json || [];
            const isOpen = expanded[record.id];
            return (
              <div key={record.id} className="timeline-item">
                <div className="card" style={{ cursor: 'pointer' }}>
                  {/* Header */}
                  <div
                    className="card-header"
                    onClick={() => toggleExpand(record.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 'var(--radius-md)',
                        background: 'var(--primary-50)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0,
                      }}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          Dr. {record.doctor_name || 'Unknown Doctor'}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(record.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'long', year: 'numeric'
                          })}
                          {medicines.length > 0 && ` · ${medicines.length} medicine(s)`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {record.diagnosis && (
                        <span className="badge badge-secondary">{record.diagnosis.slice(0, 20)}</span>
                      )}
                      {isOpen ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isOpen && (
                    <div className="card-body">
                      {record.diagnosis && (
                        <p style={{ marginBottom: 12 }}><strong>Diagnosis: </strong>{record.diagnosis}</p>
                      )}
                      {record.notes && (
                        <p style={{ marginBottom: 12 }}><strong>Notes: </strong>{record.notes}</p>
                      )}

                      {medicines.length > 0 && (
                        <>
                          <h5 style={{ marginBottom: 10 }}>💊 Prescribed Medicines</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {medicines.map((med, mi) => (
                              <div key={mi} className="medicine-card">
                                <div className="medicine-card-name">{med.name}</div>
                                <div className="medicine-card-details">
                                  {med.dosage && <span className="medicine-detail-chip">💉 {med.dosage}</span>}
                                  {med.frequency && <span className="medicine-detail-chip">🔄 {med.frequency}</span>}
                                  {med.duration && <span className="medicine-detail-chip">📅 {med.duration}</span>}
                                  {med.instructions && <span className="medicine-detail-chip">📋 {med.instructions}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(record.id)}
                          disabled={deleting === record.id}
                        >
                          {deleting === record.id ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Trash2 size={14} />}
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ScanHistory;
