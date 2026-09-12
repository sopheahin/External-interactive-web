var ChemicalManager = (function() {
  const STORAGE_KEY = 'lan_chemicals';
  
  let chemicals = [];
  let currentSort = { column: 'name', asc: true };
  let searchTerm = '';
  let categoryFilter = '';
  let statusFilter = '';

  const CATEGORIES = ['Solvent', 'Acid', 'Base', 'Salt', 'Precursor', 'Surfactant', 'Polymer', 'Organic', 'Inorganic', 'Other'];
  const HAZARD_CLASSES = ['Flammable', 'Corrosive', 'Toxic', 'Oxidizer', 'Irritant', 'None'];
  const UNITS = ['mL', 'L', 'g', 'kg', 'mg'];

  function loadData() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      chemicals = JSON.parse(data);
    } else {
      chemicals = getSampleData();
      saveData();
    }
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chemicals));
  }

  function getSampleData() {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()).toISOString().split('T')[0];
    const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
    const pastDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().split('T')[0];

    return [
      { id: App.generateId(), name: 'Ethanol', casNumber: '64-17-5', category: 'Solvent', quantity: 2.5, unit: 'L', reorderLevel: 1.0, location: 'Cabinet A-1', supplier: 'Sigma-Aldrich', dateReceived: '2025-01-15', expiryDate: nextYear, hazardClass: 'Flammable', sdsLink: '', notes: 'Absolute ethanol' },
      { id: App.generateId(), name: 'Acetone', casNumber: '67-64-1', category: 'Solvent', quantity: 0.5, unit: 'L', reorderLevel: 1.0, location: 'Cabinet A-2', supplier: 'Fisher Scientific', dateReceived: '2025-02-10', expiryDate: nextYear, hazardClass: 'Flammable', sdsLink: '', notes: '' },
      { id: App.generateId(), name: 'Hydrochloric Acid', casNumber: '7647-01-0', category: 'Acid', quantity: 1.5, unit: 'L', reorderLevel: 0.5, location: 'Cabinet B-1', supplier: 'Merck', dateReceived: '2025-03-20', expiryDate: nextYear, hazardClass: 'Corrosive', sdsLink: '', notes: '37% w/w' },
      { id: App.generateId(), name: 'Sodium Hydroxide', casNumber: '1310-73-2', category: 'Base', quantity: 500, unit: 'g', reorderLevel: 200, location: 'Cabinet B-2', supplier: 'Sigma-Aldrich', dateReceived: '2025-04-05', expiryDate: nextYear, hazardClass: 'Corrosive', sdsLink: '', notes: 'Pellets' },
      { id: App.generateId(), name: 'Tetraethyl Orthosilicate (TEOS)', casNumber: '78-10-4', category: 'Precursor', quantity: 200, unit: 'mL', reorderLevel: 250, location: 'Cabinet C-1', supplier: 'Acros Organics', dateReceived: '2025-01-10', expiryDate: nextMonth, hazardClass: 'Flammable', sdsLink: '', notes: 'Store under inert gas' },
      { id: App.generateId(), name: 'Silver Nitrate', casNumber: '7761-88-8', category: 'Precursor', quantity: 25, unit: 'g', reorderLevel: 10, location: 'Cabinet C-2', supplier: 'Sigma-Aldrich', dateReceived: '2024-06-15', expiryDate: pastDate, hazardClass: 'Oxidizer', sdsLink: '', notes: 'Light sensitive' },
      { id: App.generateId(), name: 'Gold(III) Chloride Trihydrate', casNumber: '16961-25-4', category: 'Precursor', quantity: 1, unit: 'g', reorderLevel: 0.5, location: 'Cabinet C-2', supplier: 'Sigma-Aldrich', dateReceived: '2025-08-01', expiryDate: nextYear, hazardClass: 'Corrosive', sdsLink: '', notes: 'Keep cold' },
      { id: App.generateId(), name: 'Titanium Isopropoxide', casNumber: '546-68-9', category: 'Precursor', quantity: 100, unit: 'mL', reorderLevel: 100, location: 'Cabinet C-1', supplier: 'Alfa Aesar', dateReceived: '2025-05-12', expiryDate: nextYear, hazardClass: 'Flammable', sdsLink: '', notes: 'Moisture sensitive' },
      { id: App.generateId(), name: 'Citric Acid', casNumber: '77-92-9', category: 'Organic', quantity: 1, unit: 'kg', reorderLevel: 0.2, location: 'Cabinet D-1', supplier: 'Sigma-Aldrich', dateReceived: '2025-02-28', expiryDate: nextYear, hazardClass: 'Irritant', sdsLink: '', notes: '' },
      { id: App.generateId(), name: 'Cetyltrimethylammonium Bromide (CTAB)', casNumber: '57-09-0', category: 'Surfactant', quantity: 250, unit: 'g', reorderLevel: 50, location: 'Cabinet D-2', supplier: 'Sigma-Aldrich', dateReceived: '2025-03-10', expiryDate: nextYear, hazardClass: 'Irritant', sdsLink: '', notes: '' },
      { id: App.generateId(), name: 'Toluene', casNumber: '108-88-3', category: 'Solvent', quantity: 0, unit: 'L', reorderLevel: 1.0, location: 'Cabinet A-3', supplier: 'Fisher Scientific', dateReceived: '2025-01-05', expiryDate: nextYear, hazardClass: 'Toxic', sdsLink: '', notes: '' },
      { id: App.generateId(), name: 'Sulfuric Acid', casNumber: '7664-93-9', category: 'Acid', quantity: 2.0, unit: 'L', reorderLevel: 1.0, location: 'Cabinet B-1', supplier: 'Merck', dateReceived: '2025-04-18', expiryDate: nextYear, hazardClass: 'Corrosive', sdsLink: '', notes: '98% conc' },
      { id: App.generateId(), name: 'Nitric Acid', casNumber: '7697-37-2', category: 'Acid', quantity: 1.0, unit: 'L', reorderLevel: 0.5, location: 'Cabinet B-1', supplier: 'Merck', dateReceived: '2025-05-22', expiryDate: nextYear, hazardClass: 'Corrosive', sdsLink: '', notes: '68% conc' },
      { id: App.generateId(), name: 'Polyvinylpyrrolidone (PVP)', casNumber: '9003-39-8', category: 'Polymer', quantity: 500, unit: 'g', reorderLevel: 100, location: 'Cabinet D-3', supplier: 'Sigma-Aldrich', dateReceived: '2025-01-30', expiryDate: nextYear, hazardClass: 'None', sdsLink: '', notes: 'MW 40,000' },
      { id: App.generateId(), name: 'Chloroform', casNumber: '67-66-3', category: 'Solvent', quantity: 1.5, unit: 'L', reorderLevel: 0.5, location: 'Cabinet A-3', supplier: 'Fisher Scientific', dateReceived: '2025-06-11', expiryDate: nextYear, hazardClass: 'Toxic', sdsLink: '', notes: 'Stabilized with amylene' }
    ];
  }

  function getStatus(chemical) {
    const today = new Date().toISOString().split('T')[0];
    if (chemical.quantity <= 0) return { label: 'Out of Stock', class: 'danger', value: 'Out of Stock' };
    if (chemical.expiryDate && chemical.expiryDate < today) return { label: 'Expired', class: 'danger', value: 'Expired' };
    if (chemical.quantity <= chemical.reorderLevel) return { label: 'Low Stock', class: 'warning', value: 'Low Stock' };
    return { label: 'Sufficient', class: 'success', value: 'Sufficient' };
  }

  function render() {
    loadData();
    const container = document.getElementById('main-content');
    
    // Alerts
    const alerts = getAlerts();
    let alertsHtml = '';
    if (alerts.length > 0) {
      alertsHtml = `<div class="alert alert-danger" style="margin-bottom: 20px;">
        <strong>Attention Needed:</strong>
        <ul style="margin: 5px 0 0 20px; padding: 0;">
          ${alerts.map(a => `<li>${App.escapeHtml(a)}</li>`).join('')}
        </ul>
      </div>`;
    }

    container.innerHTML = `
      ${alertsHtml}
      <div class="content-header">
        <h2>Chemical Inventory</h2>
        <div class="action-buttons">
          <button class="btn btn-outline" id="btn-export-csv">📄 Export CSV</button>
          <button class="btn btn-primary" id="btn-add-chemical">➕ Add Chemical</button>
        </div>
      </div>

      <div class="search-filter-bar" style="display: flex; gap: 10px; margin-bottom: 20px;">
        <input type="text" id="search-input" class="search-input" placeholder="Search by name or CAS..." value="${App.escapeHtml(searchTerm)}" style="flex: 1;">
        
        <select id="category-filter" class="form-select" style="width: 200px;">
          <option value="">All Categories</option>
          ${CATEGORIES.map(c => `<option value="${c}" ${categoryFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
        
        <select id="status-filter" class="form-select" style="width: 200px;">
          <option value="">All Statuses</option>
          <option value="Sufficient" ${statusFilter === 'Sufficient' ? 'selected' : ''}>Sufficient</option>
          <option value="Low Stock" ${statusFilter === 'Low Stock' ? 'selected' : ''}>Low Stock</option>
          <option value="Expired" ${statusFilter === 'Expired' ? 'selected' : ''}>Expired</option>
          <option value="Out of Stock" ${statusFilter === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option>
        </select>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th data-sort="status" style="cursor: pointer;">Status ${getSortIcon('status')}</th>
              <th data-sort="name" style="cursor: pointer;">Name ${getSortIcon('name')}</th>
              <th data-sort="casNumber" style="cursor: pointer;">CAS # ${getSortIcon('casNumber')}</th>
              <th data-sort="category" style="cursor: pointer;">Category ${getSortIcon('category')}</th>
              <th data-sort="quantity" style="cursor: pointer;">Qty ${getSortIcon('quantity')}</th>
              <th data-sort="location" style="cursor: pointer;">Location ${getSortIcon('location')}</th>
              <th data-sort="expiryDate" style="cursor: pointer;">Expiry Date ${getSortIcon('expiryDate')}</th>
              <th>Hazard</th>
              <th style="width: 100px; text-align: center;">Actions</th>
            </tr>
          </thead>
          <tbody id="chemicals-table-body">
            <!-- Rows rendered by JS -->
          </tbody>
        </table>
      </div>
    `;

    bindEvents();
    renderTable();
  }

  function getAlerts() {
    let expired = 0, lowStock = 0, outOfStock = 0;
    chemicals.forEach(c => {
      const status = getStatus(c).value;
      if (status === 'Expired') expired++;
      if (status === 'Low Stock') lowStock++;
      if (status === 'Out of Stock') outOfStock++;
    });

    const msgs = [];
    if (expired > 0) msgs.push(`${expired} chemical(s) have expired.`);
    if (outOfStock > 0) msgs.push(`${outOfStock} chemical(s) are out of stock.`);
    if (lowStock > 0) msgs.push(`${lowStock} chemical(s) are running low.`);
    return msgs;
  }

  function getSortIcon(col) {
    if (currentSort.column !== col) return '↕️';
    return currentSort.asc ? '⬆️' : '⬇️';
  }

  function bindEvents() {
    document.getElementById('btn-add-chemical').addEventListener('click', () => openFormModal());
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
    
    document.getElementById('search-input').addEventListener('input', (e) => {
      searchTerm = e.target.value.toLowerCase();
      renderTable();
    });
    
    document.getElementById('category-filter').addEventListener('change', (e) => {
      categoryFilter = e.target.value;
      renderTable();
    });
    
    document.getElementById('status-filter').addEventListener('change', (e) => {
      statusFilter = e.target.value;
      renderTable();
    });

    document.querySelectorAll('th[data-sort]').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (currentSort.column === col) {
          currentSort.asc = !currentSort.asc;
        } else {
          currentSort.column = col;
          currentSort.asc = true;
        }
        render(); // Re-render to update icons and table
      });
    });
  }

  function renderTable() {
    let filtered = chemicals.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm) || c.casNumber.toLowerCase().includes(searchTerm);
      const matchCategory = categoryFilter === '' || c.category === categoryFilter;
      const matchStatus = statusFilter === '' || getStatus(c).value === statusFilter;
      return matchSearch && matchCategory && matchStatus;
    });

    filtered.sort((a, b) => {
      let valA = a[currentSort.column];
      let valB = b[currentSort.column];
      
      if (currentSort.column === 'status') {
        valA = getStatus(a).value;
        valB = getStatus(b).value;
      }
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return currentSort.asc ? -1 : 1;
      if (valA > valB) return currentSort.asc ? 1 : -1;
      return 0;
    });

    const tbody = document.getElementById('chemicals-table-body');
    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9">
            <div class="empty-state">
              <div class="empty-state-icon">🧪</div>
              <div class="empty-state-text">No chemicals found</div>
              <div class="empty-state-hint">Try adjusting your search or filters</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(c => {
      const status = getStatus(c);
      return `
        <tr>
          <td><span class="status-badge ${status.class}">${status.label}</span></td>
          <td><strong>${App.escapeHtml(c.name)}</strong></td>
          <td>${App.escapeHtml(c.casNumber)}</td>
          <td>${App.escapeHtml(c.category)}</td>
          <td>${c.quantity} ${c.unit}</td>
          <td>${App.escapeHtml(c.location)}</td>
          <td>${c.expiryDate ? App.formatDate(c.expiryDate) : 'N/A'}</td>
          <td>${App.escapeHtml(c.hazardClass)}</td>
          <td class="action-cell">
            <button class="btn btn-sm btn-outline" onclick="ChemicalManager.editChemical('${c.id}')" title="Edit">✏️</button>
            <button class="btn btn-sm btn-danger" onclick="ChemicalManager.deleteChemical('${c.id}')" title="Delete">🗑️</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function openFormModal(id = null) {
    let c = {
      id: '', name: '', casNumber: '', category: 'Solvent', quantity: 0, unit: 'L',
      reorderLevel: 0, location: '', supplier: '', dateReceived: '', expiryDate: '',
      hazardClass: 'None', sdsLink: '', notes: ''
    };

    if (id) {
      const existing = chemicals.find(x => x.id === id);
      if (existing) c = { ...existing };
    }

    const title = id ? 'Edit Chemical' : 'Add Chemical';
    const bodyHTML = `
      <form id="chemical-form">
        <input type="hidden" id="c-id" value="${c.id}">
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Name *</label>
            <input type="text" id="c-name" class="form-input" value="${App.escapeHtml(c.name)}" required>
          </div>
          <div class="form-group">
            <label class="form-label">CAS Number</label>
            <input type="text" id="c-cas" class="form-input" value="${App.escapeHtml(c.casNumber)}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Category *</label>
            <select id="c-category" class="form-select" required>
              ${CATEGORIES.map(cat => `<option value="${cat}" ${c.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Hazard Class</label>
            <select id="c-hazard" class="form-select">
              ${HAZARD_CLASSES.map(h => `<option value="${h}" ${c.hazardClass === h ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group" style="display:flex; gap:10px;">
            <div style="flex:2">
              <label class="form-label">Quantity *</label>
              <input type="number" id="c-qty" class="form-input" value="${c.quantity}" step="0.01" min="0" required>
            </div>
            <div style="flex:1">
              <label class="form-label">Unit</label>
              <select id="c-unit" class="form-select">
                ${UNITS.map(u => `<option value="${u}" ${c.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Reorder Level *</label>
            <input type="number" id="c-reorder" class="form-input" value="${c.reorderLevel}" step="0.01" min="0" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Location</label>
            <input type="text" id="c-location" class="form-input" value="${App.escapeHtml(c.location)}">
          </div>
          <div class="form-group">
            <label class="form-label">Supplier</label>
            <input type="text" id="c-supplier" class="form-input" value="${App.escapeHtml(c.supplier)}">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Date Received</label>
            <input type="date" id="c-date-received" class="form-input" value="${c.dateReceived}">
          </div>
          <div class="form-group">
            <label class="form-label">Expiry Date</label>
            <input type="date" id="c-expiry" class="form-input" value="${c.expiryDate}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">SDS Link (URL)</label>
          <input type="url" id="c-sds" class="form-input" value="${App.escapeHtml(c.sdsLink)}">
        </div>

        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea id="c-notes" class="form-textarea" rows="3">${App.escapeHtml(c.notes)}</textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Chemical</button>
        </div>
      </form>
    `;
    
    App.openModal(title, bodyHTML);
    
    document.getElementById('chemical-form').addEventListener('submit', function(e) {
      e.preventDefault();
      saveChemical();
    });
  }

  function saveChemical() {
    const id = document.getElementById('c-id').value;
    
    const chemicalData = {
      id: id || App.generateId(),
      name: document.getElementById('c-name').value.trim(),
      casNumber: document.getElementById('c-cas').value.trim(),
      category: document.getElementById('c-category').value,
      quantity: parseFloat(document.getElementById('c-qty').value),
      unit: document.getElementById('c-unit').value,
      reorderLevel: parseFloat(document.getElementById('c-reorder').value),
      location: document.getElementById('c-location').value.trim(),
      supplier: document.getElementById('c-supplier').value.trim(),
      dateReceived: document.getElementById('c-date-received').value,
      expiryDate: document.getElementById('c-expiry').value,
      hazardClass: document.getElementById('c-hazard').value,
      sdsLink: document.getElementById('c-sds').value.trim(),
      notes: document.getElementById('c-notes').value.trim()
    };

    if (id) {
      const index = chemicals.findIndex(c => c.id === id);
      if (index !== -1) chemicals[index] = chemicalData;
      App.showToast('Chemical updated successfully', 'success');
    } else {
      chemicals.push(chemicalData);
      App.showToast('Chemical added successfully', 'success');
    }

    saveData();
    App.closeModal();
    render();
  }

  async function deleteChemical(id) {
    const confirmed = await App.confirm('Delete Chemical', 'Are you sure you want to delete this chemical? This action cannot be undone.');
    if (confirmed) {
      chemicals = chemicals.filter(c => c.id !== id);
      saveData();
      App.showToast('Chemical deleted', 'info');
      render();
    }
  }

  function exportCSV() {
    const headers = ['Status', 'Name', 'CAS Number', 'Category', 'Quantity', 'Unit', 'Reorder Level', 'Location', 'Supplier', 'Date Received', 'Expiry Date', 'Hazard Class', 'Notes'];
    const rows = chemicals.map(c => [
      getStatus(c).value,
      c.name,
      c.casNumber,
      c.category,
      c.quantity,
      c.unit,
      c.reorderLevel,
      c.location,
      c.supplier,
      c.dateReceived,
      c.expiryDate,
      c.hazardClass,
      c.notes
    ]);
    
    App.exportCSV('chemical_inventory.csv', headers, rows);
  }

  return {
    render: render,
    editChemical: openFormModal,
    deleteChemical: deleteChemical
  };
})();
