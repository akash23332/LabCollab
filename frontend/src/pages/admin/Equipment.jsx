import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, X, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { equipmentService } from '../../services/equipmentService';
import './Equipment.css';

const categories = ['Electronics', 'Fabrication', 'Imaging', 'RF & Communications', 'Mechanical', 'Chemical', 'Optical'];
const statuses = ['Available', 'Booked', 'Maintenance', 'Inactive'];
const conditions = ['Excellent', 'Good', 'Fair', 'Poor'];
const maintenanceStatuses = ['Up to Date', 'Due Soon', 'Maintenance Required', 'Under Maintenance'];
const colleges = ['Chitkara University', 'IIT Delhi', 'IIT Bombay', 'BITS Pilani', 'NIT Trichy'];

const initialFormData = {
  equipmentName: '',
  category: '',
  description: '',
  capabilities: [],
  applications: [],
  experimentTypes: [],
  sampleTypes: [],
  measurements: [],
  specifications: '',
  keywords: [],
  collegeId: '',
  labName: '',
  building: '',
  roomNumber: '',
  availability: 'Available',
  status: 'Available',
  condition: 'Excellent',
  maintenanceStatus: 'Up to Date',
};

export default function Equipment() {
  const [equipmentData, setEquipmentData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingAI, setIsSyncingAI] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEquipment = async () => {
    try {
      setIsLoading(true);
      const res = await equipmentService.getEquipment({ limit: 200, manage: true });
      if (res.success && Array.isArray(res.data)) {
        setEquipmentData(res.data);
      }
    } catch (err) {
      console.warn('Backend equipment fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredEquipment = useMemo(() => {
    return equipmentData.filter((eq) => {
      const name = eq.equipmentName || '';
      const number = eq.equipmentNumber || eq.equipmentId || '';
      const cat = eq.category || '';
      const lab = eq.labName || '';
      const matchesSearch =
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lab.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || eq.category === categoryFilter;
      const matchesStatus = !statusFilter || eq.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [equipmentData, searchQuery, categoryFilter, statusFilter]);

  const handleTagInput = (field, value) => {
    const tags = value.split(',').map(t => t.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [field]: tags }));
  };

  const handleTagKeyDown = (field, e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const currentTags = formData[field] || [];
      const newTag = e.target.value.trim();
      if (newTag && !currentTags.includes(newTag)) {
        setFormData(prev => ({ ...prev, [field]: [...currentTags, newTag] }));
      }
      e.target.value = '';
    } else if (e.key === 'Backspace' && e.target.value === '') {
      const currentTags = formData[field] || [];
      if (currentTags.length > 0) {
        setFormData(prev => ({ ...prev, [field]: currentTags.slice(0, -1) }));
      }
    }
  };

  const removeTag = (field, tag) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(t => t !== tag),
    }));
  };

  const openAddModal = () => {
    setFormData(initialFormData);
    setEditingEquipment(null);
    setShowAddModal(true);
  };

  const openEditModal = (equipment) => {
    setFormData({
      ...equipment,
      capabilities: equipment.capabilities || [],
      applications: equipment.applications || [],
      experimentTypes: equipment.experimentTypes || [],
      sampleTypes: equipment.sampleTypes || [],
      measurements: equipment.measurements || [],
      keywords: equipment.keywords || [],
      specifications: typeof equipment.specifications === 'string' ? equipment.specifications : JSON.stringify(equipment.specifications, null, 2),
    });
    setEditingEquipment(equipment);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingEquipment(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingEquipment) {
        const id = editingEquipment.equipmentId || editingEquipment.id || editingEquipment._id;
        const res = await equipmentService.updateEquipment(id, formData);
        if (res.success && res.data) {
          setEquipmentData(prev => prev.map(item => (item.equipmentId === id || item.id === id ? res.data : item)));
          showToast('Equipment updated successfully');
        }
      } else {
        const res = await equipmentService.createEquipment(formData);
        if (res.success && res.data) {
          setEquipmentData(prev => [res.data, ...prev]);
          showToast('New equipment added and synced with AI search database');
        }
      }
      closeModal();
    } catch (err) {
      console.error('Error saving equipment:', err);
      // Fallback local update
      if (editingEquipment) {
        setEquipmentData(prev => prev.map(item => item.id === editingEquipment.id ? { ...item, ...formData } : item));
      } else {
        const newId = `eq-${Date.now()}`;
        setEquipmentData(prev => [{ ...formData, id: newId, equipmentId: newId, equipmentNumber: newId }, ...prev]);
      }
      closeModal();
      showToast('Equipment saved (offline mode)');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (equipment) => {
    setShowDeleteConfirm(equipment);
  };

  const handleDelete = async () => {
    if (showDeleteConfirm) {
      const id = showDeleteConfirm.equipmentId || showDeleteConfirm.id || showDeleteConfirm._id;
      try {
        await equipmentService.deleteEquipment(id);
        showToast(`Equipment ${id} deleted`);
      } catch (err) {
        console.warn('Backend delete failed, removing locally:', err);
      }
      setEquipmentData(prev => prev.filter(item => (item.equipmentId !== id && item.id !== id)));
      setShowDeleteConfirm(null);
    }
  };

  const handleSyncAIDemand = async () => {
    setIsSyncingAI(true);
    try {
      const res = await equipmentService.syncDemandPredictions();
      showToast(res.message || 'AI Demand Predictions synced successfully');
      await fetchEquipment();
    } catch (err) {
      showToast('AI Demand sync failed: ' + err.message);
    } finally {
      setIsSyncingAI(false);
    }
  };

  return (
    <div className="admin-equipment-page">
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#0f172a',
          color: '#38bdf8',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 9999,
          fontWeight: '500',
          border: '1px solid rgba(56, 189, 248, 0.3)',
        }}>
          {toastMessage}
        </div>
      )}

      <div className="admin-page-header">
        <h1 className="admin-page-title-main">Equipment</h1>
        <p className="admin-page-subtitle">Manage laboratory equipment, AI demand forecasts, and operational status.</p>
        <div className="admin-page-header-actions" style={{ display: 'flex', gap: '10px' }}>
          <button
            className="admin-btn"
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={handleSyncAIDemand}
            disabled={isSyncingAI}
            title="Sync AI Demand Predictions from model"
          >
            {isSyncingAI ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Sync AI Demand
          </button>
          <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add Equipment
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-filter-bar">
          <div className="admin-search-wrapper">
            <Search className="admin-search-icon" aria-hidden="true" />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Search equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search equipment"
            />
          </div>
          <div className="admin-filter-group">
            <label className="admin-filter-label" htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              className="admin-filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="admin-filter-group">
            <label className="admin-filter-label" htmlFor="status-filter">Status</label>
            <select
              id="status-filter"
              className="admin-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-table-wrapper">
          {filteredEquipment.length > 0 ? (
            <table className="admin-table" role="grid">
              <thead>
                <tr>
                  <th scope="col">Equipment Name</th>
                  <th scope="col">Equipment Number</th>
                  <th scope="col">Category</th>
                  <th scope="col">College</th>
                  <th scope="col">Department</th>
                  <th scope="col">Lab</th>
                  <th scope="col">Status</th>
                  <th scope="col">AI Demand</th>
                  <th scope="col">Condition</th>
                  <th scope="col">Maintenance</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.map((eq) => (
                  <tr key={eq.equipmentId || eq.id || eq._id}>
                    <td>
                      <div className="admin-table-cell-equipment">
                        <div className="admin-table-equipment-icon">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <path d="M8 21h8" />
                            <path d="M12 17v4" />
                          </svg>
                        </div>
                        <div>
                          <div className="admin-table-equipment-name">{eq.equipmentName}</div>
                          <div className="admin-table-equipment-number">{eq.equipmentNumber || eq.equipmentId}</div>
                        </div>
                      </div>
                    </td>
                    <td>{eq.equipmentNumber || eq.equipmentId}</td>
                    <td>{eq.category}</td>
                    <td>{eq.collegeName || eq.collegeId}</td>
                    <td>{eq.department || '—'}</td>
                    <td>{eq.labName}</td>
                    <td>
                      <span className={`admin-status-badge ${eq.status.toLowerCase()}`}>
                        {eq.status}
                      </span>
                    </td>
                    <td>
                      {eq.demandPrediction?.demandLevel ? (
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          background: eq.demandPrediction.demandLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.15)' : eq.demandPrediction.demandLevel === 'MEDIUM' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                          color: eq.demandPrediction.demandLevel === 'HIGH' ? '#f87171' : eq.demandPrediction.demandLevel === 'MEDIUM' ? '#facc15' : '#4ade80',
                          border: `1px solid ${eq.demandPrediction.demandLevel === 'HIGH' ? 'rgba(239, 68, 68, 0.3)' : eq.demandPrediction.demandLevel === 'MEDIUM' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                        }}>
                          {eq.demandPrediction.demandLevel} ({eq.demandPrediction.predictedBookings})
                        </span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`admin-status-badge ${eq.condition.toLowerCase()}`}>
                        {eq.condition}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-status-badge ${eq.maintenanceStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                        {eq.maintenanceStatus}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-action-btn"
                          onClick={() => openEditModal(eq)}
                          aria-label={`View ${eq.equipmentName}`}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="admin-action-btn"
                          onClick={() => openEditModal(eq)}
                          aria-label={`Edit ${eq.equipmentName}`}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="admin-action-btn delete"
                          onClick={() => confirmDelete(eq)}
                          aria-label={`Delete ${eq.equipmentName}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="admin-empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6v6H9z" />
              </svg>
              <h3 className="admin-empty-state-title">No equipment found</h3>
              <p className="admin-empty-state-message">
                {searchQuery || categoryFilter || statusFilter
                  ? 'Try adjusting your search or filters.'
                  : 'Add your first piece of equipment to get started.'
                }
              </p>
              {!searchQuery && !categoryFilter && !statusFilter && (
                <button className="admin-btn admin-btn-primary" onClick={openAddModal}>
                  <Plus size={18} /> Add Equipment
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="admin-modal-overlay" onClick={closeModal} role="dialog" aria-modal="true" aria-labelledby="equipment-modal-title">
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 id="equipment-modal-title" className="admin-modal-title">
                {editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
              </h2>
              <button className="admin-modal-close" onClick={closeModal} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-grid">
                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="equipmentName">Equipment Name</label>
                    <input
                      type="text"
                      id="equipmentName"
                      className="admin-form-input"
                      value={formData.equipmentName}
                      onChange={(e) => setFormData(prev => ({ ...prev, equipmentName: e.target.value }))}
                      placeholder="e.g., Digital Storage Oscilloscope"
                      required
                    />
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="equipmentNumber">Equipment Number</label>
                    <input
                      type="text"
                      id="equipmentNumber"
                      className="admin-form-input"
                      value={formData.equipmentNumber || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, equipmentNumber: e.target.value }))}
                      placeholder="e.g., EQ-OSC-001"
                    />
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="category">Category</label>
                    <select
                      id="category"
                      className="admin-form-select"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      required
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="collegeId">College</label>
                    <select
                      id="collegeId"
                      className="admin-form-select"
                      value={formData.collegeId}
                      onChange={(e) => setFormData(prev => ({ ...prev, collegeId: e.target.value }))}
                      required
                    >
                      <option value="">Select college</option>
                      {colleges.map((college) => (
                        <option key={college} value={college}>{college}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-field full-width">
                    <label className="admin-form-label required" htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      className="admin-form-textarea"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detailed description of the equipment..."
                      required
                      rows={3}
                    />
                  </div>

                  <div className="admin-form-field full-width">
                    <label className="admin-form-label" htmlFor="capabilities">Capabilities</label>
                    <div className="admin-tag-input">
                      {formData.capabilities.map((tag) => (
                        <span key={tag} className="admin-tag">
                          {tag}
                          <button type="button" className="admin-tag-remove" onClick={() => removeTag('capabilities', tag)} aria-label={`Remove ${tag}`}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="admin-tag-input-field"
                        placeholder="Add capability, press Enter..."
                        onKeyDown={(e) => handleTagKeyDown('capabilities', e)}
                        onBlur={(e) => handleTagInput('capabilities', e.target.value)}
                        aria-label="Add capability"
                      />
                    </div>
                    <p className="admin-form-hint">Press Enter or comma to add tags</p>
                  </div>

                  <div className="admin-form-field full-width">
                    <label className="admin-form-label" htmlFor="applications">Applications</label>
                    <div className="admin-tag-input">
                      {formData.applications.map((tag) => (
                        <span key={tag} className="admin-tag">
                          {tag}
                          <button type="button" className="admin-tag-remove" onClick={() => removeTag('applications', tag)} aria-label={`Remove ${tag}`}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="admin-tag-input-field"
                        placeholder="Add application, press Enter..."
                        onKeyDown={(e) => handleTagKeyDown('applications', e)}
                        onBlur={(e) => handleTagInput('applications', e.target.value)}
                        aria-label="Add application"
                      />
                    </div>
                    <p className="admin-form-hint">Press Enter or comma to add tags</p>
                  </div>

                  <div className="admin-form-field full-width">
                    <label className="admin-form-label" htmlFor="experimentTypes">Experiment Types</label>
                    <div className="admin-tag-input">
                      {formData.experimentTypes.map((tag) => (
                        <span key={tag} className="admin-tag">
                          {tag}
                          <button type="button" className="admin-tag-remove" onClick={() => removeTag('experimentTypes', tag)} aria-label={`Remove ${tag}`}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="admin-tag-input-field"
                        placeholder="Add experiment type, press Enter..."
                        onKeyDown={(e) => handleTagKeyDown('experimentTypes', e)}
                        onBlur={(e) => handleTagInput('experimentTypes', e.target.value)}
                        aria-label="Add experiment type"
                      />
                    </div>
                    <p className="admin-form-hint">Press Enter or comma to add tags</p>
                  </div>

                  <div className="admin-form-field full-width">
                    <label className="admin-form-label" htmlFor="sampleTypes">Sample Types</label>
                    <div className="admin-tag-input">
                      {formData.sampleTypes.map((tag) => (
                        <span key={tag} className="admin-tag">
                          {tag}
                          <button type="button" className="admin-tag-remove" onClick={() => removeTag('sampleTypes', tag)} aria-label={`Remove ${tag}`}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="admin-tag-input-field"
                        placeholder="Add sample type, press Enter..."
                        onKeyDown={(e) => handleTagKeyDown('sampleTypes', e)}
                        onBlur={(e) => handleTagInput('sampleTypes', e.target.value)}
                        aria-label="Add sample type"
                      />
                    </div>
                    <p className="admin-form-hint">Press Enter or comma to add tags</p>
                  </div>

                  <div className="admin-form-field full-width">
                    <label className="admin-form-label" htmlFor="measurements">Measurements</label>
                    <div className="admin-tag-input">
                      {formData.measurements.map((tag) => (
                        <span key={tag} className="admin-tag">
                          {tag}
                          <button type="button" className="admin-tag-remove" onClick={() => removeTag('measurements', tag)} aria-label={`Remove ${tag}`}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="admin-tag-input-field"
                        placeholder="Add measurement, press Enter..."
                        onKeyDown={(e) => handleTagKeyDown('measurements', e)}
                        onBlur={(e) => handleTagInput('measurements', e.target.value)}
                        aria-label="Add measurement"
                      />
                    </div>
                    <p className="admin-form-hint">Press Enter or comma to add tags</p>
                  </div>

                  <div className="admin-form-field full-width">
                    <label className="admin-form-label" htmlFor="specifications">Specifications (JSON)</label>
                    <textarea
                      id="specifications"
                      className="admin-form-textarea"
                      value={formData.specifications}
                      onChange={(e) => setFormData(prev => ({ ...prev, specifications: e.target.value }))}
                      placeholder='{"bandwidth": "1 GHz", "channels": 4, "sampleRate": "5 GS/s"}'
                      rows={6}
                      style={{ fontFamily: 'var(--mono)', fontSize: '13px' }}
                    />
                  </div>

                  <div className="admin-form-field full-width">
                    <label className="admin-form-label" htmlFor="keywords">Keywords</label>
                    <div className="admin-tag-input">
                      {formData.keywords.map((tag) => (
                        <span key={tag} className="admin-tag">
                          {tag}
                          <button type="button" className="admin-tag-remove" onClick={() => removeTag('keywords', tag)} aria-label={`Remove ${tag}`}>
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="admin-tag-input-field"
                        placeholder="Add keyword, press Enter..."
                        onKeyDown={(e) => handleTagKeyDown('keywords', e)}
                        onBlur={(e) => handleTagInput('keywords', e.target.value)}
                        aria-label="Add keyword"
                      />
                    </div>
                    <p className="admin-form-hint">Press Enter or comma to add tags</p>
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="labName">Lab Name</label>
                    <input
                      type="text"
                      id="labName"
                      className="admin-form-input"
                      value={formData.labName}
                      onChange={(e) => setFormData(prev => ({ ...prev, labName: e.target.value }))}
                      placeholder="e.g., Electronics Lab 2"
                      required
                    />
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label" htmlFor="department">Department</label>
                    <input
                      type="text"
                      id="department"
                      className="admin-form-input"
                      value={formData.department || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      placeholder="e.g., ECE"
                    />
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label" htmlFor="building">Building</label>
                    <input
                      type="text"
                      id="building"
                      className="admin-form-input"
                      value={formData.building || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                      placeholder="e.g., Block C"
                    />
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label" htmlFor="roomNumber">Room Number</label>
                    <input
                      type="text"
                      id="roomNumber"
                      className="admin-form-input"
                      value={formData.roomNumber || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, roomNumber: e.target.value }))}
                      placeholder="e.g., C-204"
                    />
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label" htmlFor="availability">Availability</label>
                    <select
                      id="availability"
                      className="admin-form-select"
                      value={formData.availability}
                      onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                    >
                      <option value="Available">Available</option>
                      <option value="Booked">Booked</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="status">Status</label>
                    <select
                      id="status"
                      className="admin-form-select"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      required
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="condition">Condition</label>
                    <select
                      id="condition"
                      className="admin-form-select"
                      value={formData.condition}
                      onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                      required
                    >
                      {conditions.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-field">
                    <label className="admin-form-label required" htmlFor="maintenanceStatus">Maintenance Status</label>
                    <select
                      id="maintenanceStatus"
                      className="admin-form-select"
                      value={formData.maintenanceStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, maintenanceStatus: e.target.value }))}
                      required
                    >
                      {maintenanceStatuses.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    editingEquipment ? 'Update Equipment' : 'Add Equipment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="admin-modal-overlay" onClick={() => setShowDeleteConfirm(null)} role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
          <div className="admin-modal admin-confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-body">
              <div className="admin-confirm-icon">
                <Trash2 size={24} />
              </div>
              <h3 id="delete-confirm-title" className="admin-confirm-title">Delete Equipment</h3>
              <p className="admin-confirm-message">
                Are you sure you want to delete <strong>{showDeleteConfirm.equipmentName}</strong> ({showDeleteConfirm.equipmentNumber})?
                This action cannot be undone.
              </p>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowDeleteConfirm(null)}>
                Cancel
              </button>
              <button className="admin-btn admin-btn-danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}