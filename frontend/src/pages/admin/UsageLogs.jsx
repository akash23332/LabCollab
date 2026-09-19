import { useState, useMemo, useCallback } from 'react';
import {
  Clock,
  Activity,
  Layers,
  CalendarCheck,
  Download,
  Search,
  CheckCircle2,
} from 'lucide-react';
import StatCard from '../../components/admin/StatCard';
import UsageFilterBar from '../../components/admin/UsageFilterBar';
import UsageLogTable from '../../components/admin/UsageLogTable';
import UsageLogModal from '../../components/admin/UsageLogModal';
import '../../components/admin/UsageLogs.css';

/* ============================================================
   MOCK USAGE LOGS DATA
   Strictly actual usage records (Completed, Active, Cancelled)
   No "Pending" status (Pending belongs to Booking Requests)
   ============================================================ */
const INITIAL_USAGE_LOGS = [
  {
    id: 'UL-1024',
    student: {
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
    },
    equipment: {
      name: 'Digital Storage Oscilloscope',
      category: 'Electronics',
    },
    lab: 'Electronics Lab',
    college: 'Example College',
    building: 'Block A',
    room: '204',
    date: '2026-09-20',
    scheduledStart: '10:00',
    scheduledEnd: '12:00',
    actualStart: '10:05',
    actualEnd: '11:52',
    durationMinutes: 107,
    purpose: 'Signal analysis experiment',
    status: 'Completed',
    technician: 'Amit Kumar',
    notes: 'Equipment used successfully. No anomalies observed during high-frequency capture.',
    cancellationReason: '',
  },
  {
    id: 'UL-1023',
    student: {
      name: 'Priya Singh',
      email: 'priya@example.com',
    },
    equipment: {
      name: 'Digital Multimeter',
      category: 'Electronics',
    },
    lab: 'Electronics Lab',
    college: 'Example College',
    building: 'Block A',
    room: '201',
    date: '2026-09-20',
    scheduledStart: '14:00',
    scheduledEnd: '15:00',
    actualStart: '14:02',
    actualEnd: '14:48',
    durationMinutes: 46,
    purpose: 'Precision voltage calibration',
    status: 'Completed',
    technician: 'Amit Kumar',
    notes: 'Multimeter probes verified and recalibrated after circuit test.',
    cancellationReason: '',
  },
  {
    id: 'UL-1022',
    student: {
      name: 'Arjun Mehta',
      email: 'arjun@example.com',
    },
    equipment: {
      name: '3D Printer',
      category: 'Fabrication',
    },
    lab: 'Fabrication Lab',
    college: 'Example College',
    building: 'Block B',
    room: '102',
    date: '2026-09-20',
    scheduledStart: '11:00',
    scheduledEnd: '13:00',
    actualStart: '11:00',
    actualEnd: '',
    durationMinutes: 72,
    purpose: 'Functional drone chassis prototype printing',
    status: 'Active',
    technician: 'Rakesh Patel',
    notes: 'Dual-nozzle extrusion in progress. Bed temperature stable at 65°C.',
    cancellationReason: '',
  },
  {
    id: 'UL-1021',
    student: {
      name: 'Sneha Verma',
      email: 'sneha@example.com',
    },
    equipment: {
      name: 'Thermal Camera',
      category: 'Imaging',
    },
    lab: 'IoT Lab',
    college: 'Example College',
    building: 'Block C',
    room: '305',
    date: '2026-09-20',
    scheduledStart: '10:30',
    scheduledEnd: '12:30',
    actualStart: '10:40',
    actualEnd: '',
    durationMinutes: 55,
    purpose: 'Heat dissipation benchmark on embedded board',
    status: 'Active',
    technician: 'Neha Reddy',
    notes: 'Radiometric infrared video stream recording.',
    cancellationReason: '',
  },
  {
    id: 'UL-1020',
    student: {
      name: 'Vikram Sethi',
      email: 'vikram@example.com',
    },
    equipment: {
      name: 'CNC Milling Machine',
      category: 'Fabrication',
    },
    lab: 'Fabrication Lab',
    college: 'Example College',
    building: 'Block B',
    room: '108',
    date: '2026-09-20',
    scheduledStart: '12:00',
    scheduledEnd: '14:00',
    actualStart: '12:10',
    actualEnd: '',
    durationMinutes: 38,
    purpose: 'Aluminum mounting bracket precision slotting',
    status: 'Active',
    technician: 'Rakesh Patel',
    notes: 'Safety interlocks locked. Coolant circulation running.',
    cancellationReason: '',
  },
  {
    id: 'UL-1019',
    student: {
      name: 'Kabir Joshi',
      email: 'kabir@example.com',
    },
    equipment: {
      name: 'Spectrum Analyzer',
      category: 'RF & Communications',
    },
    lab: 'RF & Communications Lab',
    college: 'Example College',
    building: 'Block C',
    room: '210',
    date: '2026-09-20',
    scheduledStart: '09:00',
    scheduledEnd: '11:00',
    actualStart: '—',
    actualEnd: '—',
    durationMinutes: 0,
    purpose: '5G antenna harmonic measurements',
    status: 'Cancelled',
    technician: 'Neha Reddy',
    notes: 'No-show logged after 30-minute standard grace window.',
    cancellationReason: 'Student did not arrive.',
  },
  {
    id: 'UL-1018',
    student: {
      name: 'Ananya Gupta',
      email: 'ananya@example.com',
    },
    equipment: {
      name: 'Digital Storage Oscilloscope',
      category: 'Electronics',
    },
    lab: 'Electronics Lab',
    college: 'Example College',
    building: 'Block A',
    room: '204',
    date: '2026-09-19',
    scheduledStart: '14:00',
    scheduledEnd: '16:00',
    actualStart: '14:00',
    actualEnd: '16:00',
    durationMinutes: 120,
    purpose: 'Power supply ripple measurement',
    status: 'Completed',
    technician: 'Amit Kumar',
    notes: 'All 4 channels utilized. Probes grounded and inspected.',
    cancellationReason: '',
  },
  {
    id: 'UL-1017',
    student: {
      name: 'Rohan Das',
      email: 'rohan@example.com',
    },
    equipment: {
      name: 'Digital Microscope',
      category: 'Imaging',
    },
    lab: 'Materials Lab',
    college: 'Example College',
    building: 'Block A',
    room: '301',
    date: '2026-09-19',
    scheduledStart: '10:00',
    scheduledEnd: '11:30',
    actualStart: '10:15',
    actualEnd: '11:25',
    durationMinutes: 70,
    purpose: 'Polymer surface morphology inspection',
    status: 'Completed',
    technician: 'Sunita Roy',
    notes: 'High-res microphotographs saved to storage drive.',
    cancellationReason: '',
  },
  {
    id: 'UL-1016',
    student: {
      name: 'Meera Nambiar',
      email: 'meera@example.com',
    },
    equipment: {
      name: '3D Printer',
      category: 'Fabrication',
    },
    lab: 'Fabrication Lab',
    college: 'Example College',
    building: 'Block B',
    room: '102',
    date: '2026-09-19',
    scheduledStart: '15:30',
    scheduledEnd: '17:30',
    actualStart: '—',
    actualEnd: '—',
    durationMinutes: 0,
    purpose: 'Biocompatible scaffold printing',
    status: 'Cancelled',
    technician: 'Rakesh Patel',
    notes: 'Technician logged localized power fault in Block B.',
    cancellationReason: 'Scheduled maintenance due to localized power fluctuation in Block B.',
  },
  {
    id: 'UL-1015',
    student: {
      name: 'Devansh Rao',
      email: 'devansh@example.com',
    },
    equipment: {
      name: 'Logic Analyzer',
      category: 'Electronics',
    },
    lab: 'Electronics Lab',
    college: 'Example College',
    building: 'Block A',
    room: '205',
    date: '2026-09-18',
    scheduledStart: '11:00',
    scheduledEnd: '13:00',
    actualStart: '11:10',
    actualEnd: '12:45',
    durationMinutes: 95,
    purpose: 'I2C & SPI peripheral protocol decoding',
    status: 'Completed',
    technician: 'Amit Kumar',
    notes: 'Timing diagrams captured. Bus speeds verified.',
    cancellationReason: '',
  },
  {
    id: 'UL-1014',
    student: {
      name: 'Tanya Nair',
      email: 'tanya@example.com',
    },
    equipment: {
      name: 'Vector Network Analyzer',
      category: 'RF & Communications',
    },
    lab: 'RF & Communications Lab',
    college: 'Example College',
    building: 'Block C',
    room: '210',
    date: '2026-09-17',
    scheduledStart: '13:00',
    scheduledEnd: '15:00',
    actualStart: '13:05',
    actualEnd: '14:50',
    durationMinutes: 105,
    purpose: 'S-parameter characterization of microstrip filter',
    status: 'Completed',
    technician: 'Neha Reddy',
    notes: 'Full two-port SOLT calibration completed before testing.',
    cancellationReason: '',
  },
  {
    id: 'UL-1013',
    student: {
      name: 'Aditya Kapoor',
      email: 'aditya@example.com',
    },
    equipment: {
      name: 'Thermal Camera',
      category: 'Imaging',
    },
    lab: 'IoT Lab',
    college: 'Example College',
    building: 'Block C',
    room: '305',
    date: '2026-09-16',
    scheduledStart: '16:00',
    scheduledEnd: '17:00',
    actualStart: '16:03',
    actualEnd: '16:49',
    durationMinutes: 46,
    purpose: 'Lithium battery cell temperature logging under discharge',
    status: 'Completed',
    technician: 'Neha Reddy',
    notes: 'Thermal gradients recorded. Max temp stayed within safety threshold.',
    cancellationReason: '',
  },
  {
    id: 'UL-1012',
    student: {
      name: 'Pooja Kulkarni',
      email: 'pooja@example.com',
    },
    equipment: {
      name: 'CNC Milling Machine',
      category: 'Fabrication',
    },
    lab: 'Fabrication Lab',
    college: 'Example College',
    building: 'Block B',
    room: '108',
    date: '2026-09-15',
    scheduledStart: '09:30',
    scheduledEnd: '11:30',
    actualStart: '09:35',
    actualEnd: '11:15',
    durationMinutes: 100,
    purpose: 'Delrin robotics gear machining',
    status: 'Completed',
    technician: 'Rakesh Patel',
    notes: 'Zero tool wear. Vacuum extraction ran continuously.',
    cancellationReason: '',
  },
  {
    id: 'UL-1011',
    student: {
      name: 'Yash Chopra',
      email: 'yash@example.com',
    },
    equipment: {
      name: 'Digital Multimeter',
      category: 'Electronics',
    },
    lab: 'Electronics Lab',
    college: 'Example College',
    building: 'Block A',
    room: '201',
    date: '2026-09-08',
    scheduledStart: '10:00',
    scheduledEnd: '11:00',
    actualStart: '10:02',
    actualEnd: '10:55',
    durationMinutes: 53,
    purpose: 'Resistor tolerance batch verification',
    status: 'Completed',
    technician: 'Amit Kumar',
    notes: 'Standard lab calibration procedure adhered to.',
    cancellationReason: '',
  },
  {
    id: 'UL-1010',
    student: {
      name: 'Simran Kaur',
      email: 'simran@example.com',
    },
    equipment: {
      name: 'Digital Microscope',
      category: 'Imaging',
    },
    lab: 'Materials Lab',
    college: 'Example College',
    building: 'Block A',
    room: '301',
    date: '2026-09-04',
    scheduledStart: '14:00',
    scheduledEnd: '15:30',
    actualStart: '—',
    actualEnd: '—',
    durationMinutes: 0,
    purpose: 'Ceramic fracture cross-section evaluation',
    status: 'Cancelled',
    technician: 'Sunita Roy',
    notes: 'Advance cancellation submitted by student due to sickness.',
    cancellationReason: 'Student notified illness prior to session.',
  },
];

