import {
  LayoutDashboard,
  Package,
  CalendarClock,
  ClipboardList,
  Activity,
  BarChart3,
  Settings,
  LogOut,
  User,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminSidebar.css';

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Equipment', icon: Package, path: '/admin/equipment' },
  { label: 'Availability', icon: CalendarClock, path: '/admin/availability' },
  { label: 'Booking Requests', icon: ClipboardList, path: '/admin/booking-requests' },
  { label: 'Usage Logs', icon: Activity, path: '/admin/usage-logs' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
];

const bottomNavigation = [
  { label: 'Profile', icon: User, path: '/admin/profile' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
  { label: 'Logout', icon: LogOut, path: '/logout', isLogout: true },
];

export default function AdminSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleNavClick = (item) => {
    if (item.isLogout) {
      logout();
      navigate('/login');
      return;
    }
    navigate(item.path);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <aside
      className={`admin-sidebar ${isOpen ? 'open' : ''}`}
      role="navigation"
      aria-label="Admin navigation"
    >
      <div className="admin-sidebar-header">
        <div className="admin-logo">
          <div className="admin-logo-icon">
            <Package size={20} />
          </div>
          <div className="admin-logo-text-wrapper">
            <span>LabShare</span>
            <span className="admin-logo-subtitle">Admin Panel</span>
          </div>
        </div>
      </div>

      <nav className="admin-nav" aria-label="Main navigation">
        <div className="admin-nav-section">
          <div className="admin-nav-section-title">Main</div>
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item)}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon size={19} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-status">
          <div className="admin-sidebar-status-header">
            <span className="admin-sidebar-status-label">Lab System</span>
            <span className="admin-sidebar-status-value" style={{ color: '#4ade80' }}>Online</span>
          </div>
          <div className="admin-sidebar-status-track">
            <div
              className="admin-sidebar-status-fill"
              style={{ width: '100%', background: '#22c55e' }}
            />
          </div>
        </div>

        <div className="admin-nav-section">
          <div className="admin-nav-section-title">Account</div>
          {bottomNavigation.map((item) => (
            <button
              key={item.path}
              className="admin-nav-item"
              onClick={() => handleNavClick(item)}
            >
              <item.icon size={19} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="admin-user-info">
          <div className="admin-user-avatar">
            {user?.name
              ? user.name
                  .split(' ')
                  .map((p) => p[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'AD'}
          </div>
          <div className="admin-user-details">
            <div className="admin-user-name">{user?.name || 'Administrator'}</div>
            <div className="admin-user-role">
              {user?.role === 'admin' ? 'Administrator' : 'Lab Technician'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
