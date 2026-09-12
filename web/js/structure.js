/* ============================================
   Lab Structure & Member Profiles Module
   — Manage Advisors, Researchers & Lab Members with Photo Upload
   ============================================ */

const StructureManager = {
    storageKey: 'lan_members',
    searchTerm: '',
    categoryFilter: 'all',
    statusFilter: 'all',
    tempPhotoData: '', // holds base64 photo during modal editing

    /* ---------- Data ---------- */
    getAll() {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            } catch (e) {
                console.error("Failed to parse lab members cache:", e);
            }
        }
        const sample = this.getSampleData();
        localStorage.setItem(this.storageKey, JSON.stringify(sample));
        return sample;
    },

    save(members) {
        localStorage.setItem(this.storageKey, JSON.stringify(members));
    },

    getMemberById(id) {
        return this.getAll().find(m => m.id === id);
    },

    /* ---------- Main Render ---------- */
    render() {
        const container = document.getElementById('main-content');
        if (!container) return;

        const all = this.getAll();
        const term = this.searchTerm.toLowerCase();

        const filtered = all.filter(m => {
            const matchesTerm = !term ||
                m.name.toLowerCase().includes(term) ||
                (m.role && m.role.toLowerCase().includes(term)) ||
                (m.email && m.email.toLowerCase().includes(term)) ||
                (m.title && m.title.toLowerCase().includes(term)) ||
                (m.researchInterests && m.researchInterests.some(t => t.toLowerCase().includes(term))) ||
                (m.office && m.office.toLowerCase().includes(term));

            const matchesCategory = this.categoryFilter === 'all' || m.category === this.categoryFilter;
            const matchesStatus = this.statusFilter === 'all' || m.status === this.statusFilter;

            return matchesTerm && matchesCategory && matchesStatus;
        });

        // Group into tiers
        const advisors = filtered.filter(m => m.category === 'advisor');
        const researchers = filtered.filter(m => m.category === 'researcher');
        const staff = filtered.filter(m => m.category === 'staff');
        const others = filtered.filter(m => !['advisor', 'researcher', 'staff'].includes(m.category));

        container.innerHTML = `
            <div class="content-header">
                <div class="search-filter-bar">
                    <input type="text" id="member-search" class="form-input search-input"
                           placeholder="🔍 Search member name, title, research..."
                           value="${App.escapeHtml(this.searchTerm)}">
                    <select id="member-category-filter" class="form-select">
                        <option value="all" ${this.categoryFilter === 'all' ? 'selected' : ''}>All Roles (${all.length})</option>
                        <option value="advisor" ${this.categoryFilter === 'advisor' ? 'selected' : ''}>👑 Advisors & PIs</option>
                        <option value="researcher" ${this.categoryFilter === 'researcher' ? 'selected' : ''}>🎓 Researchers & Students</option>
                        <option value="staff" ${this.categoryFilter === 'staff' ? 'selected' : ''}>🔬 Technical & Safety Staff</option>
                        <option value="alumni" ${this.categoryFilter === 'alumni' ? 'selected' : ''}>📜 Alumni</option>
                    </select>
                    <select id="member-status-filter" class="form-select">
                        <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>All Status</option>
                        <option value="Active" ${this.statusFilter === 'Active' ? 'selected' : ''}>🟢 Active Only</option>
                        <option value="Alumni" ${this.statusFilter === 'Alumni' ? 'selected' : ''}>🎓 Alumni</option>
                    </select>
                </div>
                <div class="action-buttons">
                    <button class="btn btn-outline" onclick="StructureManager.exportCSV()">📥 Export Directory</button>
                    <button class="btn btn-outline" onclick="window.print()">🖨️ Print</button>
                    <button class="btn btn-primary" onclick="StructureManager.openAddModal()">+ Add Member / Advisor</button>
                </div>
            </div>

            <div class="alert alert-info" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <span>
                    🏛️ <strong>Laboratory of Applied Nanomaterial (LAN) Organizational Structure</strong> —
                    Keep track of advisors, graduate students, research assistants, and technical staff with contact details and pictures.
                </span>
                <span class="status-badge info" style="font-size:.8rem;">Total: ${filtered.length} member(s)</span>
            </div>

            ${filtered.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-text">No members found</div>
                    <div class="empty-state-hint">Try adjusting your search criteria or click "+ Add Member / Advisor" to add one.</div>
                </div>
            ` : `
                <!-- Tier 1: Advisors & Leadership -->
                ${advisors.length > 0 ? `
                <div class="structure-tier">
                    <div class="tier-header">
                        <span style="font-size:1.4rem;">👑</span>
                        <h2 class="tier-title">Principal Investigator & Academic Advisors</h2>
                        <span class="tier-count">${advisors.length}</span>
                    </div>
                    <div class="members-grid">
                        ${advisors.map(m => this.renderMemberCard(m)).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Tier 2: Researchers & Graduate Students -->
                ${researchers.length > 0 ? `
                <div class="structure-tier">
                    <div class="tier-header">
                        <span style="font-size:1.4rem;">🎓</span>
                        <h2 class="tier-title">Researchers & Graduate Students</h2>
                        <span class="tier-count">${researchers.length}</span>
                    </div>
                    <div class="members-grid">
                        ${researchers.map(m => this.renderMemberCard(m)).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Tier 3: Technical & Safety Staff -->
                ${staff.length > 0 ? `
                <div class="structure-tier">
                    <div class="tier-header">
                        <span style="font-size:1.4rem;">🔬</span>
                        <h2 class="tier-title">Research Assistants & Technical Staff</h2>
                        <span class="tier-count">${staff.length}</span>
                    </div>
                    <div class="members-grid">
                        ${staff.map(m => this.renderMemberCard(m)).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Others / Alumni -->
                ${others.length > 0 ? `
                <div class="structure-tier">
                    <div class="tier-header">
                        <span style="font-size:1.4rem;">📜</span>
                        <h2 class="tier-title">Alumni & Visiting Scholars</h2>
                        <span class="tier-count">${others.length}</span>
                    </div>
                    <div class="members-grid">
                        ${others.map(m => this.renderMemberCard(m)).join('')}
                    </div>
                </div>
                ` : ''}
            `}
        `;

        // Event listeners
        const searchInput = document.getElementById('member-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.render();
            });
        }

        const catFilter = document.getElementById('member-category-filter');
        if (catFilter) {
            catFilter.addEventListener('change', (e) => {
                this.categoryFilter = e.target.value;
                this.render();
            });
        }

        const statFilter = document.getElementById('member-status-filter');
        if (statFilter) {
            statFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.render();
            });
        }
    },

    /* ---------- Card Renderer ---------- */
    renderMemberCard(m) {
        const isAdvisor = m.category === 'advisor';
        const avatarHTML = m.photo
            ? `<img src="${m.photo}" alt="${App.escapeHtml(m.name)}" class="member-avatar">`
            : `<div class="member-avatar" style="background:linear-gradient(135deg, ${isAdvisor ? '#f59e0b, #d97706' : '#0ea5e9, #0284c7'}); color:#fff; font-weight:700;">${this.getInitials(m.name)}</div>`;

        const statusColor = m.status === 'Active' ? 'var(--success)' : (m.status === 'Alumni' ? 'var(--text-muted)' : 'var(--warning)');

        return `
            <div class="member-card ${isAdvisor ? 'is-advisor' : ''}" id="card-${m.id}">
                <div class="member-card-body">
                    <div class="member-avatar-wrap" onclick="StructureManager.viewProfile('${m.id}')" style="cursor:pointer;">
                        ${avatarHTML}
                        <span class="member-status-dot" style="background:${statusColor};" title="${m.status || 'Active'}"></span>
                    </div>
                    <div class="member-info">
                        <div class="member-name" title="${App.escapeHtml(m.name)}" onclick="StructureManager.viewProfile('${m.id}')" style="cursor:pointer;">
                            ${App.escapeHtml(m.name)}
                        </div>
                        <div class="member-role">${isAdvisor ? '👑 ' : ''}${App.escapeHtml(m.role || 'Member')}</div>
                        ${m.title ? `<div class="member-academic">${App.escapeHtml(m.title)}</div>` : ''}

                        <div class="member-contact-list">
                            ${m.email ? `
                                <div class="member-contact-item" title="${App.escapeHtml(m.email)}">
                                    <span>✉️</span>
                                    <a href="mailto:${App.escapeHtml(m.email)}" onclick="event.stopPropagation();" style="color:inherit;">${App.escapeHtml(m.email)}</a>
                                </div>
                            ` : ''}
                            ${m.office ? `
                                <div class="member-contact-item" title="${App.escapeHtml(m.office)}">
                                    <span>📍</span>
                                    <span>${App.escapeHtml(m.office)}</span>
                                </div>
                            ` : ''}
                            ${m.phone ? `
                                <div class="member-contact-item" title="${App.escapeHtml(m.phone)}">
                                    <span>📞</span>
                                    <a href="tel:${App.escapeHtml(m.phone)}" onclick="event.stopPropagation();" style="color:inherit;">${App.escapeHtml(m.phone)}</a>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>

                ${m.researchInterests && m.researchInterests.length > 0 ? `
                    <div class="member-tags">
                        ${m.researchInterests.slice(0, 3).map(tag => `
                            <span class="member-tag">${App.escapeHtml(tag)}</span>
                        `).join('')}
                        ${m.researchInterests.length > 3 ? `<span class="member-tag" style="background:transparent; border-style:dashed;">+${m.researchInterests.length - 3}</span>` : ''}
                    </div>
                ` : ''}

                <div class="member-card-footer">
                    <span style="font-size:.78rem; color:var(--text-muted);">
                        ${m.joinDate ? `Joined ${App.escapeHtml(m.joinDate)}` : (m.status || 'Active')}
                    </span>
                    <div class="member-card-actions">
                        <button class="btn btn-outline btn-xs" onclick="StructureManager.viewProfile('${m.id}')" title="View Full Profile">👁️ View</button>
                        <button class="btn btn-outline btn-xs" onclick="StructureManager.openEditModal('${m.id}')" title="Edit Profile & Photo">✏️ Edit</button>
                        <button class="btn btn-danger btn-xs" onclick="StructureManager.deleteMember('${m.id}')" title="Delete Profile">🗑️</button>
                    </div>
                </div>
            </div>
        `;
    },

    /* ---------- Profile Detail Modal ---------- */
    viewProfile(id) {
        const m = this.getMemberById(id);
        if (!m) return;

        const isAdvisor = m.category === 'advisor';
        const avatarHTML = m.photo
            ? `<img src="${m.photo}" alt="${App.escapeHtml(m.name)}" style="width:110px; height:110px; border-radius:50%; object-fit:cover; border:3px solid ${isAdvisor ? '#f59e0b' : 'var(--secondary)'}; box-shadow:var(--shadow-md);">`
            : `<div style="width:110px; height:110px; border-radius:50%; background:linear-gradient(135deg, ${isAdvisor ? '#f59e0b, #d97706' : '#0ea5e9, #0284c7'}); color:#fff; display:flex; align-items:center; justify-content:center; font-size:2.8rem; font-weight:700; box-shadow:var(--shadow-md);">${this.getInitials(m.name)}</div>`;

        // Check if user has certifications in the system
        const certs = JSON.parse(localStorage.getItem('lan_certifications') || '[]')
            .filter(c => c.passed && c.userName && c.userName.toLowerCase().trim() === m.name.toLowerCase().trim());

        App.openModal(`Lab Profile: ${m.name}`, `
            <div style="padding:10px 0;">
                <div style="display:flex; gap:20px; align-items:center; margin-bottom:24px; flex-wrap:wrap;">
                    ${avatarHTML}
                    <div style="flex:1; min-width:220px;">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                            <h2 style="font-size:1.35rem; margin:0;">${App.escapeHtml(m.name)}</h2>
                            <span class="status-badge ${isAdvisor ? 'warning' : 'info'}">${App.escapeHtml(m.role || 'Member')}</span>
                            <span class="status-badge ${m.status === 'Active' ? 'success' : 'neutral'}">${App.escapeHtml(m.status || 'Active')}</span>
                        </div>
                        ${m.title ? `<p style="font-size:.9rem; color:var(--text-secondary); margin-top:4px;">🎓 ${App.escapeHtml(m.title)}</p>` : ''}
                        ${m.affiliation ? `<p style="font-size:.85rem; color:var(--text-muted); margin-top:2px;">🏛️ ${App.escapeHtml(m.affiliation)}</p>` : ''}
                    </div>
                </div>

                <!-- Contact & Office Box -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; background:var(--bg); border-radius:var(--radius); padding:16px; margin-bottom:20px;">
                    <div>
                        <div style="font-size:.78rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Email Address</div>
                        <div style="font-size:.9rem; margin-top:3px;">
                            ${m.email ? `<a href="mailto:${App.escapeHtml(m.email)}">✉️ ${App.escapeHtml(m.email)}</a>` : '—'}
                        </div>
                    </div>
                    <div>
                        <div style="font-size:.78rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Phone Number</div>
                        <div style="font-size:.9rem; margin-top:3px;">
                            ${m.phone ? `<a href="tel:${App.escapeHtml(m.phone)}">📞 ${App.escapeHtml(m.phone)}</a>` : '—'}
                        </div>
                    </div>
                    <div>
                        <div style="font-size:.78rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Lab / Office Room</div>
                        <div style="font-size:.9rem; margin-top:3px;">
                            📍 ${App.escapeHtml(m.office || 'Lab Space')}
                        </div>
                    </div>
                    <div>
                        <div style="font-size:.78rem; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Member Since</div>
                        <div style="font-size:.9rem; margin-top:3px;">
                            📅 ${App.escapeHtml(m.joinDate || '—')}
                        </div>
                    </div>
                </div>

                <!-- Research Interests -->
                ${m.researchInterests && m.researchInterests.length > 0 ? `
                    <div style="margin-bottom:20px;">
                        <h4 style="font-size:.95rem; margin-bottom:8px; color:var(--primary);">🔬 Research Interests & Focus Areas</h4>
                        <div style="display:flex; flex-wrap:wrap; gap:6px;">
                            ${m.researchInterests.map(tag => `
                                <span class="member-tag" style="padding:4px 12px; font-size:.82rem; background:var(--surface-hover); border-color:var(--secondary); color:var(--text); font-weight:500;">
                                    ${App.escapeHtml(tag)}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Biography / Overview -->
                ${m.bio ? `
                    <div style="margin-bottom:20px;">
                        <h4 style="font-size:.95rem; margin-bottom:8px; color:var(--primary);">📝 Biography & Responsibilities</h4>
                        <p style="font-size:.88rem; line-height:1.7; color:var(--text-secondary); background:var(--surface-hover); padding:14px; border-radius:var(--radius); border-left:3px solid var(--secondary);">
                            ${App.escapeHtml(m.bio)}
                        </p>
                    </div>
                ` : ''}

                <!-- Certified Instruments -->
                <div style="margin-bottom:20px;">
                    <h4 style="font-size:.95rem; margin-bottom:8px; color:var(--primary);">🏆 Equipment Authorizations & Certifications</h4>
                    ${certs.length > 0 ? `
                        <div style="display:flex; flex-wrap:wrap; gap:8px;">
                            ${certs.map(c => `
                                <div style="background:var(--success-bg); border:1px solid var(--success); border-radius:var(--radius); padding:6px 12px; font-size:.82rem; display:flex; align-items:center; gap:8px;">
                                    <span style="font-weight:700; color:var(--success);">✅ ${App.escapeHtml(c.instrumentName || 'Instrument')}</span>
                                    <span style="color:var(--text-muted); font-size:.78rem;">Score: ${c.percentage}%</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : (m.instruments && m.instruments.length > 0 ? `
                        <div style="display:flex; flex-wrap:wrap; gap:8px;">
                            ${m.instruments.map(inst => `
                                <span class="status-badge success" style="font-size:.82rem;">✅ ${App.escapeHtml(inst)}</span>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="font-size:.82rem; color:var(--text-muted);">No instrument certifications recorded yet.</p>
                    `)}
                </div>

                <div class="form-actions" style="margin-top:24px;">
                    <button class="btn btn-outline" onclick="App.closeModal()">Close</button>
                    <button class="btn btn-primary" onclick="App.closeModal(); StructureManager.openEditModal('${m.id}');">✏️ Edit Profile</button>
                </div>
            </div>
        `);
    },

    /* ---------- Add / Edit Modal ---------- */
    openAddModal() {
        this.tempPhotoData = '';
        App.openModal('Add Lab Member / Advisor', this.getFormHTML());
        this.attachPhotoListener();
    },

    openEditModal(id) {
        const m = this.getMemberById(id);
        if (!m) return;
        this.tempPhotoData = m.photo || '';
        App.openModal(`Edit Profile — ${m.name}`, this.getFormHTML(m));
        this.attachPhotoListener(m.photo);
    },

    getFormHTML(m = null) {
        const isAdvisor = m && m.category === 'advisor';
        const interestsStr = m && m.researchInterests ? m.researchInterests.join(', ') : '';

        return `
            <form id="member-form" onsubmit="StructureManager.saveMember(event, '${m ? m.id : ''}')">
                <!-- Picture Upload Section -->
                <div class="form-group">
                    <label class="form-label">Profile Picture / Photo</label>
                    <div class="photo-uploader">
                        <div id="photo-preview-box" class="photo-preview">
                            ${m && m.photo ? `<img src="${m.photo}" id="preview-img" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` : '👤'}
                        </div>
                        <div class="photo-uploader-controls">
                            <input type="file" id="member-photo-input" accept="image/*" style="display:none;">
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                                <button type="button" class="btn btn-outline btn-sm" onclick="document.getElementById('member-photo-input').click();">
                                    📷 Select Photo from Computer
                                </button>
                                <button type="button" class="btn btn-outline btn-sm" id="btn-remove-photo" onclick="StructureManager.removePhoto();" style="${m && m.photo ? '' : 'display:none;'}">
                                    ❌ Remove
                                </button>
                            </div>
                            <div class="photo-hint">
                                Supports JPG, PNG, WEBP, GIF. Images are automatically optimized and saved.
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Full Name *</label>
                        <input type="text" id="m-name" class="form-input" required
                               placeholder="e.g. Dr. Sothea Seng"
                               value="${m ? App.escapeHtml(m.name) : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Academic Title / Degree</label>
                        <input type="text" id="m-title" class="form-input"
                               placeholder="e.g. Ph.D. in Nanomaterials Engineering"
                               value="${m ? App.escapeHtml(m.title || '') : ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Category / Section *</label>
                        <select id="m-category" class="form-select" required onchange="StructureManager.onCategoryChange(this.value)">
                            <option value="advisor" ${m && m.category === 'advisor' ? 'selected' : ''}>👑 Advisor / Leadership</option>
                            <option value="researcher" ${(!m || m.category === 'researcher') ? 'selected' : ''}>🎓 Researcher / Graduate Student</option>
                            <option value="staff" ${m && m.category === 'staff' ? 'selected' : ''}>🔬 Research Assistant / Technical Staff</option>
                            <option value="alumni" ${m && m.category === 'alumni' ? 'selected' : ''}>📜 Alumni / Former Member</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Position / Role *</label>
                        <input type="text" id="m-role" class="form-input" required
                               placeholder="e.g. Principal Investigator, PhD Candidate, Lab Technician"
                               value="${m ? App.escapeHtml(m.role || '') : ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Email Address *</label>
                        <input type="email" id="m-email" class="form-input" required
                               placeholder="e.g. member@rupp.edu.kh"
                               value="${m ? App.escapeHtml(m.email || '') : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone Number</label>
                        <input type="tel" id="m-phone" class="form-input"
                               placeholder="e.g. +855 12 345 678"
                               value="${m ? App.escapeHtml(m.phone || '') : ''}">
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Office / Lab Desk Location</label>
                        <input type="text" id="m-office" class="form-input"
                               placeholder="e.g. Room 402, STEM Building"
                               value="${m ? App.escapeHtml(m.office || '') : ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Join Period / Date</label>
                        <input type="text" id="m-join" class="form-input"
                               placeholder="e.g. 2022 - Present, or Sep 2024"
                               value="${m ? App.escapeHtml(m.joinDate || '') : ''}">
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Research Interests / Focus Areas (comma-separated)</label>
                    <input type="text" id="m-interests" class="form-input"
                           placeholder="e.g. Nanoparticle Synthesis, Photocatalysis, Thin Films, SEM Analysis"
                           value="${App.escapeHtml(interestsStr)}">
                    <div class="form-hint">Separate each focus area with a comma.</div>
                </div>

                <div class="form-group">
                    <label class="form-label">Biography & Responsibilities</label>
                    <textarea id="m-bio" class="form-textarea" rows="3"
                              placeholder="Brief description of research background, assigned responsibilities in the lab...">${m ? App.escapeHtml(m.bio || '') : ''}</textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Membership Status</label>
                        <select id="m-status" class="form-select">
                            <option value="Active" ${(!m || m.status === 'Active') ? 'selected' : ''}>Active Member</option>
                            <option value="Visiting" ${m && m.status === 'Visiting' ? 'selected' : ''}>Visiting Scholar</option>
                            <option value="Alumni" ${m && m.status === 'Alumni' ? 'selected' : ''}>Alumni</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Affiliation / Department</label>
                        <input type="text" id="m-affiliation" class="form-input"
                               placeholder="e.g. Department of Material Science, RUPP"
                               value="${m ? App.escapeHtml(m.affiliation || 'Laboratory of Applied Nanomaterial') : 'Laboratory of Applied Nanomaterial'}">
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">💾 Save Profile</button>
                </div>
            </form>
        `;
    },

    onCategoryChange(cat) {
        const roleInput = document.getElementById('m-role');
        if (!roleInput || roleInput.value.trim() !== '') return;
        if (cat === 'advisor') roleInput.value = 'Academic Advisor';
        else if (cat === 'researcher') roleInput.value = 'Graduate Researcher';
        else if (cat === 'staff') roleInput.value = 'Research Assistant';
    },

    /* ---------- Photo Upload Handling ---------- */
    attachPhotoListener(existingPhoto = '') {
        const input = document.getElementById('member-photo-input');
        if (!input) return;

        this.tempPhotoData = existingPhoto || '';

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                App.showToast('Please select a valid image file (JPG, PNG, WEBP, etc.)', 'warning');
                return;
            }

            const reader = new FileReader();
            reader.onload = (evt) => {
                const img = new Image();
                img.onload = () => {
                    // Compress & scale to maximum 400x400 for efficient localStorage storage
                    const canvas = document.createElement('canvas');
                    const maxDim = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > maxDim) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        }
                    } else {
                        if (height > maxDim) {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);
                    StructureManager.tempPhotoData = compressedBase64;

                    // Update preview
                    const box = document.getElementById('photo-preview-box');
                    if (box) {
                        box.innerHTML = `<img src="${compressedBase64}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                    }
                    const removeBtn = document.getElementById('btn-remove-photo');
                    if (removeBtn) removeBtn.style.display = 'inline-flex';

                    App.showToast('Photo uploaded and optimized successfully! 📷', 'success');
                };
                img.src = evt.target.result;
            };
            reader.readAsDataURL(file);
        });
    },

    removePhoto() {
        this.tempPhotoData = '';
        const box = document.getElementById('photo-preview-box');
        if (box) box.innerHTML = '👤';
        const removeBtn = document.getElementById('btn-remove-photo');
        if (removeBtn) removeBtn.style.display = 'none';
        const input = document.getElementById('member-photo-input');
        if (input) input.value = '';
    },

    /* ---------- Save Member ---------- */
    saveMember(e, editId) {
        e.preventDefault();

        const name = document.getElementById('m-name').value.trim();
        if (!name) {
            App.showToast('Full name is required', 'warning');
            return;
        }

        const rawInterests = document.getElementById('m-interests').value;
        const researchInterests = rawInterests
            ? rawInterests.split(',').map(s => s.trim()).filter(s => s.length > 0)
            : [];

        const memberData = {
            name: name,
            role: document.getElementById('m-role').value.trim(),
            category: document.getElementById('m-category').value,
            title: document.getElementById('m-title').value.trim(),
            email: document.getElementById('m-email').value.trim(),
            phone: document.getElementById('m-phone').value.trim(),
            office: document.getElementById('m-office').value.trim(),
            joinDate: document.getElementById('m-join').value.trim(),
            affiliation: document.getElementById('m-affiliation').value.trim(),
            researchInterests: researchInterests,
            bio: document.getElementById('m-bio').value.trim(),
            status: document.getElementById('m-status').value,
            photo: this.tempPhotoData || '',
            lastUpdated: new Date().toISOString()
        };

        const all = this.getAll();

        if (editId) {
            const idx = all.findIndex(m => m.id === editId);
            if (idx !== -1) {
                all[idx] = { ...all[idx], ...memberData };
                App.showToast(`Profile updated for ${name}!`, 'success');
            }
        } else {
            memberData.id = App.generateId();
            all.push(memberData);
            App.showToast(`New member ${name} added to Lab Structure!`, 'success');
        }

        this.save(all);
        App.closeModal();
        this.render();
    },

    /* ---------- Delete Member ---------- */
    async deleteMember(id) {
        const m = this.getMemberById(id);
        if (!m) return;

        const ok = await App.confirm('Delete Member Profile', `Are you sure you want to remove "${m.name}" from the Lab Structure?`);
        if (!ok) return;

        const all = this.getAll().filter(item => item.id !== id);
        this.save(all);
        App.showToast(`Profile for ${m.name} removed.`, 'success');
        this.render();
    },

    /* ---------- Export CSV Directory ---------- */
    exportCSV() {
        const members = this.getAll();
        const headers = ['Name', 'Role', 'Category', 'Academic Title', 'Email', 'Phone', 'Office', 'Status', 'Research Interests'];
        const rows = members.map(m => [
            m.name,
            m.role,
            m.category,
            m.title,
            m.email,
            m.phone,
            m.office,
            m.status,
            (m.researchInterests || []).join('; ')
        ]);
        App.exportCSV(`Lab_Structure_Directory_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    },

    /* ---------- Helpers ---------- */
    getInitials(name) {
        if (!name) return 'LM';
        const parts = name.replace(/^Dr\.\s*/i, '').trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    },

    /* ---------- Pre-populated Sample Data ---------- */
    getSampleData() {
        return [
            {
                id: 'mem_sothea_01',
                name: 'Dr. Sothea Seng',
                role: 'Principal Investigator / Lab Director',
                category: 'advisor',
                title: 'Ph.D. in Nanotechnology & Materials Science',
                affiliation: 'Department of Material Science & Engineering',
                email: 'sothea.seng@rupp.edu.kh',
                phone: '+855 12 888 101',
                office: 'STEM Building, Room 402',
                joinDate: '2020 - Present',
                researchInterests: ['Nanomaterial Synthesis', 'Photocatalytic Water Purification', 'SEM / TEM Characterization', 'Thin Film Deposition'],
                bio: 'Head of the Laboratory of Applied Nanomaterial. Leading research projects in low-cost semiconductor nanostructures, green chemical synthesis, and environmental remediation technologies.',
                status: 'Active',
                photo: '', // will render styled avatar initials
                lastUpdated: '2026-09-01'
            },
            {
                id: 'mem_vicheka_02',
                name: 'Dr. Vicheka Chea',
                role: 'Co-Advisor & Senior Researcher',
                category: 'advisor',
                title: 'Ph.D. in Solid State Materials Physics',
                affiliation: 'Faculty of Science, RUPP',
                email: 'vicheka.chea@rupp.edu.kh',
                phone: '+855 12 777 202',
                office: 'STEM Building, Room 405',
                joinDate: '2021 - Present',
                researchInterests: ['X-Ray Crystallography (XRD)', 'Nanostructured Thin Films', 'Energy Storage Materials', 'Phase Transitions'],
                bio: 'Co-directs structural and crystallographic characterization across the laboratory. Oversees X-ray diffraction protocols and advanced spectroscopy instrumentation.',
                status: 'Active',
                photo: '',
                lastUpdated: '2026-08-20'
            },
            {
                id: 'mem_sokha_03',
                name: 'Sokha Chan',
                role: 'PhD Candidate & Senior Student Researcher',
                category: 'researcher',
                title: 'M.Sc. in Applied Physics',
                affiliation: 'Laboratory of Applied Nanomaterial',
                email: 'sokha.chan@student.rupp.edu.kh',
                phone: '+855 11 345 678',
                office: 'Lab Room 401, Bench A',
                joinDate: '2023 - 2027',
                researchInterests: ['Gold & Silver Nanoparticles', 'DLS Particle Size Analysis', 'Localized Surface Plasmon Resonance', 'UV-Vis Spectroscopy'],
                bio: 'Doctoral researcher investigating noble metal nanoparticle colloidal synthesis for bio-sensing applications. Experienced operator for UV-Vis and DLS instrumentation.',
                status: 'Active',
                photo: '',
                lastUpdated: '2026-09-05'
            },
            {
                id: 'mem_dara_04',
                name: 'Dara Kim',
                role: 'Master Student Researcher',
                category: 'researcher',
                title: 'B.Sc. in Chemistry',
                affiliation: 'Laboratory of Applied Nanomaterial',
                email: 'dara.kim@student.rupp.edu.kh',
                phone: '+855 92 456 789',
                office: 'Lab Room 401, Bench B',
                joinDate: '2024 - 2026',
                researchInterests: ['Sol-Gel Synthesis', 'Spin Coating Thin Films', 'Gas Sensor Nanostructures', 'Hot Plate Thermal Annealing'],
                bio: 'Master candidate studying metal oxide thin films via spin coating techniques for hazardous gas detection. Certified in spin coater and furnace operation.',
                status: 'Active',
                photo: '',
                lastUpdated: '2026-09-10'
            },
            {
                id: 'mem_sreyleak_05',
                name: 'Sreyleak Meas',
                role: 'Research Assistant',
                category: 'staff',
                title: 'B.Sc. in Material Science',
                affiliation: 'Laboratory of Applied Nanomaterial',
                email: 'sreyleak.meas@rupp.edu.kh',
                phone: '+855 78 567 890',
                office: 'Lab Prep Room 403',
                joinDate: '2024 - Present',
                researchInterests: ['Chemical Inventory Tracking', 'Sample Preparation', 'Analytical Weighing & Dilution', 'Laboratory Safety Protocols'],
                bio: 'Assists with chemical management, precursor preparation, student training support, and standard chemical documentation in the laboratory.',
                status: 'Active',
                photo: '',
                lastUpdated: '2026-09-08'
            },
            {
                id: 'mem_sovann_06',
                name: 'Sovann Rath',
                role: 'Lab Technician & Chemical Safety Officer',
                category: 'staff',
                title: 'B.Sc. in Chemical Engineering',
                affiliation: 'Laboratory of Applied Nanomaterial',
                email: 'sovann.rath@rupp.edu.kh',
                phone: '+855 17 678 901',
                office: 'Safety & Equipment Room 400',
                joinDate: '2022 - Present',
                researchInterests: ['Hazardous Waste Disposal', 'Instrument Preventive Maintenance', 'Vacuum Systems', 'Emergency Response Protocols'],
                bio: 'Oversees day-to-day instrument health, vacuum pump maintenance, hazardous chemical disposal, and safety compliance for all lab users.',
                status: 'Active',
                photo: '',
                lastUpdated: '2026-09-11'
            }
        ];
    }
};
