import { useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  StopCircle,
} from 'lucide-react';
import UsageStatusBadge from './UsageStatusBadge';
import {
  formatTimeDisplay,
  formatDateDisplay,
  formatDurationDisplay,
} from './usageLogUtils';

export default function UsageLogModal({ log, onClose, onEndSession }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!log) return null;

  const isActive = log.status === 'Active';
  const isCancelled = log.status === 'Cancelled';

  // Format scheduled range
  const scheduledRange =
    log.scheduledStart && log.scheduledEnd
      ? `${formatTimeDisplay(log.scheduledStart)} - ${formatTimeDisplay(
          log.scheduledEnd
        )}`
      : 'Not specified';

  // Format actual range
  const actualRange = isActive
    ? `${formatTimeDisplay(log.actualStart)} - In Progress`
    : isCancelled
    ? 'Session not attended / cancelled'
    : `${formatTimeDisplay(log.actualStart)} - ${formatTimeDisplay(log.actualEnd)}`;

  const actualDurationFormatted = isCancelled
    ? '0m (Cancelled)'
    : log.durationMinutes
    ? formatDurationDisplay(log.durationMinutes)
    : isActive
    ? 'In Progress'
    : '—';

  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal ul-view-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="admin-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="admin-modal-title">Usage Session</h3>
              <span className="ul-log-id">{log.id}</span>
            </div>
            <div style={{ marginTop: '4px' }}>
              <UsageStatusBadge status={log.status} />
            </div>
          </div>
          <button
            type="button"
            className="admin-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="admin-modal-body">
          {/* Scheduled vs Actual Time Box (Critical Requirement) */}
          <div className="ul-modal-time-box">
            {/* Scheduled */}
            <div className="ul-modal-time-col">
              <div className="ul-modal-time-label">
                <Clock size={13} />
                Scheduled Time
              </div>
              <div className="ul-modal-time-range">{scheduledRange}</div>
              <div className="ul-modal-time-meta">Booked reservation window</div>
            </div>

            {/* Actual */}
            <div className="ul-modal-time-col">
              <div className="ul-modal-time-label actual">
                <CheckCircle2 size={13} />
                Actual Usage Record
              </div>
              <div className="ul-modal-time-range">{actualRange}</div>
              <div className="ul-modal-time-meta highlight">
                Actual Duration: {actualDurationFormatted}
              </div>
            </div>
          </div>

          {/* Cancellation Reason Callout if Cancelled */}
          {isCancelled && (
            <div className="ul-cancellation-callout">
              <AlertTriangle size={18} className="ul-cancellation-callout-icon" />
              <div>
                <div className="ul-cancellation-callout-title">
                  Cancellation Reason
                </div>
                <p className="ul-cancellation-callout-text">
                  {log.cancellationReason || 'Student did not arrive.'}
                </p>
              </div>
            </div>
          )}

          {/* Facility & Equipment */}
          <div className="ul-detail-section">
            <h4 className="ul-detail-section-title">Equipment & Facility</h4>
            <div className="ul-detail-grid">
              {/* Equipment */}
              <div className="ul-detail-item">
                <span className="ul-detail-label">Equipment</span>
                <span className="ul-detail-value">{log.equipment?.name}</span>
                <span className="ul-detail-subvalue">
                  Category: {log.equipment?.category || 'General'}
                </span>
              </div>

              {/* Lab & Location */}
              <div className="ul-detail-item">
                <span className="ul-detail-label">Lab & Location</span>
                <span className="ul-detail-value">{log.lab}</span>
                <span className="ul-detail-subvalue">
                  Room {log.room}, {log.building} • {log.college}
                </span>
              </div>

              {/* Date */}
              <div className="ul-detail-item">
                <span className="ul-detail-label">Session Date</span>
                <span className="ul-detail-value">{formatDateDisplay(log.date)}</span>
              </div>

              {/* Supervising Technician */}
              <div className="ul-detail-item">
                <span className="ul-detail-label">Supervising Technician</span>
                <span className="ul-detail-value">
                  {log.technician || 'Amit Kumar'}
                </span>
                <span className="ul-detail-subvalue">Verified on-site</span>
              </div>
            </div>
          </div>

          {/* Student & Purpose */}
          <div className="ul-detail-section">
            <h4 className="ul-detail-section-title">Student & Purpose</h4>
            <div className="ul-detail-grid">
              {/* Student */}
              <div className="ul-detail-item">
                <span className="ul-detail-label">Student</span>
                <span className="ul-detail-value">{log.student?.name}</span>
                <span className="ul-detail-subvalue">{log.student?.email}</span>
              </div>

              {/* Purpose */}
              <div className="ul-detail-item">
                <span className="ul-detail-label">Purpose</span>
                <span className="ul-detail-value">
                  {log.purpose || 'Laboratory experiment'}
                </span>
              </div>

              {/* Notes */}
              <div className="ul-detail-item full-width">
                <span className="ul-detail-label">Technician Notes</span>
                <span className="ul-detail-value" style={{ fontWeight: 400 }}>
                  {log.notes || 'Equipment returned in nominal condition.'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="admin-modal-footer">
          {isActive && (
            <button
              type="button"
              className="admin-btn admin-btn-danger"
              onClick={() => onEndSession(log.id)}
            >
              <StopCircle size={15} />
              End Session
            </button>
          )}
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
