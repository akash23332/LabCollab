import { useMemo, useState } from 'react';
import {
  CalendarRange,
  Download,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Gauge,
  Boxes,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import { LineChart, BarChart, UtilizationBars, DonutChart } from '../../components/admin/Charts';
import './Analytics.css';

/* ============================================================
   MOCK SOURCE RECORDS
   Shaped like future backend responses. Analytics are DERIVED
   from these — utilization / hours / counts are never stored
   on the equipment objects themselves.
   ============================================================ */

const EQUIPMENT = [
  { id: 'EQ-001', name: 'Digital Storage Oscilloscope', category: 'Electronics', status: 'Available' },
  { id: 'EQ-002', name: '3D Printer', category: 'Fabrication', status: 'Available' },
  { id: 'EQ-003', name: 'Thermal Camera', category: 'Imaging', status: 'Available' },
  { id: 'EQ-004', name: 'Digital Multimeter', category: 'Electronics', status: 'Available' },
  { id: 'EQ-005', name: 'Logic Analyzer', category: 'Electronics', status: 'Booked' },
  { id: 'EQ-006', name: 'CNC Milling Machine', category: 'Fabrication', status: 'Maintenance' },
  { id: 'EQ-007', name: 'Function Generator', category: 'Electronics', status: 'Available' },
  { id: 'EQ-008', name: 'Spectrum Analyzer', category: 'RF & Communications', status: 'Inactive' },
];

/* Weekly usage minutes per equipment (Mon..Sun). Total lab open
   capacity per week is used as the denominator for utilization. */
const USAGE_MINUTES = {
  'EQ-001': [412, 468, 380, 505, 447, 210, 96],
  'EQ-002': [356, 421, 348, 462, 396, 178, 74],
  'EQ-003': [254, 312, 268, 358, 301, 142, 58],
  'EQ-004': [188, 242, 205, 286, 234, 118, 52],
  'EQ-005': [162, 224, 198, 262, 212, 96, 44],
  'EQ-006': [148, 201, 176, 238, 194, 82, 36],
  'EQ-007': [132, 178, 154, 208, 168, 74, 32],
  'EQ-008': [88, 124, 104, 142, 116, 48, 22],
};

/* Weekly availability minutes per equipment (Mon..Sun) — the
   capacity against which utilization is measured. */
const AVAILABILITY_MINUTES = {
  'EQ-001': [540, 540, 540, 540, 540, 360, 360],
  'EQ-002': [540, 540, 540, 540, 540, 360, 360],
  'EQ-003': [540, 540, 540, 540, 540, 360, 360],
  'EQ-004': [540, 540, 540, 540, 540, 360, 360],
  'EQ-005': [480, 480, 480, 480, 480, 300, 300],
  'EQ-006': [540, 540, 540, 540, 540, 360, 360],
  'EQ-007': [480, 480, 480, 480, 480, 300, 300],
  'EQ-008': [480, 480, 480, 480, 480, 300, 300],
};

/* Booking counts per weekday (Mon..Sun), split by status.
   status: [approved, pending, rejected, cancelled] */
const BOOKINGS_BY_DAY = {
  'EQ-001': [[12, 3, 1, 1], [16, 4, 2, 1], [13, 3, 1, 0], [18, 5, 2, 1], [15, 4, 2, 1], [8, 2, 1, 0], [4, 1, 0, 0]],
  'EQ-002': [[10, 3, 1, 0], [14, 3, 2, 1], [11, 2, 1, 1], [15, 4, 1, 0], [12, 3, 2, 0], [7, 2, 1, 1], [3, 1, 0, 0]],
  'EQ-003': [[7, 2, 1, 0], [10, 2, 1, 0], [8, 2, 1, 0], [11, 3, 1, 1], [9, 2, 1, 0], [5, 1, 0, 0], [2, 1, 0, 0]],
  'EQ-004': [[5, 1, 0, 0], [8, 2, 1, 0], [6, 1, 1, 0], [9, 2, 1, 0], [7, 2, 0, 0], [4, 1, 1, 0], [2, 0, 0, 0]],
  'EQ-005': [[4, 1, 1, 0], [7, 1, 0, 0], [5, 1, 1, 0], [8, 2, 0, 0], [6, 1, 1, 0], [3, 1, 0, 0], [1, 0, 0, 0]],
  'EQ-006': [[4, 1, 0, 0], [6, 1, 1, 0], [5, 1, 0, 0], [7, 1, 1, 0], [5, 1, 0, 0], [3, 0, 1, 0], [1, 1, 0, 0]],
  'EQ-007': [[3, 1, 0, 0], [5, 1, 0, 0], [4, 1, 0, 0], [6, 1, 1, 0], [4, 1, 0, 0], [2, 1, 0, 0], [1, 0, 0, 0]],
  'EQ-008': [[2, 0, 0, 0], [3, 1, 0, 0], [3, 0, 1, 0], [4, 1, 0, 0], [3, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0]],
};

const LABS = [
  { name: 'Electronics Lab', equipmentIds: ['EQ-001', 'EQ-004', 'EQ-005', 'EQ-007'] },
  { name: 'Fabrication Lab', equipmentIds: ['EQ-002', 'EQ-006'] },
  { name: 'Imaging Lab', equipmentIds: ['EQ-003'] },
  { name: 'RF & Communications Lab', equipmentIds: ['EQ-008'] },
];

/* Sessions started per 2-hour window across the week (08:00–20:00) */
const SESSIONS_BY_WINDOW = [
  { window: '08:00 AM – 10:00 AM', sessions: 21 },
  { window: '10:00 AM – 12:00 PM', sessions: 38 },
  { window: '12:00 PM – 02:00 PM', sessions: 26 },
  { window: '02:00 PM – 04:00 PM', sessions: 24 },
  { window: '04:00 PM – 06:00 PM', sessions: 12 },
  { window: '06:00 PM – 08:00 PM', sessions: 9 },
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/* ============================================================
   ANALYTICS HELPERS (derived metrics — replace with API later)
   ============================================================ */

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

const rangeDayCount = {
  today: 1,
  '7d': 7,
  '30d': 30,
  month: 30,
};

function computeAnalytics(range) {
  const weeks = range === 'today' ? 1 / 7 : range === '7d' ? 1 : range === '30d' ? 4 : 4;
  const dayCount = rangeDayCount[range] || 7;

  const perEquipment = EQUIPMENT.map((eq) => {
    const usedMin = sum(USAGE_MINUTES[eq.id]) * weeks;
    const availMin = sum(AVAILABILITY_MINUTES[eq.id]) * weeks;
    const bookings = sum(BOOKINGS_BY_DAY[eq.id].map(sum)) * weeks;
    return {
      ...eq,
      bookings: Math.round(bookings),
      usageHours: Math.round((usedMin / 60) * 10) / 10,
      utilization: Math.round((usedMin / availMin) * 100),
    };
  });

  const totalUsageHours = Math.round((sum(perEquipment.map((e) => e.usageHours)) * 10)) / 10;
  const totalAvailableHours =
    sum(Object.values(AVAILABILITY_MINUTES).map(sum)) * weeks / 60;
  const avgUtilization = Math.round((totalUsageHours / totalAvailableHours) * 1000) / 10;

  const bookingsAll = perEquipment.reduce((acc, e) => {
    const rows = BOOKINGS_BY_DAY[e.id];
    ['approved', 'pending', 'rejected', 'cancelled'].forEach((k, idx) => {
      acc[k] = (acc[k] || 0) + sum(rows.map((r) => r[idx])) * weeks;
    });
    return acc;
  }, {});
  const totalBookings = Math.round(sum(Object.values(bookingsAll)));
  const completedSessions = Math.round(bookingsAll.approved * 0.75);

  const trend = DAY_LABELS.map((label, i) => ({
    label,
    value: Math.round((sum(Object.values(USAGE_MINUTES).map((w) => w[i])) * weeks) / 60 * 10) / 10,
  }));

  const activity = DAY_LABELS.map((label, i) => ({
    label,
    value: Math.round(sum(Object.values(BOOKINGS_BY_DAY).map((rows) => sum(rows[i]))) * weeks),
  }));

  const byStatus = ['approved', 'pending', 'rejected', 'cancelled'].map((k, idx) => {
    const labels = { approved: 'Approved', pending: 'Pending', rejected: 'Rejected', cancelled: 'Cancelled' };
    const tones = { approved: 'tone-success', pending: 'tone-pending', rejected: 'tone-danger', cancelled: 'tone-muted' };
    return { label: labels[k], value: Math.round(bookingsAll[k]), className: tones[k] };
  });
  const statusTotal = sum(byStatus.map((s) => s.value)) || 1;
  const statusPct = byStatus.map((s) => ({
    ...s,
    value: Math.round((s.value / statusTotal) * 100),
  }));
  // normalize rounding to exactly 100
  const drift = 100 - sum(statusPct.map((s) => s.value));
  if (drift !== 0) statusPct[0].value += drift;

  const labs = LABS.map((lab) => {
    const used = sum(lab.equipmentIds.map((id) => sum(USAGE_MINUTES[id]))) * weeks;
    const avail = sum(lab.equipmentIds.map((id) => sum(AVAILABILITY_MINUTES[id]))) * weeks;
    return { label: lab.name, value: Math.round((used / avail) * 100) };
  }).sort((a, b) => b.value - a.value);

  const utilSorted = [...perEquipment]
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 8)
    .map((e) => ({ label: e.name, value: e.utilization, meta: `${e.usageHours}h` }));

  const peak = [...SESSIONS_BY_WINDOW].sort((a, b) => b.sessions - a.sessions)[0];
  const lowest = [...SESSIONS_BY_WINDOW].sort((a, b) => a.sessions - b.sessions)[0];

  return {
    kpis: {
      totalBookings,
      completedSessions,
      totalUsageHours,
      avgUtilization,
      activeEquipment: `${EQUIPMENT.filter((e) => e.status === 'Available' || e.status === 'Booked').length} / ${EQUIPMENT.length}`,
    },
    trend,
    activity,
    utilSorted,
    perEquipment: [...perEquipment].sort((a, b) => b.utilization - a.utilization),
    statusPct,
    labs,
    peak,
    lowest,
    dayCount,
  };
}

/* ============================================================
   COMPONENT
   ============================================================ */

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: 'month', label: 'This Month' },
];

