import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, LogOut, User, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AdminHeader.css';

export default function AdminHeader({ onMenuClick, pageTitle }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifications = [
    { id: 1, message: 'New booking request for Digital Oscilloscope', time: '2 min ago', unread: true },
    { id: 2, message: '3D Printer maintenance completed', time: '1 hour ago', unread: true },
    { id: 3, message: 'Equipment calibration due for Microscope', time: '3 hours ago', unread: false },
  ];

  return (
    <header className="admin-header" role="banner">
      <div className="admin-header-left">
        <button
          className="admin-mobile-menu-btn"
          onClick={onMenuClick}
          aria-label="Toggle menu"
          aria-expanded="false"
        >
          <Menu size={20} />
        </button>
        <h1 className="admin-page-title">{pageTitle}</h1>
      </div>

      <div className="admin-header-right">
        <div className="admin-search">
          <Search className="admin-search-icon" aria-hidden="true" />
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search equipment, bookings..."
            aria-label="Search"
          />
        </div>

        <div className="relative" ref={notificationsRef}>
          <button
            className="admin-notification-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            aria-expanded={showNotifications}
          >
            <Bell size={20} aria-hidden="true" />
            {notifications.some(n => n.unread) && <span className="admin-notification-badge" />}
          </button>

          {showNotifications && (
            <div className="admin-notification-dropdown">
              <div className="admin-notification-header">
                <h3>Notifications</h3>
                <button className="admin-mark-read" onClick={() => {}}>Mark all read</button>
              </div>
              <div className="admin-notification-list">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`admin-notification-item ${notification.unread ? 'unread' : ''}`}
                  >
                    <p>{notification.message}</p>
                    <span className="admin-notification-time">{notification.time}</span>
                  </div>
                ))}
              </div>
              <div className="admin-notification-footer">
                <a href="/admin/notifications">View all notifications</a>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            className="admin-header-avatar"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="User menu"
            aria-expanded={showUserMenu}
          >
            {user?.avatar || 'NP'}
          </button>

          {showUserMenu && (
            <div className="admin-user-dropdown">
              <div className="admin-user-dropdown-header">
                <div className="admin-user-dropdown-avatar">{user?.avatar || 'NP'}</div>
                <div>
                  <p className="admin-user-dropdown-name">{user?.name || 'Nikhil Palyal'}</p>
                  <p className="admin-user-dropdown-role">{user?.role === 'admin' ? 'Administrator' : 'Lab Technician'}</p>
                </div>
              </div>
              <div className="admin-user-dropdown-divider" />
              <button className="admin-user-dropdown-item" onClick={() => {}}>
                <User size={16} /> Profile
              </button>
              <button className="admin-user-dropdown-item" onClick={() => {}}>
                <Settings size={16} /> Settings
              </button>
              <div className="admin-user-dropdown-divider" />
              <button className="admin-user-dropdown-item admin-user-dropdown-danger" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}