import { useEffect, useState } from 'react';
import { Users, Search, Phone, Calendar, ArrowRight, Loader2, User, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const PatientLookup = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchPhone, setSearchPhone] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/doctor/patients');
      setPatients(data.data || []);
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;
    navigate(`/doctor/patient/${searchPhone.trim()}`);
  };

  const filteredPatients = searchPhone
    ? patients.filter(p => p.patient_phone.includes(searchPhone) || (p.patient_name || '').toLowerCase().includes(searchPhone.toLowerCase()))
    : patients;

  return (
    <div className="fade-in">
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>Patient Records</h2>
          <p>Look up patients by phone number and manage their prescription history</p>
        </div>
      </div>

      {/* Search / Lookup */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--primary-50), var(--secondary-50))' }}>
        <div className="card-body">
          <h4 style={{ marginBottom: 12, color: 'var(--primary)' }}>
            <Phone size={16} style={{ display: 'inline', marginRight: 8 }} />
            Look Up Patient by Phone
          </h4>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
            <input
              className="form-input"
              placeholder="Enter patient phone number..."
              value={searchPhone}
              onChange={e => setSearchPhone(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!searchPhone.trim() || searching}
            >
              {searching ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={16} />}
              View History
            </button>
          </form>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 8, marginBottom: 0 }}>
            💡 Phone number is the unique identifier for patients
          </p>
        </div>
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="loading-screen">
          <div className="spinner" />
          <p>Loading patients...</p>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={36} /></div>
            <h3>No Patients Yet</h3>
            <p>Scan a prescription and save it to a patient record to get started</p>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Your Patients ({filteredPatients.length})</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredPatients.map((patient) => (
              <div
                key={patient.patient_phone}
                className="card hover-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/doctor/patient/${patient.patient_phone}`)}
              >
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
                  }}>
                    {(patient.patient_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>
                      {patient.patient_name || 'Unknown Patient'}
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={13} /> {patient.patient_phone}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Activity size={13} /> {patient.visit_count} visit(s)
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={13} /> Last: {new Date(patient.last_visit).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <ArrowRight size={20} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default PatientLookup;
