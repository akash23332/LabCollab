import { Eye, Clock, AlertCircle } from 'lucide-react';
import UsageStatusBadge from './UsageStatusBadge';
import {
  formatTimeDisplay,
  formatDateDisplay,
  formatDurationDisplay,
} from './usageLogUtils';

export default function UsageLogTable({ logs, onViewLog, onResetFilters }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="admin-empty-state">
        <AlertCircle size={48} aria-hidden="true" />
        <h3 className="admin-empty-state-title">No usage logs found</h3>
        <p className="admin-empty-state-message">
          Try changing your search or filters to locate equipment session records.
        </p>
        {onResetFilters && (
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onResetFilters}
          >
            Clear Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table ul-table">
        <thead>
          <tr>
            <th>Log ID</th>
            <th>Student</th>
            <th>Equipment</th>
            <th>Lab</th>
            <th>Date</th>
            <th>Start</th>
            <th>End</th>
            <th>Duration</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const isActive = log.status === 'Active';
            const isCancelled = log.status === 'Cancelled';
            const initials = log.student?.name
              ? log.student.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase()
              : 'ST';

            return (
              <tr key={log.id} className={isActive ? 'row-active' : ''}>
                {/* Log ID */}
                <td>
                  <span className="ul-log-id">{log.id}</span>
                </td>

                {/* Student */}
                <td>
                  <div className="ul-student-cell">
                    <div className="ul-student-avatar">{initials}</div>
                    <div>
                      <div className="ul-student-name">{log.student?.name}</div>
                      <div className="ul-student-email">{log.student?.email}</div>
                    </div>
                  </div>
                </td>

                {/* Equipment */}
                <td>
                  <div className="ul-equipment-cell">
                    <div className="ul-equipment-name">{log.equipment?.name}</div>
                    <div className="ul-equipment-cat">{log.equipment?.category}</div>
                  </div>
                </td>

                {/* Lab */}
                <td>
                  <span className="ul-lab-pill">{log.lab}</span>
                </td>

                {/* Date */}
                <td>
                  <span className="ul-nowrap">{formatDateDisplay(log.date)}</span>
                </td>

                {/* Start Time */}
                <td>
                  <span
                    className={`ul-time-cell ${isActive ? 'ul-time-active' : ''}`}
                  >
                    {formatTimeDisplay(log.actualStart)}
                  </span>
                </td>

                {/* End Time */}
                <td>
                  <span
                    className={`ul-time-cell ${isActive ? 'ul-time-active' : ''}`}
                  >
                    {isActive ? '—' : isCancelled ? '—' : formatTimeDisplay(log.actualEnd)}
                  </span>
                </td>

                {/* Duration */}
                <td>
                  {isCancelled ? (
                    <span className="ul-duration-badge cancelled">—</span>
                  ) : isActive ? (
                    <span className="ul-duration-badge active">
                      <Clock size={12} />
                      {log.durationMinutes
                        ? formatDurationDisplay(log.durationMinutes)
                        : 'In Progress'}
                    </span>
                  ) : (
                    <span className="ul-duration-badge">
                      {formatDurationDisplay(log.durationMinutes)}
                    </span>
                  )}
                </td>

                {/* Status */}
                <td>
                  <UsageStatusBadge status={log.status} />
                </td>

                {/* Action */}
                <td style={{ textAlign: 'right' }}>
                  <button
                    type="button"
                    className="ul-view-btn"
                    onClick={() => onViewLog(log)}
                    title="View session record"
                  >
                    <Eye size={14} />
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
