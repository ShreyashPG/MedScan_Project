import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell, X } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/scan': 'Scan Prescription',
  '/patient/history': 'Scan History',
  '/patient/profile': 'My Profile',
  '/doctor/patients': 'Patient Records',
  '/doctor/profile': 'My Profile',
  '/chemist/inventory': 'Inventory',
  '/chemist/profile': 'My Profile',
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const title = Object.entries(pageTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'MedScan';

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 99, display: 'none',
          }}
          onClick={() => setSidebarOpen(false)}
          className="mobile-overlay"
        />
      )}

      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="main-content">
        {/* Top Bar */}
        <header className="topbar">
          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost btn-icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}
              id="mobile-menu-btn"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
                {title}
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--surface-2)', padding: '8px 14px',
              borderRadius: 'var(--radius-full)', border: '1px solid var(--border)'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--primary)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '0.75rem', fontWeight: 700
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                  {user?.role}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
