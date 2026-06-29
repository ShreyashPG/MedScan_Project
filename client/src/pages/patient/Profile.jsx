import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Phone, Mail, Save, Loader2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const roleColors = { patient: 'var(--secondary)', doctor: 'var(--primary)', chemist: 'var(--warning)' };
  const roleEmojis = { patient: '🧑‍⚕️', doctor: '👨‍⚕️', chemist: '💊' };

  return (
    <div className="fade-in" style={{ maxWidth: 600 }}>
      <div className="page-header">
        <h2>My Profile</h2>
        <p>Manage your personal information</p>
      </div>

      {/* Profile Avatar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `linear-gradient(135deg, ${roleColors[user?.role] || 'var(--primary)'}, var(--primary-dark))`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: '2rem', fontWeight: 800,
            boxShadow: 'var(--shadow-primary)',
          }}>
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 style={{ marginBottom: 4 }}>{user?.name}</h3>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>{user?.email}</p>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                {roleEmojis[user?.role]} {user?.role}
              </span>
              <span className="badge badge-neutral">
                <Shield size={11} /> Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card">
        <div className="card-header">
          <h4 style={{ margin: 0 }}>Edit Information</h4>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                <User size={14} style={{ display: 'inline', marginRight: 4 }} />
                Full Name
              </label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <Phone size={14} style={{ display: 'inline', marginRight: 4 }} />
                Phone Number
              </label>
              <input
                className="form-input"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="10-digit phone"
              />
            </div>
            <div className="form-group">
              <label className="form-label">
                <Mail size={14} style={{ display: 'inline', marginRight: 4 }} />
                Email Address
              </label>
              <input
                className="form-input"
                value={user?.email || ''}
                disabled
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Email cannot be changed</span>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setForm({ name: user?.name || '', phone: user?.phone || '' })}
              >
                Reset
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Save size={16} />}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Profile;
