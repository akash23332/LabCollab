import { useMemo, useState, useEffect } from 'react';
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
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import { mockEquipment } from '../../data/adminMockData';
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
   MOCK DATA  (shaped for a future API response)
   ------------------------------------------------------------
   weeklyTemplate : recurring availability per weekday (0 = Sun)
   exceptions     : one-off technician actions (available/blocked/
                    maintenance) keyed by date
   bookings       : approved bookings — the system turns these
                    into BOOKED periods automatically. Admins never
                    create booked slots manually.
   ============================================================ */

const avail = (start, end) => ({ start, end, status: 'available' });

const AVAILABILITY_CONFIG = {
  'eq-1': {
    weeklyTemplate: { default: [avail(10 * 60, 19 * 60)] },
    exceptions: {
      '2026-09-20': [
        { id: 'exc-1-m', start: 17 * 60, end: 19 * 60, status: 'maintenance', reason: 'Quarterly sensor calibration' },
      ],
    },
    bookings: [
      {
        id: 'bk-1',
        date: '2026-09-20',
        start: 12 * 60,
        end: 14 * 60,
        studentName: 'Rahul Sharma',
        institution: 'XYZ University',
        purpose: 'IoT Signal Analysis',
      },
      {
        id: 'bk-2',
        date: '2026-09-23',
        start: 10 * 60,
        end: 12 * 60,
        studentName: 'Aman Kumar',
        institution: 'XYZ University',
        purpose: 'Embedded waveform capture',
      },
    ],
  },
  'eq-2': {
    weeklyTemplate: { default: [avail(9 * 60, 17 * 60)] },
    exceptions: {
      '2026-09-21': [
        { id: 'exc-2-b', start: 13 * 60, end: 15 * 60, status: 'blocked', reason: 'Filament resupply' },
      ],
    },
    bookings: [
      {
        id: 'bk-3',
        date: '2026-09-22',
        start: 11 * 60,
        end: 13 * 60,
        studentName: 'Priya Nair',
        institution: 'ABC College',
        purpose: 'Prototype enclosure printing',
      },
    ],
  },
  'eq-3': {
    weeklyTemplate: { default: [avail(9 * 60, 18 * 60)] },
    exceptions: {
      '2026-09-24': [
        { id: 'exc-3-m', start: 9 * 60, end: 12 * 60, status: 'maintenance', reason: 'Objective lens servicing' },
      ],
    },
    bookings: [
      {
        id: 'bk-4',
        date: '2026-09-21',
        start: 14 * 60,
        end: 16 * 60,
        studentName: 'Rahul Sharma',
        institution: 'XYZ University',
        purpose: 'Microstructure imaging',
      },
    ],
  },
  'eq-4': {
    weeklyTemplate: { default: [avail(9 * 60, 17 * 60)] },
    exceptions: {
      '2026-09-20': [
        { id: 'exc-4-m', start: 9 * 60, end: 17 * 60, status: 'maintenance', reason: 'Firmware repair in progress' },
      ],
    },
    bookings: [],
  },
  'eq-5': {
    weeklyTemplate: { default: [avail(8 * 60, 16 * 60)] },
    exceptions: {},
    bookings: [
      {
        id: 'bk-5',
        date: '2026-09-22',
        start: 9 * 60,
        end: 11 * 60,
        studentName: 'Vikram Singh',
        institution: 'XYZ University',
        purpose: 'Aluminium batch milling',
      },
    ],
  },
  'eq-6': {
    weeklyTemplate: { default: [avail(10 * 60, 18 * 60)] },
    exceptions: {},
    bookings: [],
  },
};

/* ============================================================
   SCHEDULE BUILDER
   Builds the final day timeline: base availability minus
   blocked/maintenance cuts, plus those cuts and bookings.
   ============================================================ */

