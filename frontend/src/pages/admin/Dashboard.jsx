import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  CalendarClock,
  ClipboardList,
  TrendingUp,
  Check,
  X,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Building2,
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import {
  mockStats,
  mockBookingRequests,
  mockRecentActivity,
  mockUtilizationData,
} from '../../data/adminMockData';
import './Dashboard.css';

const INITIAL_FACILITIES = [
  {
    name: 'Electronics Lab',
    location: 'Block A, Room 204',
    activeSessions: 3,
    capacity: '12 / 16 stations',
    status: 'Available',
    isBusy: false,
  },
  {
    name: 'Fabrication Lab',
    location: 'Block B, Room 102',
    activeSessions: 4,
    capacity: '6 / 8 stations',
    status: 'High Demand',
    isBusy: true,
  },
  {
    name: 'IoT & Robotics Lab',
    location: 'Block C, Room 305',
    activeSessions: 1,
    capacity: '8 / 10 stations',
    status: 'Available',
    isBusy: false,
  },
  {
    name: 'Materials Science Lab',
    location: 'Block A, Room 301',
    activeSessions: 2,
    capacity: '4 / 6 stations',
    status: 'Active',
    isBusy: false,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  // Booking requests with interactive approve/reject state
  const [requests, setRequests] = useState([
    ...mockBookingRequests,
    {
      id: 'br-5',
      studentName: 'Ananya Gupta',
      studentEmail: 'ananya.gupta@student.chitkara.edu.in',
      studentAvatar: 'AG',
      equipmentId: 'eq-4',
      equipmentName: 'Thermal Camera - Radiometric',
      date: '2024-12-24',
      startTime: '11:00',
      endTime: '13:00',
      status: 'Pending',
      purpose: 'PCB thermal profiling analysis',
      createdAt: '2024-12-19T09:10:00',
    },
    {
      id: 'br-6',
      studentName: 'Siddharth Rao',
      studentEmail: 'siddharth.rao@student.chitkara.edu.in',
      studentAvatar: 'SR',
      equipmentId: 'eq-6',
      equipmentName: 'Vector Network Analyzer',
      date: '2024-12-24',
      startTime: '14:30',
      endTime: '16:30',
      status: 'Pending',
      purpose: 'Microstrip antenna impedance matching',
      createdAt: '2024-12-19T11:20:00',
    },
  ]);

  const [toast, setToast] = useState(null);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  const handleApprove = (id, studentName) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r))
    );
    showToast(`Approved booking request for ${studentName}.`);
  };

  const handleReject = (id, studentName) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Rejected' } : r))
    );
    showToast(`Rejected booking request for ${studentName}.`);
  };

  const pendingCount = useMemo(() => {
    return requests.filter((r) => r.status === 'Pending').length;
  }, [requests]);

  const stats = useMemo(
    () => [
      {
        label: 'Total Equipment',
        value: mockStats.totalEquipment,
        trend: 12,
        trendLabel: 'vs last month',
        icon: <Package size={24} />,
        iconColor: 'cyan',
      },
      {
        label: 'Active Bookings',
        value: mockStats.activeBookings,
        trend: 8,
        trendLabel: 'vs last week',
        icon: <CalendarClock size={24} />,
        iconColor: 'blue',
      },
      {
        label: 'Pending Requests',
        value: pendingCount,
        trend: pendingCount > 0 ? pendingCount : 0,
        trendLabel: 'needs review',
        icon: <ClipboardList size={24} />,
        iconColor: 'amber',
      },
      {
        label: 'Utilization',
        value: `${mockStats.utilizationRate}%`,
        trend: 5,
        trendLabel: 'vs last month',
        icon: <TrendingUp size={24} />,
        iconColor: 'green',
      },
    ],
    [pendingCount]
  );

  return (
    <div className="admin-dashboard">
      {/* ---------- Hero Operations Banner ---------- */}
      <section className="admin-hero">
        <div className="admin-hero-content">
          <span className="admin-hero-greeting">
            <span className="admin-hero-live-dot" />
            Lab Operations Center
          </span>
          <h1 className="admin-hero-title">Welcome back, Tech. Kumar</h1>
          <p className="admin-hero-subtitle">
            Monitor laboratory resources, review student equipment reservations, and track live telemetry.
          </p>
        </div>
        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-hero-btn"
            onClick={() => navigate('/admin/booking-requests')}
          >
            <CalendarClock size={16} />
            Booking Requests
          </button>
          <button
            type="button"
            className="admin-hero-btn admin-hero-btn-primary"
            onClick={() => navigate('/admin/usage-logs')}
          >
            <Activity size={16} />
            Live Usage Logs
          </button>
        </div>
      </section>

      {/* ---------- 4 Summary Stat Cards ---------- */}
      <div className="admin-stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* ---------- Main Two-Column Operations Grid ---------- */}
      <div className="admin-dashboard-grid">
        {/* Left Column: Recent Booking Requests */}
        <section className="admin-card admin-dashboard-card">
          <div className="admin-card-header">
            <div className="admin-card-header-left">
              <h2 className="admin-card-title">Recent Booking Requests</h2>
              <span className="admin-card-badge">{pendingCount} pending</span>
            </div>
            <button
              type="button"
              className="admin-section-action"
              onClick={() => navigate('/admin/booking-requests')}
            >
              View all
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="admin-card-body">
            <div className="admin-booking-request-list">
              {requests.slice(0, 6).map((request) => {
                const isPending = request.status === 'Pending';
                const isApproved = request.status === 'Approved';

                return (
                  <div key={request.id} className="admin-booking-request-item">
                    <div className="admin-booking-request-info">
                      <div className="admin-booking-request-avatar">
                        {request.studentAvatar || 'ST'}
                      </div>
                      <div className="admin-booking-request-details">
                        <p className="admin-booking-request-student">
                          {request.studentName}
                        </p>
                        <p className="admin-booking-request-equipment">
                          {request.equipmentName}
                        </p>
                        <p className="admin-booking-request-datetime">
                          {request.date} • {request.startTime} – {request.endTime}
                        </p>
                      </div>
                    </div>
                    <div className="admin-booking-request-actions">
                      <span
                        className={`admin-status-badge ${
                          isPending ? 'pending' : isApproved ? 'available' : 'maintenance'
                        }`}
                      >
                        {request.status}
                      </span>
                      {isPending && (
                        <>
                          <button
                            type="button"
                            className="admin-btn-action-icon approve"
                            onClick={() =>
                              handleApprove(request.id, request.studentName)
                            }
                            aria-label={`Approve ${request.studentName}`}
                            title="Approve booking"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            type="button"
                            className="admin-btn-action-icon reject"
                            onClick={() =>
                              handleReject(request.id, request.studentName)
                            }
                            aria-label={`Reject ${request.studentName}`}
                            title="Reject booking"
                          >
                            <X size={15} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Column: Equipment Utilization */}
        <section className="admin-card admin-dashboard-card">
          <div className="admin-card-header">
            <div className="admin-card-header-left">
              <h2 className="admin-card-title">Equipment Utilization</h2>
              <span className="admin-card-badge">Live telemetry</span>
            </div>
            <button
              type="button"
              className="admin-section-action"
              onClick={() => navigate('/admin/equipment')}
            >
              Equipment
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="admin-card-body">
            <div className="admin-utilization-list">
              {mockUtilizationData.map((item) => {
                const isHigh = item.value >= 70;
                return (
                  <div key={item.name} className="admin-utilization-item">
                    <div className="admin-utilization-info">
                      <div className="admin-utilization-name-row">
                        <span className="admin-utilization-name">{item.name}</span>
                        <span
                          className={`admin-utilization-val-pill ${
                            isHigh ? 'high' : ''
                          }`}
                        >
                          {item.value}%
                        </span>
                      </div>
                      <div className="admin-utilization-bar">
                        <div
                          className={`admin-utilization-fill ${
                            isHigh ? 'high' : 'normal'
                          }`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ---------- Lower Grid: Activity & Facility Status ---------- */}
      <div className="admin-dashboard-grid">
        {/* Recent Activity */}
        <section className="admin-card admin-dashboard-card">
          <div className="admin-card-header">
            <div className="admin-card-header-left">
              <h2 className="admin-card-title">System Activity Log</h2>
              <span className="admin-card-badge">Live Audit</span>
            </div>
            <button
              type="button"
              className="admin-section-action"
              onClick={() => navigate('/admin/usage-logs')}
            >
              Session History
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="admin-card-body">
            <div className="admin-activity-list">
              {mockRecentActivity.map((activity) => (
                <div key={activity.id} className="admin-activity-item">
                  <div className={`admin-activity-icon ${activity.type}`}>
                    {activity.type === 'request' && <ClipboardList size={16} />}
                    {activity.type === 'approved' && <Check size={16} />}
                    {activity.type === 'updated' && <Activity size={16} />}
                  </div>
                  <div className="admin-activity-content">
                    <p
                      className="admin-activity-text"
                      dangerouslySetInnerHTML={{ __html: activity.message }}
                    />
                    <p className="admin-activity-time">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Facility Overview */}
        <section className="admin-card admin-dashboard-card">
          <div className="admin-card-header">
            <div className="admin-card-header-left">
              <h2 className="admin-card-title">Active Facility Overview</h2>
              <span className="admin-card-badge">4 Hubs</span>
            </div>
            <button
              type="button"
              className="admin-section-action"
              onClick={() => navigate('/admin/availability')}
            >
              Availability
              <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="admin-card-body">
            <div className="admin-facility-grid">
              {INITIAL_FACILITIES.map((facility) => (
                <div key={facility.name} className="admin-facility-card">
                  <div className="admin-facility-header">
                    <span className="admin-facility-name">{facility.name}</span>
                    <span
                      className={`admin-facility-status-dot ${
                        facility.isBusy ? 'busy' : ''
                      }`}
                      title={facility.status}
                    />
                  </div>
                  <span className="admin-facility-meta">{facility.location}</span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 600,
                        color: 'var(--admin-text-muted)',
                      }}
                    >
                      {facility.capacity}
                    </span>
                    <span
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: facility.isBusy
                          ? 'var(--admin-warning)'
                          : 'var(--admin-success)',
                      }}
                    >
                      {facility.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="admin-dash-toast" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}