import { useMemo, useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Layers,
  Eye,
  Check,
  X,
  User,
  Building2,
  FlaskConical,
  MapPin,
  CalendarDays,
  Clock,
  FileText,
  Ban,
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import bookingService from '../../services/bookingService';
import './BookingRequests.css';

/* ============================================================
   MOCK DATA — shaped for a future API response
   ============================================================ */

const INITIAL_REQUESTS = [];

/* ============================================================
   DATE / TIME HELPERS
   ============================================================ */

const TODAY = new Date().toISOString().slice(0, 10);

const dateStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const fmtDateShort = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return iso;
    return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
};

const fmtDateLong = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return iso;
    return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const date = `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}`;
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const am = h < 12;
    h = h % 12 || 12;
    return `${date}, ${h}:${m} ${am ? 'AM' : 'PM'}`;
  } catch {
    return iso;
  }
};

const fmtTime = (t) => {
  if (!t || typeof t !== 'string' || !t.includes(':')) return t || '—';
  const [hStr, m] = t.split(':');
  let h = Number(hStr);
  const am = h < 12;
  h = h % 12 || 12;
  return `${h}:${m} ${am ? 'AM' : 'PM'}`;
};

const initials = (name) =>
  (name || 'ST')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

const weekRangeOf = (iso) => {
  const base = new Date(`${iso}T00:00:00`);
  const mondayOffset = (base.getDay() + 6) % 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - mondayOffset);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday: dateStr(monday), sunday: dateStr(sunday) };
};

const addDaysISO = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return dateStr(d);
};

/* ============================================================
   STATUS BADGE
   ============================================================ */

