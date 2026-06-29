import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine, History, Users, Package, TrendingUp,
  ClipboardList, ArrowRight, Calendar, Activity, Sparkles, AlertTriangle, Pill, IndianRupee
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const COLORS = ['#0F766E', '#2563EB', '#F59E0B', '#EC4899', '#8B5CF6', '#10B981'];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [user?.role]);

  const fetchAnalytics = async () => {
    if (!user?.role) return;
    try {
      setLoading(true);
      const { data } = await api.get(`/analytics/${user.role}`);
      setAnalytics(data.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const roleConfig = {
    patient: {
      subtitle: 'Track your medication history, scan records, and AI health insights',
      color: 'var(--secondary)',
    },
    doctor: {
      subtitle: 'Manage clinical records, patient statistics, and AI summaries',
      color: 'var(--primary)',
    },
    chemist: {
      subtitle: 'Monitor stock levels, inventory valuation, and expiring medications',
      color: 'var(--warning)',
    },
  };

  const config = roleConfig[user?.role] || roleConfig.patient;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Welcome Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${config.color} 0%, var(--primary-dark) 100%)`,
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
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
        <div style={{ position: 'absolute', right: -20, top: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: 4 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 style={{ color: 'white', marginBottom: 6, fontSize: '1.6rem', fontWeight: 800 }}>
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '0.9rem' }}>{config.subtitle}</p>
        </div>

        <button className="btn btn-primary" onClick={() => navigate('/scan')} style={{ background: 'white', color: 'var(--primary)', fontWeight: 700, border: 'none', boxShadow: '0 4px 14px rgba(0,0,0,0.15)' }}>
          <ScanLine size={18} /> Scan New Prescription
        </button>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ height: 300 }}><div className="spinner" /></div>
      ) : (
        <>
          {/* ================= PATIENT DASHBOARD ================= */}
          {user?.role === 'patient' && analytics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Stat Cards */}
              <div className="grid-3" style={{ gap: 16 }}>
                <div className="stat-card blue">
                  <div className="stat-card-header"><span className="stat-card-title">Monthly Scans</span><div className="stat-card-icon"><ClipboardList size={20} /></div></div>
                  <div className="stat-card-value">{analytics.monthlyScans?.reduce((acc, curr) => acc + parseInt(curr.count), 0) || 0}</div>
                  <div className="stat-card-desc">Saved in medical record</div>
                </div>
                <div className="stat-card green">
                  <div className="stat-card-header"><span className="stat-card-title">Doctors Consulted</span><div className="stat-card-icon"><Users size={20} /></div></div>
                  <div className="stat-card-value">{analytics.topDoctors?.length || 0}</div>
                  <div className="stat-card-desc">Unique healthcare providers</div>
                </div>
                <div className="stat-card yellow">
                  <div className="stat-card-header"><span className="stat-card-title">Medicines Tracked</span><div className="stat-card-icon"><Pill size={20} /></div></div>
                  <div className="stat-card-value">{analytics.topMedicines?.length || 0}</div>
                  <div className="stat-card-desc">Extracted via Groq AI</div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid-2" style={{ gap: 20 }}>
                {/* Area Chart: Scan Activity */}
                <div className="card">
                  <div className="card-header"><h4 style={{ margin: 0 }}>📈 Scan Activity Trend</h4></div>
                  <div className="card-body" style={{ height: 260 }}>
                    {analytics.monthlyScans?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.monthlyScans}>
                          <defs>
                            <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0F766E" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#0F766E" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} />
                          <Tooltip />
                          <Area type="monotone" dataKey="count" stroke="#0F766E" fillOpacity={1} fill="url(#colorScans)" name="Scans" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : <div className="empty-state">No scan history available</div>}
                  </div>
                </div>

                {/* Bar Chart: Top Prescribed Medicines */}
                <div className="card">
                  <div className="card-header"><h4 style={{ margin: 0 }}>💊 Top Prescribed Medicines</h4></div>
                  <div className="card-body" style={{ height: 260 }}>
                    {analytics.topMedicines?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.topMedicines} layout="vertical">
                          <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                          <YAxis dataKey="name" type="category" stroke="var(--text-muted)" fontSize={11} width={100} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#2563EB" radius={[0, 4, 4, 0]} name="Times Prescribed" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div className="empty-state">No medicine data yet</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= DOCTOR DASHBOARD ================= */}
          {user?.role === 'doctor' && analytics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Summary Stats */}
              <div className="grid-3" style={{ gap: 16 }}>
                <div className="stat-card green">
                  <div className="stat-card-header"><span className="stat-card-title">Total Patients</span><div className="stat-card-icon"><Users size={20} /></div></div>
                  <div className="stat-card-value">{analytics.summary?.totalPatients || 0}</div>
                  <div className="stat-card-desc">Registered under your profile</div>
                </div>
                <div className="stat-card blue">
                  <div className="stat-card-header"><span className="stat-card-title">Total Consultations</span><div className="stat-card-icon"><Activity size={20} /></div></div>
                  <div className="stat-card-value">{analytics.summary?.totalVisits || 0}</div>
                  <div className="stat-card-desc">Recorded visit sessions</div>
                </div>
                <div className="stat-card yellow">
                  <div className="stat-card-header"><span className="stat-card-title">Avg Visits / Patient</span><div className="stat-card-icon"><TrendingUp size={20} /></div></div>
                  <div className="stat-card-value">{analytics.summary?.avgVisits || 0}</div>
                  <div className="stat-card-desc">Consultation frequency</div>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 20 }}>
                {/* Line Chart: Visit Trends */}
                <div className="card">
                  <div className="card-header"><h4 style={{ margin: 0 }}>📊 Monthly Patient Visits</h4></div>
                  <div className="card-body" style={{ height: 260 }}>
                    {analytics.monthlyVisits?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.monthlyVisits}>
                          <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="visits" fill="#0F766E" radius={[4, 4, 0, 0]} name="Visits" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div className="empty-state">No visit data available</div>}
                  </div>
                </div>

                {/* Pie Chart: Top Diagnoses */}
                <div className="card">
                  <div className="card-header"><h4 style={{ margin: 0 }}>🩺 Frequent Diagnoses</h4></div>
                  <div className="card-body" style={{ height: 260, display: 'flex', alignItems: 'center' }}>
                    {analytics.topDiagnoses?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analytics.topDiagnoses} dataKey="count" nameKey="diagnosis" cx="50%" cy="50%" outerRadius={80} label>
                            {analytics.topDiagnoses.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div className="empty-state">No diagnoses logged</div>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= CHEMIST DASHBOARD ================= */}
          {user?.role === 'chemist' && analytics && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Chemist Stats */}
              <div className="grid-3" style={{ gap: 16 }}>
                <div className="stat-card green">
                  <div className="stat-card-header"><span className="stat-card-title">Total Items in Stock</span><div className="stat-card-icon"><Package size={20} /></div></div>
                  <div className="stat-card-value">{analytics.summary?.totalItems || 0}</div>
                  <div className="stat-card-desc">Active inventory SKUs</div>
                </div>
                <div className="stat-card red">
                  <div className="stat-card-header"><span className="stat-card-title">Low Stock Alert</span><div className="stat-card-icon"><AlertTriangle size={20} /></div></div>
                  <div className="stat-card-value">{analytics.lowStock?.length || 0}</div>
                  <div className="stat-card-desc">Items below 10 units</div>
                </div>
                <div className="stat-card yellow">
                  <div className="stat-card-header"><span className="stat-card-title">Total Valuation</span><div className="stat-card-icon"><IndianRupee size={20} /></div></div>
                  <div className="stat-card-value">₹{analytics.summary?.totalValuation || 0}</div>
                  <div className="stat-card-desc">Estimated inventory value</div>
                </div>
              </div>

              <div className="grid-2" style={{ gap: 20 }}>
                {/* Category Breakdown */}
                <div className="card">
                  <div className="card-header"><h4 style={{ margin: 0 }}>📦 Inventory Category Share</h4></div>
                  <div className="card-body" style={{ height: 260, display: 'flex', alignItems: 'center' }}>
                    {analytics.categoryBreakdown?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analytics.categoryBreakdown} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label>
                            {analytics.categoryBreakdown.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div className="empty-state">No inventory categories</div>}
                  </div>
                </div>

                {/* Low Stock Bar */}
                <div className="card">
                  <div className="card-header"><h4 style={{ margin: 0 }}>⚠️ Critical Stock Levels (&lt;10 Units)</h4></div>
                  <div className="card-body" style={{ height: 260 }}>
                    {analytics.lowStock?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.lowStock}>
                          <XAxis dataKey="medicine_name" stroke="var(--text-muted)" fontSize={11} />
                          <YAxis stroke="var(--text-muted)" fontSize={12} />
                          <Tooltip />
                          <Bar dataKey="quantity" fill="#DC2626" radius={[4, 4, 0, 0]} name="Units Remaining" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : <div className="empty-state">All items well stocked</div>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
