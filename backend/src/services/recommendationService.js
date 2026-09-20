// Phase 4 services live at the backend root (same placement as the Phase 3
// routes/controllers). This shim keeps the src/ import path working too.
module.exports = require('../../services/recommendationService');
