/* ============================================
   App Core — Router, Theme, Utilities, Dashboard
   ============================================ */

const App = {
    currentPage: 'dashboard',

    init() {
        this.setupNavigation();
        this.setupTheme();
        this.setupImportExport();
        this.setupModal();
        this.updateDate();
        // Handle initial route
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute();
    },

    /* ---------- Navigation ---------- */
    setupNavigation() {
        const sidebar = document.getElementById('sidebar');
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            sidebar.classList.toggle('open');
        });
        // Close sidebar on mobile when link clicked
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 1024) {
                    sidebar.classList.remove('open');
                    sidebar.classList.add('collapsed');
                }
            });
        });
    },

    handleRoute() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        this.currentPage = hash;
        document.getElementById('page-title').textContent = this.getPageTitle(hash);
        // Update active nav
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.toggle('active', l.dataset.page === hash);
        });
        // Render page
        switch (hash) {
            case 'chemicals':    ChemicalManager.render(); break;
            case 'instruments':  InstrumentManager.render(); break;
            case 'instructions': InstructionManager.render(); break;
            case 'booking':      BookingManager.render(); break;
            case 'structure':    StructureManager.render(); break;
            default:             this.renderDashboard(); break;
        }
    },

    getPageTitle(page) {
        return {
            dashboard: 'Dashboard',
            chemicals: 'Chemical Inventory',
            instruments: 'Instrument Inventory',
            instructions: 'Work Instructions',
            booking: 'Lab Booking Schedule',
            structure: 'Lab Structure & Members'
        }[page] || 'Dashboard';
    },

    navigateTo(page) {
        window.location.hash = '#' + page;
    },

    /* ---------- Dashboard ---------- */
    /* ---------- Dashboard ---------- */
    renderDashboard() {
        const chemicals = JSON.parse(localStorage.getItem('lan_chemicals') || '[]');
        const instruments = JSON.parse(localStorage.getItem('lan_instruments') || '[]');
        const instructions = JSON.parse(localStorage.getItem('lan_instructions') || '[]');
        const bookings = JSON.parse(localStorage.getItem('lan_bookings') || '[]');
        const members = JSON.parse(localStorage.getItem('lan_members') || '[]');

        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const expiredChems = chemicals.filter(c => c.expiryDate && new Date(c.expiryDate) < today).length;
        const lowChems = chemicals.filter(c => !c.expiryDate || new Date(c.expiryDate) >= today ? c.quantity <= (c.reorderLevel || 0) && c.quantity > 0 : false).length;
        const availInstr = instruments.filter(i => i.status === 'Available').length;
        const maintInstr = instruments.filter(i => i.status === 'Under Maintenance' || i.status === 'Out of Order').length;
        const todayBookings = bookings.filter(b => b.date === todayStr).length;

        const calDue = instruments.filter(i => {
            if (!i.nextCalibration) return false;
            const d = new Date(i.nextCalibration);
            const diff = (d - today) / 86400000;
            return diff <= 14;
        });

        const el = document.getElementById('main-content');
        el.innerHTML = `
            ${expiredChems > 0 ? `<div class="alert alert-danger">🔴 ${expiredChems} chemical(s) have expired and need attention!</div>` : ''}
            ${calDue.length > 0 ? `<div class="alert alert-warning">⚠️ ${calDue.length} instrument(s) have calibration due within 14 days.</div>` : ''}

            <div class="stats-grid">
                <div class="stat-card" onclick="App.navigateTo('chemicals')" style="cursor:pointer">
                    <div class="stat-icon">🧪</div>
                    <div class="stat-info">
                        <div class="stat-number">${chemicals.length}</div>
                        <div class="stat-label">Chemicals Tracked</div>
                    </div>
                </div>
                <div class="stat-card" onclick="App.navigateTo('instruments')" style="cursor:pointer">
                    <div class="stat-icon">🔬</div>
                    <div class="stat-info">
                        <div class="stat-number">${instruments.length}</div>
                        <div class="stat-label">Instruments</div>
                    </div>
                </div>
                <div class="stat-card" onclick="App.navigateTo('instructions')" style="cursor:pointer">
                    <div class="stat-icon">📋</div>
                    <div class="stat-info">
                        <div class="stat-number">${instructions.length}</div>
                        <div class="stat-label">Work Instructions</div>
                    </div>
                </div>
                <div class="stat-card" onclick="App.navigateTo('booking')" style="cursor:pointer">
                    <div class="stat-icon">📅</div>
                    <div class="stat-info">
                        <div class="stat-number">${todayBookings}</div>
                        <div class="stat-label">Bookings Today</div>
                    </div>
                </div>
                <div class="stat-card" onclick="App.navigateTo('structure')" style="cursor:pointer">
                    <div class="stat-icon">👥</div>
                    <div class="stat-info">
                        <div class="stat-number">${members.length}</div>
                        <div class="stat-label">Advisors & Members</div>
                    </div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-info">
                        <div class="stat-number">${availInstr}</div>
                        <div class="stat-label">Available Instruments</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🔧</div>
                    <div class="stat-info">
                        <div class="stat-number">${maintInstr}</div>
                        <div class="stat-label">Under Maintenance / Out of Order</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚠️</div>
                    <div class="stat-info">
                        <div class="stat-number">${expiredChems + lowChems}</div>
                        <div class="stat-label">Chemical Alerts</div>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">📆</div>
                    <div class="stat-info">
                        <div class="stat-number">${bookings.length}</div>
                        <div class="stat-label">Total Bookings</div>
                    </div>
                </div>
            </div>

            <h2 style="margin-bottom:12px; font-size:1.1rem;">Quick Access</h2>
            <div class="quick-links">
                <div class="quick-link-card" onclick="App.navigateTo('chemicals')">
                    <div class="ql-icon">🧪</div>
                    <div class="ql-title">Chemical Inventory</div>
                    <div class="ql-desc">Track stock levels, expiry dates & hazards</div>
                </div>
                <div class="quick-link-card" onclick="App.navigateTo('instruments')">
                    <div class="ql-icon">🔬</div>
                    <div class="ql-title">Instruments</div>
                    <div class="ql-desc">Manage instruments & calibration schedules</div>
                </div>
                <div class="quick-link-card" onclick="App.navigateTo('instructions')">
                    <div class="ql-icon">📋</div>
                    <div class="ql-title">Work Instructions</div>
                    <div class="ql-desc">SOPs for safe instrument operation</div>
                </div>
                <div class="quick-link-card" onclick="App.navigateTo('booking')">
                    <div class="ql-icon">📅</div>
                    <div class="ql-title">Lab Booking</div>
                    <div class="ql-desc">Reserve time slots & avoid conflicts</div>
                </div>
                <div class="quick-link-card" onclick="App.navigateTo('structure')">
                    <div class="ql-icon">👥</div>
                    <div class="ql-title">Lab Structure</div>
                    <div class="ql-desc">Advisors, students, researchers & roles</div>
                </div>
            </div>
        `;
    },

    /* ---------- Theme ---------- */
    setupTheme() {
        const saved = localStorage.getItem('lan_theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
        const btn = document.getElementById('theme-toggle');
        btn.textContent = saved === 'dark' ? '☀️' : '🌙';
        btn.addEventListener('click', () => {
            const cur = document.documentElement.getAttribute('data-theme');
            const next = cur === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('lan_theme', next);
            btn.textContent = next === 'dark' ? '☀️' : '🌙';
        });
    },

    /* ---------- Import / Export ---------- */
    setupImportExport() {
        document.getElementById('btn-export-all').addEventListener('click', () => {
            const data = {
                chemicals: JSON.parse(localStorage.getItem('lan_chemicals') || '[]'),
                instruments: JSON.parse(localStorage.getItem('lan_instruments') || '[]'),
                instructions: JSON.parse(localStorage.getItem('lan_instructions') || '[]'),
                bookings: JSON.parse(localStorage.getItem('lan_bookings') || '[]'),
                members: JSON.parse(localStorage.getItem('lan_members') || '[]'),
                exportedAt: new Date().toISOString()
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `lab_backup_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
            this.showToast('Data exported successfully!', 'success');
        });

        document.getElementById('btn-import-all').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
                try {
                    const data = JSON.parse(evt.target.result);
                    if (data.chemicals) localStorage.setItem('lan_chemicals', JSON.stringify(data.chemicals));
                    if (data.instruments) localStorage.setItem('lan_instruments', JSON.stringify(data.instruments));
                    if (data.instructions) localStorage.setItem('lan_instructions', JSON.stringify(data.instructions));
                    if (data.bookings) localStorage.setItem('lan_bookings', JSON.stringify(data.bookings));
                    if (data.members) localStorage.setItem('lan_members', JSON.stringify(data.members));
                    this.showToast('Data restored successfully! Refreshing...', 'success');
                    setTimeout(() => this.handleRoute(), 500);
                } catch (err) {
                    this.showToast('Invalid backup file: ' + err.message, 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        });
    },

    /* ---------- Modal ---------- */
    setupModal() {
        document.getElementById('modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modal-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeModal();
        });
    },

    openModal(title, bodyHTML) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').innerHTML = bodyHTML;
        document.getElementById('modal-overlay').classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
    },

    /* ---------- Confirm Dialog ---------- */
    confirm(title, message) {
        return new Promise((resolve) => {
            document.getElementById('confirm-title').textContent = title;
            document.getElementById('confirm-message').textContent = message;
            document.getElementById('confirm-overlay').classList.remove('hidden');

            const ok = document.getElementById('confirm-ok');
            const cancel = document.getElementById('confirm-cancel');
            const close = () => {
                document.getElementById('confirm-overlay').classList.add('hidden');
                ok.replaceWith(ok.cloneNode(true));
                cancel.replaceWith(cancel.cloneNode(true));
            };

            document.getElementById('confirm-ok').addEventListener('click', () => { close(); resolve(true); });
            document.getElementById('confirm-cancel').addEventListener('click', () => { close(); resolve(false); });
        });
    },

    /* ---------- Toast ---------- */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        toast.innerHTML = `<span>${icons[type] || ''} ${message}</span><button class="toast-close" onclick="this.parentElement.remove()">✕</button>`;
        container.appendChild(toast);
        setTimeout(() => { if (toast.parentElement) toast.remove(); }, 4000);
    },

    /* ---------- Utilities ---------- */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    },

    formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    },

    updateDate() {
        const d = new Date();
        document.getElementById('current-date').textContent =
            d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    },

    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    exportCSV(filename, headers, rows) {
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
        this.showToast(`Exported ${filename}`, 'success');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