function getBaseTemplate(config, key) {
  const dow = parseKey(key).getDay();
  const t = config.weeklyTemplate;
  return (t[dow] || t.default || []).map((s) => ({ ...s }));
}

function buildDaySchedule(equipmentId, key) {
  const config = AVAILABILITY_CONFIG[equipmentId];
  if (!config) return [];

  const base = getBaseTemplate(config, key);
  const cuts = [
    ...(config.exceptions[key] || []).map((s) => ({ ...s })),
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

/* Raw slots (before subtraction) — used for overlap validation */
function getAllSlotsRaw(equipmentId, key) {
  const config = AVAILABILITY_CONFIG[equipmentId];
  if (!config) return [];
  return [
    ...getBaseTemplate(config, key),
    ...(config.exceptions[key] || []),
    ...(config.bookings || []).filter((b) => b.date === key),
  ];
}

const sumHours = (slots, statuses) =>
  slots
    .filter((s) => statuses.includes(s.status))
    .reduce((acc, s) => acc + (s.end - s.start), 0) / 60;

/* ============================================================
   COMPONENT
   ============================================================ */

export default function Availability() {
  const [equipmentId, setEquipmentId] = useState('eq-1');
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'week'
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [toast, setToast] = useState(null);

  const equipment = mockEquipment.find((e) => e.id === equipmentId) || mockEquipment[0];
  const config = AVAILABILITY_CONFIG[equipmentId] || { exceptions: {}, bookings: [] };

  /* ---- Derived schedule data ---- */

  const daySchedule = useMemo(
    () => buildDaySchedule(equipmentId, selectedDate),
    [equipmentId, selectedDate]
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
    () => (config.bookings || []).filter((b) => b.date === selectedDate),
    [config, selectedDate]
  );

  const weekBookings = useMemo(
    () =>
      (config.bookings || []).filter((b) => weekDays.some((d) => d.key === b.date)),
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

  const emptyAddForm = {
    equipmentId,
    date: selectedDate,
    start: '10:00',
    end: '12:00',
  };

  const emptyBlockForm = {
    equipmentId,
    date: selectedDate,
    start: '09:00',
    end: '11:00',
    type: 'blocked',
    reason: '',
  };

  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addErrors, setAddErrors] = useState({});
  const [blockForm, setBlockForm] = useState(emptyBlockForm);
  const [blockErrors, setBlockErrors] = useState({});

  const openAddModal = () => {
    setAddForm({ equipmentId, date: selectedDate, start: '10:00', end: '12:00' });
    setAddErrors({});
    setShowAddModal(true);
  };

  const openBlockModal = () => {
    setBlockForm({ ...emptyBlockForm, equipmentId, date: selectedDate });
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
        const overlaps = getAllSlotsRaw(form.equipmentId, form.date).some(
          (s) => start < s.end && end > s.start
        );
        if (overlaps) {
          errors.end = 'This slot overlaps an existing availability, block or booking';
        }
      }
    }
    if (requireReason && !form.reason.trim()) {
      errors.reason = 'Please provide a reason';
    }
    return errors;
  };

  const handleAddAvailability = (e) => {
    e.preventDefault();
    const errors = validateSlot(addForm, false);
    setAddErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const conf = AVAILABILITY_CONFIG[addForm.equipmentId];
    if (!conf.exceptions[addForm.date]) conf.exceptions[addForm.date] = [];
    conf.exceptions[addForm.date].push({
      id: `exc-${Date.now()}`,
      start: timeToMinutes(addForm.start),
      end: timeToMinutes(addForm.end),
      status: 'available',
    });
    setShowAddModal(false);
    setToast({ type: 'success', message: 'Availability slot added successfully' });
  };

  const handleBlockSlot = (e) => {
    e.preventDefault();
    const errors = validateSlot(blockForm, true);
    setBlockErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const conf = AVAILABILITY_CONFIG[blockForm.equipmentId];
    if (!conf.exceptions[blockForm.date]) conf.exceptions[blockForm.date] = [];
    conf.exceptions[blockForm.date].push({
      id: `exc-${Date.now()}`,
      start: timeToMinutes(blockForm.start),
      end: timeToMinutes(blockForm.end),
      status: blockForm.type,
      reason: blockForm.reason.trim(),
    });
    setShowBlockModal(false);
    setToast({
      type: 'success',
      message: blockForm.type === 'maintenance'
        ? 'Maintenance period scheduled'
        : 'Slot blocked successfully',
    });
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

  const equipmentName = (id) => {
    const eq = mockEquipment.find((e) => e.id === id);
    return eq ? eq.equipmentName : 'Unknown equipment';
  };

  const renderSlotBlock = (slot, compact = false) => {
    const isBooking = slot.status === 'booked';
    return (
      <div
        key={slot.id}
        className={`avail-block ${slot.status} ${compact ? 'compact' : ''}`}
        style={blockPos(slot)}
      >
        <span className="avail-block-status">{SLOT_LABELS[slot.status]}</span>
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

  return (
    <div className="admin-availability-page">
      {/* ---------- Page header ---------- */}
      <div className="admin-page-header">
        <h1 className="admin-page-title-main">Availability Management</h1>
        <p className="admin-page-subtitle">
          Manage when laboratory equipment is available for booking.
        </p>
        <div className="admin-page-header-actions">
          <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add Availability
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={openBlockModal}>
            <Ban size={18} /> Block Slot
          </button>
        </div>
      </div>

      {/* ---------- Equipment selector + info panel ---------- */}
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
            {mockEquipment.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.equipmentName} — {eq.equipmentNumber}
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
              <h2 className="avail-equipment-name">{equipment.equipmentName}</h2>
              <p className="avail-equipment-number">{equipment.equipmentNumber}</p>
            </div>
          </div>

          <div className="avail-equipment-meta">
            <div className="avail-equipment-meta-item">
              <Building2 size={14} />
              <span>{equipment.collegeId}</span>
            </div>
            <div className="avail-equipment-meta-item">
              <FlaskConical size={14} />
              <span>{equipment.labName}</span>
            </div>
          </div>

          <div className="avail-equipment-badges">
            <div className="avail-equipment-badge-group">
              <span className="avail-equipment-badge-label">Status</span>
              <span className={`admin-status-badge ${statusClass[equipment.status] || 'inactive'}`}>
                {equipment.status}
              </span>
            </div>
            <div className="avail-equipment-badge-group">
              <span className="avail-equipment-badge-label">Condition</span>
              <span className={`admin-status-badge ${conditionClass[equipment.condition] || 'fair'}`}>
                {equipment.condition}
              </span>
            </div>
            <div className="avail-equipment-badge-group">
              <span className="avail-equipment-badge-label">Maintenance</span>
              <span className={`admin-status-badge ${maintenanceClass[equipment.maintenanceStatus] || 'up-to-date'}`}>
                {equipment.maintenanceStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

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
                const slots = buildDaySchedule(equipmentId, key);
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
              <div key={b.id} className="avail-booking-row">
                <div className="avail-booking-when">
                  <span className="avail-booking-date">{fmtDateShort(parseKey(b.date))}</span>
                  <span className="avail-booking-time">
                    {fmt12h(b.start)} – {fmt12h(b.end)}
                  </span>
                </div>
                <div className="avail-booking-who">
                  <div className="avail-booking-avatar">
                    {b.studentName.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="avail-booking-student">{b.studentName}</p>
                    <p className="avail-booking-inst">
                      <Building2 size={12} /> {b.institution}
                    </p>
                  </div>
                </div>
                <p className="avail-booking-purpose">{b.purpose}</p>
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
                      {mockEquipment.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.equipmentName} — {eq.equipmentNumber}
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
                      {mockEquipment.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.equipmentName} — {eq.equipmentNumber}
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
