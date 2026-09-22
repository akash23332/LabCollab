import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Ban,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  CalendarCheck,
  CalendarX,
  Gauge,
  Wrench,
  User,
  Building2,
  FlaskConical,
  Check,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import equipmentService from '../../services/equipmentService';
import availabilityService from '../../services/availabilityService';
import './Availability.css';

/* ============================================================
   CONSTANTS & DATE HELPERS
   ============================================================ */

const LAB_OPEN = 8 * 60;   // 08:00 in minutes
const LAB_CLOSE = 20 * 60; // 20:00 in minutes
const LAB_HOURS = LAB_CLOSE - LAB_OPEN;

const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseKey = (key) => new Date(`${key}T00:00:00`);

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const fmtDateLong = (d) =>
  `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'long' })} ${d.getFullYear()}`;

const fmtDateShort = (d) =>
  `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;

const fmt24h = (mins) =>
  `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

const fmt12h = (mins) => {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const am = h < 12;
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
};

const timeToMinutes = (value) => {
  if (!value) return NaN;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

const SLOT_LABELS = {
  available: 'Available',
  booked: 'Booked',
  blocked: 'Blocked',
  maintenance: 'Maintenance',
};

const statusClass = {
  Available: 'available',
  Booked: 'booked',
  Maintenance: 'maintenance',
  Inactive: 'inactive',
};

const conditionClass = {
  Excellent: 'excellent',
  Good: 'good',
  Fair: 'fair',
  Poor: 'poor',
};

const maintenanceClass = {
  'Up to Date': 'up-to-date',
  'Due Soon': 'due-soon',
  'Maintenance Required': 'maintenance-required',
  'Under Maintenance': 'under-maintenance',
};

/* ============================================================
   SCHEDULE BUILDER
   Builds the final day timeline: base availability minus
   blocked/maintenance cuts, plus those cuts and bookings.
   ============================================================ */

function getBaseTemplate(config, key) {
  if (!config) return [{ start: 8 * 60, end: 20 * 60, status: 'available' }];
  const dow = parseKey(key).getDay();
  const t = config.weeklyTemplate || {};
  const base = t[dow] || t.default || [{ start: 8 * 60, end: 20 * 60, status: 'available' }];
  return base.map((s) => ({ ...s }));
}

function getExceptionsForDay(config, key) {
  if (!config || !config.exceptions) return [];
  if (Array.isArray(config.exceptions)) {
    return config.exceptions.filter((e) => e.date === key);
  }
  return config.exceptions[key] || [];
}

function buildDaySchedule(config, key) {
  if (!config) return [];

  const base = getBaseTemplate(config, key);
  const dayExceptions = getExceptionsForDay(config, key);
  const cuts = [
    ...dayExceptions.map((s) => ({ ...s })),
    ...(config.bookings || [])
      .filter((b) => b.date === key)
      .map((b) => ({ ...b, status: 'booked' })),
  ].sort((a, b) => a.start - b.start);

  let segments = base;
  for (const cut of cuts) {
    const next = [];
    for (const seg of segments) {
      if (cut.end <= seg.start || cut.start >= seg.end) {
        next.push(seg);
        continue;
      }
      if (cut.start > seg.start) next.push({ ...seg, end: cut.start });
      if (cut.end < seg.end) next.push({ ...seg, start: cut.end });
    }
    segments = next;
  }

  return [...segments, ...cuts].sort((a, b) => a.start - b.start);
}



const sumHours = (slots, statuses) =>
  slots
    .filter((s) => statuses.includes(s.status))
    .reduce((acc, s) => acc + (s.end - s.start), 0) / 60;

/* ============================================================
   COMPONENT
   ============================================================ */

export default function Availability() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [equipmentId, setEquipmentId] = useState('');
  const [config, setConfig] = useState({ weeklyTemplate: { default: [{ start: 8 * 60, end: 20 * 60, status: 'available' }] }, exceptions: [], bookings: [] });
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Fetch equipment list from backend
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const res = await equipmentService.getEquipment({ manage: true });
        const items = res.data?.data || res.data || [];
        if (Array.isArray(items) && items.length > 0) {
          setEquipmentList(items);
          setEquipmentId(items[0].equipmentId || items[0].id);
        }
      } catch (err) {
        console.error('Failed to load equipment:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEquipment();
  }, []);

  // Fetch availability for selected equipment
  const loadAvailability = useCallback(async (eqId) => {
    if (!eqId) return;
    try {
      const res = await availabilityService.getAvailability(eqId);
      if (res.data?.success && res.data.data) {
        setConfig(res.data.data);
      } else if (res.data) {
        setConfig(res.data);
      }
    } catch (err) {
      console.error('Failed to load availability:', err);
    }
  }, []);

  useEffect(() => {
    if (equipmentId) {
      loadAvailability(equipmentId);
    }
  }, [equipmentId, loadAvailability]);

  const currentEquipment = useMemo(() => {
    return equipmentList.find((e) => (e.equipmentId || e.id) === equipmentId) || equipmentList[0] || null;
  }, [equipmentList, equipmentId]);

  /* ---- Derived schedule data ---- */

  const daySchedule = useMemo(
    () => buildDaySchedule(config, selectedDate),
    [config, selectedDate]
  );

  const weekDays = useMemo(() => {
    const base = parseKey(selectedDate);
    const mondayOffset = (base.getDay() + 6) % 7; // Monday-first week
    const monday = addDays(base, -mondayOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(monday, i);
      return { key: dateKey(d), date: d };
    });
  }, [selectedDate]);

  const summary = useMemo(() => {
    const availableH = sumHours(daySchedule, ['available']);
    const bookedH = sumHours(daySchedule, ['booked']);
    const blockedH = sumHours(daySchedule, ['blocked', 'maintenance']);
    const utilization = availableH + bookedH > 0
      ? Math.round((bookedH / (availableH + bookedH)) * 100)
      : 0;
    return { availableH, bookedH, blockedH, utilization };
  }, [daySchedule]);

  const dayBookings = useMemo(
    () => (config?.bookings || []).filter((b) => b.date === selectedDate),
    [config, selectedDate]
  );

  const dayExceptions = useMemo(
    () => getExceptionsForDay(config, selectedDate),
    [config, selectedDate]
  );

  const weekBookings = useMemo(
    () =>
      (config?.bookings || []).filter((b) => weekDays.some((d) => d.key === b.date)),
    [config, weekDays]
  );

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const isToday = selectedDate === dateKey(new Date());
  const showNowLine = isToday && nowMinutes >= LAB_OPEN && nowMinutes <= LAB_CLOSE;

  /* ---- Toast auto-dismiss ---- */
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---- Navigation handlers ---- */

  const shiftDate = (n) => setSelectedDate(dateKey(addDays(parseKey(selectedDate), n)));

  /* ---- Modal form state ---- */

  const [addForm, setAddForm] = useState({
    equipmentId: '',
    date: selectedDate,
    start: '10:00',
    end: '12:00',
  });
  const [addErrors, setAddErrors] = useState({});

  const [blockForm, setBlockForm] = useState({
    equipmentId: '',
    date: selectedDate,
    start: '09:00',
    end: '11:00',
    type: 'blocked',
    reason: '',
  });
  const [blockErrors, setBlockErrors] = useState({});

  const openAddModal = () => {
    setAddForm({ equipmentId, date: selectedDate, start: '10:00', end: '12:00' });
    setAddErrors({});
    setShowAddModal(true);
  };

  const openBlockModal = () => {
    setBlockForm({ equipmentId, date: selectedDate, start: '09:00', end: '11:00', type: 'blocked', reason: '' });
    setBlockErrors({});
    setShowBlockModal(true);
  };

  const validateSlot = (form, requireReason) => {
    const errors = {};
    if (!form.equipmentId) errors.equipmentId = 'Select equipment';
    if (!form.date) errors.date = 'Select a date';
    if (!form.start) errors.start = 'Start time is required';
    if (!form.end) errors.end = 'End time is required';
    if (form.start && form.end) {
      const start = timeToMinutes(form.start);
      const end = timeToMinutes(form.end);
      if (Number.isNaN(start) || Number.isNaN(end)) {
        errors.start = 'Invalid time format';
      } else if (start >= end) {
        errors.end = 'End time must be after start time';
      } else if (start < LAB_OPEN || end > LAB_CLOSE) {
        errors.end = `Slot must be within lab hours (${fmt12h(LAB_OPEN)} – ${fmt12h(LAB_CLOSE)})`;
      } else {
        const dayExceptions = getExceptionsForDay(config, form.date);
        const dayBookings = (config?.bookings || []).filter((b) => b.date === form.date);

        // 1. Conflict with existing confirmed/approved student bookings
        const bookingConflict = dayBookings.find(
          (b) => start < b.end && end > b.start
        );
        if (bookingConflict) {
          errors.end = `This slot overlaps an existing booking (${fmt24h(bookingConflict.start)} – ${fmt24h(bookingConflict.end)})`;
        } else {
          // 2. Conflict with existing blocked or maintenance periods
          const blockConflict = dayExceptions.find(
            (e) => ['blocked', 'maintenance'].includes(e.status) && start < e.end && end > e.start
          );
          if (blockConflict) {
            if (requireReason) {
              errors.end = `This slot overlaps an already ${blockConflict.status} period (${fmt24h(blockConflict.start)} – ${fmt24h(blockConflict.end)})`;
            } else {
              errors.end = `This slot overlaps a blocked/maintenance period (${fmt24h(blockConflict.start)} – ${fmt24h(blockConflict.end)}). Remove the block first.`;
            }
          } else if (!requireReason) {
            // 3. For Add Availability: check if identical manual availability exception is already added
            const availConflict = dayExceptions.find(
              (e) => e.status === 'available' && start < e.end && end > e.start
            );
            if (availConflict) {
              errors.end = `This slot overlaps an already added availability slot (${fmt24h(availConflict.start)} – ${fmt24h(availConflict.end)})`;
            }
          }
        }
      }
    }
    if (requireReason && !form.reason?.trim()) {
      errors.reason = 'Please provide a reason';
    }
    return errors;
  };

  const handleRemoveException = async (exceptionId) => {
    if (!exceptionId || !equipmentId) return;
    try {
      await availabilityService.removeException(equipmentId, exceptionId);
      await loadAvailability(equipmentId);
      setToast({ type: 'success', message: 'Slot exception removed successfully' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to remove slot exception' });
    }
  };

  const handleAddAvailability = async (e) => {
    e.preventDefault();
    const errors = validateSlot(addForm, false);
    setAddErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await availabilityService.addException(addForm.equipmentId, {
        date: addForm.date,
        start: timeToMinutes(addForm.start),
        end: timeToMinutes(addForm.end),
        status: 'available',
      });
      await loadAvailability(addForm.equipmentId);
      setShowAddModal(false);
      setToast({ type: 'success', message: 'Availability slot added successfully' });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to add availability' });
    }
  };

  const handleBlockSlot = async (e) => {
    e.preventDefault();
    const errors = validateSlot(blockForm, true);
    setBlockErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await availabilityService.addException(blockForm.equipmentId, {
        date: blockForm.date,
        start: timeToMinutes(blockForm.start),
        end: timeToMinutes(blockForm.end),
        status: blockForm.type,
        reason: blockForm.reason.trim(),
      });
      await loadAvailability(blockForm.equipmentId);
      setShowBlockModal(false);
      setToast({
        type: 'success',
        message: blockForm.type === 'maintenance'
          ? 'Maintenance period scheduled'
          : 'Slot blocked successfully',
      });
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.message || 'Failed to block slot' });
    }
  };

  /* ---- Render helpers ---- */

  const blockPos = (s) => ({
    top: `${((s.start - LAB_OPEN) / LAB_HOURS) * 100}%`,
    height: `${Math.max(((s.end - s.start) / LAB_HOURS) * 100, 4.5)}%`,
  });

  const hourMarks = Array.from(
    { length: LAB_HOURS / 60 + 1 },
    (_, i) => LAB_OPEN + i * 60
  );

  const renderSlotBlock = (slot, compact = false) => {
    const isBooking = slot.status === 'booked';
    const isCustomException = Boolean(slot.id && !isBooking);
    return (
      <div
        key={slot.id || `slot-${slot.start}-${slot.end}`}
        className={`avail-block ${slot.status} ${compact ? 'compact' : ''}`}
        style={blockPos(slot)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <span className="avail-block-status">{SLOT_LABELS[slot.status]}</span>
          {isCustomException && !compact && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveException(slot.id);
              }}
              style={{
                background: 'rgba(0,0,0,0.15)',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                color: 'currentColor',
                padding: 0,
                lineHeight: 1,
              }}
              title="Remove this slot"
              aria-label="Remove this slot"
            >
              ✕
            </button>
          )}
        </div>
        <span className="avail-block-time">
          {fmt12h(slot.start)} – {fmt12h(slot.end)}
        </span>
        {!compact && slot.reason && (
          <span className="avail-block-note">{slot.reason}</span>
        )}
        {!compact && isBooking && slot.studentName && (
          <span className="avail-block-note">
            <User size={11} /> {slot.studentName}
          </span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-availability-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Loader2 size={32} className="admin-spinner" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="admin-availability-page">
      {/* ---------- Page header ---------- */}
      <div className="admin-page-header">
        <h1 className="admin-page-title-main">Availability Management</h1>
        <p className="admin-page-subtitle">
          Manage when laboratory equipment is available for booking.
        </p>
        <div className="admin-page-header-actions">
          <button className="admin-btn admin-btn-primary" onClick={openAddModal} disabled={!equipmentId}>
            <Plus size={18} /> Add Availability
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={openBlockModal} disabled={!equipmentId}>
            <Ban size={18} /> Block Slot
          </button>
        </div>
      </div>

      {/* ---------- Equipment selector + info panel ---------- */}
      {currentEquipment ? (
        <div className="admin-card avail-equipment-bar">
          <div className="avail-equipment-select">
            <label className="admin-form-label" htmlFor="avail-equipment">
              Equipment
            </label>
            <select
              id="avail-equipment"
              className="admin-form-select"
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
            >
              {equipmentList.map((eq) => (
                <option key={eq.equipmentId || eq.id} value={eq.equipmentId || eq.id}>
                  {eq.equipmentName} — {eq.equipmentNumber || eq.equipmentId || eq.id}
                </option>
              ))}
            </select>
          </div>

          <div className="avail-equipment-divider" aria-hidden="true" />

          <div className="avail-equipment-info">
            <div className="avail-equipment-identity">
              <div className="avail-equipment-icon">
                <FlaskConical size={22} />
              </div>
              <div>
                <h2 className="avail-equipment-name">{currentEquipment.equipmentName}</h2>
                <p className="avail-equipment-number">{currentEquipment.equipmentNumber || currentEquipment.equipmentId}</p>
              </div>
            </div>

            <div className="avail-equipment-meta">
              <div className="avail-equipment-meta-item">
                <Building2 size={14} />
                <span>{currentEquipment.collegeName || currentEquipment.collegeId || 'Campus Lab'}</span>
              </div>
              <div className="avail-equipment-meta-item">
                <FlaskConical size={14} />
                <span>{currentEquipment.labName || 'General Lab'}</span>
              </div>
            </div>

            <div className="avail-equipment-badges">
              <div className="avail-equipment-badge-group">
                <span className="avail-equipment-badge-label">Status</span>
                <span className={`admin-status-badge ${statusClass[currentEquipment.status] || 'inactive'}`}>
                  {currentEquipment.status}
                </span>
              </div>
              <div className="avail-equipment-badge-group">
                <span className="avail-equipment-badge-label">Condition</span>
                <span className={`admin-status-badge ${conditionClass[currentEquipment.condition] || 'good'}`}>
                  {currentEquipment.condition || 'Good'}
                </span>
              </div>
              <div className="avail-equipment-badge-group">
                <span className="avail-equipment-badge-label">Maintenance</span>
                <span className={`admin-status-badge ${maintenanceClass[currentEquipment.maintenanceStatus] || 'up-to-date'}`}>
                  {currentEquipment.maintenanceStatus || 'Up to Date'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-card">
          <div className="admin-empty-state">
            <FlaskConical size={40} />
            <h3 className="admin-empty-state-title">No equipment found in database</h3>
            <p className="admin-empty-state-message">Add instruments in the Equipment section to manage availability.</p>
          </div>
        </div>
      )}

      {/* ---------- Summary cards ---------- */}
      <div className="admin-stats-grid avail-summary-grid">
        <StatCard
          label="Available Hours"
          value={`${summary.availableH % 1 === 0 ? summary.availableH : summary.availableH.toFixed(1)}h`}
          icon={<Clock size={24} />}
          iconColor="cyan"
        />
        <StatCard
          label="Booked Hours"
          value={`${summary.bookedH % 1 === 0 ? summary.bookedH : summary.bookedH.toFixed(1)}h`}
          icon={<CalendarCheck size={24} />}
          iconColor="blue"
        />
        <StatCard
          label="Blocked Hours"
          value={`${summary.blockedH % 1 === 0 ? summary.blockedH : summary.blockedH.toFixed(1)}h`}
          icon={<CalendarX size={24} />}
          iconColor="amber"
        />
        <StatCard
          label="Today's Utilization"
          value={`${summary.utilization}%`}
          icon={<Gauge size={24} />}
          iconColor="green"
        />
      </div>

      {/* ---------- Schedule card ---------- */}
      <div className="admin-card avail-schedule-card">
        <div className="avail-schedule-toolbar">
          <div className="avail-date-nav">
            <button
              className="avail-nav-btn"
              onClick={() => shiftDate(-1)}
              aria-label="Previous day"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="avail-date-display">
              <CalendarDays size={18} />
              <span className="avail-date-text">{fmtDateLong(parseKey(selectedDate))}</span>
            </div>
            <button
              className="avail-nav-btn"
              onClick={() => shiftDate(1)}
              aria-label="Next day"
            >
              <ChevronRight size={18} />
            </button>
            <button
              className={`admin-btn admin-btn-ghost avail-today-btn ${isToday ? 'is-today' : ''}`}
              onClick={() => setSelectedDate(dateKey(new Date()))}
              disabled={isToday}
            >
              Today
            </button>
            <div className="avail-view-toggle" role="tablist" aria-label="Schedule view">
              <button
                role="tab"
                aria-selected={viewMode === 'day'}
                className={viewMode === 'day' ? 'active' : ''}
                onClick={() => setViewMode('day')}
              >
                Day
              </button>
              <button
                role="tab"
                aria-selected={viewMode === 'week'}
                className={viewMode === 'week' ? 'active' : ''}
                onClick={() => setViewMode('week')}
              >
                Week View
              </button>
            </div>
          </div>

          <div className="avail-legend" aria-label="Schedule legend">
            <span className="avail-legend-item"><i className="available" /> Available</span>
            <span className="avail-legend-item"><i className="booked" /> Booked</span>
            <span className="avail-legend-item"><i className="blocked" /> Blocked</span>
            <span className="avail-legend-item"><i className="maintenance" /> Maintenance</span>
          </div>
        </div>

        {viewMode === 'day' ? (
          <div className="avail-timeline" role="table" aria-label="Daily availability timeline">
            <div className="avail-timeline-gutter">
              {hourMarks.map((h) => (
                <span key={h} style={{ top: `${((h - LAB_OPEN) / LAB_HOURS) * 100}%` }}>
                  {fmt24h(h)}
                </span>
              ))}
            </div>
            <div className="avail-timeline-track">
              {hourMarks.map((h) => (
                <i
                  key={h}
                  className="avail-hour-line"
                  style={{ top: `${((h - LAB_OPEN) / LAB_HOURS) * 100}%` }}
                  aria-hidden="true"
                />
              ))}

              {showNowLine && (
                <div
                  className="avail-now-line"
                  style={{ top: `${((nowMinutes - LAB_OPEN) / LAB_HOURS) * 100}%` }}
                >
                  <span className="avail-now-dot" />
                  <span className="avail-now-time">Now</span>
                </div>
              )}

              {daySchedule.length > 0 ? (
                daySchedule.map((slot) => renderSlotBlock(slot))
              ) : (
                <div className="avail-empty-day">
                  <Wrench size={28} />
                  <p>No availability defined for this day.</p>
                  <span>Use “Add Availability” to open booking hours.</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="avail-week">
            <div className="avail-week-header">
              <span className="avail-week-range">
                {fmtDateShort(weekDays[0].date)} – {fmtDateLong(weekDays[6].date)}
              </span>
            </div>
            <div className="avail-week-grid">
              {weekDays.map(({ key, date }) => {
                const slots = buildDaySchedule(config, key);
                const isSel = key === selectedDate;
                const isDayToday = key === dateKey(new Date());
                return (
                  <button
                    key={key}
                    className={`avail-week-col ${isSel ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedDate(key);
                      setViewMode('day');
                    }}
                    title="View day schedule"
                  >
                    <span className="avail-week-col-day">
                      {date.toLocaleString('en-GB', { weekday: 'short' })}
                      {isDayToday && <i className="avail-week-today-dot" />}
                    </span>
                    <span className="avail-week-col-date">{date.getDate()}</span>
                    <span className="avail-week-col-body">
                      {hourMarks.map((h) => (
                        <i
                          key={h}
                          className="avail-hour-line"
                          style={{ top: `${((h - LAB_OPEN) / LAB_HOURS) * 100}%` }}
                          aria-hidden="true"
                        />
                      ))}
                      {slots.map((slot) => renderSlotBlock(slot, true))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ---------- Active Day Exceptions / Blocks ---------- */}
      {dayExceptions.length > 0 && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              Active Blocks & Exceptions · {fmtDateShort(parseKey(selectedDate))}
            </h3>
            <span className="avail-bookings-count">
              {dayExceptions.length} exception{dayExceptions.length === 1 ? '' : 's'}
            </span>
          </div>
          <div className="avail-bookings-list">
            {dayExceptions.map((exc) => (
              <div key={exc.id || `exc-${exc.start}-${exc.end}`} className="avail-booking-row">
                <div className="avail-booking-when">
                  <span className="avail-booking-date">{fmtDateShort(parseKey(selectedDate))}</span>
                  <span className="avail-booking-time">
                    {fmt12h(exc.start)} – {fmt12h(exc.end)}
                  </span>
                </div>
                <div className="avail-booking-who">
                  <div>
                    <p className="avail-booking-student" style={{ textTransform: 'capitalize' }}>
                      {exc.status === 'maintenance' ? 'Scheduled Maintenance' : (exc.status === 'blocked' ? 'Blocked Slot' : 'Custom Availability')}
                    </p>
                    <p className="avail-booking-inst">
                      {exc.reason || 'No reason specified'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`admin-status-badge ${exc.status || 'blocked'}`}>
                    {exc.status || 'Blocked'}
                  </span>
                  {exc.id && (
                    <button
                      type="button"
                      className="admin-btn admin-btn-ghost"
                      style={{ color: '#b91c1c', padding: '4px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => handleRemoveException(exc.id)}
                      title="Remove this slot"
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------- Bookings list ---------- */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            Bookings · {viewMode === 'day' ? fmtDateShort(parseKey(selectedDate)) : 'This week'}
          </h3>
          <span className="avail-bookings-count">
            {viewMode === 'day' ? dayBookings.length : weekBookings.length} booking
            {(viewMode === 'day' ? dayBookings.length : weekBookings.length) === 1 ? '' : 's'}
          </span>
        </div>
        <div className="avail-bookings-list">
          {(viewMode === 'day' ? dayBookings : weekBookings).length > 0 ? (
            (viewMode === 'day' ? dayBookings : weekBookings).map((b) => (
              <div key={b.id || b._id} className="avail-booking-row">
                <div className="avail-booking-when">
                  <span className="avail-booking-date">{fmtDateShort(parseKey(b.date))}</span>
                  <span className="avail-booking-time">
                    {fmt12h(b.start)} – {fmt12h(b.end)}
                  </span>
                </div>
                <div className="avail-booking-who">
                  <div className="avail-booking-avatar">
                    {(b.studentName || 'Student').split(' ').map((p) => p[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="avail-booking-student">{b.studentName || 'Student'}</p>
                    <p className="avail-booking-inst">
                      <Building2 size={12} /> {b.institution || 'Partner University'}
                    </p>
                  </div>
                </div>
                <p className="avail-booking-purpose">{b.purpose || 'Laboratory Research'}</p>
                <span className="admin-status-badge booked">Booked</span>
              </div>
            ))
          ) : (
            <div className="admin-empty-state">
              <CalendarCheck size={48} />
              <h3 className="admin-empty-state-title">No bookings</h3>
              <p className="admin-empty-state-message">
                Approved student bookings will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ---------- Add Availability modal ---------- */}
      {showAddModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowAddModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-availability-title"
        >
          <div className="admin-modal avail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 id="add-availability-title" className="admin-modal-title">Add Availability</h2>
              <button className="admin-modal-close" onClick={() => setShowAddModal(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddAvailability} noValidate>
              <div className="admin-modal-body">
                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="add-equipment">Equipment</label>
                    <select
                      id="add-equipment"
                      className="admin-form-select"
                      value={addForm.equipmentId}
                      onChange={(e) => setAddForm((f) => ({ ...f, equipmentId: e.target.value }))}
                    >
                      {equipmentList.map((eq) => (
                        <option key={eq.equipmentId || eq.id} value={eq.equipmentId || eq.id}>
                          {eq.equipmentName} — {eq.equipmentNumber || eq.equipmentId || eq.id}
                        </option>
                      ))}
                    </select>
                    {addErrors.equipmentId && <p className="avail-field-error">{addErrors.equipmentId}</p>}
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="add-date">Date</label>
                    <input
                      id="add-date"
                      type="date"
                      className="admin-form-input"
                      value={addForm.date}
                      onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                    />
                    {addErrors.date && <p className="avail-field-error">{addErrors.date}</p>}
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="add-start">Start Time</label>
                    <input
                      id="add-start"
                      type="time"
                      className="admin-form-input"
                      min="08:00"
                      max="20:00"
                      value={addForm.start}
                      onChange={(e) => setAddForm((f) => ({ ...f, start: e.target.value }))}
                    />
                    {addErrors.start && <p className="avail-field-error">{addErrors.start}</p>}
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="add-end">End Time</label>
                    <input
                      id="add-end"
                      type="time"
                      className="admin-form-input"
                      min="08:00"
                      max="20:00"
                      value={addForm.end}
                      onChange={(e) => setAddForm((f) => ({ ...f, end: e.target.value }))}
                    />
                    {addErrors.end && <p className="avail-field-error">{addErrors.end}</p>}
                  </div>

                  <div className="admin-form-field full-width">
                    <span className="admin-form-label">Status</span>
                    <div className="avail-status-note">
                      <Check size={14} />
                      New slots are created as <strong>Available</strong>. Booked periods are generated
                      automatically when student bookings are approved.
                    </div>
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary">Add Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Block Slot modal ---------- */}
      {showBlockModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => setShowBlockModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="block-slot-title"
        >
          <div className="admin-modal avail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 id="block-slot-title" className="admin-modal-title">Block Slot</h2>
              <button className="admin-modal-close" onClick={() => setShowBlockModal(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <form onSubmit={handleBlockSlot} noValidate>
              <div className="admin-modal-body">
                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="block-equipment">Equipment</label>
                    <select
                      id="block-equipment"
                      className="admin-form-select"
                      value={blockForm.equipmentId}
                      onChange={(e) => setBlockForm((f) => ({ ...f, equipmentId: e.target.value }))}
                    >
                      {equipmentList.map((eq) => (
                        <option key={eq.equipmentId || eq.id} value={eq.equipmentId || eq.id}>
                          {eq.equipmentName} — {eq.equipmentNumber || eq.equipmentId || eq.id}
                        </option>
                      ))}
                    </select>
                    {blockErrors.equipmentId && <p className="avail-field-error">{blockErrors.equipmentId}</p>}
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="block-date">Date</label>
                    <input
                      id="block-date"
                      type="date"
                      className="admin-form-input"
                      value={blockForm.date}
                      onChange={(e) => setBlockForm((f) => ({ ...f, date: e.target.value }))}
                    />
                    {blockErrors.date && <p className="avail-field-error">{blockErrors.date}</p>}
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="block-start">Start Time</label>
                    <input
                      id="block-start"
                      type="time"
                      className="admin-form-input"
                      min="08:00"
                      max="20:00"
                      value={blockForm.start}
                      onChange={(e) => setBlockForm((f) => ({ ...f, start: e.target.value }))}
                    />
                    {blockErrors.start && <p className="avail-field-error">{blockErrors.start}</p>}
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="block-end">End Time</label>
                    <input
                      id="block-end"
                      type="time"
                      className="admin-form-input"
                      min="08:00"
                      max="20:00"
                      value={blockForm.end}
                      onChange={(e) => setBlockForm((f) => ({ ...f, end: e.target.value }))}
                    />
                    {blockErrors.end && <p className="avail-field-error">{blockErrors.end}</p>}
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="block-type">Type</label>
                    <select
                      id="block-type"
                      className="admin-form-select"
                      value={blockForm.type}
                      onChange={(e) => setBlockForm((f) => ({ ...f, type: e.target.value }))}
                    >
                      <option value="blocked">Blocked</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="block-reason">Reason</label>
                    <input
                      id="block-reason"
                      type="text"
                      className="admin-form-input"
                      placeholder='e.g., "Department maintenance"'
                      value={blockForm.reason}
                      onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))}
                    />
                    {blockErrors.reason && <p className="avail-field-error">{blockErrors.reason}</p>}
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowBlockModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-danger">Block Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Toast ---------- */}
      {toast && (
        <div className={`avail-toast ${toast.type}`} role="status">
          {toast.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
