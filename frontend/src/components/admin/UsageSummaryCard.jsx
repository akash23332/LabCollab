export default function UsageSummaryCard({
  label,
  value,
  subtext,
  icon,
  variant = 'cyan',
}) {
  const iconVariantClass = `ul-stat-icon-${variant}`;

  return (
    <div className="ul-stat-card">
      <div
        className="ul-stat-glow"
        style={{
          background:
            variant === 'cyan' || variant === 'active'
              ? '#06b6d4'
              : variant === 'blue'
              ? '#3b82f6'
              : '#a855f7',
        }}
      />
      <div className={`ul-stat-icon-wrapper ${iconVariantClass}`}>
        {icon}
      </div>
      <div className="ul-stat-info">
        <div className="ul-stat-label">{label}</div>
        <div className="ul-stat-value">{value}</div>
        {subtext && <div className="ul-stat-subtext">{subtext}</div>}
      </div>
    </div>
  );
}
