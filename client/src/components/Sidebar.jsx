import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ScanLine, History, Users, Package,
  ClipboardList, LogOut, Stethoscope, User, ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const roleNavItems = {
  patient: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/scan', icon: ScanLine, label: 'Scan Prescription' },
    { to: '/patient/history', icon: History, label: 'My Scan History' },
    { to: '/patient/profile', icon: User, label: 'Profile' },
  ],
  doctor: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/scan', icon: ScanLine, label: 'Scan Prescription' },
    { to: '/doctor/patients', icon: Users, label: 'My Patients' },
    { to: '/doctor/profile', icon: User, label: 'Profile' },
  ],
  chemist: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/scan', icon: ScanLine, label: 'Scan Prescription' },
    { to: '/chemist/inventory', icon: Package, label: 'Inventory' },
    { to: '/chemist/profile', icon: User, label: 'Profile' },
  ],
};

const roleIcon = {
  patient: <User size={20} />,
  doctor: <Stethoscope size={20} />,
  chemist: <ShoppingBag size={20} />,
};

const roleBadgeColor = {
  patient: '#2563EB',
  doctor: '#0F766E',
  chemist: '#D97706',
};

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = roleNavItems[user?.role] || [];
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ScanLine size={22} />
        </div>
        <div>
          <div className="sidebar-logo-text">MedScan</div>
          <div className="sidebar-logo-sub">Healthcare Platform</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
              end={item.to === '/dashboard'}
            >
              <Icon className="nav-icon" size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User Card */}
      <div className="sidebar-user">
        <div className="sidebar-user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {roleIcon[user?.role]} <span style={{ marginLeft: 4 }}>{user?.role}</span>
            </div>
          </div>
          <button
            className="nav-link"
            onClick={handleLogout}
            style={{ padding: '8px', width: 'auto', color: 'rgba(255,255,255,0.6)' }}
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
