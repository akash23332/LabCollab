import { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import './AdminLayout.css';

const titles = {
  '/admin/dashboard': 'Dashboard',
  '/admin/equipment': 'Equipment',
  '/admin/availability': 'Availability',
  '/admin/booking-requests': 'Booking Requests',
  '/admin/usage-logs': 'Usage Logs',
  '/admin/analytics': 'Analytics',
  '/admin/profile': 'Profile',
  '/admin/settings': 'Settings',
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pageTitle = useMemo(() => titles[location.pathname] || 'Dashboard', [location.pathname]);

  return (
    <div className="admin-layout">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="admin-main">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} pageTitle={pageTitle} />
        <main className="admin-content" role="main">
          <Outlet />
        </main>
      </div>
      {sidebarOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}