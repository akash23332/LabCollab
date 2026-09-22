import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
import { analyticsService } from '../../services/analyticsService';
import { bookingService } from '../../services/bookingService';
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
  const { user } = useAuth();

  const [dashboardStats, setDashboardStats] = useState({
    totalEquipment: 0,
    pendingRequests: 0,
    activeSessions: 0,
    utilizationRate: 0,
  });
  const [activityList, setActivityList] = useState([]);
  const [utilizationList, setUtilizationList] = useState([]);
  const [facilityList, setFacilityList] = useState([]);
  const [requests, setRequests] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await analyticsService.getDashboardMetrics();
        if (res.success && res.data) {
          if (res.data.stats) setDashboardStats(res.data.stats);
          setActivityList(res.data.recentActivity || []);
          setUtilizationList(res.data.utilizationData || []);
          setFacilityList(res.data.facilities || []);
        }
      } catch (err) {
        console.warn('Dashboard backend metrics fetch:', err.message);
      }

      try {
        const bookRes = await bookingService.getBookings({ status: 'Pending' });
        if (bookRes.success && Array.isArray(bookRes.data)) {
          const mapped = bookRes.data.map(b => ({
            id: b.bookingId || b.id || b._id,
            studentName: b.student?.name || 'Student',
            studentEmail: b.student?.email || '',
            studentAvatar: b.student?.avatar || 'ST',
            equipmentId: b.equipmentId,
            equipmentName: b.equipmentName,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            status: (b.status || 'pending').toLowerCase() === 'approved'
              ? 'Approved'
              : (b.status || 'pending').toLowerCase() === 'rejected'
              ? 'Rejected'
              : 'Pending',
            purpose: b.purpose,
            createdAt: b.requestedAt || b.createdAt,
          }));
          setRequests(mapped);
        }
      } catch (err) {
        console.warn('Dashboard pending bookings fetch:', err.message);
      }
    };
    fetchDashboardData();
  }, []);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 3800);
  };

  const handleApprove = async (id, studentName) => {
    try {
      await bookingService.updateBookingStatus(id, 'Approved');
    } catch (err) {
      console.warn('Backend approve failed, updating locally:', err.message);
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r))
    );
    showToast(`Approved booking request for ${studentName}.`);
  };

  const handleReject = async (id, studentName) => {
    try {
      await bookingService.updateBookingStatus(id, 'Rejected', 'Rejected by administrator');
    } catch (err) {
      console.warn('Backend reject failed, updating locally:', err.message);
    }
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Rejected' } : r))
    );
    showToast(`Rejected booking request for ${studentName}.`);
  };

  const pendingCount = useMemo(() => {
    return requests.filter((r) => (r.status || '').toLowerCase() === 'pending').length;
  }, [requests]);

  const stats = useMemo(
    () => [
      {
        label: 'Total Equipment',
        value: dashboardStats.totalEquipment,
        trend: 12,
        trendLabel: 'in laboratory',
        icon: <Package size={24} />,
        iconColor: 'cyan',
      },
      {
        label: 'Active Bookings',
        value: dashboardStats.activeBookings,
        trend: 8,
        trendLabel: 'confirmed slots',
        icon: <CalendarClock size={24} />,
        iconColor: 'blue',
      },
      {
        label: 'Pending Requests',
        value: pendingCount || dashboardStats.pendingRequests,
        trend: pendingCount > 0 ? pendingCount : 0,
        trendLabel: 'needs review',
        icon: <ClipboardList size={24} />,
        iconColor: 'amber',
      },
      {
        label: 'Utilization',
        value: `${dashboardStats.utilizationRate}%`,
        trend: 5,
        trendLabel: 'capacity usage',
        icon: <TrendingUp size={24} />,
        iconColor: 'green',
      },
    ],
    [dashboardStats, pendingCount]
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
          <h1 className="admin-hero-title">Welcome back, {user?.name || 'Tech. Kumar'}</h1>
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
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                <p style={{ fontWeight: 600, fontSize: '15px', color: '#f1f5f9', margin: '0 0 4px' }}>No pending booking requests</p>
                <p style={{ fontSize: '13px', margin: 0, opacity: 0.8 }}>New student requests will appear here dynamically in real time.</p>
              </div>
            ) : (
              <div className="admin-booking-request-list">
                {requests.slice(0, 6).map((request) => {
                  const isPending = (request.status || '').toLowerCase() === 'pending';
                  const isApproved = (request.status || '').toLowerCase() === 'approved';

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
            )}
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
            {utilizationList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                <p style={{ fontWeight: 600, fontSize: '15px', color: '#f1f5f9', margin: '0 0 4px' }}>No equipment records</p>
                <p style={{ fontSize: '13px', margin: 0, opacity: 0.8 }}>Add instruments in Equipment section to start tracking telemetry.</p>
              </div>
            ) : (
              <div className="admin-utilization-list">
                {utilizationList.map((item) => {
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
            )}
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
              <span className="admin-card-badge">{activityList.length} Events</span>
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
            {activityList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                <p style={{ fontWeight: 600, fontSize: '15px', color: '#f1f5f9', margin: '0 0 4px' }}>No recent activity</p>
                <p style={{ fontSize: '13px', margin: 0, opacity: 0.8 }}>Live session and booking logs will be displayed here.</p>
              </div>
            ) : (
              <div className="admin-activity-list">
                {activityList.map((activity) => (
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
            )}
          </div>
        </section>

        {/* Facility Overview */}
        <section className="admin-card admin-dashboard-card">
          <div className="admin-card-header">
            <div className="admin-card-header-left">
              <h2 className="admin-card-title">Active Facility Overview</h2>
              <span className="admin-card-badge">{facilityList.length} Labs</span>
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
            {facilityList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94a3b8' }}>
                <p style={{ fontWeight: 600, fontSize: '15px', color: '#f1f5f9', margin: '0 0 4px' }}>No active facilities</p>
                <p style={{ fontSize: '13px', margin: 0, opacity: 0.8 }}>Facilities will appear once laboratory equipment is added.</p>
              </div>
            ) : (
              <div className="admin-facility-grid">
                {facilityList.map((facility) => (
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
            )}
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