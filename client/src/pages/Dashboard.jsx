import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine, History, Users, Package, TrendingUp,
  ClipboardList, ArrowRight, Calendar, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, recent: 0 });
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (user?.role === 'patient') {
        const { data } = await api.get('/patient/history');
        setStats({ total: data.count, recent: data.data?.slice(0, 3).length || 0 });
        setRecentItems(data.data?.slice(0, 3) || []);
      } else if (user?.role === 'doctor') {
        const { data } = await api.get('/doctor/patients');
        setStats({ total: data.count, recent: data.data?.slice(0, 3).length || 0 });
        setRecentItems(data.data?.slice(0, 3) || []);
      } else if (user?.role === 'chemist') {
        const { data } = await api.get('/chemist/inventory');
        setStats({ total: data.count, recent: data.data?.filter(i => i.quantity < 10).length || 0 });
        setRecentItems(data.data?.slice(0, 3) || []);
      }
    } catch {
      // Stats are optional, don't show error
    } finally {
      setLoading(false);
    }
  };

  const roleConfig = {
    patient: {
      greeting: 'Your Health Dashboard',
      subtitle: 'View your prescription history and scan new prescriptions',
      color: 'var(--secondary)',
      actions: [
        {
          icon: ScanLine, title: 'Scan Prescription', desc: 'Upload & analyze a prescription image using AI',
          action: () => navigate('/scan'), color: 'var(--primary)', bg: 'var(--primary-50)',
        },
        {
          icon: History, title: 'View Scan History', desc: 'Browse your past prescriptions by doctor',
          action: () => navigate('/patient/history'), color: 'var(--secondary)', bg: 'var(--secondary-50)',
        },
      ],
      statsConfig: [
        { label: 'Total Scans', value: stats.total, icon: ClipboardList, colorClass: 'green' },
        { label: 'Recent Records', value: stats.recent, icon: TrendingUp, colorClass: 'blue' },
      ],
    },
    doctor: {
      greeting: 'Doctor Dashboard',
      subtitle: 'Manage patient records and track prescription history',
      color: 'var(--primary)',
      actions: [
        {
          icon: ScanLine, title: 'Scan Prescription', desc: 'Analyze a prescription and save to patient record',
          action: () => navigate('/scan'), color: 'var(--primary)', bg: 'var(--primary-50)',
        },
        {
          icon: Users, title: 'Patient Records', desc: 'Lookup patients by phone number and view history',
          action: () => navigate('/doctor/patients'), color: 'var(--secondary)', bg: 'var(--secondary-50)',
        },
      ],
      statsConfig: [
        { label: 'Total Patients', value: stats.total, icon: Users, colorClass: 'green' },
        { label: 'Recent Patients', value: stats.recent, icon: Activity, colorClass: 'blue' },
      ],
    },
    chemist: {
      greeting: 'Pharmacy Dashboard',
      subtitle: 'Manage your inventory and check medicine availability',
      color: 'var(--warning)',
      actions: [
        {
          icon: ScanLine, title: 'Scan Prescription', desc: 'Check if prescribed medicines are in stock',
          action: () => navigate('/scan'), color: 'var(--primary)', bg: 'var(--primary-50)',
        },
        {
          icon: Package, title: 'Manage Inventory', desc: 'Add, update or remove medicines from stock',
          action: () => navigate('/chemist/inventory'), color: 'var(--warning)', bg: 'var(--warning-50)',
        },
      ],
      statsConfig: [
        { label: 'Total Items', value: stats.total, icon: Package, colorClass: 'green' },
        { label: 'Low Stock Items', value: stats.recent, icon: TrendingUp, colorClass: 'red' },
      ],
    },
  };

  const config = roleConfig[user?.role] || roleConfig.patient;

  return (
    <div className="fade-in">
      {/* Welcome Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${config.color} 0%, var(--primary-dark) 100%)`,
        borderRadius: 'var(--radius-xl)',
        padding: '32px',
        marginBottom: '28px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />
        <div style={{
          position: 'absolute', right: 60, bottom: -40,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} />
        <div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: 6 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 style={{ color: 'white', marginBottom: 8, fontSize: '1.75rem' }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>{config.subtitle}</p>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Activity size={16} color="rgba(255,255,255,0.8)" />
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', textTransform: 'capitalize' }}>
              {user?.role} Account
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'white', fontWeight: 500 }}>{user?.email}</div>
          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{user?.phone}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {config.statsConfig.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="stat-card hover-card">
              <div className={`stat-icon ${stat.colorClass}`}>
                <Icon size={24} />
              </div>
              <div>
                <div className="stat-value">{loading ? '–' : stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <h3 style={{ marginBottom: 16, color: 'var(--text)' }}>Quick Actions</h3>
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {config.actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <div
              key={idx}
              className="card hover-card"
              onClick={action.action}
              style={{ cursor: 'pointer', padding: 0 }}
            >
              <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 'var(--radius-md)',
                  background: action.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  color: action.color, flexShrink: 0,
                }}>
                  <Icon size={26} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ marginBottom: 4, color: 'var(--text)' }}>{action.title}</h4>
                  <p style={{ fontSize: '0.85rem', margin: 0 }}>{action.desc}</p>
                </div>
                <ArrowRight size={20} color="var(--text-muted)" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <>
          <h3 style={{ marginBottom: 16 }}>Recent Activity</h3>
          <div className="card">
            {recentItems.map((item, idx) => (
              <div key={idx} style={{
                padding: '16px 20px',
                borderBottom: idx < recentItems.length - 1 ? '1px solid var(--border-light)' : 'none',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--primary-50)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
                }}>
                  <Calendar size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  {user?.role === 'patient' && (
                    <>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        Dr. {item.doctor_name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(item.created_at).toLocaleDateString('en-IN')}
                        {item.medicines_json?.length > 0 && ` · ${item.medicines_json.length} medicines`}
                      </div>
                    </>
                  )}
                  {user?.role === 'doctor' && (
                    <>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {item.patient_name || 'Unknown Patient'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        📞 {item.patient_phone} · {item.visit_count} visits
                      </div>
                    </>
                  )}
                  {user?.role === 'chemist' && (
                    <>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.medicine_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Qty: {item.quantity} · ₹{item.price}
                      </div>
                    </>
                  )}
                </div>
                <span className={`badge ${item.quantity < 10 && user?.role === 'chemist' ? 'badge-danger' : 'badge-success'}`}>
                  {user?.role === 'chemist' ? (item.quantity < 10 ? 'Low Stock' : 'In Stock') : 'View'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
