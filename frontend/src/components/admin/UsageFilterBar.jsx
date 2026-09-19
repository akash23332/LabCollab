import { Search, RotateCcw } from 'lucide-react';

export default function UsageFilterBar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  equipmentFilter,
  onEquipmentChange,
  labFilter,
  onLabChange,
  dateFilter,
  onDateChange,
  equipmentList = [],
  labList = [],
  onResetFilters,
  hasActiveFilters,
  filteredCount,
  totalCount,
}) {
  return (
    <>
      <div className="admin-filter-bar">
        {/* Status Filter */}
        <div className="admin-filter-group">
          <label className="admin-filter-label" htmlFor="ul-status">
            Status
          </label>
          <select
            id="ul-status"
            className="admin-filter-select"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Active">Active</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Equipment Filter */}
        <div className="admin-filter-group">
          <label className="admin-filter-label" htmlFor="ul-equipment">
            Equipment
          </label>
          <select
            id="ul-equipment"
            className="admin-filter-select"
            value={equipmentFilter}
            onChange={(e) => onEquipmentChange(e.target.value)}
          >
            <option value="All">All Equipment</option>
            {equipmentList.map((eq) => (
              <option key={eq} value={eq}>
                {eq}
              </option>
            ))}
          </select>
        </div>

        {/* Lab Filter */}
        <div className="admin-filter-group">
          <label className="admin-filter-label" htmlFor="ul-lab">
            Lab
          </label>
          <select
            id="ul-lab"
            className="admin-filter-select"
            value={labFilter}
            onChange={(e) => onLabChange(e.target.value)}
          >
            <option value="All">All Labs</option>
            {labList.map((lab) => (
              <option key={lab} value={lab}>
                {lab}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="admin-filter-group">
          <label className="admin-filter-label" htmlFor="ul-date">
            Date
          </label>
          <select
            id="ul-date"
            className="admin-filter-select"
            value={dateFilter}
            onChange={(e) => onDateChange(e.target.value)}
          >
            <option value="All">All Dates</option>
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
          </select>
        </div>

        {/* Search Wrapper */}
        <div className="admin-search-wrapper">
          <Search className="admin-search-icon" size={16} aria-hidden="true" />
          <input
            type="search"
            className="admin-search-input"
            placeholder="Search student, equipment, log ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search usage logs"
          />
        </div>

        {/* Reset Action */}
        {hasActiveFilters && (
          <button
            type="button"
            className="admin-section-action"
            onClick={onResetFilters}
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <RotateCcw size={13} />
            Reset Filters
          </button>
        )}
      </div>

      {/* Filter Metadata Strip */}
      <div className="ul-filter-meta-bar">
        <span>
          Showing <span className="ul-filter-meta-count">{filteredCount}</span> of{' '}
          <span className="ul-filter-meta-count">{totalCount}</span> actual sessions
        </span>
        {hasActiveFilters && (
          <span className="ul-filter-active-tag">
            ● Active filter applied
          </span>
        )}
      </div>
    </>
  );
}
