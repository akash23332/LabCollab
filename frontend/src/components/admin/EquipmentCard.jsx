import './EquipmentCard.css';

export default function EquipmentCard({ equipment, onView, onEdit, onDelete }) {
  const getStatusClass = (status) => {
    const statusMap = {
      Available: 'available',
      Booked: 'booked',
      Maintenance: 'maintenance',
      Inactive: 'inactive',
    };
    return statusMap[status] || 'inactive';
  };

  const getConditionClass = (condition) => {
    const conditionMap = {
      Excellent: 'excellent',
      Good: 'good',
      Fair: 'fair',
      Poor: 'poor',
    };
    return conditionMap[condition] || 'fair';
  };

  const getMaintenanceClass = (maintenance) => {
    const maintenanceMap = {
      'Up to Date': 'up-to-date',
      'Due Soon': 'due-soon',
      'Maintenance Required': 'maintenance-required',
      'Under Maintenance': 'under-maintenance',
    };
    return maintenanceMap[maintenance] || 'up-to-date';
  };

  return (
    <div className="admin-equipment-card">
      <div className="admin-equipment-card-header">
        <div className="admin-equipment-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
        </div>
        <div className="admin-equipment-card-info">
          <h3 className="admin-equipment-card-name">{equipment.equipmentName}</h3>
          <p className="admin-equipment-card-number">{equipment.equipmentNumber}</p>
        </div>
      </div>

      <div className="admin-equipment-card-details">
        <div className="admin-equipment-detail">
          <span className="admin-equipment-detail-label">Category</span>
          <span className="admin-equipment-detail-value">{equipment.category}</span>
        </div>
        <div className="admin-equipment-detail">
          <span className="admin-equipment-detail-label">College</span>
          <span className="admin-equipment-detail-value">{equipment.collegeId}</span>
        </div>
        <div className="admin-equipment-detail">
          <span className="admin-equipment-detail-label">Department</span>
          <span className="admin-equipment-detail-value">{equipment.department}</span>
        </div>
        <div className="admin-equipment-detail">
          <span className="admin-equipment-detail-label">Lab</span>
          <span className="admin-equipment-detail-value">{equipment.labName}</span>
        </div>
      </div>

      <div className="admin-equipment-card-status">
        <span className={`admin-status-badge ${getStatusClass(equipment.status)}`}>
          {equipment.status}
        </span>
        <span className={`admin-status-badge ${getConditionClass(equipment.condition)}`}>
          {equipment.condition}
        </span>
        <span className={`admin-status-badge ${getMaintenanceClass(equipment.maintenanceStatus)}`}>
          {equipment.maintenanceStatus}
        </span>
      </div>

      <div className="admin-equipment-card-actions">
        <button className="admin-action-btn" onClick={() => onView(equipment)} aria-label="View equipment">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button className="admin-action-btn" onClick={() => onEdit(equipment)} aria-label="Edit equipment">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button className="admin-action-btn delete" onClick={() => onDelete(equipment)} aria-label="Delete equipment">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}