const statusClassMap = {
  Available: 'available',
  Booked: 'booked',
  Maintenance: 'maintenance',
  Inactive: 'inactive',
};

export default function Analytics() {
  const [range, setRange] = useState('7d');
  const [toast, setToast] = useState(false);

  const analytics = useMemo(() => computeAnalytics(range), [range]);
  const { kpis } = analytics;
  const hasData = kpis.totalBookings > 0;

  const handleExport = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  return (
    <div className="admin-analytics-page">
      {/* ---------- Page header ---------- */}
      <div className="admin-page-header">
        <h1 className="admin-page-title-main">Analytics</h1>
        <p className="admin-page-subtitle">
          Monitor equipment utilization, booking activity, usage trends, and laboratory performance.
        </p>
        <div className="admin-page-header-actions">
          <div className="analytics-range-select">
            <CalendarRange size={16} aria-hidden="true" />
            <select
              className="admin-filter-select"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              aria-label="Select date range"
            >
              {RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={handleExport}>
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {!hasData ? (
        <div className="admin-card">
          <div className="admin-empty-state">
            <Gauge size={48} />
            <h3 className="admin-empty-state-title">No analytics data available</h3>
            <p className="admin-empty-state-message">Try selecting a different date range.</p>
          </div>
        </div>
      ) : (
        <>
          {/* ---------- KPI cards ---------- */}
          <div className="admin-stats-grid">
            <StatCard
              label="Total Bookings"
              value={kpis.totalBookings}
              icon={<CalendarCheck size={24} />}
              iconColor="cyan"
            />
            <StatCard
              label="Completed Sessions"
              value={kpis.completedSessions}
              icon={<CheckCircle2 size={24} />}
              iconColor="green"
            />
            <StatCard
              label="Total Usage Hours"
              value={`${kpis.totalUsageHours} hrs`}
              icon={<Clock size={24} />}
              iconColor="blue"
            />
            <StatCard
              label="Average Utilization"
              value={`${kpis.avgUtilization}%`}
              icon={<Gauge size={24} />}
              iconColor="amber"
            />
            <StatCard
              label="Active Equipment"
              value={kpis.activeEquipment}
              icon={<Boxes size={24} />}
              iconColor="cyan"
            />
          </div>

          {/* ---------- Usage trend + booking activity ---------- */}
          <div className="analytics-grid-2">
            <section className="admin-card analytics-chart-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">Equipment Usage Trend</h3>
                <span className="analytics-card-sub">Usage hours by day</span>
              </div>
              <div className="analytics-card-body">
                <LineChart data={analytics.trend} formatValue={(v) => `${v}h`} />
              </div>
            </section>

            <section className="admin-card analytics-chart-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">Bookings by Day</h3>
                <span className="analytics-card-sub">Requests received</span>
              </div>
              <div className="analytics-card-body">
                <BarChart data={analytics.activity} color="blue" />
              </div>
            </section>
          </div>

          {/* ---------- Equipment utilization ---------- */}
          <section className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Equipment Utilization</h3>
              <span className="analytics-card-sub">Most used equipment · used hrs / available hrs</span>
            </div>
            <div className="analytics-card-body">
              <UtilizationBars data={analytics.utilSorted} />
            </div>
          </section>

          {/* ---------- Equipment performance table ---------- */}
          <section className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">Equipment Performance</h3>
              <span className="analytics-card-sub">Read-only · derived from usage logs</span>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table" role="grid">
                <thead>
                  <tr>
                    <th scope="col">Equipment</th>
                    <th scope="col">Bookings</th>
                    <th scope="col">Usage Hours</th>
                    <th scope="col">Utilization</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.perEquipment.map((eq) => (
                    <tr key={eq.id}>
                      <td>
                        <div className="analytics-eq-name">{eq.name}</div>
                        <div className="analytics-eq-cat">{eq.category} · {eq.id}</div>
                      </td>
                      <td className="analytics-num">{eq.bookings}</td>
                      <td className="analytics-num">{eq.usageHours}h</td>
                      <td>
                        <span className={`analytics-util-chip ${eq.utilization >= 70 ? 'high' : eq.utilization >= 45 ? 'mid' : 'low'}`}>
                          {eq.utilization}%
                        </span>
                      </td>
                      <td>
                        <span className={`admin-status-badge ${statusClassMap[eq.status] || 'inactive'}`}>
                          {eq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ---------- Booking status + lab utilization ---------- */}
          <div className="analytics-grid-2">
            <section className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">Booking Status</h3>
                <span className="analytics-card-sub">Share of total bookings</span>
              </div>
              <div className="analytics-card-body">
                <DonutChart
                  data={analytics.statusPct}
                  centerLabel="Total"
                  centerValue={kpis.totalBookings}
                />
              </div>
            </section>

            <section className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">Laboratory Utilization</h3>
                <span className="analytics-card-sub">Highest first</span>
              </div>
              <div className="analytics-card-body">
                <UtilizationBars data={analytics.labs} />
              </div>
            </section>
          </div>

          {/* ---------- Peak usage insight cards ---------- */}
          <div className="analytics-grid-2 analytics-peak-grid">
            <div className="analytics-peak-card peak">
              <div className="analytics-peak-icon peak">
                <TrendingUp size={22} />
              </div>
              <div>
                <span className="analytics-peak-label">Peak Usage Period</span>
                <strong className="analytics-peak-value">{analytics.peak.window}</strong>
                <span className="analytics-peak-meta">{analytics.peak.sessions} sessions</span>
              </div>
            </div>
            <div className="analytics-peak-card lowest">
              <div className="analytics-peak-icon lowest">
                <TrendingDown size={22} />
              </div>
              <div>
                <span className="analytics-peak-label">Lowest Usage Period</span>
                <strong className="analytics-peak-value">{analytics.lowest.window}</strong>
                <span className="analytics-peak-meta">{analytics.lowest.sessions} sessions</span>
              </div>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className="analytics-toast" role="status">
          <Download size={16} />
          <span>Report export started — you will be notified when ready.</span>
        </div>
      )}
    </div>
  );
}