export default function UsageLogs() {
  // Usage logs state
  const [usageLogs, setUsageLogs] = useState(INITIAL_USAGE_LOGS);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [equipmentFilter, setEquipmentFilter] = useState('All');
  const [labFilter, setLabFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');

  // Modal state
  const [selectedLog, setSelectedLog] = useState(null);

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => {
      setToast(null);
    }, 4000);
  }, []);

  // Derived filter options
  const equipmentList = useMemo(() => {
    const set = new Set();
    usageLogs.forEach((l) => {
      if (l.equipment?.name) set.add(l.equipment.name);
    });
    return Array.from(set).sort();
  }, [usageLogs]);

  const labList = useMemo(() => {
    const set = new Set();
    usageLogs.forEach((l) => {
      if (l.lab) set.add(l.lab);
    });
    return Array.from(set).sort();
  }, [usageLogs]);

  // Derived Analytics / Summary Cards
  // Dynamically computed from mock state: 248 sessions, 624.5 hrs, 3 active, 86 this month
  const stats = useMemo(() => {
    const activeCount = usageLogs.filter((l) => l.status === 'Active').length;

    // Sum actual minutes across all records
    const totalMinutes = usageLogs.reduce((sum, l) => {
      return sum + (l.durationMinutes || 0);
    }, 0);

    // Dynamic historical baseline: 233 + 15 = 248 sessions
    const totalSessions = 233 + usageLogs.length;

    // Dynamic historical baseline: 610.3 + (totalMinutes / 60) = 624.5 hrs
    const hoursUsed = (610.3 + totalMinutes / 60).toFixed(1);

    // This month records
    const septRecordsCount = usageLogs.filter((l) =>
      (l.date || '').startsWith('2026-09')
    ).length;
    const thisMonthSessions = 71 + septRecordsCount; // 86 sessions

    return {
      totalSessions,
      hoursUsed: `${hoursUsed} hrs`,
      activeSessions: activeCount,
      thisMonth: `${thisMonthSessions} sessions`,
    };
  }, [usageLogs]);

  // Multi-criteria Filtering
  const filteredLogs = useMemo(() => {
    return usageLogs.filter((log) => {
      // 1. Status Filter
      if (statusFilter !== 'All') {
        if (log.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // 2. Equipment Filter
      if (equipmentFilter !== 'All') {
        if (log.equipment?.name !== equipmentFilter) {
          return false;
        }
      }

      // 3. Lab Filter
      if (labFilter !== 'All') {
        if (log.lab !== labFilter) {
          return false;
        }
      }

      // 4. Date Filter (Base reference date: 2026-09-20)
      if (dateFilter !== 'All') {
        const logDate = log.date;
        if (dateFilter === 'Today') {
          if (logDate !== '2026-09-20') return false;
        } else if (dateFilter === 'Yesterday') {
          if (logDate !== '2026-09-19') return false;
        } else if (dateFilter === 'This Week') {
          if (logDate < '2026-09-14' || logDate > '2026-09-20') return false;
        } else if (dateFilter === 'This Month') {
          if (!logDate.startsWith('2026-09')) return false;
        }
      }

      // 5. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = (log.id || '').toLowerCase().includes(q);
        const matchesStudent = (log.student?.name || '').toLowerCase().includes(q);
        const matchesEquipment = (log.equipment?.name || '').toLowerCase().includes(q);
        const matchesLab = (log.lab || '').toLowerCase().includes(q);
        const matchesPurpose = (log.purpose || '').toLowerCase().includes(q);

        if (
          !matchesId &&
          !matchesStudent &&
          !matchesEquipment &&
          !matchesLab &&
          !matchesPurpose
        ) {
          return false;
        }
      }

      return true;
    });
  }, [usageLogs, statusFilter, equipmentFilter, labFilter, dateFilter, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    statusFilter !== 'All' ||
    equipmentFilter !== 'All' ||
    labFilter !== 'All' ||
    dateFilter !== 'All';

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('All');
    setEquipmentFilter('All');
    setLabFilter('All');
    setDateFilter('All');
  }, []);

  // End Session Action for Active Sessions
  const handleEndSession = useCallback(
    (logId) => {
      const now = new Date();
      const currentHours = now.getHours().toString().padStart(2, '0');
      const currentMinutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;

      let updatedRecord = null;

      setUsageLogs((prev) =>
        prev.map((log) => {
          if (log.id === logId && log.status === 'Active') {
            let duration = log.durationMinutes || 60;
            if (log.actualStart && log.actualStart.includes(':')) {
              const [startH, startM] = log.actualStart.split(':').map(Number);
              const [endH, endM] = [now.getHours(), now.getMinutes()];
              const diffMinutes = endH * 60 + endM - (startH * 60 + startM);
              if (diffMinutes > 0) {
                duration = diffMinutes;
              } else {
                duration = Math.max(log.durationMinutes + 15, 75);
              }
            }

            updatedRecord = {
              ...log,
              status: 'Completed',
              actualEnd: currentTimeStr,
              durationMinutes: duration,
              notes: `${log.notes} Session concluded by technician Amit Kumar at ${currentTimeStr}.`,
            };
            return updatedRecord;
          }
          return log;
        })
      );

      if (updatedRecord) {
        setSelectedLog(updatedRecord);
        showToast(
          `Usage session ${logId} ended — recorded actual runtime of ${Math.floor(
            updatedRecord.durationMinutes / 60
          )}h ${updatedRecord.durationMinutes % 60}m.`
        );
      }
    },
    [showToast]
  );

  // Frontend-only Mock Export Logs
  const handleExportLogs = useCallback(() => {
    try {
      const headers = [
        'Log ID',
        'Student Name',
        'Student Email',
        'Equipment',
        'Category',
        'Laboratory',
        'Date',
        'Scheduled Start',
        'Scheduled End',
        'Actual Start',
        'Actual End',
        'Duration (Minutes)',
        'Status',
        'Technician',
        'Purpose',
        'Cancellation Reason',
        'Notes',
      ];

      const rows = filteredLogs.map((l) => [
        l.id,
        `"${l.student?.name || ''}"`,
        `"${l.student?.email || ''}"`,
        `"${l.equipment?.name || ''}"`,
        `"${l.equipment?.category || ''}"`,
        `"${l.lab || ''}"`,
        l.date,
        l.scheduledStart,
        l.scheduledEnd,
        l.actualStart,
        l.actualEnd || (l.status === 'Active' ? 'In Progress' : '—'),
        l.durationMinutes || 0,
        l.status,
        `"${l.technician || ''}"`,
        `"${(l.purpose || '').replace(/"/g, '""')}"`,
        `"${(l.cancellationReason || '').replace(/"/g, '""')}"`,
        `"${(l.notes || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', encodedUri);
      downloadAnchor.setAttribute(
        'download',
        `LabCollab_Usage_Logs_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);

      showToast(`Exported ${filteredLogs.length} usage logs to CSV.`);
    } catch {
      showToast(`Export executed for ${filteredLogs.length} records.`);
    }
  }, [filteredLogs, showToast]);

  return (
    <div className="admin-usage-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <h1 className="admin-page-title-main">Usage Logs</h1>
        <p className="admin-page-subtitle">
          Track actual laboratory equipment usage and session history.
        </p>

        <div className="admin-page-header-actions">
          <div className="ul-header-search">
            <Search className="admin-search-icon" size={16} aria-hidden="true" />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Search usage logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search usage logs"
            />
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={handleExportLogs}
          >
            <Download size={16} /> Export Logs
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="admin-stats-grid ul-summary-grid">
        <StatCard
          label="Total Sessions"
          value={stats.totalSessions}
          trend={12}
          trendLabel="vs last month"
          icon={<Layers size={24} />}
          iconColor="cyan"
        />
        <StatCard
          label="Hours Used"
          value={stats.hoursUsed}
          trend={8}
          trendLabel="vs last week"
          icon={<Clock size={24} />}
          iconColor="blue"
        />
        <StatCard
          label="Active Sessions"
          value={stats.activeSessions}
          trend={stats.activeSessions > 0 ? stats.activeSessions : 0}
          trendLabel="live now"
          icon={<Activity size={24} />}
          iconColor="amber"
        />
        <StatCard
          label="This Month"
          value={stats.thisMonth}
          trend={15}
          trendLabel="vs target"
          icon={<CalendarCheck size={24} />}
          iconColor="green"
        />
      </div>

      {/* Filter Bar & Table Card */}
      <div className="admin-card">
        <UsageFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          equipmentFilter={equipmentFilter}
          onEquipmentChange={setEquipmentFilter}
          labFilter={labFilter}
          onLabChange={setLabFilter}
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          equipmentList={equipmentList}
          labList={labList}
          onResetFilters={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
          filteredCount={filteredLogs.length}
          totalCount={usageLogs.length}
        />

        <UsageLogTable
          logs={filteredLogs}
          onViewLog={(log) => setSelectedLog(log)}
          onResetFilters={handleResetFilters}
        />
      </div>

      {/* Detailed Modal */}
      {selectedLog && (
        <UsageLogModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onEndSession={handleEndSession}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="ul-toast" role="status">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}