const InstrumentManager = (function () {
    const STORAGE_KEY = 'lan_instruments';

    const SAMPLE_DATA = [
        {
            id: 'inst-001',
            name: 'Scanning Electron Microscope (SEM)',
            model: 'JEOL JSM-7600F',
            serialNumber: 'SEM-7600-012',
            category: 'Microscopy',
            location: 'Lab Room 101',
            status: 'In Use',
            purchaseDate: '2022-01-15',
            lastCalibration: '2026-01-10',
            nextCalibration: '2027-01-10',
            responsiblePerson: 'Dr. Alice Smith',
            notes: 'High-resolution imaging.'
        },
        {
            id: 'inst-002',
            name: 'Transmission Electron Microscope (TEM)',
            model: 'JEOL JEM-2100',
            serialNumber: 'TEM-2100-345',
            category: 'Microscopy',
            location: 'Lab Room 102',
            status: 'Available',
            purchaseDate: '2021-03-22',
            lastCalibration: '2025-09-15',
            nextCalibration: '2026-09-15',
            responsiblePerson: 'Dr. Bob Johnson',
            notes: 'Needs liquid nitrogen.'
        },
        {
            id: 'inst-003',
            name: 'X-Ray Diffractometer (XRD)',
            model: 'Bruker D8 Advance',
            serialNumber: 'XRD-D8-789',
            category: 'Spectroscopy',
            location: 'Lab Room 103',
            status: 'Under Maintenance',
            purchaseDate: '2023-05-11',
            lastCalibration: '2025-11-20',
            nextCalibration: '2026-11-20',
            responsiblePerson: 'Charlie Davis',
            notes: 'X-ray tube replacement scheduled.'
        },
        {
            id: 'inst-004',
            name: 'UV-Vis Spectrophotometer',
            model: 'Shimadzu UV-2600',
            serialNumber: 'UV-2600-111',
            category: 'Spectroscopy',
            location: 'Lab Room 201',
            status: 'Available',
            purchaseDate: '2024-02-14',
            lastCalibration: '2026-02-10',
            nextCalibration: '2027-02-10',
            responsiblePerson: 'Diana Evans',
            notes: 'Routine analysis.'
        },
        {
            id: 'inst-005',
            name: 'FTIR Spectrometer',
            model: 'Bruker Vertex 70',
            serialNumber: 'FTIR-V70-222',
            category: 'Spectroscopy',
            location: 'Lab Room 201',
            status: 'Available',
            purchaseDate: '2022-07-30',
            lastCalibration: '2026-08-01',
            nextCalibration: '2027-08-01',
            responsiblePerson: 'Diana Evans',
            notes: 'ATR accessory included.'
        },
        {
            id: 'inst-006',
            name: 'Dynamic Light Scattering (DLS)',
            model: 'Malvern Zetasizer Nano ZS',
            serialNumber: 'DLS-ZS-333',
            category: 'Measurement',
            location: 'Lab Room 202',
            status: 'In Use',
            purchaseDate: '2023-11-05',
            lastCalibration: '2025-09-20',
            nextCalibration: '2026-09-20',
            responsiblePerson: 'Evan Foster',
            notes: 'Particle size and zeta potential.'
        },
        {
            id: 'inst-007',
            name: 'Atomic Force Microscope (AFM)',
            model: 'Bruker Dimension Icon',
            serialNumber: 'AFM-DI-444',
            category: 'Microscopy',
            location: 'Lab Room 104',
            status: 'Available',
            purchaseDate: '2021-08-18',
            lastCalibration: '2026-03-12',
            nextCalibration: '2027-03-12',
            responsiblePerson: 'Fiona Green',
            notes: 'Multiple probes available.'
        },
        {
            id: 'inst-008',
            name: 'Centrifuge',
            model: 'Eppendorf 5424',
            serialNumber: 'CEN-5424-555',
            category: 'Sample Prep',
            location: 'Sample Prep Room',
            status: 'Available',
            purchaseDate: '2025-01-10',
            lastCalibration: '2026-01-15',
            nextCalibration: '2027-01-15',
            responsiblePerson: 'George Harris',
            notes: 'Max speed 15,000 rpm.'
        },
        {
            id: 'inst-009',
            name: 'Analytical Balance',
            model: 'Mettler Toledo XPE205',
            serialNumber: 'BAL-XPE-666',
            category: 'Measurement',
            location: 'Sample Prep Room',
            status: 'Available',
            purchaseDate: '2024-04-22',
            lastCalibration: '2026-09-01',
            nextCalibration: '2027-09-01',
            responsiblePerson: 'George Harris',
            notes: 'Keep table free from vibrations.'
        },
        {
            id: 'inst-010',
            name: 'Hot Plate/Magnetic Stirrer',
            model: 'IKA C-MAG HS7',
            serialNumber: 'HP-HS7-777',
            category: 'General',
            location: 'Fume Hood 1',
            status: 'Available',
            purchaseDate: '2023-10-15',
            lastCalibration: '2025-10-15',
            nextCalibration: '2026-10-15',
            responsiblePerson: 'Lab Manager',
            notes: 'Heating up to 500C.'
        },
        {
            id: 'inst-011',
            name: 'Ultrasonic Bath',
            model: 'Elmasonic S 30 H',
            serialNumber: 'US-S30H-888',
            category: 'Sample Prep',
            location: 'Fume Hood 2',
            status: 'Out of Order',
            purchaseDate: '2022-05-08',
            lastCalibration: '2025-05-10',
            nextCalibration: '2026-05-10',
            responsiblePerson: 'Lab Manager',
            notes: 'Heater not working.'
        },
        {
            id: 'inst-012',
            name: 'Spin Coater',
            model: 'Laurell WS-650',
            serialNumber: 'SC-WS650-999',
            category: 'Sample Prep',
            location: 'Cleanroom',
            status: 'Available',
            purchaseDate: '2024-09-01',
            lastCalibration: '2026-09-10',
            nextCalibration: '2027-09-10',
            responsiblePerson: 'Ian Irvine',
            notes: 'Requires vacuum supply.'
        }
    ];

    let instruments = [];
    let currentSort = { column: 'name', asc: true };
    let currentFilters = { search: '', category: '', status: '' };

    function loadData() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                instruments = JSON.parse(stored);
            } catch (e) {
                instruments = [...SAMPLE_DATA];
                saveData();
            }
        } else {
            instruments = [...SAMPLE_DATA];
            saveData();
        }
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(instruments));
    }

    function getCalibrationAlerts() {
        const today = new Date('2026-09-11'); // using the current time
        const twoWeeksFromNow = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
        
        const overdue = [];
        const upcoming = [];

        instruments.forEach(inst => {
            if (inst.nextCalibration) {
                const calDate = new Date(inst.nextCalibration);
                if (calDate < today) {
                    overdue.push(inst);
                } else if (calDate <= twoWeeksFromNow) {
                    upcoming.push(inst);
                }
            }
        });

        return { overdue, upcoming };
    }

    function renderAlerts() {
        const { overdue, upcoming } = getCalibrationAlerts();
        let html = '';

        if (overdue.length > 0) {
            html += `<div class="alert alert-danger" style="margin-bottom: 1rem;">
                <strong>⚠️ Overdue Calibration:</strong> ${overdue.map(i => App.escapeHtml(i.name)).join(', ')}
            </div>`;
        }
        
        if (upcoming.length > 0) {
            html += `<div class="alert alert-warning" style="margin-bottom: 1rem;">
                <strong>⚠️ Upcoming Calibration (Next 14 days):</strong> ${upcoming.map(i => App.escapeHtml(i.name)).join(', ')}
            </div>`;
        }

        return html;
    }

    function renderHeader() {
        return `
            <div class="content-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2>Instrument Inventory</h2>
                <div class="action-buttons">
                    <button class="btn btn-outline" id="btn-export-csv">Export CSV</button>
                    <button class="btn btn-primary" id="btn-add-instrument">+ Add Instrument</button>
                </div>
            </div>
            <div class="search-filter-bar" style="display: flex; gap: 1rem; margin-bottom: 1rem;">
                <input type="text" class="search-input form-input" id="search-instrument" placeholder="Search by name or model..." style="flex: 1;" value="${App.escapeHtml(currentFilters.search)}">
                <select class="form-select" id="filter-category" style="width: 200px;">
                    <option value="">All Categories</option>
                    <option value="Microscopy" ${currentFilters.category === 'Microscopy' ? 'selected' : ''}>Microscopy</option>
                    <option value="Spectroscopy" ${currentFilters.category === 'Spectroscopy' ? 'selected' : ''}>Spectroscopy</option>
                    <option value="Chromatography" ${currentFilters.category === 'Chromatography' ? 'selected' : ''}>Chromatography</option>
                    <option value="Sample Prep" ${currentFilters.category === 'Sample Prep' ? 'selected' : ''}>Sample Prep</option>
                    <option value="Measurement" ${currentFilters.category === 'Measurement' ? 'selected' : ''}>Measurement</option>
                    <option value="General" ${currentFilters.category === 'General' ? 'selected' : ''}>General</option>
                </select>
                <select class="form-select" id="filter-status" style="width: 200px;">
                    <option value="">All Statuses</option>
                    <option value="Available" ${currentFilters.status === 'Available' ? 'selected' : ''}>Available</option>
                    <option value="In Use" ${currentFilters.status === 'In Use' ? 'selected' : ''}>In Use</option>
                    <option value="Under Maintenance" ${currentFilters.status === 'Under Maintenance' ? 'selected' : ''}>Under Maintenance</option>
                    <option value="Out of Order" ${currentFilters.status === 'Out of Order' ? 'selected' : ''}>Out of Order</option>
                </select>
            </div>
        `;
    }

    function getStatusBadge(status) {
        let cls = 'info';
        let icon = '🔵';
        if (status === 'Available') { cls = 'success'; icon = '🟢'; }
        else if (status === 'Under Maintenance') { cls = 'warning'; icon = '🟡'; }
        else if (status === 'Out of Order') { cls = 'danger'; icon = '🔴'; }
        
        return `<span class="status-badge ${cls}">${icon} ${App.escapeHtml(status)}</span>`;
    }

    function getFilteredAndSortedData() {
        let data = instruments.filter(inst => {
            const matchSearch = (inst.name.toLowerCase().includes(currentFilters.search.toLowerCase()) || 
                                 inst.model.toLowerCase().includes(currentFilters.search.toLowerCase()));
            const matchCat = currentFilters.category ? inst.category === currentFilters.category : true;
            const matchStatus = currentFilters.status ? inst.status === currentFilters.status : true;
            return matchSearch && matchCat && matchStatus;
        });

        data.sort((a, b) => {
            let valA = a[currentSort.column] || '';
            let valB = b[currentSort.column] || '';
            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return currentSort.asc ? -1 : 1;
            if (valA > valB) return currentSort.asc ? 1 : -1;
            return 0;
        });

        return data;
    }

    function renderTable() {
        const data = getFilteredAndSortedData();
        
        if (data.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">🔬</div>
                    <div class="empty-state-text">No instruments found</div>
                    <div class="empty-state-hint">Try adjusting your search or filters.</div>
                </div>
            `;
        }

        const getSortIcon = (col) => {
            if (currentSort.column === col) {
                return currentSort.asc ? '▲' : '▼';
            }
            return '';
        };

        const th = (label, col) => `<th class="sortable" data-col="${col}" style="cursor:pointer">${label} <span style="font-size: 0.8em">${getSortIcon(col)}</span></th>`;

        let html = `
            <div class="table-container">
                <table class="data-table" style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            ${th('Status', 'status')}
                            ${th('Name', 'name')}
                            ${th('Model', 'model')}
                            ${th('Serial#', 'serialNumber')}
                            ${th('Category', 'category')}
                            ${th('Location', 'location')}
                            ${th('Next Cal.', 'nextCalibration')}
                            ${th('Responsible', 'responsiblePerson')}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.forEach(inst => {
            html += `
                <tr>
                    <td>${getStatusBadge(inst.status)}</td>
                    <td><strong>${App.escapeHtml(inst.name)}</strong></td>
                    <td>${App.escapeHtml(inst.model)}</td>
                    <td>${App.escapeHtml(inst.serialNumber)}</td>
                    <td>${App.escapeHtml(inst.category)}</td>
                    <td>${App.escapeHtml(inst.location)}</td>
                    <td>${App.formatDate(inst.nextCalibration)}</td>
                    <td>${App.escapeHtml(inst.responsiblePerson)}</td>
                    <td class="action-cell">
                        <button class="btn btn-sm btn-outline btn-edit-inst" data-id="${inst.id}" title="Edit">✏️</button>
                        <button class="btn btn-sm btn-danger btn-delete-inst" data-id="${inst.id}" title="Delete">🗑️</button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;
        return html;
    }

    function renderForm(inst = null) {
        return `
            <form id="instrument-form">
                <input type="hidden" id="inst-id" value="${inst ? inst.id : ''}">
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-input" id="inst-name" required value="${inst ? App.escapeHtml(inst.name) : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Model</label>
                        <input type="text" class="form-input" id="inst-model" value="${inst ? App.escapeHtml(inst.model) : ''}">
                    </div>
                </div>
                
                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Serial Number</label>
                        <input type="text" class="form-input" id="inst-serial" value="${inst ? App.escapeHtml(inst.serialNumber) : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Category</label>
                        <select class="form-select" id="inst-category">
                            <option value="Microscopy" ${inst && inst.category === 'Microscopy' ? 'selected' : ''}>Microscopy</option>
                            <option value="Spectroscopy" ${inst && inst.category === 'Spectroscopy' ? 'selected' : ''}>Spectroscopy</option>
                            <option value="Chromatography" ${inst && inst.category === 'Chromatography' ? 'selected' : ''}>Chromatography</option>
                            <option value="Sample Prep" ${inst && inst.category === 'Sample Prep' ? 'selected' : ''}>Sample Prep</option>
                            <option value="Measurement" ${inst && inst.category === 'Measurement' ? 'selected' : ''}>Measurement</option>
                            <option value="General" ${inst && inst.category === 'General' ? 'selected' : ''}>General</option>
                        </select>
                    </div>
                </div>

                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Location</label>
                        <input type="text" class="form-input" id="inst-location" value="${inst ? App.escapeHtml(inst.location) : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Status</label>
                        <select class="form-select" id="inst-status">
                            <option value="Available" ${inst && inst.status === 'Available' ? 'selected' : ''}>Available</option>
                            <option value="In Use" ${inst && inst.status === 'In Use' ? 'selected' : ''}>In Use</option>
                            <option value="Under Maintenance" ${inst && inst.status === 'Under Maintenance' ? 'selected' : ''}>Under Maintenance</option>
                            <option value="Out of Order" ${inst && inst.status === 'Out of Order' ? 'selected' : ''}>Out of Order</option>
                        </select>
                    </div>
                </div>

                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Purchase Date</label>
                        <input type="date" class="form-input" id="inst-purchase" value="${inst ? inst.purchaseDate : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Responsible Person</label>
                        <input type="text" class="form-input" id="inst-responsible" value="${inst ? App.escapeHtml(inst.responsiblePerson) : ''}">
                    </div>
                </div>

                <div class="form-row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Last Calibration Date</label>
                        <input type="date" class="form-input" id="inst-last-cal" value="${inst ? inst.lastCalibration : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Next Calibration Date</label>
                        <input type="date" class="form-input" id="inst-next-cal" value="${inst ? inst.nextCalibration : ''}">
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 1rem;">
                    <label class="form-label">Notes</label>
                    <textarea class="form-textarea" id="inst-notes" rows="3" style="width: 100%;">${inst ? App.escapeHtml(inst.notes) : ''}</textarea>
                </div>

                <div class="form-actions" style="text-align: right; margin-top: 1rem;">
                    <button type="button" class="btn btn-secondary" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Instrument</button>
                </div>
            </form>
        `;
    }

    function attachEvents() {
        const main = document.getElementById('main-content');

        const searchInput = document.getElementById('search-instrument');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                currentFilters.search = e.target.value;
                updateTableOnly();
            });
        }

        const catFilter = document.getElementById('filter-category');
        if (catFilter) {
            catFilter.addEventListener('change', (e) => {
                currentFilters.category = e.target.value;
                updateTableOnly();
            });
        }

        const statusFilter = document.getElementById('filter-status');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                currentFilters.status = e.target.value;
                updateTableOnly();
            });
        }

        const btnExport = document.getElementById('btn-export-csv');
        if (btnExport) {
            btnExport.addEventListener('click', () => {
                const data = getFilteredAndSortedData();
                const headers = ['Status', 'Name', 'Model', 'Serial Number', 'Category', 'Location', 'Purchase Date', 'Last Calibration', 'Next Calibration', 'Responsible Person', 'Notes'];
                const rows = data.map(i => [
                    i.status, i.name, i.model, i.serialNumber, i.category, i.location, i.purchaseDate, i.lastCalibration, i.nextCalibration, i.responsiblePerson, i.notes
                ]);
                App.exportCSV('instruments.csv', headers, rows);
            });
        }

        const btnAdd = document.getElementById('btn-add-instrument');
        if (btnAdd) {
            btnAdd.addEventListener('click', () => {
                App.openModal('Add Instrument', renderForm());
                attachFormEvents();
            });
        }

        main.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => {
                const col = th.getAttribute('data-col');
                if (currentSort.column === col) {
                    currentSort.asc = !currentSort.asc;
                } else {
                    currentSort.column = col;
                    currentSort.asc = true;
                }
                updateTableOnly();
            });
        });

        main.querySelectorAll('.btn-edit-inst').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const inst = instruments.find(i => i.id === id);
                if (inst) {
                    App.openModal('Edit Instrument', renderForm(inst));
                    attachFormEvents();
                }
            });
        });

        main.querySelectorAll('.btn-delete-inst').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                const inst = instruments.find(i => i.id === id);
                if (inst) {
                    const confirmed = await App.confirm('Delete Instrument', `Are you sure you want to delete ${App.escapeHtml(inst.name)}?`);
                    if (confirmed) {
                        instruments = instruments.filter(i => i.id !== id);
                        saveData();
                        App.showToast('Instrument deleted', 'success');
                        render();
                    }
                }
            });
        });
    }

    function attachFormEvents() {
        const form = document.getElementById('instrument-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const id = document.getElementById('inst-id').value || App.generateId();
                const name = document.getElementById('inst-name').value.trim();
                const model = document.getElementById('inst-model').value.trim();
                const serialNumber = document.getElementById('inst-serial').value.trim();
                const category = document.getElementById('inst-category').value;
                const location = document.getElementById('inst-location').value.trim();
                const status = document.getElementById('inst-status').value;
                const purchaseDate = document.getElementById('inst-purchase').value;
                const responsiblePerson = document.getElementById('inst-responsible').value.trim();
                const lastCalibration = document.getElementById('inst-last-cal').value;
                const nextCalibration = document.getElementById('inst-next-cal').value;
                const notes = document.getElementById('inst-notes').value.trim();

                if (!name) {
                    App.showToast('Name is required', 'error');
                    return;
                }

                const index = instruments.findIndex(i => i.id === id);
                const newData = {
                    id, name, model, serialNumber, category, location, status,
                    purchaseDate, responsiblePerson, lastCalibration, nextCalibration, notes
                };

                if (index >= 0) {
                    instruments[index] = newData;
                    App.showToast('Instrument updated', 'success');
                } else {
                    instruments.push(newData);
                    App.showToast('Instrument added', 'success');
                }

                saveData();
                App.closeModal();
                render();
            });
        }
    }

    function updateTableOnly() {
        const main = document.getElementById('main-content');
        const container = main.querySelector('.table-wrapper-dynamic');
        if (container) {
            container.innerHTML = renderTable();
            attachEvents(); // re-attach table events
        }
    }

    function render() {
        loadData();
        const main = document.getElementById('main-content');
        if (!main) return;

        main.innerHTML = `
            ${renderAlerts()}
            ${renderHeader()}
            <div class="table-wrapper-dynamic">
                ${renderTable()}
            </div>
        `;
        attachEvents();
    }

    return {
        render
    };
})();
