import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ScanLine, User, Stethoscope, ShoppingBag, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const roleOptions = [
  { value: 'patient', label: 'Patient', icon: '🧑‍⚕️', desc: 'Access prescriptions & history' },
  { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️', desc: 'Manage patient records' },
  { value: 'chemist', label: 'Chemist', icon: '💊', desc: 'Manage pharmacy inventory' },
];

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-up">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <ScanLine size={26} />
          </div>
          <div>
            <div className="auth-logo-title">MedScan</div>
            <div className="auth-logo-sub">Healthcare Platform</div>
          </div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your account to continue</p>

        {error && (
          <div className="alert alert-danger" style={{ marginBottom: 20 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-block btn-lg ${loading ? 'btn-loading' : ''}`}
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <><Loader2 size={18} className="spinning" /> Signing in...</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0 20px' }}>
          <span className="divider-text">New to MedScan?</span>
        </div>

        <Link to="/register" className="btn btn-outline btn-block">
          Create an Account
        </Link>
      </div>

      <style>{`
        .spinning { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Login;