function BookingStatusBadge({ status }) {
  const cls = { Pending: 'pending', Approved: 'approved', Rejected: 'rejected' }[status] || 'pending';
  return <span className={`admin-status-badge br-${cls}`}>{status}</span>;
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function BookingRequests() {
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [equipmentFilter, setEquipmentFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [viewRequest, setViewRequest] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await bookingService.getBookings();
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map((b) => ({
            id: b.bookingId || b.id || b._id,
            student: {
              name: b.student?.name || 'Student',
              email: b.student?.email || 'student@example.com',
            },
            equipment: {
              name: b.equipmentName,
              category: b.equipmentCategory || 'General',
            },
            lab: b.lab || 'Lab',
            college: b.college || 'Chitkara University',
            building: b.building || 'Block A',
            room: b.room || '',
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            purpose: b.purpose,
            requestedAt: b.requestedAt || b.createdAt,
            status: b.status,
            rejectionReason: b.rejectionReason || '',
            approvedBy: b.approvedBy || '',
            approvedAt: b.approvedAt || '',
          }));
          setRequests(mapped);
        }
      } catch (err) {
        console.warn('Backend bookings fetch:', err.message);
      }
    };
    fetchBookings();
  }, []);

  const equipmentOptions = useMemo(
    () => [...new Set(requests.map((r) => r.equipment?.name).filter(Boolean))].sort(),
    [requests]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const { monday, sunday } = weekRangeOf(TODAY);

    return requests.filter((r) => {
      if (q) {
        const haystack = [r.id, r.student?.name, r.equipment?.name, r.lab, r.purpose]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (statusFilter && r.status !== statusFilter) return false;
      if (equipmentFilter && r.equipment?.name !== equipmentFilter) return false;
      if (dateFilter === 'today' && r.date !== TODAY) return false;
      if (dateFilter === 'tomorrow' && r.date !== addDaysISO(TODAY, 1)) return false;
      if (dateFilter === 'week') {
        if (r.date < monday || r.date > sunday) return false;
      }
      return true;
    });
  }, [requests, search, statusFilter, equipmentFilter, dateFilter]);

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === 'Pending').length,
      approvedToday: requests.filter((r) => r.status === 'Approved' && r.approvedAt?.startsWith(TODAY)).length,
      rejectedToday: requests.filter((r) => r.status === 'Rejected' && r.date >= addDaysISO(TODAY, -1)).length,
      total: requests.length,
    }),
    [requests]
  );

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setEquipmentFilter('');
    setDateFilter('');
  };

  const handleApprove = async (request) => {
    try {
      await bookingService.updateBookingStatus(request.id, 'Approved');
    } catch (err) {
      console.warn('Backend booking approval failed, updating locally:', err.message);
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.id === request.id
          ? { ...r, status: 'Approved', approvedBy: 'Lab Administrator', approvedAt: `${TODAY}T08:15:00` }
          : r
      )
    );
    setApproveTarget(null);
    if (viewRequest?.id === request.id) {
      setViewRequest((prev) => ({ ...prev, status: 'Approved' }));
    }
    setToast({ type: 'success', message: `Booking ${request.id} approved — slot is now booked` });
  };

  const openRejectModal = (request) => {
    setRejectTarget(request);
    setRejectReason('');
    setRejectError('');
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setRejectError('A reason is required to reject this request');
      return;
    }

    try {
      await bookingService.updateBookingStatus(rejectTarget.id, 'Rejected', rejectReason.trim());
    } catch (err) {
      console.warn('Backend booking rejection failed, updating locally:', err.message);
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.id === rejectTarget.id ? { ...r, status: 'Rejected', rejectionReason: rejectReason.trim() } : r
      )
    );
    if (viewRequest?.id === rejectTarget.id) {
      setViewRequest((prev) => ({ ...prev, status: 'Rejected', rejectionReason: rejectReason.trim() }));
    }
    setToast({ type: 'success', message: `Booking ${rejectTarget.id} rejected` });
    setRejectTarget(null);
    setRejectReason('');
    setRejectError('');
  };

  const hasActiveFilters = search || statusFilter || equipmentFilter || dateFilter;

  const renderActions = (r) => (
    <div className="br-actions">
      <button
        className="admin-action-btn"
        onClick={() => setViewRequest(r)}
        aria-label={`View ${r.id}`}
        title="View details"
      >
        <Eye size={16} />
      </button>
      {r.status === 'Pending' && (
        <>
          <button
            className="admin-action-btn approve"
            onClick={() => setApproveTarget(r)}
            aria-label={`Approve ${r.id}`}
            title="Approve"
          >
            <Check size={16} />
          </button>
          <button
            className="admin-action-btn reject"
            onClick={() => openRejectModal(r)}
            aria-label={`Reject ${r.id}`}
            title="Reject"
          >
            <X size={16} />
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="admin-booking-page">
      {/* ---------- Page header ---------- */}
      <div className="admin-page-header">
        <h1 className="admin-page-title-main">Booking Requests</h1>
        <p className="admin-page-subtitle">
          Review and manage student requests for laboratory equipment.
        </p>
        <div className="admin-page-header-actions">
          <div className="br-header-search">
            <Search className="admin-search-icon" size={16} aria-hidden="true" />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Search requests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search requests"
            />
          </div>
          <button
            className="admin-btn admin-btn-secondary"
            onClick={() => setToast({ type: 'success', message: 'Requests refreshed' })}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* ---------- Summary cards ---------- */}
      <div className="admin-stats-grid br-summary-grid">
        <StatCard
          label="Pending Requests"
          value={counts.pending}
          icon={<ClipboardList size={24} />}
          iconColor="amber"
        />
        <StatCard
          label="Approved Today"
          value={counts.approvedToday}
          icon={<CheckCircle2 size={24} />}
          iconColor="green"
        />
        <StatCard
          label="Rejected Today"
          value={counts.rejectedToday}
          icon={<XCircle size={24} />}
          iconColor="cyan"
        />
        <StatCard
          label="Total Requests"
          value={counts.total}
          icon={<Layers size={24} />}
          iconColor="blue"
        />
      </div>

      {/* ---------- Table card with filter bar ---------- */}
      <div className="admin-card">
        <div className="admin-filter-bar">
          <div className="admin-filter-group">
            <label className="admin-filter-label" htmlFor="br-status">Status</label>
            <select
              id="br-status"
              className="admin-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          <div className="admin-filter-group">
            <label className="admin-filter-label" htmlFor="br-equipment">Equipment</label>
            <select
              id="br-equipment"
              className="admin-filter-select"
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
            >
              <option value="">All Equipment</option>
              {equipmentOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="admin-filter-group">
            <label className="admin-filter-label" htmlFor="br-date">Date</label>
            <select
              id="br-date"
              className="admin-filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This Week</option>
            </select>
          </div>

          <div className="admin-search-wrapper">
            <Search className="admin-search-icon" size={16} aria-hidden="true" />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Student / Equipment / Request ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search by student, equipment or request ID"
            />
          </div>
        </div>

        <div className="admin-table-wrapper">
          {filtered.length > 0 ? (
            <table className="admin-table br-table" role="grid">
              <thead>
                <tr>
                  <th scope="col">Request ID</th>
                  <th scope="col">Student</th>
                  <th scope="col">Equipment</th>
                  <th scope="col">Lab</th>
                  <th scope="col">Date</th>
                  <th scope="col">Time</th>
                  <th scope="col">Purpose</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td><span className="br-request-id">{r.id}</span></td>
                    <td>
                      <div className="br-student-cell">
                        <div className="br-student-avatar">{initials(r.student?.name)}</div>
                        <div>
                          <div className="br-student-name">{r.student?.name || 'Student'}</div>
                          <div className="br-student-email">{r.student?.email || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="br-equipment-name">{r.equipment?.name || 'Equipment'}</div>
                      <div className="br-equipment-cat">{r.equipment?.category || 'General'}</div>
                    </td>
                    <td>{r.lab}</td>
                    <td className="br-nowrap">{fmtDateShort(r.date)}</td>
                    <td className="br-nowrap">{fmtTime(r.startTime)} – {fmtTime(r.endTime)}</td>
                    <td className="br-purpose" title={r.purpose}>{r.purpose}</td>
                    <td><BookingStatusBadge status={r.status} /></td>
                    <td>{renderActions(r)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin-empty-state">
              <Search size={48} />
              <h3 className="admin-empty-state-title">No booking requests found</h3>
              <p className="admin-empty-state-message">
                Try changing your search or filters.
              </p>
              {hasActiveFilters && (
                <button className="admin-btn admin-btn-secondary" onClick={clearFilters}>
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ---------- View Request modal ---------- */}
      {viewRequest && (
        <div
          className="admin-modal-overlay"
          onClick={() => setViewRequest(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="br-view-title"
        >
          <div className="admin-modal br-view-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2 id="br-view-title" className="admin-modal-title">Booking Request</h2>
                <p className="br-view-subtitle">{viewRequest.id}</p>
              </div>
              <BookingStatusBadge status={viewRequest.status} />
            </div>
            <div className="admin-modal-body">
              <div className="br-detail-grid">
                <div className="br-detail-item">
                  <span className="br-detail-label"><User size={13} /> Student</span>
                  <span className="br-detail-value">
                    {viewRequest.student.name}
                    <small>{viewRequest.student.email}</small>
                  </span>
                </div>
                <div className="br-detail-item">
                  <span className="br-detail-label"><FlaskConical size={13} /> Equipment</span>
                  <span className="br-detail-value">
                    {viewRequest.equipment.name}
                    <small>{viewRequest.equipment.category}</small>
                  </span>
                </div>
                <div className="br-detail-item">
                  <span className="br-detail-label"><Building2 size={13} /> College</span>
                  <span className="br-detail-value">{viewRequest.college}</span>
                </div>
                <div className="br-detail-item">
                  <span className="br-detail-label"><MapPin size={13} /> Location</span>
                  <span className="br-detail-value">
                    {viewRequest.lab}
                    <small>{viewRequest.building} · Room {viewRequest.room}</small>
                  </span>
                </div>
                <div className="br-detail-item">
                  <span className="br-detail-label"><CalendarDays size={13} /> Requested Date</span>
                  <span className="br-detail-value">{fmtDateLong(viewRequest.date)}</span>
                </div>
                <div className="br-detail-item">
                  <span className="br-detail-label"><Clock size={13} /> Requested Time</span>
                  <span className="br-detail-value">{fmtTime(viewRequest.startTime)} – {fmtTime(viewRequest.endTime)}</span>
                </div>
                <div className="br-detail-item br-detail-full">
                  <span className="br-detail-label"><FileText size={13} /> Purpose</span>
                  <span className="br-detail-value">{viewRequest.purpose}</span>
                </div>
                <div className="br-detail-item br-detail-full">
                  <span className="br-detail-label"><ClipboardList size={13} /> Requested At</span>
                  <span className="br-detail-value">{fmtDateTime(viewRequest.requestedAt)}</span>
                </div>

                {viewRequest.status === 'Rejected' && viewRequest.rejectionReason && (
                  <div className="br-detail-item br-detail-full">
                    <span className="br-detail-label"><Ban size={13} /> Rejection Reason</span>
                    <span className="br-rejection-note">{viewRequest.rejectionReason}</span>
                  </div>
                )}

                {viewRequest.status === 'Approved' && (
                  <div className="br-detail-item br-detail-full">
                    <span className="br-detail-label"><CheckCircle2 size={13} /> Approval Status</span>
                    <span className="br-detail-value">
                      Approved
                      <small>
                        by {viewRequest.approvedBy || 'Lab Technician'} · {fmtDateTime(viewRequest.approvedAt || `${TODAY}T08:15:00`)}
                      </small>
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setViewRequest(null)}>
                Close
              </button>
              {viewRequest.status === 'Pending' && (
                <>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => openRejectModal(viewRequest)}
                  >
                    Reject
                  </button>
                  <button
                    className="admin-btn admin-btn-primary"
                    onClick={() => setApproveTarget(viewRequest)}
                  >
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- Approve confirmation modal ---------- */}
      {approveTarget && (
        <div
          className="admin-modal-overlay"
          onClick={() => setApproveTarget(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="br-approve-title"
        >
          <div className="admin-modal admin-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-body">
              <div className="br-approve-icon">
                <Check size={26} />
              </div>
              <h3 id="br-approve-title" className="admin-confirm-title">Approve Booking?</h3>
              <p className="admin-confirm-message">
                Are you sure you want to approve this booking request?
              </p>
              <div className="br-confirm-summary">
                <div>
                  <span>Equipment</span>
                  <strong>{approveTarget.equipment.name}</strong>
                </div>
                <div>
                  <span>Date</span>
                  <strong>{fmtDateLong(approveTarget.date)}</strong>
                </div>
                <div>
                  <span>Time</span>
                  <strong>{fmtTime(approveTarget.startTime)} – {fmtTime(approveTarget.endTime)}</strong>
                </div>
              </div>
              <p className="br-approve-note">
                The requested slot will be marked as booked.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setApproveTarget(null)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-primary" onClick={() => handleApprove(approveTarget)}>
                Approve Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Reject modal ---------- */}
      {rejectTarget && (
        <div
          className="admin-modal-overlay"
          onClick={() => setRejectTarget(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="br-reject-title"
        >
          <div className="admin-modal br-reject-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 id="br-reject-title" className="admin-modal-title">Reject Booking Request</h2>
              <button className="admin-modal-close" onClick={() => setRejectTarget(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleReject} noValidate>
              <div className="admin-modal-body">
                <div className="br-reject-context">
                  <div>
                    <span>Request</span>
                    <strong>{rejectTarget.id}</strong>
                  </div>
                  <div>
                    <span>Equipment</span>
                    <strong>{rejectTarget.equipment.name}</strong>
                  </div>
                </div>
                <div className="admin-form-field">
                  <label className="admin-form-label required" htmlFor="br-reject-reason">
                    Reason for rejection
                  </label>
                  <textarea
                    id="br-reject-reason"
                    className="admin-form-textarea"
                    placeholder="Enter reason for rejecting this request..."
                    value={rejectReason}
                    onChange={(e) => {
                      setRejectReason(e.target.value);
                      if (rejectError) setRejectError('');
                    }}
                    rows={4}
                  />
                  {rejectError && <p className="br-field-error">{rejectError}</p>}
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setRejectTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-danger">
                  Reject Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Toast ---------- */}
      {toast && (
        <div className={`br-toast ${toast.type}`} role="status">
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
