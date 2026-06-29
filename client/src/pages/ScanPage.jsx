import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import {
  Upload, ScanLine, X, AlertCircle, CheckCircle2,
  Info, Loader2, Save, FlaskConical, ChevronDown, ChevronUp,
  Phone, FileText, BookImage, Search, ChevronLeft, ChevronRight,
  Sparkles, Database
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

/* ============================================================
   MEDICINE INFO MODAL
   ============================================================ */
const MedicineInfoModal = ({ medicine, onClose }) => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/scan/medicine-info', { medicine_name: medicine.name });
      setInfo(data.data);
    } catch {
      toast.error('Failed to fetch medicine information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 style={{ color: 'var(--primary)' }}>💊 {medicine.name}</h3>
            {medicine.dosage && <p style={{ fontSize: '0.85rem', margin: '4px 0 0' }}>Dosage: {medicine.dosage}</p>}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {!info && !loading && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <FlaskConical size={48} color="var(--primary)" style={{ marginBottom: 16 }} />
              <p style={{ marginBottom: 20 }}>Get detailed information about <strong>{medicine.name}</strong></p>
              <button className="btn btn-primary" onClick={fetchInfo}>
                <Info size={16} /> Fetch Medicine Information
              </button>
            </div>
          )}
          {loading && (
            <div className="loading-screen">
              <Loader2 size={36} color="var(--primary)" style={{ animation: 'spin 0.8s linear infinite' }} />
              <p>Analyzing medicine with AI...</p>
            </div>
          )}
          {info && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="grid-2">
                <div style={{ background: 'var(--primary-50)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Generic Name</p>
                  <p style={{ fontWeight: 600, color: 'var(--text)', margin: 0 }}>{info.generic_name || 'N/A'}</p>
                </div>
                <div style={{ background: 'var(--secondary-50)', borderRadius: 'var(--radius-md)', padding: 14 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Drug Class</p>
                  <p style={{ fontWeight: 600, color: 'var(--text)', margin: 0 }}>{info.drug_class || 'N/A'}</p>
                </div>
              </div>
              {info.uses?.length > 0 && (
                <div>
                  <h5 style={{ marginBottom: 8, color: 'var(--primary)' }}>✅ Medical Uses</h5>
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {info.uses.slice(0, 5).map((use, i) => (
                      <li key={i} style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--success)', flexShrink: 0 }}>•</span> {use}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {info.side_effects?.common?.length > 0 && (
                <div>
                  <h5 style={{ marginBottom: 8, color: 'var(--warning)' }}>⚠️ Common Side Effects</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {info.side_effects.common.slice(0, 6).map((se, i) => (
                      <span key={i} className="badge badge-warning">{se}</span>
                    ))}
                  </div>
                </div>
              )}
              {info.side_effects?.serious?.length > 0 && (
                <div className="alert alert-danger">
                  <AlertCircle size={16} />
                  <div><strong>Serious Side Effects: </strong>{info.side_effects.serious.slice(0, 3).join(', ')}</div>
                </div>
              )}
              {info.active_ingredients?.length > 0 && (
                <div>
                  <h5 style={{ marginBottom: 8 }}>🧬 Active Ingredients</h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {info.active_ingredients.map((ing, i) => (
                      <span key={i} className="badge badge-secondary">{ing}</span>
                    ))}
                  </div>
                </div>
              )}
              {info.storage && (
                <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: 12 }}>
                  <strong style={{ fontSize: '0.875rem' }}>📦 Storage: </strong>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{info.storage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SAVE TO PATIENT MODAL (DOCTOR)
   ============================================================ */
const SaveToPatientModal = ({ prescriptionId, onClose, onSave }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!phone) { toast.error('Patient phone is required'); return; }
    setLoading(true);
    try {
      await api.post('/doctor/patient/record', {
        patient_phone: phone, patient_name: name, prescription_id: prescriptionId, diagnosis, notes,
      });
      toast.success('Saved to patient record!');
      onClose();
      onSave?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Save to Patient Record</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Patient Phone <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="form-input" placeholder="9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Patient Name</label>
            <input className="form-input" placeholder="Optional" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Diagnosis</label>
            <input className="form-input" placeholder="Diagnosis / condition" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" placeholder="Additional notes" value={notes} onChange={e => setNotes(e.target.value)} />
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

/* ============================================================
   SAMPLE PRESCRIPTIONS GALLERY
   ============================================================ */
const SampleGallery = ({ onSelect }) => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const LIMIT = 8;

  useEffect(() => {
    fetchSamples();
  }, [page, search]);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/samples', { params: { page, limit: LIMIT, search } });
      setAvailable(data.available);
      setSamples(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setAvailable(false);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  if (!available && !loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-50), var(--secondary-50))',
        border: '2px dashed var(--primary-200)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        textAlign: 'center',
      }}>
        <Database size={48} color="var(--primary)" style={{ marginBottom: 16, opacity: 0.7 }} />
        <h3 style={{ marginBottom: 8, color: 'var(--text)' }}>Dataset Not Downloaded</h3>
        <p style={{ marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
          Run the following command to download the Medical Prescription OCR Dataset from HuggingFace:
        </p>
        <div style={{
          background: '#1E293B', color: '#A3E635', borderRadius: 'var(--radius-md)',
          padding: '12px 20px', fontFamily: 'monospace', fontSize: '0.9rem',
          display: 'inline-block', marginBottom: 16,
        }}>
          python download_dataset.py
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Downloads 40 synthetic handwritten prescription images for testing
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: 'var(--primary)', borderRadius: 'var(--radius-md)',
            padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Database size={16} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Sample Prescriptions</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Medical Prescription OCR Dataset · {total} images
            </div>
          </div>
          <span className="badge badge-success">
            <Sparkles size={10} /> AI Ready
          </span>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <div className="search-bar" style={{ maxWidth: 200 }}>
            <Search size={14} className="search-icon" />
            <input
              className="form-input"
              placeholder="Search..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '8px 8px 8px 34px' }}
            />
          </div>
        </form>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{
              height: 140, borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(90deg, var(--border-light) 25%, var(--border) 50%, var(--border-light) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
            }} />
          ))}
        </div>
      ) : samples.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
          No samples found
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {samples.map((sample) => (
              <div
                key={sample.id}
                className="hover-card"
                onClick={() => onSelect(sample)}
                style={{
                  cursor: 'pointer',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: 'var(--white)',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                title={`Sample #${sample.id} — Click to scan`}
              >
                {/* Badge */}
                <div style={{
                  position: 'absolute', top: 6, right: 6, zIndex: 1,
                  background: 'rgba(15,118,110,0.9)', color: 'white',
                  borderRadius: 'var(--radius-sm)', padding: '2px 6px',
                  fontSize: '0.65rem', fontWeight: 600,
                }}>
                  #{sample.id}
                </div>

                <img
                  src={`http://localhost:5000${sample.image_url}`}
                  alt={`Prescription ${sample.id}`}
                  style={{
                    width: '100%', height: 130,
                    objectFit: 'cover', display: 'block',
                  }}
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div style={{
                  height: 130, display: 'none', alignItems: 'center',
                  justifyContent: 'center', background: 'var(--surface-2)',
                  color: 'var(--text-muted)', flexDirection: 'column', gap: 4,
                }}>
                  <FileText size={24} />
                  <span style={{ fontSize: '0.7rem' }}>#{sample.id}</span>
                </div>

                <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--primary)' }}>
                    Click to Scan
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 1 }}>
                    Handwritten Rx
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} /> Prev
              </button>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

/* ============================================================
   SCAN RESULT DISPLAY
   ============================================================ */
const ScanResult = ({ result, user, onSelectMedicine, onSaveToHistory, savingToHistory, onSaveToPatient, onCheckAvailability, checkingAvailability, availability }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    {/* Prescription Info */}
    <div className="card">
      <div className="card-header">
        <h4 style={{ margin: 0, color: 'var(--primary)' }}>
          <CheckCircle2 size={18} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
          Prescription Details
        </h4>
        <div style={{ display: 'flex', gap: 8 }}>
          {result.is_sample && <span className="badge badge-secondary"><Database size={10} /> Dataset Sample</span>}
          <span className="badge badge-success">Scanned</span>
        </div>
      </div>
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Doctor', value: result.doctor_name },
          { label: 'Clinic', value: result.doctor_clinic },
          { label: 'Patient', value: result.patient_name },
          { label: 'Date', value: result.date },
          { label: 'Diagnosis', value: result.diagnosis },
          { label: 'Follow-up', value: result.follow_up },
        ].filter(f => f.value).map((field, i) => (
          <div key={i} style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{field.label}</p>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>{field.value}</p>
          </div>
        ))}
      </div>
    </div>

    {/* Ground Truth (dataset samples only) */}
    {result.is_sample && result.ground_truth && Object.keys(result.ground_truth).length > 0 && (
      <div className="alert alert-info" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 8 }}>
          <Database size={16} />
          Dataset Ground Truth (for comparison)
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxHeight: 120, overflowY: 'auto' }}>
          {typeof result.ground_truth === 'string'
            ? result.ground_truth
            : JSON.stringify(result.ground_truth, null, 2)}
        </div>
      </div>
    )}

    {/* Medicines */}
    {result.medicines?.length > 0 && (
      <div className="card">
        <div className="card-header">
          <h4 style={{ margin: 0 }}>💊 Medicines ({result.medicines.length})</h4>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {result.medicines.map((med, idx) => (
            <div key={idx} className="medicine-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="medicine-card-name">{med.name || 'Unknown Medicine'}</div>
                <button className="btn btn-ghost btn-sm" onClick={() => onSelectMedicine(med)} style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>
                  <Info size={14} /> Info
                </button>
              </div>
              <div className="medicine-card-details">
                {med.dosage && <span className="medicine-detail-chip">💉 {med.dosage}</span>}
                {med.frequency && <span className="medicine-detail-chip">🔄 {med.frequency}</span>}
                {med.duration && <span className="medicine-detail-chip">📅 {med.duration}</span>}
                {med.instructions && <span className="medicine-detail-chip">📋 {med.instructions}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {result.instructions && (
      <div className="alert alert-info">
        <Info size={16} />
        <div><strong>Doctor's Instructions: </strong>{result.instructions}</div>
      </div>
    )}

    {/* Availability (Chemist) */}
    {availability && (
      <div className="card">
        <div className="card-header"><h4 style={{ margin: 0 }}>Stock Availability</h4></div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {availability.map((item, idx) => (
            <div key={idx} className={`availability-item ${item.available ? 'available' : 'unavailable'}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{item.medicine_name}</strong>
                <span className={`badge ${item.available ? 'badge-success' : 'badge-danger'}`}>
                  {item.available ? '✅ In Stock' : '❌ Out of Stock'}
                </span>
              </div>
              {item.available && item.inventory_item && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                  Stock: {item.inventory_item.quantity} units · ₹{item.inventory_item.price}
                </p>
              )}
              {!item.available && item.alternatives?.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--warning)', marginBottom: 6 }}>Alternatives in inventory:</p>
                  {item.alternatives.map((alt, ai) => (
                    <div key={ai} className="alternative-item">
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{alt.medicine_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{alt.reason}</div>
                      {alt.note && <div style={{ fontSize: '0.78rem', color: 'var(--warning)', marginTop: 2 }}>⚠️ {alt.note}</div>}
                    </div>
                  ))}
                </div>
              )}
              {!item.available && item.alternatives?.length === 0 && (
                <p style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: 4 }}>No alternatives found in inventory</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

/* ============================================================
   MAIN SCAN PAGE
   ============================================================ */
const ScanPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Upload state
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  // UI state
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savingToHistory, setSavingToHistory] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availability, setAvailability] = useState(null);

  // Tabs: 'upload' | 'samples'
  const [activeTab, setActiveTab] = useState('upload');

  // Currently selected sample (for scanning without uploading)
  const [selectedSample, setSelectedSample] = useState(null);

  /* ---- Dropzone ---- */
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error('Image too large. Max 4MB.'); return; }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImage({ base64: reader.result.split(',')[1], mimeType: file.type || 'image/jpeg' });
      setResult(null);
      setAvailability(null);
      setSelectedSample(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 1,
  });

  const resetScan = () => {
    setImagePreview(null);
    setImage(null);
    setResult(null);
    setAvailability(null);
    setSelectedSample(null);
  };

  /* ---- Handle sample selection ---- */
  const handleSelectSample = (sample) => {
    setSelectedSample(sample);
    setImagePreview(`http://localhost:5000${sample.image_url}`);
    setImage(null); // no base64 needed — backend reads the file directly
    setResult(null);
    setAvailability(null);
    setActiveTab('upload'); // switch to upload tab to show preview
    toast.success(`Sample #${sample.id} selected — click Scan to analyze`);
  };

  /* ---- Scan ---- */
  const handleScan = async () => {
    setScanning(true);
    try {
      let data;
      if (selectedSample) {
        // Scan a dataset sample — backend reads image file directly
        const res = await api.post(`/samples/${selectedSample.id}/scan`);
        data = res.data.data;
      } else {
        if (!image) { toast.error('Please select an image first'); setScanning(false); return; }
        const res = await api.post('/scan/prescription', { image: image.base64, mimeType: image.mimeType });
        data = res.data.data;
      }
      setResult(data);
      toast.success('Prescription scanned successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Scan failed. Please try again.');
    } finally {
      setScanning(false);
    }
  };

  /* ---- Save to patient history (patient) ---- */
  const handleSaveToHistory = async () => {
    if (!result?.prescription_id) return;
    setSavingToHistory(true);
    try {
      await api.post('/patient/history', {
        prescription_id: result.prescription_id,
        doctor_name: result.doctor_name,
      });
      toast.success('Saved to your history!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSavingToHistory(false);
    }
  };

  /* ---- Check availability (chemist) ---- */
  const handleCheckAvailability = async () => {
    if (!result?.medicines?.length) { toast.error('No medicines found in scan'); return; }
    setCheckingAvailability(true);
    try {
      const { data } = await api.post('/chemist/check-availability', { medicines: result.medicines });
      setAvailability(data.data);
      toast.success('Availability check complete!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check failed');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const tabStyle = (tab) => ({
    padding: '10px 20px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 600,
    fontSize: '0.875rem',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: activeTab === tab ? 'var(--primary)' : 'transparent',
    color: activeTab === tab ? 'white' : 'var(--text-muted)',
  });

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>Scan Prescription</h2>
        <p>Upload a prescription image or pick from the Medical Prescription Dataset for AI-powered extraction</p>
      </div>

      <div className="grid-2" style={{ alignItems: 'start', gap: 24 }}>
        {/* ===== LEFT COLUMN ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Tabs */}
          <div style={{
            background: 'var(--surface-2)', borderRadius: 'var(--radius-md)',
            padding: 4, display: 'flex', gap: 4,
            border: '1px solid var(--border)',
          }}>
            <button style={tabStyle('upload')} onClick={() => setActiveTab('upload')}>
              <Upload size={16} /> Upload Image
            </button>
            <button style={tabStyle('samples')} onClick={() => setActiveTab('samples')}>
              <BookImage size={16} /> Dataset Samples
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="card">
              <div className="card-body">
                <div {...getRootProps()} className={`scan-dropzone ${isDragActive ? 'active' : ''}`}>
                  <input {...getInputProps()} />
                  {imagePreview ? (
                    <div style={{ position: 'relative' }}>
                      <img src={imagePreview} alt="Preview" style={{
                        width: '100%', maxHeight: 300, objectFit: 'contain',
                        borderRadius: 'var(--radius-md)',
                      }} />
                      {selectedSample && (
                        <div style={{
                          position: 'absolute', top: 8, left: 8,
                          background: 'var(--primary)', color: 'white',
                          borderRadius: 'var(--radius-sm)', padding: '4px 10px',
                          fontSize: '0.75rem', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          <Database size={12} /> Dataset Sample #{selectedSample.id}
                        </div>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => { e.stopPropagation(); resetScan(); }}
                        style={{ position: 'absolute', top: 8, right: 8 }}
                      >
                        <X size={14} /> Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="scan-dropzone-icon"><Upload size={32} /></div>
                      <h3>{isDragActive ? 'Drop prescription here' : 'Upload Prescription'}</h3>
                      <p>Drag & drop or click to select<br />
                        <span style={{ fontSize: '0.8rem' }}>JPG, PNG, WebP · Max 4MB</span>
                      </p>
                      <div style={{ marginTop: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        — or switch to <strong>Dataset Samples</strong> tab to pick a sample →
                      </div>
                    </>
                  )}
                </div>

                <button
                  className="btn btn-primary btn-block btn-lg"
                  onClick={handleScan}
                  disabled={(!image && !selectedSample) || scanning}
                  style={{ marginTop: 16 }}
                >
                  {scanning ? (
                    <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Scanning with Groq AI...</>
                  ) : (
                    <><ScanLine size={18} /> Scan Prescription</>
                  )}
                </button>

                {scanning && (
                  <div className="scanning-animation" style={{ marginTop: 16 }}>
                    <div className="scan-pulse"><ScanLine size={28} /></div>
                    <p style={{ fontWeight: 600, color: 'var(--primary)' }}>
                      {selectedSample ? 'Analyzing dataset sample with Groq AI...' : 'Analyzing with Groq AI...'}
                    </p>
                    <p style={{ fontSize: '0.8rem', margin: 0 }}>Extracting medicines and doctor information</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Samples Tab */}
          {activeTab === 'samples' && (
            <div className="card">
              <div className="card-body">
                <SampleGallery onSelect={handleSelectSample} />
              </div>
            </div>
          )}

          {/* Role-specific actions after scan */}
          {result && (
            <div className="card">
              <div className="card-header"><h4 style={{ margin: 0 }}>Actions</h4></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {user?.role === 'patient' && (
                  <button className="btn btn-primary" onClick={handleSaveToHistory} disabled={savingToHistory}>
                    {savingToHistory ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
                    Save to My History
                  </button>
                )}
                {user?.role === 'doctor' && (
                  <button className="btn btn-primary" onClick={() => setShowSaveModal(true)}>
                    <Save size={16} /> Save to Patient Record
                  </button>
                )}
                {user?.role === 'chemist' && (
                  <button className="btn btn-secondary" onClick={handleCheckAvailability} disabled={checkingAvailability}>
                    {checkingAvailability ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <FlaskConical size={16} />}
                    Check Stock Availability
                  </button>
                )}
                <button className="btn btn-ghost btn-sm" onClick={resetScan}>
                  <X size={14} /> Scan Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ===== RIGHT COLUMN — Results ===== */}
        <div>
          {!result && !scanning && (
            <div className="card">
              <div className="empty-state" style={{ padding: 48 }}>
                <div className="empty-state-icon"><FileText size={36} /></div>
                <h3>No Scan Yet</h3>
                <p>Upload a prescription image or pick a <strong>Dataset Sample</strong> and click Scan to extract medicine information using Groq AI</p>
              </div>
            </div>
          )}

          {result && (
            <ScanResult
              result={result}
              user={user}
              onSelectMedicine={setSelectedMedicine}
              onSaveToHistory={handleSaveToHistory}
              savingToHistory={savingToHistory}
              onSaveToPatient={() => setShowSaveModal(true)}
              onCheckAvailability={handleCheckAvailability}
              checkingAvailability={checkingAvailability}
              availability={availability}
            />
          )}
        </div>
      </div>

      {/* Medicine Info Modal */}
      {selectedMedicine && (
        <MedicineInfoModal medicine={selectedMedicine} onClose={() => setSelectedMedicine(null)} />
      )}

      {/* Save to Patient Modal (Doctor) */}
      {showSaveModal && (
        <SaveToPatientModal
          prescriptionId={result?.prescription_id}
          onClose={() => setShowSaveModal(false)}
          onSave={() => navigate('/doctor/patients')}
        />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default ScanPage;
