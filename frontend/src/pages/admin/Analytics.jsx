import { useState, useEffect } from 'react';
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
  Sparkles,
  Loader2,
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import { LineChart, BarChart, UtilizationBars, DonutChart } from '../../components/admin/Charts';
import analyticsService from '../../services/analyticsService';
import './Analytics.css';

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
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [aiDemandInsights, setAiDemandInsights] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [reportsRes, insightsRes] = await Promise.allSettled([
          analyticsService.getReports(),
          analyticsService.getDemandInsights(),
        ]);

        if (reportsRes.status === 'fulfilled' && reportsRes.value?.data?.data) {
          setReportData(reportsRes.value.data.data);
        }

        if (insightsRes.status === 'fulfilled' && insightsRes.value?.data?.data) {
          setAiDemandInsights(insightsRes.value.data.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range]);

  const handleExport = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  if (loading && !reportData) {
    return (
      <div className="admin-analytics-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Loader2 size={32} className="admin-spinner" style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const kpis = reportData?.kpis || {
    totalBookings: 0,
    completedSessions: 0,
    totalUsageHours: 0,
    avgUtilization: 0,
    activeEquipment: '0 / 0',
  };

  const trend = reportData?.trend || [];
  const activity = reportData?.activity || [];
  const utilSorted = reportData?.utilSorted || [];
  const perEquipment = reportData?.perEquipment || [];
  const statusPct = reportData?.statusPct || [];
  const labs = reportData?.labs || [];
  const peak = reportData?.peak || { window: '10:00 AM – 12:00 PM', sessions: 0 };
  const lowest = reportData?.lowest || { window: '06:00 PM – 08:00 PM', sessions: 0 };

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
            <LineChart data={trend} formatValue={(v) => `${v}h`} />
          </div>
        </section>

        <section className="admin-card analytics-chart-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">Bookings by Day</h3>
            <span className="analytics-card-sub">Requests received</span>
          </div>
          <div className="analytics-card-body">
            <BarChart data={activity} color="blue" />
          </div>
        </section>
      </div>

      {/* ---------- Equipment utilization ---------- */}
      <section className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Equipment Utilization</h3>
          <span className="analytics-card-sub">Most used equipment · used hrs / nominal hrs</span>
        </div>
        <div className="analytics-card-body">
          {utilSorted.length > 0 ? (
            <UtilizationBars data={utilSorted} />
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>No equipment utilization records yet.</p>
          )}
        </div>
      </section>

      {/* ---------- Equipment performance table ---------- */}
      <section className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Equipment Performance</h3>
          <span className="analytics-card-sub">Real-time dynamic data from database</span>
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
              {perEquipment.length > 0 ? (
                perEquipment.map((eq) => (
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
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    No equipment found in database.
                  </td>
                </tr>
              )}
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
              data={statusPct}
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
            {labs.length > 0 ? (
              <UtilizationBars data={labs} />
            ) : (
              <p style={{ color: '#94a3b8', textAlign: 'center', padding: '24px' }}>No laboratory data available.</p>
            )}
          </div>
        </section>
      </div>

      {/* ---------- AI Demand Model Predictive Insights ---------- */}
      {aiDemandInsights && (
        <section className="admin-card" style={{ marginBottom: '24px' }}>
          <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="admin-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#38bdf8" /> AI Demand Prediction & Forecast
              </h3>
              <span className="analytics-card-sub">Machine learning forecast powered by booking history model</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', fontWeight: 600 }}>
                High: {aiDemandInsights.distribution?.HIGH || 0}
              </span>
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', fontWeight: 600 }}>
                Medium: {aiDemandInsights.distribution?.MEDIUM || 0}
              </span>
              <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontWeight: 600 }}>
                Low: {aiDemandInsights.distribution?.LOW || 0}
              </span>
            </div>
          </div>
          <div className="analytics-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '12px' }}>
            {aiDemandInsights.topHighDemand?.slice(0, 4).map((item) => (
              <div key={item.equipmentId} style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '14px' }}>{item.equipmentName}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                    HIGH DEMAND
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>{item.category} · {item.labName}</span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Forecast Bookings:</span>
                  <strong style={{ color: '#38bdf8', fontSize: '13px' }}>{item.demandPrediction?.predictedBookings || 0} / day</strong>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Peak usage insight cards ---------- */}
      <div className="analytics-grid-2 analytics-peak-grid">
        <div className="analytics-peak-card peak">
          <div className="analytics-peak-icon peak">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="analytics-peak-label">Peak Usage Period</span>
            <strong className="analytics-peak-value">{peak.window}</strong>
            <span className="analytics-peak-meta">{peak.sessions} sessions</span>
          </div>
        </div>
        <div className="analytics-peak-card lowest">
          <div className="analytics-peak-icon lowest">
            <TrendingDown size={22} />
          </div>
          <div>
            <span className="analytics-peak-label">Lowest Usage Period</span>
            <strong className="analytics-peak-value">{lowest.window}</strong>
            <span className="analytics-peak-meta">{lowest.sessions} sessions</span>
          </div>
        </div>
      </div>

      {toast && (
        <div className="analytics-toast" role="status">
          <Download size={16} />
          <span>Report export started — you will be notified when ready.</span>
        </div>
      )}
    </div>
  );
}
