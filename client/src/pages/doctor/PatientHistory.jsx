import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Calendar, Download, Plus, Trash2, Loader2,
  ChevronDown, ChevronUp, Phone, X, Save
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const AddRecordModal = ({ phone, onClose, onSave }) => {
  const [form, setForm] = useState({ patient_name: '', diagnosis: '', notes: '', visit_date: new Date().toISOString().split('T')[0] });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/doctor/patient/record', { patient_phone: phone, ...form });
      toast.success('Record added!');
      onClose();
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Visit Record</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Patient Name</label>
            <input className="form-input" value={form.patient_name} onChange={e => setForm({ ...form, patient_name: e.target.value })} placeholder="Patient's full name" />
          </div>
          <div className="form-group">
            <label className="form-label">Visit Date</label>
            <input type="date" className="form-input" value={form.visit_date} onChange={e => setForm({ ...form, visit_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Diagnosis</label>
            <input className="form-input" value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="Condition / diagnosis" />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Treatment notes, instructions..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
            Save Record
          </button>
        </div>
      </div>
    </div>
  );
};

const PatientHistory = () => {
  const { phone } = useParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [patientName, setPatientName] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [phone]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/doctor/patient/${phone}`);
      setRecords(data.data || []);
      setPatientName(data.patient_name || '');
    } catch {
      toast.error('Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    setDeleting(id);
    try {
      await api.delete(`/doctor/patient/record/${id}`);
      setRecords(r => r.filter(item => item.id !== id));
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
      const response = await fetch(`http://localhost:5000/api/pdf/doctor-patient/${phone}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patient_${phone}_history.pdf`;
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

  return (
    <div className="fade-in">
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/doctor/patients')}>
            <ArrowLeft size={16} /> Back
          </button>
          <div>
            <h2 style={{ margin: 0 }}>{patientName || 'Patient History'}</h2>
            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
              <Phone size={14} /> {phone}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleDownloadPdf} disabled={downloadingPdf || records.length === 0}>
            {downloadingPdf ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Download size={16} />}
            PDF Report
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Record
          </button>
        </div>
      </div>

      {/* Summary card */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--primary-50), var(--secondary-50))' }}>
        <div className="card-body" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{records.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Visits</div>
          </div>
          <div style={{ width: 1, background: 'var(--border)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)' }}>
              {records.reduce((acc, r) => acc + ((r.medicines_json || []).length), 0)}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Medicines</div>
          </div>
          {records.length > 0 && (
            <>
              <div style={{ width: 1, background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                  {new Date(records[0].visit_date || records[0].created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Last Visit</div>
              </div>
            </>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-screen"><div className="spinner" /></div>
      ) : records.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <h3>No Records Yet</h3>
            <p>Add a visit record or scan a prescription for this patient</p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add First Record
            </button>
          </div>
        </div>
      ) : (
        <div className="timeline">
          {records.map((record) => {
            const medicines = record.medicines_json || [];
            const isOpen = expanded[record.id];
            return (
              <div key={record.id} className="timeline-item">
                <div className="card">
                  <div className="card-header" onClick={() => toggleExpand(record.id)} style={{ cursor: 'pointer' }}>
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
                          {new Date(record.visit_date || record.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {record.diagnosis || 'No diagnosis'} · {medicines.length} medicine(s)
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {isOpen ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                    </div>
                  </div>

                  {isOpen && (
                    <div className="card-body">
                      {record.diagnosis && <p style={{ marginBottom: 8 }}><strong>Diagnosis: </strong>{record.diagnosis}</p>}
                      {record.notes && <p style={{ marginBottom: 8 }}><strong>Notes: </strong>{record.notes}</p>}
                      {record.prescribing_doctor && <p style={{ marginBottom: 12 }}><strong>Prescribing Doctor: </strong>{record.prescribing_doctor}</p>}

                      {medicines.length > 0 && (
                        <>
                          <h5 style={{ marginBottom: 10 }}>💊 Medicines</h5>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                            {medicines.map((med, mi) => (
                              <div key={mi} className="medicine-card">
                                <div className="medicine-card-name">{med.name}</div>
                                <div className="medicine-card-details">
                                  {med.dosage && <span className="medicine-detail-chip">💉 {med.dosage}</span>}
                                  {med.frequency && <span className="medicine-detail-chip">🔄 {med.frequency}</span>}
                                  {med.duration && <span className="medicine-detail-chip">📅 {med.duration}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(record.id)} disabled={deleting === record.id}>
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

      {showAddModal && (
        <AddRecordModal phone={phone} onClose={() => setShowAddModal(false)} onSave={fetchHistory} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PatientHistory;
