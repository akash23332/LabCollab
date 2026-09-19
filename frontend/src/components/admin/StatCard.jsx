import './StatCard.css';

export default function StatCard({ label, value, trend, trendLabel, icon, iconColor = 'cyan' }) {
  return (
    <div className="admin-stat-card">
      <div className={`admin-stat-icon ${iconColor}`}>
        {icon}
      </div>
      <div className="admin-stat-content">
        <div className="admin-stat-label">{label}</div>
        <div className="admin-stat-value">{value}</div>
        {trend !== undefined && (
          <div className={`admin-stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trendLabel}
          </div>
        )}
      </div>
    </div>
  );
}