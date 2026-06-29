import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ScanLine, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const roleOptions = [
  { value: 'patient', label: 'Patient', icon: '🧑‍⚕️' },
  { value: 'doctor', label: 'Doctor', icon: '👨‍⚕️' },
  { value: 'chemist', label: 'Chemist', icon: '💊' },
];

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'patient',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Invalid email address';
    if (!form.phone.match(/^\d{10,15}$/)) errs.phone = 'Enter a valid phone number (10-15 digits)';
    if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.role,
      });
      login(data.token, data.user);
      toast.success(`Account created! Welcome, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card slide-up" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <ScanLine size={26} />
          </div>
          <div>
            <div className="auth-logo-title">MedScan</div>
            <div className="auth-logo-sub">Healthcare Platform</div>
          </div>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join MedScan to manage your healthcare data</p>

        {errors.general && (
          <div className="alert alert-danger" style={{ marginBottom: 16 }}>⚠️ {errors.general}</div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <div className="form-group">
            <label className="form-label">I am a</label>
            <div className="role-selector">
              {roleOptions.map((role) => (
                <div
                  key={role.value}
                  className={`role-option ${form.role === role.value ? 'selected' : ''}`}
                  onClick={() => setForm({ ...form, role: role.value })}
                >
                  <span className="role-option-icon">{role.icon}</span>
                  <span className="role-option-label">{role.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                className={`form-input ${errors.name ? 'error' : ''}`}
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                required
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                className={`form-input ${errors.phone ? 'error' : ''}`}
                placeholder="9876543210"
                value={form.phone}
                onChange={handleChange}
                required
              />
              {errors.phone && <span className="form-error">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
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
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              {errors.confirmPassword && <span className="form-error">{errors.confirmPassword}</span>}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? <><Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> Creating Account...</> : 'Create Account'}
          </button>
        </form>

        <div className="divider" style={{ margin: '24px 0 20px' }}>
          <span className="divider-text">Already have an account?</span>
        </div>

        <Link to="/login" className="btn btn-outline btn-block">Sign In</Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Register;
