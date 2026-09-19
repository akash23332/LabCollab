export default function UsageStatusBadge({ status }) {
  const normalizedStatus = (status || '').toLowerCase();

  let badgeClass = 'completed';
  let displayLabel = 'Completed';

  if (normalizedStatus === 'active') {
    badgeClass = 'active';
    displayLabel = 'Active';
  } else if (normalizedStatus === 'cancelled' || normalizedStatus === 'canceled') {
    badgeClass = 'cancelled';
    displayLabel = 'Cancelled';
  }

  return (
    <span className={`admin-status-badge ul-${badgeClass}`}>
      {displayLabel}
    </span>
  );
}
