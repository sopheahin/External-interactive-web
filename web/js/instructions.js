/* ============================================
   Work Instructions Module — with Certification Quiz
   ============================================ */

const InstructionManager = {
    storageKey: 'lan_instructions',
    certStorageKey: 'lan_certifications',
    currentView: 'grid',
    currentDetailId: null,
    searchTerm: '',
    PASS_THRESHOLD: 70, // percentage required to pass (at least 70%)

    /* ---------- Data ---------- */
    getAll() {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                // Auto-upgrade if cached data has no quizzes
                const hasAnyQuiz = parsed.some(i => i.quiz && i.quiz.length > 0);
                if (!hasAnyQuiz || parsed.length === 0) {
                    const sample = this.getSampleData();
                    localStorage.setItem(this.storageKey, JSON.stringify(sample));
                    return sample;
                }
                return parsed;
            } catch (e) {
                console.error("Failed to parse instructions cache:", e);
            }
        }
        const sample = this.getSampleData();
        localStorage.setItem(this.storageKey, JSON.stringify(sample));
        return sample;
    },

    save(instructions) {
        localStorage.setItem(this.storageKey, JSON.stringify(instructions));
    },

    getInstruments() {
        return JSON.parse(localStorage.getItem('lan_instruments') || '[]');
    },

    getCertifications() {
        const list = JSON.parse(localStorage.getItem(this.certStorageKey) || '[]');
        return list.map(c => ({
            ...c,
            passed: typeof c.percentage === 'number' ? c.percentage >= this.PASS_THRESHOLD : (c.passed ?? false)
        }));
    },

    getCertById(certId) {
        return this.getCertifications().find(c => c.id === certId);
    },

    saveCertification(cert) {
        const certs = JSON.parse(localStorage.getItem(this.certStorageKey) || '[]');
        certs.push(cert);
        localStorage.setItem(this.certStorageKey, JSON.stringify(certs));
    },

    getCertsForInstruction(instructionId) {
        return this.getCertifications().filter(c => c.instructionId === instructionId);
    },

    /* ---------- Main Render ---------- */
    render() {
        this.currentView = 'grid';
        this.currentDetailId = null;
        this.renderPage();
    },

    renderPage() {
        const container = document.getElementById('main-content');
        if (!container) return;
        switch (this.currentView) {
            case 'detail': this.renderDetail(container); break;
            case 'quiz':   this.renderQuiz(container); break;
            case 'result': break; // result replaces in-place
            default:       this.renderGrid(container); break;
        }
    },

    /* =============================================
       GRID / CARD VIEW
       ============================================= */
    renderGrid(container) {
        const all = this.getAll();
        const certs = this.getCertifications();
        const term = this.searchTerm.toLowerCase();
        const filtered = term
            ? all.filter(i => i.title.toLowerCase().includes(term) || i.instrumentName.toLowerCase().includes(term))
            : all;

        container.innerHTML = `
            <div class="content-header">
                <div class="search-filter-bar">
                    <input type="text" id="instr-search" class="form-input search-input"
                           placeholder="🔍 Search by title or instrument..."
                           value="${App.escapeHtml(this.searchTerm)}">
                </div>
                <div class="action-buttons">
                    <button class="btn btn-outline" onclick="InstructionManager.showCertHistory()">🎓 Certifications</button>
                    <button class="btn btn-primary" onclick="InstructionManager.openAddModal()">+ Add Instruction</button>
                </div>
            </div>

            <div class="alert alert-info">
                💡 Click any card to view the full operating procedure. Each instruction includes a <strong>certification quiz</strong> — new users must pass (≥${this.PASS_THRESHOLD}%) to be certified for that instrument.
            </div>

            ${filtered.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">No work instructions found</div>
                    <div class="empty-state-hint">Click "+ Add Instruction" to create one, or adjust your search.</div>
                </div>
            ` : `
                <div class="instructions-grid">
                    ${filtered.map(ins => this.renderCard(ins, certs)).join('')}
                </div>
            `}
        `;

        document.getElementById('instr-search').addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.renderGrid(container);
        });
    },

    renderCard(ins, certs) {
        const stepCount = this.splitLines(ins.procedure).length;
        const safetyCount = this.splitLines(ins.safetyPrecautions).length;
        const quizCount = (ins.quiz || []).length;
        const certCount = certs.filter(c => c.instructionId === ins.id && c.passed).length;
        const preview = this.splitLines(ins.procedure).slice(0, 2).join(' → ');
        return `
            <div class="instruction-card" onclick="InstructionManager.showDetail('${ins.id}')">
                <div class="instruction-card-header">
                    <h4>${App.escapeHtml(ins.title)}</h4>
                    <span class="instrument-tag">🔬 ${App.escapeHtml(ins.instrumentName || 'General')}</span>
                </div>
                <div class="instruction-card-body">
                    <p style="margin-bottom:8px; color:var(--text-muted); font-size:.82rem;">${App.escapeHtml(preview)}${stepCount > 2 ? ' …' : ''}</p>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <span class="status-badge danger" style="font-size:.72rem;">⚠️ ${safetyCount} Safety</span>
                        <span class="status-badge info" style="font-size:.72rem;">📝 ${stepCount} Steps</span>
                        ${quizCount > 0 ? `<span class="status-badge success" style="font-size:.72rem;">🎓 ${quizCount}Q Quiz</span>` : ''}
                        <span class="status-badge neutral" style="font-size:.72rem;">v${App.escapeHtml(ins.version || '1.0')}</span>
                    </div>
                    ${certCount > 0 ? `<div style="margin-top:8px; font-size:.78rem; color:var(--success); font-weight:600;">✅ ${certCount} user(s) certified</div>` : ''}
                </div>
                <div class="instruction-card-footer">
                    <span>✍️ ${App.escapeHtml(ins.author)}</span>
                    <span>📅 ${App.formatDate(ins.lastUpdated)}</span>
                </div>
            </div>
        `;
    },

    /* =============================================
       DETAIL VIEW
       ============================================= */
    showDetail(id) {
        this.currentView = 'detail';
        this.currentDetailId = id;
        this.renderPage();
    },

    backToGrid() {
        this.currentView = 'grid';
        this.currentDetailId = null;
        this.renderPage();
    },

    renderDetail(container) {
        const all = this.getAll();
        const ins = all.find(i => i.id === this.currentDetailId);
        if (!ins) { this.backToGrid(); return; }

        const safetyItems = this.splitLines(ins.safetyPrecautions);
        const checklistItems = this.splitLines(ins.preOperationChecklist);
        const procedureItems = this.splitLines(ins.procedure);
        const shutdownItems = this.splitLines(ins.shutdownProcedure);
        const troubleItems = this.splitLines(ins.troubleshooting);
        const quizQuestions = ins.quiz || [];
        const certs = this.getCertsForInstruction(ins.id);
        const passedCerts = certs.filter(c => c.passed);

        container.innerHTML = `
            <div class="instruction-detail">
                <div class="instruction-detail-header">
                    <div>
                        <button class="btn btn-outline btn-sm" onclick="InstructionManager.backToGrid()" style="margin-bottom:10px;">← Back to All Instructions</button>
                        <h2>${App.escapeHtml(ins.title)}</h2>
                        <div style="margin-top:6px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                            <span class="instrument-tag" style="font-size:.9rem;">🔬 ${App.escapeHtml(ins.instrumentName || 'General')}</span>
                            <span class="status-badge neutral">v${App.escapeHtml(ins.version || '1.0')}</span>
                            ${quizQuestions.length > 0 ? `<span class="status-badge success">🎓 Quiz Available</span>` : ''}
                        </div>
                    </div>
                    <div class="action-buttons" style="flex-shrink:0;">
                        <button class="btn btn-outline btn-sm" onclick="window.print()">🖨️ Print</button>
                        <button class="btn btn-primary btn-sm" onclick="InstructionManager.openEditModal('${ins.id}')">✏️ Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="InstructionManager.deleteInstruction('${ins.id}')">🗑️ Delete</button>
                    </div>
                </div>

                <div class="instruction-detail-body">
                    <!-- Meta -->
                    <div style="display:flex; gap:20px; flex-wrap:wrap; padding:12px 16px; background:var(--bg); border-radius:var(--radius); margin-bottom:24px; font-size:.85rem; color:var(--text-secondary);">
                        <span><strong>Author:</strong> ${App.escapeHtml(ins.author)}</span>
                        <span><strong>Version:</strong> ${App.escapeHtml(ins.version || '1.0')}</span>
                        <span><strong>Last Updated:</strong> ${App.formatDate(ins.lastUpdated)}</span>
                    </div>

                    <!-- SAFETY -->
                    ${safetyItems.length > 0 ? `
                    <div class="safety-box" style="margin-bottom:28px;">
                        <h3 style="margin-bottom:12px; font-size:1.1rem;">⚠️ SAFETY PRECAUTIONS — READ BEFORE OPERATING</h3>
                        <p style="margin-bottom:10px; font-size:.85rem; font-weight:600; color:#9b2c2c;">You MUST read and understand all safety precautions before using this instrument.</p>
                        <div>
                            ${safetyItems.map((item, i) => `
                                <div style="display:flex; gap:10px; align-items:flex-start; padding:8px 0; ${i < safetyItems.length - 1 ? 'border-bottom:1px solid rgba(229,62,62,.15);' : ''}">
                                    <span style="background:#e53e3e; color:#fff; border-radius:50%; min-width:24px; height:24px; display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; flex-shrink:0;">${i + 1}</span>
                                    <span style="line-height:1.6;">${App.escapeHtml(item)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>` : ''}

                    <!-- PRE-OP CHECKLIST -->
                    ${checklistItems.length > 0 ? `
                    <div class="instruction-section" style="margin-bottom:28px;">
                        <h3 style="font-size:1.05rem; display:flex; align-items:center; gap:8px;">
                            <span style="background:var(--warning); color:#fff; border-radius:var(--radius-sm); padding:3px 8px; font-size:.75rem;">STEP 1</span>
                            ✅ Pre-Operation Checklist
                        </h3>
                        <p style="color:var(--text-muted); margin-bottom:12px; font-size:.85rem;">Complete ALL items below before starting the instrument.</p>
                        <div style="background:var(--surface-hover); border-radius:var(--radius); padding:16px;">
                            ${checklistItems.map((item, i) => `
                                <label style="display:flex; gap:10px; align-items:flex-start; padding:8px 4px; cursor:pointer; border-bottom:1px solid var(--border-light);"
                                       onclick="this.querySelector('input').checked = !this.querySelector('input').checked; event.preventDefault();">
                                    <input type="checkbox" style="margin-top:3px; width:18px; height:18px; flex-shrink:0; accent-color:var(--success); cursor:pointer;"
                                           onclick="event.stopPropagation(); this.checked = !this.checked;">
                                    <span style="line-height:1.6;"><strong>${i + 1}.</strong> ${App.escapeHtml(item)}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>` : ''}

                    <!-- PROCEDURE -->
                    ${procedureItems.length > 0 ? `
                    <div class="instruction-section" style="margin-bottom:28px;">
                        <h3 style="font-size:1.05rem; display:flex; align-items:center; gap:8px;">
                            <span style="background:var(--primary); color:#fff; border-radius:var(--radius-sm); padding:3px 8px; font-size:.75rem;">STEP 2</span>
                            📝 Operating Procedure
                        </h3>
                        <p style="color:var(--text-muted); margin-bottom:12px; font-size:.85rem;">Follow each step in order. Do not skip steps.</p>
                        <div>
                            ${procedureItems.map((item, i) => `
                                <div style="display:flex; gap:14px; align-items:flex-start; padding:12px 0; ${i < procedureItems.length - 1 ? 'border-bottom:1px dashed var(--border);' : ''}">
                                    <div style="background:var(--primary); color:#fff; border-radius:50%; min-width:32px; height:32px; display:flex; align-items:center; justify-content:center; font-size:.85rem; font-weight:700; flex-shrink:0;">${i + 1}</div>
                                    <div style="line-height:1.7; padding-top:5px;">${App.escapeHtml(item)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>` : ''}

                    <!-- SHUTDOWN -->
                    ${shutdownItems.length > 0 ? `
                    <div class="instruction-section" style="margin-bottom:28px;">
                        <h3 style="font-size:1.05rem; display:flex; align-items:center; gap:8px;">
                            <span style="background:var(--secondary); color:#fff; border-radius:var(--radius-sm); padding:3px 8px; font-size:.75rem;">STEP 3</span>
                            🔌 Shutdown Procedure
                        </h3>
                        <p style="color:var(--text-muted); margin-bottom:12px; font-size:.85rem;">Always follow the shutdown procedure after finishing your work.</p>
                        <div>
                            ${shutdownItems.map((item, i) => `
                                <div style="display:flex; gap:14px; align-items:flex-start; padding:10px 0; ${i < shutdownItems.length - 1 ? 'border-bottom:1px dashed var(--border);' : ''}">
                                    <div style="background:var(--secondary); color:#fff; border-radius:50%; min-width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-size:.8rem; font-weight:700; flex-shrink:0;">${i + 1}</div>
                                    <div style="line-height:1.7; padding-top:3px;">${App.escapeHtml(item)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>` : ''}

                    <!-- TROUBLESHOOTING -->
                    ${troubleItems.length > 0 ? `
                    <div class="instruction-section" style="margin-bottom:28px;">
                        <h3 style="font-size:1.05rem; display:flex; align-items:center; gap:8px;">
                            <span style="background:var(--info); color:#fff; border-radius:var(--radius-sm); padding:3px 8px; font-size:.75rem;">HELP</span>
                            🔧 Troubleshooting Guide
                        </h3>
                        <p style="color:var(--text-muted); margin-bottom:12px; font-size:.85rem;">Common issues and how to resolve them.</p>
                        <div style="background:var(--surface-hover); border-radius:var(--radius); overflow:hidden;">
                            ${troubleItems.map((item, i) => {
                                const parts = item.split(':');
                                const problem = parts[0] ? parts[0].trim() : item;
                                const solution = parts.length > 1 ? parts.slice(1).join(':').trim() : '';
                                return `
                                    <div style="padding:12px 16px; ${i < troubleItems.length - 1 ? 'border-bottom:1px solid var(--border-light);' : ''} display:flex; gap:12px; align-items:flex-start;">
                                        <span style="font-size:1.1rem; flex-shrink:0;">🔸</span>
                                        <div>
                                            <div style="font-weight:700; margin-bottom:2px;">${App.escapeHtml(problem)}</div>
                                            ${solution ? `<div style="color:var(--text-secondary); line-height:1.6;">→ ${App.escapeHtml(solution)}</div>` : ''}
                                        </div>
                                    </div>`;
                            }).join('')}
                        </div>
                    </div>` : ''}

                    <!-- ===== CERTIFICATION QUIZ SECTION ===== -->
                    ${quizQuestions.length > 0 ? `
                    <div style="margin-top:36px; padding-top:28px; border-top:3px solid var(--secondary);">
                        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; margin-bottom:20px;">
                            <div>
                                <h3 style="font-size:1.2rem; display:flex; align-items:center; gap:10px;">
                                    <span style="background:linear-gradient(135deg, #f59e0b, #ef4444); color:#fff; border-radius:var(--radius); padding:5px 12px; font-size:.8rem; font-weight:700;">CERTIFICATION</span>
                                    🎓 Instrument Certification Test
                                </h3>
                                <p style="color:var(--text-secondary); margin-top:6px; font-size:.9rem;">
                                    New users must pass this quiz (≥${this.PASS_THRESHOLD}%) to be certified to operate this instrument.
                                    <br><strong>${quizQuestions.length} multiple-choice questions</strong> based on the safety and procedures above.
                                </p>
                            </div>
                            <button class="btn btn-primary btn-lg" onclick="InstructionManager.startQuiz('${ins.id}')" style="background:linear-gradient(135deg, #f59e0b, #ef4444); border:none; font-size:.95rem;">
                                📝 Take Certification Test
                            </button>
                        </div>

                        ${passedCerts.length > 0 ? `
                        <div style="background:var(--success-bg); border:1px solid var(--success); border-radius:var(--radius-lg); padding:16px 20px;">
                            <h4 style="color:var(--success); margin-bottom:10px;">✅ Certified Users</h4>
                            <div style="display:flex; flex-wrap:wrap; gap:8px;">
                                ${passedCerts.map(c => `
                                    <div style="background:var(--surface); border-radius:var(--radius); padding:8px 14px; display:flex; align-items:center; gap:10px; font-size:.85rem; box-shadow:var(--shadow-sm);">
                                        <span style="font-weight:700;">${App.escapeHtml(c.userName)}</span>
                                        <span style="color:var(--text-muted);">— ${c.percentage}% — ${App.formatDate(c.date)}</span>
                                        <button class="btn btn-outline btn-xs" onclick="InstructionManager.downloadCertificate('${c.id}')" title="Download Certificate (PNG)">📥 Certificate</button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : `
                        <div style="background:var(--warning-bg); border-radius:var(--radius); padding:12px 16px; font-size:.88rem; color:var(--warning);">
                            ⚠️ No users are certified for this instrument yet. Take the test above to get certified.
                        </div>
                        `}

                        ${certs.filter(c => !c.passed).length > 0 ? `
                        <details style="margin-top:12px;">
                            <summary style="cursor:pointer; font-size:.85rem; color:var(--text-muted); font-weight:600;">
                                Show failed attempts (${certs.filter(c => !c.passed).length})
                            </summary>
                            <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">
                                ${certs.filter(c => !c.passed).map(c => `
                                    <span style="background:var(--danger-bg); color:var(--danger); padding:4px 10px; border-radius:var(--radius-sm); font-size:.8rem;">
                                        ❌ ${App.escapeHtml(c.userName)} — ${c.percentage}% — ${App.formatDate(c.date)}
                                    </span>
                                `).join('')}
                            </div>
                        </details>` : ''}
                    </div>
                    ` : `
                    <div style="margin-top:36px; padding:20px; background:var(--bg); border-radius:var(--radius-lg); text-align:center; color:var(--text-muted);">
                        <p>🎓 No certification quiz has been added for this instruction yet.</p>
                        <p style="font-size:.85rem; margin-top:4px;">Edit this instruction to add quiz questions.</p>
                    </div>
                    `}
                </div>
            </div>
        `;
    },

    /* =============================================
       QUIZ VIEW
       ============================================= */
    startQuiz(id) {
        this.currentView = 'quiz';
        this.currentDetailId = id;
        this.renderPage();
    },

    renderQuiz(container) {
        const all = this.getAll();
        const ins = all.find(i => i.id === this.currentDetailId);
        if (!ins || !ins.quiz || ins.quiz.length === 0) {
            App.showToast('No quiz available for this instruction.', 'warning');
            this.showDetail(this.currentDetailId);
            return;
        }

        const questions = ins.quiz;
        // Shuffle question order for fairness
        const shuffledIndices = questions.map((_, i) => i);

        container.innerHTML = `
            <div style="max-width:800px; margin:0 auto;">
                <button class="btn btn-outline btn-sm" onclick="InstructionManager.showDetail('${ins.id}')" style="margin-bottom:16px;">
                    ← Back to Instruction
                </button>

                <div style="background:linear-gradient(135deg, #0f4c75, #00b4d8); color:#fff; border-radius:var(--radius-lg); padding:28px; margin-bottom:24px; text-align:center;">
                    <div style="font-size:2.5rem; margin-bottom:8px;">🎓</div>
                    <h2 style="margin-bottom:6px;">Certification Test</h2>
                    <p style="opacity:.9; font-size:.95rem;">${App.escapeHtml(ins.title)}</p>
                    <p style="opacity:.75; font-size:.85rem; margin-top:8px;">
                        ${questions.length} questions · Passing score: ${this.PASS_THRESHOLD}% · Select the best answer for each question
                    </p>
                </div>

                <div class="form-group" style="margin-bottom:24px;">
                    <label class="form-label" style="font-size:.95rem;">👤 Your Full Name (required for certification record)</label>
                    <input type="text" id="quiz-user-name" class="form-input" placeholder="e.g. Sokha Chan" required
                           style="max-width:400px; font-size:1rem;">
                </div>

                <form id="quiz-form" onsubmit="InstructionManager.submitQuiz(event, '${ins.id}')">
                    ${shuffledIndices.map((qi, displayIdx) => {
                        const q = questions[qi];
                        return `
                        <div class="card" style="margin-bottom:16px;" id="quiz-q-${qi}">
                            <div class="card-body" style="padding:20px;">
                                <div style="display:flex; gap:12px; align-items:flex-start; margin-bottom:14px;">
                                    <div style="background:var(--primary); color:#fff; border-radius:50%; min-width:36px; height:36px; display:flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0;">
                                        ${displayIdx + 1}
                                    </div>
                                    <p style="font-weight:600; font-size:.95rem; line-height:1.5; padding-top:6px;">${App.escapeHtml(q.question)}</p>
                                </div>
                                <div style="display:grid; gap:8px; padding-left:48px;">
                                    ${q.options.map((opt, oi) => `
                                        <label style="display:flex; align-items:center; gap:10px; padding:10px 14px; border:2px solid var(--border); border-radius:var(--radius); cursor:pointer; transition:all .15s ease;"
                                               onmouseover="this.style.borderColor='var(--secondary)'" onmouseout="if(!this.querySelector('input').checked) this.style.borderColor='var(--border)'"
                                               onclick="this.parentElement.querySelectorAll('label').forEach(l=>{l.style.borderColor='var(--border)';l.style.background='transparent'}); this.style.borderColor='var(--secondary)'; this.style.background='var(--info-bg)';">
                                            <input type="radio" name="q_${qi}" value="${oi}" required
                                                   style="width:18px; height:18px; accent-color:var(--secondary); flex-shrink:0;">
                                            <span style="line-height:1.5;"><strong>${String.fromCharCode(65 + oi)}.</strong> ${App.escapeHtml(opt)}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        </div>`;
                    }).join('')}

                    <div style="text-align:center; padding:20px 0;">
                        <p style="color:var(--text-muted); margin-bottom:12px; font-size:.88rem;">
                            ⚠️ Make sure you have answered ALL questions before submitting.
                        </p>
                        <button type="submit" class="btn btn-lg" style="background:linear-gradient(135deg, #f59e0b, #ef4444); color:#fff; border:none; padding:14px 40px; font-size:1rem;">
                            📝 Submit Test
                        </button>
                    </div>
                </form>
            </div>
        `;
    },

    submitQuiz(e, instructionId) {
        e.preventDefault();

        const userName = document.getElementById('quiz-user-name').value.trim();
        if (!userName) {
            App.showToast('Please enter your name before submitting.', 'warning');
            document.getElementById('quiz-user-name').focus();
            return;
        }

        const all = this.getAll();
        const ins = all.find(i => i.id === instructionId);
        if (!ins || !ins.quiz) return;

        const questions = ins.quiz;
        let correct = 0;
        let allAnswered = true;
        const answers = [];

        questions.forEach((q, qi) => {
            const selected = document.querySelector(`input[name="q_${qi}"]:checked`);
            if (!selected) {
                allAnswered = false;
                answers.push({ qi, selected: -1, correct: q.correctAnswer, isCorrect: false });
            } else {
                const val = parseInt(selected.value);
                const isCorrect = val === q.correctAnswer;
                if (isCorrect) correct++;
                answers.push({ qi, selected: val, correct: q.correctAnswer, isCorrect });
            }
        });

        if (!allAnswered) {
            App.showToast('Please answer all questions before submitting.', 'warning');
            return;
        }

        const total = questions.length;
        const percentage = Math.round((correct / total) * 100);
        const passed = percentage >= this.PASS_THRESHOLD;

        // Save certification record
        const cert = {
            id: App.generateId(),
            instructionId: instructionId,
            instructionTitle: ins.title,
            instrumentName: ins.instrumentName,
            userName: userName,
            score: correct,
            totalQuestions: total,
            percentage: percentage,
            passed: passed,
            date: new Date().toISOString(),
            answers: answers
        };
        this.saveCertification(cert);

        // Show results
        this.renderResults(ins, cert, answers);
    },

    renderResults(ins, cert, answers) {
        const container = document.getElementById('main-content');
        const questions = ins.quiz;

        container.innerHTML = `
            <div style="max-width:800px; margin:0 auto;">
                <button class="btn btn-outline btn-sm" onclick="InstructionManager.showDetail('${ins.id}')" style="margin-bottom:16px;">
                    ← Back to Instruction
                </button>

                <!-- Result Banner -->
                <div style="background:${cert.passed
                    ? 'linear-gradient(135deg, #38a169, #2f855a)'
                    : 'linear-gradient(135deg, #e53e3e, #c53030)'}; color:#fff; border-radius:var(--radius-lg); padding:36px; text-align:center; margin-bottom:24px;">

                    <div style="font-size:4rem; margin-bottom:12px;">${cert.passed ? '🎉' : '📚'}</div>
                    <h2 style="font-size:1.6rem; margin-bottom:8px;">${cert.passed ? 'CONGRATULATIONS — YOU PASSED!' : 'NOT YET PASSED — KEEP STUDYING'}</h2>
                    <p style="opacity:.9; font-size:1rem; margin-bottom:16px;">${App.escapeHtml(cert.userName)}</p>

                    <div style="display:flex; justify-content:center; gap:30px; margin:20px 0;">
                        <div>
                            <div style="font-size:2.5rem; font-weight:800;">${cert.percentage}%</div>
                            <div style="opacity:.75; font-size:.85rem;">Score</div>
                        </div>
                        <div>
                            <div style="font-size:2.5rem; font-weight:800;">${cert.score}/${cert.totalQuestions}</div>
                            <div style="opacity:.75; font-size:.85rem;">Correct</div>
                        </div>
                        <div>
                            <div style="font-size:2.5rem; font-weight:800;">${this.PASS_THRESHOLD}%</div>
                            <div style="opacity:.75; font-size:.85rem;">Required</div>
                        </div>
                    </div>

                    ${cert.passed ? `
                        <div style="background:rgba(255,255,255,.15); border-radius:var(--radius-lg); padding:24px; margin-top:20px; max-width:560px; margin-left:auto; margin-right:auto; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
                            <p style="font-size:1.1rem; font-weight:700; letter-spacing:1px; margin-bottom:6px;">📜 Certificate of Competency</p>
                            <p style="font-size:.92rem; opacity:.92; line-height:1.6;">
                                This certifies that <strong>${App.escapeHtml(cert.userName)}</strong> has achieved <strong>${cert.percentage}%</strong> (Passing requirement: ≥ ${this.PASS_THRESHOLD}%) and is officially authorized to operate the
                                <strong>${App.escapeHtml(ins.instrumentName)}</strong> at the Laboratory of Applied Nanomaterial.
                            </p>
                            <p style="font-size:.82rem; opacity:.8; margin-top:10px;">Date Issued: ${App.formatDate(cert.date)}</p>

                            <div style="display:flex; justify-content:center; gap:12px; margin-top:18px; flex-wrap:wrap;">
                                <button class="btn btn-lg" onclick="InstructionManager.downloadCertificate('${cert.id}')" style="background:#ffffff; color:#22543d; font-weight:700; border:none; box-shadow:var(--shadow-md); padding:10px 22px;">
                                    📥 Download Certificate (PNG)
                                </button>
                                <button class="btn btn-outline btn-lg" onclick="InstructionManager.printCertificate('${cert.id}')" style="background:rgba(255,255,255,0.22); color:#fff; border-color:rgba(255,255,255,0.7); padding:10px 20px;">
                                    🖨️ Print / PDF
                                </button>
                            </div>
                        </div>
                    ` : `
                        <p style="font-size:.95rem; opacity:.9; margin-top:12px;">
                            Please review the work instruction carefully and try again. You need at least ${this.PASS_THRESHOLD}% to pass and receive your certificate.
                        </p>
                    `}
                </div>

                <!-- Answer Review -->
                <h3 style="margin-bottom:16px; font-size:1.1rem;">📋 Answer Review</h3>
                ${answers.map((a, displayIdx) => {
                    const q = questions[a.qi];
                    return `
                    <div class="card" style="margin-bottom:12px; border-left:4px solid ${a.isCorrect ? 'var(--success)' : 'var(--danger)'};">
                        <div class="card-body" style="padding:16px 20px;">
                            <div style="display:flex; gap:10px; align-items:flex-start; margin-bottom:10px;">
                                <span style="font-size:1.2rem;">${a.isCorrect ? '✅' : '❌'}</span>
                                <p style="font-weight:600; font-size:.9rem; line-height:1.5;"><strong>Q${displayIdx + 1}.</strong> ${App.escapeHtml(q.question)}</p>
                            </div>
                            <div style="padding-left:34px; font-size:.88rem;">
                                ${!a.isCorrect ? `
                                    <p style="color:var(--danger); margin-bottom:4px;">
                                        <strong>Your answer:</strong> ${String.fromCharCode(65 + a.selected)}. ${App.escapeHtml(q.options[a.selected])}
                                    </p>
                                ` : ''}
                                <p style="color:var(--success);">
                                    <strong>Correct answer:</strong> ${String.fromCharCode(65 + a.correct)}. ${App.escapeHtml(q.options[a.correct])}
                                </p>
                            </div>
                        </div>
                    </div>`;
                }).join('')}

                <div style="text-align:center; padding:24px 0; display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
                    ${cert.passed ? `
                        <button class="btn btn-success btn-lg" onclick="InstructionManager.downloadCertificate('${cert.id}')">
                            📥 Download Certificate (${cert.percentage}%)
                        </button>
                        <button class="btn btn-outline btn-lg" onclick="InstructionManager.printCertificate('${cert.id}')">
                            🖨️ Print
                        </button>
                    ` : `
                        <button class="btn btn-primary btn-lg" onclick="InstructionManager.startQuiz('${ins.id}')">🔄 Retake Test</button>
                    `}
                    <button class="btn btn-outline btn-lg" onclick="InstructionManager.showDetail('${ins.id}')">← Back to Instruction</button>
                </div>
            </div>
        `;
    },

    /* =============================================
       CERTIFICATION HISTORY MODAL
       ============================================= */
    showCertHistory() {
        const certs = this.getCertifications();
        if (certs.length === 0) {
            App.openModal('🎓 Certification Records', `
                <div class="empty-state" style="padding:30px;">
                    <div class="empty-state-icon">🎓</div>
                    <div class="empty-state-text">No certification records yet</div>
                    <div class="empty-state-hint">Certification records will appear here once users complete quizzes.</div>
                </div>
            `);
            return;
        }

        // Sort by date descending
        const sorted = [...certs].sort((a, b) => new Date(b.date) - new Date(a.date));

        App.openModal('🎓 Certification Records', `
            <div style="max-height:60vh; overflow-y:auto;">
                <table class="data-table" style="font-size:.85rem;">
                    <thead>
                        <tr>
                            <th>Result</th>
                            <th>User</th>
                            <th>Instrument</th>
                            <th>Score</th>
                            <th>Date</th>
                            <th>Certificate</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sorted.map(c => `
                            <tr>
                                <td><span class="status-badge ${c.passed ? 'success' : 'danger'}">${c.passed ? '✅ PASSED' : '❌ FAILED'}</span></td>
                                <td><strong>${App.escapeHtml(c.userName)}</strong></td>
                                <td>${App.escapeHtml(c.instrumentName || c.instructionTitle)}</td>
                                <td>${c.score}/${c.totalQuestions} (${c.percentage}%)</td>
                                <td>${App.formatDate(c.date)}</td>
                                <td>
                                    ${c.passed ? `
                                        <button class="btn btn-outline btn-xs" onclick="InstructionManager.downloadCertificate('${c.id}')" title="Download Certificate (PNG)">📥 Download</button>
                                    ` : '<span class="text-muted" style="font-size:.78rem;">Score &lt; 70%</span>'}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div class="form-actions" style="margin-top:16px;">
                <button class="btn btn-danger btn-sm" onclick="if(confirm('Clear all certification records?')){localStorage.removeItem('lan_certifications');App.closeModal();App.showToast('Records cleared','success');}">🗑️ Clear All Records</button>
                <button class="btn btn-outline" onclick="App.closeModal()">Close</button>
            </div>
        `);
    },

    /* =============================================
       CERTIFICATE GENERATION & DOWNLOAD (PNG / Print)
       ============================================= */
    generateCertificateCanvas(cert) {
        const canvas = document.createElement('canvas');
        canvas.width = 1600;
        canvas.height = 1130;
        const ctx = canvas.getContext('2d');

        // 1. Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Ivory subtle gradient
        const bgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        bgGrad.addColorStop(0, '#fcfdfd');
        bgGrad.addColorStop(0.5, '#f7faff');
        bgGrad.addColorStop(1, '#fcfdfd');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);

        // 2. Borders
        // Outer Deep Navy Border
        ctx.strokeStyle = '#0f4c75';
        ctx.lineWidth = 10;
        ctx.strokeRect(35, 35, canvas.width - 70, canvas.height - 70);

        // Middle Slate Border
        ctx.strokeStyle = '#3282b8';
        ctx.lineWidth = 2;
        ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

        // Inner Gold Border
        ctx.strokeStyle = '#c59b27';
        ctx.lineWidth = 4;
        ctx.strokeRect(56, 56, canvas.width - 112, canvas.height - 112);

        // Decorative Corner Flourishes
        const drawCorner = (x, y, dx, dy) => {
            ctx.fillStyle = '#c59b27';
            ctx.beginPath();
            ctx.arc(x, y, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + dx * 22, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y + dy * 22, 4, 0, Math.PI * 2);
            ctx.fill();
        };
        drawCorner(75, 75, 1, 1);
        drawCorner(canvas.width - 75, 75, -1, 1);
        drawCorner(75, canvas.height - 75, 1, -1);
        drawCorner(canvas.width - 75, canvas.height - 75, -1, -1);

        // 3. Header Institution & Official Logo
        const logoImg = document.querySelector('.lab-logo-img');
        if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
            try {
                ctx.drawImage(logoImg, 125, 95, 80, 80);
                ctx.drawImage(logoImg, canvas.width - 205, 95, 80, 80);
            } catch(e) {}
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = '#0f4c75';
        ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
        ctx.fillText('LABORATORY OF APPLIED NANOMATERIAL', canvas.width / 2, 130);

        ctx.fillStyle = '#4a5568';
        ctx.font = '600 20px "Segoe UI", Arial, sans-serif';
        ctx.fillText('SAFETY & EQUIPMENT COMPETENCY PROGRAM', canvas.width / 2, 165);

        // Divider
        ctx.strokeStyle = '#c59b27';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - 250, 185);
        ctx.lineTo(canvas.width / 2 + 250, 185);
        ctx.stroke();

        ctx.fillStyle = '#c59b27';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 185, 6, 0, Math.PI * 2);
        ctx.fill();

        // 4. Certificate Title
        ctx.fillStyle = '#1b262c';
        ctx.font = 'bold 54px Georgia, "Times New Roman", serif';
        ctx.fillText('CERTIFICATE OF COMPETENCY', canvas.width / 2, 260);

        ctx.fillStyle = '#718096';
        ctx.font = 'italic 23px Georgia, serif';
        ctx.fillText('This official credential certifies that', canvas.width / 2, 310);

        // 5. User Name
        ctx.fillStyle = '#0f4c75';
        ctx.font = 'bold 52px Georgia, "Times New Roman", serif';
        const nameText = cert.userName || 'Lab Member';
        ctx.fillText(nameText, canvas.width / 2, 385);

        // Underline
        const textWidth = ctx.measureText(nameText).width;
        const underlineW = Math.max(textWidth + 80, 420);
        ctx.strokeStyle = '#00b4d8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2 - underlineW / 2, 405);
        ctx.lineTo(canvas.width / 2 + underlineW / 2, 405);
        ctx.stroke();

        // 6. Narrative
        ctx.fillStyle = '#2d3748';
        ctx.font = '22px "Segoe UI", Arial, sans-serif';
        ctx.fillText('has successfully studied the standard operating procedures, passed safety validation,', canvas.width / 2, 455);
        ctx.fillText('and fulfilled all qualification examination requirements for safe operation of:', canvas.width / 2, 490);

        // 7. Instrument Box
        const instrBoxY = 530;
        const instrBoxH = 80;
        const instrBoxW = 950;
        ctx.fillStyle = 'rgba(0, 180, 216, 0.08)';
        ctx.fillRect(canvas.width / 2 - instrBoxW / 2, instrBoxY, instrBoxW, instrBoxH);
        ctx.strokeStyle = '#00b4d8';
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - instrBoxW / 2, instrBoxY, instrBoxW, instrBoxH);

        ctx.fillStyle = '#0a3555';
        ctx.font = 'bold 32px "Segoe UI", Arial, sans-serif';
        const instrumentDisplay = cert.instrumentName || cert.instructionTitle || 'Laboratory Instrument';
        ctx.fillText(`🔬 ${instrumentDisplay}`, canvas.width / 2, instrBoxY + 50);

        // 8. Performance Details
        ctx.fillStyle = '#4a5568';
        ctx.font = '20px "Segoe UI", Arial, sans-serif';
        ctx.fillText(`Examination Score: ${cert.percentage}%  (${cert.score}/${cert.totalQuestions} Correct)   |   Passing Standard: ≥ 70%`, canvas.width / 2, 655);

        // 9. Official Seal
        const sealX = canvas.width / 2;
        const sealY = 820;
        const sealR = 75;

        ctx.beginPath();
        ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
        ctx.fillStyle = '#fef3c7';
        ctx.fill();
        ctx.strokeStyle = '#c59b27';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(sealX, sealY, sealR - 8, 0, Math.PI * 2);
        ctx.strokeStyle = '#c59b27';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 15px "Segoe UI", Arial, sans-serif';
        ctx.fillText('★ OFFICIAL CERTIFICATION ★', sealX, sealY - 25);
        ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif';
        ctx.fillText('PASSED', sealX, sealY + 5);
        ctx.font = 'bold 13px "Segoe UI", Arial, sans-serif';
        ctx.fillText('CERTIFIED OPERATOR', sealX, sealY + 28);
        ctx.fillText('≥ 70% QUALIFIED', sealX, sealY + 45);

        // 10. Signatures
        // Left signature
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(180, 850);
        ctx.lineTo(480, 850);
        ctx.stroke();

        ctx.fillStyle = '#1a202c';
        ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
        ctx.fillText('Dr. Sothea / Lab Supervisor', 330, 880);
        ctx.font = '16px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#718096';
        ctx.fillText('Laboratory of Applied Nanomaterial', 330, 905);

        // Right signature
        ctx.strokeStyle = '#2d3748';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(canvas.width - 480, 850);
        ctx.lineTo(canvas.width - 180, 850);
        ctx.stroke();

        ctx.fillStyle = '#1a202c';
        ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
        ctx.fillText(App.formatDate(cert.date), canvas.width - 330, 880);
        ctx.font = '16px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#718096';
        ctx.fillText('Issue Date & Authorized Verification', canvas.width - 330, 905);

        // 11. Footer Credential ID
        ctx.fillStyle = '#a0aec0';
        ctx.font = '14px monospace';
        const certCode = `LAN-CERT-${(cert.id || '').toUpperCase().slice(0, 8)}-${(cert.instrumentName || 'INST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}`;
        ctx.fillText(`Credential ID: ${certCode}   •   Laboratory of Applied Nanomaterial Management System`, canvas.width / 2, 1060);

        return canvas;
    },

    downloadCertificate(certIdOrCert) {
        const cert = typeof certIdOrCert === 'string' ? this.getCertById(certIdOrCert) : certIdOrCert;
        if (!cert) {
            App.showToast('Certificate not found', 'error');
            return;
        }
        if (!cert.passed || cert.percentage < this.PASS_THRESHOLD) {
            App.showToast(`Certificate is only available for scores of at least ${this.PASS_THRESHOLD}%. (Current: ${cert.percentage}%)`, 'warning');
            return;
        }

        try {
            const canvas = this.generateCertificateCanvas(cert);
            const userNameClean = (cert.userName || 'Member').replace(/[^a-zA-Z0-9_-]/g, '_');
            const instrumentClean = (cert.instrumentName || 'Instrument').replace(/[^a-zA-Z0-9_-]/g, '_');
            const filename = `Certificate_${instrumentClean}_${userNameClean}.png`;

            if (canvas.toBlob) {
                canvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    App.showToast(`Certificate downloaded: ${filename}! 🎉`, 'success');
                }, 'image/png');
            } else {
                const dataUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = dataUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                App.showToast(`Certificate downloaded: ${filename}! 🎉`, 'success');
            }
        } catch (err) {
            console.error("Certificate download error:", err);
            App.showToast("Could not generate certificate: " + err.message, "error");
        }
    },

    printCertificate(certIdOrCert) {
        const cert = typeof certIdOrCert === 'string' ? this.getCertById(certIdOrCert) : certIdOrCert;
        if (!cert) {
            App.showToast('Certificate not found', 'error');
            return;
        }
        try {
            const canvas = this.generateCertificateCanvas(cert);
            const dataUrl = canvas.toDataURL('image/png');
            const printWin = window.open('', '_blank');
            if (!printWin) {
                App.showToast('Pop-up was blocked. Please allow pop-ups to print certificate.', 'warning');
                return;
            }
            printWin.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Certificate - ${App.escapeHtml(cert.userName)}</title>
                    <style>
                        body { margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #2d3748; }
                        img { max-width: 95%; height: auto; box-shadow: 0 8px 30px rgba(0,0,0,.4); background: #fff; border-radius: 4px; }
                        @media print {
                            body { background: transparent; }
                            img { width: 100%; height: auto; box-shadow: none; border-radius: 0; }
                        }
                    </style>
                </head>
                <body>
                    <img src="${dataUrl}" onload="setTimeout(()=>{window.print();}, 300);">
                </body>
                </html>
            `);
            printWin.document.close();
        } catch (err) {
            console.error("Certificate print error:", err);
            App.showToast("Could not print certificate: " + err.message, "error");
        }
    },

    /* =============================================
       UTILITIES
       ============================================= */
    splitLines(text) {
        if (!text) return [];
        return text.split('\n')
            .map(l => l.replace(/^\d+[\.\)]\s*/, '').trim())
            .filter(l => l.length > 0);
    },

    /* ---------- Add / Edit Modal ---------- */
    openAddModal() {
        App.openModal('Add Work Instruction', this.getFormHTML());
    },

    openEditModal(id) {
        const all = this.getAll();
        const ins = all.find(i => i.id === id);
        if (ins) App.openModal('Edit Work Instruction', this.getFormHTML(ins));
    },

    getFormHTML(ins) {
        const instruments = this.getInstruments();
        let instrumentOptions = '<option value="">— Select Instrument —</option>';
        instruments.forEach(inst => {
            const sel = ins && ins.instrumentId === inst.id ? 'selected' : '';
            instrumentOptions += `<option value="${inst.id}" data-name="${App.escapeHtml(inst.name)}" ${sel}>${App.escapeHtml(inst.name)}</option>`;
        });
        const customName = ins && ins.instrumentName && !instruments.find(x => x.id === ins.instrumentId) ? ins.instrumentName : '';

        // Serialize quiz for editing
        const quizJSON = ins && ins.quiz ? JSON.stringify(ins.quiz, null, 2) : '';

        return `
            <form id="instruction-form" onsubmit="InstructionManager.saveInstruction(event, '${ins ? ins.id : ''}')">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" id="ins-title" class="form-input" required placeholder="e.g. SEM Standard Operating Procedure" value="${ins ? App.escapeHtml(ins.title) : ''}">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Linked Instrument</label>
                        <select id="ins-instrument" class="form-select">${instrumentOptions}</select>
                        <input type="text" id="ins-instrument-custom" class="form-input" style="margin-top:6px;" placeholder="Or type custom name" value="${App.escapeHtml(customName)}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Author *</label>
                        <input type="text" id="ins-author" class="form-input" required value="${ins ? App.escapeHtml(ins.author) : ''}">
                        <label class="form-label" style="margin-top:12px;">Version</label>
                        <input type="text" id="ins-version" class="form-input" value="${ins ? App.escapeHtml(ins.version || '1.0') : '1.0'}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">⚠️ Safety Precautions (one per line)</label>
                    <textarea id="ins-safety" class="form-textarea" rows="3">${ins ? ins.safetyPrecautions || '' : ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">✅ Pre-Operation Checklist (one per line)</label>
                    <textarea id="ins-preop" class="form-textarea" rows="3">${ins ? ins.preOperationChecklist || '' : ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">📝 Operating Procedure (one per line)</label>
                    <textarea id="ins-procedure" class="form-textarea" rows="4">${ins ? ins.procedure || '' : ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">🔌 Shutdown Procedure (one per line)</label>
                    <textarea id="ins-shutdown" class="form-textarea" rows="3">${ins ? ins.shutdownProcedure || '' : ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">🔧 Troubleshooting (Problem: Solution — one per line)</label>
                    <textarea id="ins-trouble" class="form-textarea" rows="3">${ins ? ins.troubleshooting || '' : ''}</textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">🎓 Quiz Questions (JSON format)</label>
                    <div class="form-hint" style="margin-bottom:6px;">Format: [{"question":"...","options":["A","B","C","D"],"correctAnswer":0}] — correctAnswer is the 0-based index.</div>
                    <textarea id="ins-quiz" class="form-textarea" rows="4" style="font-family:monospace; font-size:.8rem;">${App.escapeHtml(quizJSON)}</textarea>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">💾 Save Instruction</button>
                </div>
            </form>
        `;
    },

    saveInstruction(e, editId) {
        e.preventDefault();
        const instSelect = document.getElementById('ins-instrument');
        const customName = document.getElementById('ins-instrument-custom').value.trim();
        const selectedOption = instSelect.options[instSelect.selectedIndex];
        const instId = instSelect.value;
        const instName = customName || (instId ? selectedOption.dataset.name || selectedOption.text : '');

        // Parse quiz JSON
        let quiz = [];
        const quizRaw = document.getElementById('ins-quiz').value.trim();
        if (quizRaw) {
            try {
                quiz = JSON.parse(quizRaw);
                if (!Array.isArray(quiz)) throw new Error('Must be an array');
            } catch (err) {
                App.showToast('Quiz JSON is invalid: ' + err.message, 'error');
                return;
            }
        }

        const data = {
            title: document.getElementById('ins-title').value.trim(),
            instrumentId: instId,
            instrumentName: instName,
            author: document.getElementById('ins-author').value.trim(),
            version: document.getElementById('ins-version').value.trim() || '1.0',
            safetyPrecautions: document.getElementById('ins-safety').value.trim(),
            preOperationChecklist: document.getElementById('ins-preop').value.trim(),
            procedure: document.getElementById('ins-procedure').value.trim(),
            shutdownProcedure: document.getElementById('ins-shutdown').value.trim(),
            troubleshooting: document.getElementById('ins-trouble').value.trim(),
            quiz: quiz,
            lastUpdated: new Date().toISOString()
        };

        const all = this.getAll();
        if (editId) {
            const idx = all.findIndex(i => i.id === editId);
            if (idx !== -1) { all[idx] = { ...all[idx], ...data }; App.showToast('Instruction updated!', 'success'); }
        } else {
            data.id = App.generateId();
            all.push(data);
            App.showToast('Instruction added!', 'success');
        }
        this.save(all);
        App.closeModal();
        if (editId && this.currentView === 'detail') { this.currentDetailId = editId; this.renderPage(); }
        else { this.currentView = 'grid'; this.renderPage(); }
    },

    async deleteInstruction(id) {
        const ok = await App.confirm('Delete Instruction', 'Are you sure? This cannot be undone.');
        if (!ok) return;
        const all = this.getAll().filter(i => i.id !== id);
        this.save(all);
        App.showToast('Instruction deleted.', 'success');
        this.backToGrid();
    },

    /* =============================================
       SAMPLE DATA WITH QUIZ QUESTIONS
       ============================================= */
    getSampleData() {
        return [
            {
                id: App.generateId(),
                title: 'Scanning Electron Microscope (SEM) — Standard Operating Procedure',
                instrumentId: '', instrumentName: 'SEM - JEOL JSM-7600F',
                safetyPrecautions:
`High voltage hazard — never open instrument panels while powered on
Liquid nitrogen is used for EDS detector cooling — wear cryogenic gloves and face shield
X-ray generation is possible — ensure all interlocks are engaged before operation
Do not bring magnetic materials near the electron column
Wear nitrile gloves when handling samples to avoid contamination
Report any unusual sounds, smells, or error messages to the lab supervisor immediately`,
                preOperationChecklist:
`Verify cooling water is circulating (check flow meter on back panel)
Check liquid nitrogen level in the EDS dewar — refill if below 50%
Ensure the roughing pump is running and vacuum is in standby range
Inspect sample holder and stage for residual contamination
Review the logbook for any issues reported by the previous user
Prepare your sample with conductive tape or sputter coating if non-conductive`,
                procedure:
`Log in to the SEM control computer and open the SmartSEM software
Vent the specimen chamber by clicking "Vent" in the software
Mount your sample securely on the stage using carbon tape or silver paste
Load the stage into the chamber and close the door firmly
Pump down the chamber — wait until vacuum reaches at least 10⁻⁵ Pa
Turn on the accelerating voltage (start at 5 kV for sensitive samples, up to 20 kV for bulk)
Adjust the working distance (WD) — typical range is 8–15 mm
Focus the image at low magnification first, then increase gradually
Correct astigmatism using the stigmator controls (X and Y)
Set the appropriate detector (SE2 for topography, BSE for compositional contrast)
Capture images at desired magnifications and save with descriptive filenames
If using EDS, ensure the detector is cooled and insert it to the correct position`,
                shutdownProcedure:
`Turn off the accelerating voltage (EHT Off)
Retract the EDS detector if it was used
Return the stage to the home/load position
Vent the chamber and carefully remove your sample
Pump the chamber back down to standby vacuum
Log your usage time, samples, and any issues in the logbook`,
                troubleshooting:
`Image is blurry or has streaks: Re-adjust focus and stigmation at high magnification
Image is drifting: Allow sample to thermally equilibrate for 10 minutes; check if stage is locked
Charging artifacts (bright areas): Sample is non-conductive — apply sputter coating or reduce kV
Poor vacuum — cannot reach 10⁻⁵ Pa: Check chamber door seal, ensure sample is dry, inspect O-rings
No beam / no image: Check if filament needs replacement — review filament hours in the log
EDS shows no peaks: Verify detector is cooled with LN₂ and properly inserted`,
                author: 'Dr. Sothea', lastUpdated: '2026-09-01', version: '2.1',
                quiz: [
                    { question: "What personal protective equipment is required when handling liquid nitrogen for the EDS detector?", options: ["Cotton gloves only", "Cryogenic gloves and face shield", "Leather work gloves", "No special PPE needed"], correctAnswer: 1 },
                    { question: "What is the minimum vacuum level required before turning on the accelerating voltage?", options: ["10⁻² Pa", "10⁻³ Pa", "10⁻⁵ Pa", "10⁻¹ Pa"], correctAnswer: 2 },
                    { question: "What is the FIRST step you should do before loading a sample into the SEM chamber?", options: ["Turn on accelerating voltage", "Vent the specimen chamber", "Adjust the stigmation", "Switch on the EDS detector"], correctAnswer: 1 },
                    { question: "What mounting material should be used for non-conductive samples?", options: ["Scotch tape", "Masking tape", "Carbon tape or silver paste", "Electrical tape"], correctAnswer: 2 },
                    { question: "What causes bright 'charging artifacts' in SEM images?", options: ["Accelerating voltage too high", "Non-conductive sample without coating", "Wrong detector selected", "Low magnification setting"], correctAnswer: 1 },
                    { question: "After removing your sample, what must you do with the chamber?", options: ["Leave it open for the next user", "Turn off the computer immediately", "Pump it back down to standby vacuum", "Nothing — it's automatic"], correctAnswer: 2 },
                    { question: "Which detector is used for topographic (surface shape) imaging?", options: ["BSE detector", "SE2 detector", "EDS detector", "WDS detector"], correctAnswer: 1 },
                    { question: "What should you do if the SEM image is drifting?", options: ["Increase the accelerating voltage", "Allow sample to thermally equilibrate for 10 minutes", "Immediately turn off the SEM", "Switch to BSE mode"], correctAnswer: 1 }
                ]
            },
            {
                id: App.generateId(),
                title: 'X-Ray Diffractometer (XRD) — Standard Operating Procedure',
                instrumentId: '', instrumentName: 'XRD - Bruker D8 Advance',
                safetyPrecautions:
`RADIATION HAZARD — X-rays can cause serious injury. Never bypass door interlocks
Wear your personal dosimeter badge at ALL times when in the XRD room
The X-ray tube housing contains high voltage — do not touch during operation
Handle beryllium windows with extreme care (toxic if damaged)
Know the location of the emergency X-ray shut-off button (red button on wall)
Only trained and authorized users may operate this instrument`,
                preOperationChecklist:
`Verify the radiation warning light outside the room is functioning
Check cooling water flow and temperature (should be 18–22°C)
Ensure the sample stage is clean and properly zeroed
Confirm the correct X-ray tube is installed (Cu Kα for most applications)
Verify appropriate divergence and anti-scatter slits are in place`,
                procedure:
`Prepare your powder sample in a standard sample holder — press flat with a glass slide
Mount the sample holder in the diffractometer goniometer
Close and lock the radiation enclosure door — verify interlock LED is green
Start the DIFFRAC.EVA software and initialize hardware
Set scan parameters: 2θ start angle (typically 10°), end angle (80°), step size (0.02°)
Ramp up the X-ray generator slowly to operating conditions (40 kV, 40 mA)
Start the scan and monitor the first few peaks to verify alignment
Wait for the scan to complete — do not open the enclosure during scanning
Save the raw data file and export to a common format if needed`,
                shutdownProcedure:
`Ramp down the X-ray generator to standby power (20 kV, 5 mA) or turn off if last user
Open the radiation enclosure and carefully remove your sample
Clean the sample holder and return it to storage
Exit the control software and record usage in the logbook`,
                troubleshooting:
`High background noise: Check for sample fluorescence — consider a monochromator or different tube
Very broad peaks: Sample may have nanocrystalline structure — verify with a standard
Interlock error: Ensure the enclosure door is completely closed and latched
No counts on detector: Check detector power supply and verify the X-ray shutter is open
Peak positions shifted: Perform zero-point calibration using a silicon standard (NIST SRM 640)`,
                author: 'Dr. Vicheka', lastUpdated: '2026-08-15', version: '2.0',
                quiz: [
                    { question: "What is the PRIMARY safety hazard associated with XRD instruments?", options: ["High temperature burns", "X-ray radiation exposure", "Chemical spill risk", "Excessive noise"], correctAnswer: 1 },
                    { question: "What must you wear at ALL times when working in the XRD room?", options: ["Lead apron", "Safety glasses", "Personal dosimeter badge", "Ear protection"], correctAnswer: 2 },
                    { question: "What should you NEVER do with the radiation enclosure door interlocks?", options: ["Test them regularly", "Bypass or override them", "Report issues with them", "Check the LED status"], correctAnswer: 1 },
                    { question: "What is the typical 2θ scanning range for a standard powder XRD measurement?", options: ["0° – 5°", "10° – 80°", "90° – 180°", "1° – 3°"], correctAnswer: 1 },
                    { question: "Before starting a scan, the interlock LED on the enclosure must be:", options: ["Red", "Yellow/amber", "Green", "Off"], correctAnswer: 2 },
                    { question: "What does a very broad peak in an XRD pattern typically indicate?", options: ["Large crystal size", "Pure single-crystal material", "Nanocrystalline structure or microstrain", "Instrument malfunction"], correctAnswer: 2 },
                    { question: "Which standard is recommended for wavelength/position calibration of XRD?", options: ["Aluminum foil", "Silicon standard (NIST SRM 640)", "Plain glass slide", "No calibration is needed"], correctAnswer: 1 }
                ]
            },
            {
                id: App.generateId(),
                title: 'UV-Vis Spectrophotometer — Measurement Procedure',
                instrumentId: '', instrumentName: 'UV-Vis - Shimadzu UV-2600',
                safetyPrecautions:
`UV light hazard — do not look directly into the sample compartment when the lid is open
Wear safety glasses and nitrile gloves when handling liquid samples
Handle quartz cuvettes carefully — they are fragile and expensive
Dispose of chemical waste in the designated waste containers
Clean up any spills immediately to prevent damage to the instrument optics
Do not use cracked or scratched cuvettes — they will affect measurements`,
                preOperationChecklist:
`Turn on the instrument and allow 20–30 minutes for lamp warmup
Inspect cuvettes for scratches, fingerprints, or residual contamination
Prepare your blank/reference solution (usually the pure solvent)
Launch the UVProbe software on the connected computer
Check lamp energy levels — replace lamps if below threshold
Prepare sample solutions at appropriate concentrations (OD should be 0.1–1.0)`,
                procedure:
`Open UVProbe software and select measurement mode (Spectrum Scan or Photometric)
Set the wavelength range (typically 200–800 nm) and scan speed
Fill a matched pair of quartz cuvettes with blank solution — wipe exterior with lens paper
Place blank cuvettes in both reference and sample positions
Run baseline correction (auto-zero) across the full wavelength range
Remove the sample-side blank, rinse with analyte, fill with analyte
Wipe the cuvette exterior clean and place in the sample position
Start the measurement and wait for the scan to complete
Record peak wavelengths (λmax) and absorbance values
For multiple samples, rinse the cuvette thoroughly between each measurement
Save the data and export spectra`,
                shutdownProcedure:
`Remove all cuvettes from both compartments
Rinse cuvettes with DI water then ethanol — dry and store in the cuvette box
Wipe down any spills inside the sample compartment with lens paper
Turn off lamps via the software, close software, shut down instrument
Record usage in the logbook`,
                troubleshooting:
`Negative absorbance reading: Baseline was not properly set — redo the auto-zero with fresh blank
Noisy spectrum with spikes: Check for air bubbles in the cuvette — remove by gentle tapping
Detector saturation (absorbance > 3): Sample is too concentrated — dilute and re-measure
Wavelength accuracy drift: Run a calibration check using a holmium oxide filter
Baseline drift over time: Allow longer warm-up time; lamps may need replacement`,
                author: 'Sokha', lastUpdated: '2026-09-05', version: '1.1',
                quiz: [
                    { question: "How long should you warm up the UV-Vis spectrophotometer before taking measurements?", options: ["1 minute", "5 minutes", "20–30 minutes", "2 hours"], correctAnswer: 2 },
                    { question: "What is the recommended absorbance (OD) range for accurate UV-Vis measurements?", options: ["0.01 – 0.05", "0.1 – 1.0", "2.0 – 4.0", "5.0 – 10.0"], correctAnswer: 1 },
                    { question: "What should you use to wipe the exterior of quartz cuvettes?", options: ["Paper towel", "Cotton cloth", "Lens paper", "Your lab coat sleeve"], correctAnswer: 2 },
                    { question: "What does a negative absorbance reading most likely indicate?", options: ["Very strong absorption", "The baseline/auto-zero was not properly set", "The sample is fluorescent", "The cuvette is too clean"], correctAnswer: 1 },
                    { question: "Why should cracked or scratched cuvettes NOT be used?", options: ["They look unprofessional", "They may leak solvent", "They will affect measurement accuracy", "They are too expensive to risk"], correctAnswer: 2 },
                    { question: "What must you do between measuring different samples in the same cuvette?", options: ["Nothing — just add the next sample", "Rinse the cuvette thoroughly with the next sample", "Replace the lamp", "Restart the software"], correctAnswer: 1 }
                ]
            },
            {
                id: App.generateId(),
                title: 'Dynamic Light Scattering (DLS) — Particle Size Measurement',
                instrumentId: '', instrumentName: 'DLS - Malvern Zetasizer Nano ZS',
                safetyPrecautions:
`Class 1 laser product under normal use — do not bypass covers to expose the laser beam
Handle disposable cuvettes and capillary cells with gloves to prevent contamination
Clean up any sample spills immediately to prevent damage to the optical block
Use appropriate PPE for the solvents and nanoparticles being analyzed
Do not open the instrument casing — no user-serviceable parts inside`,
                preOperationChecklist:
`Filter all solvents through 0.2 μm syringe filter to remove dust
Ensure the sample is well-dispersed — sonicate if needed
Know the refractive index and absorption of your nanoparticles
Know the viscosity and refractive index of your solvent at measurement temperature
Check that the temperature controller is functioning (green LED on)
Clean cuvettes with filtered solvent just before use`,
                procedure:
`Turn on the Zetasizer and launch the software on the PC
Allow the instrument to warm up and self-calibrate (about 5 minutes)
Set the desired measurement temperature (typically 25°C) and wait for equilibration
Prepare your sample at appropriate concentration (translucent, not opaque)
Load sample into a disposable cuvette — avoid introducing bubbles
Place the cuvette in the cell holder and close the lid
Enter sample material properties (refractive index, absorption)
Enter dispersant properties (e.g., water: RI=1.330, viscosity=0.8872 cP at 25°C)
Select measurement type: Size measurement
Run the measurement — typically 3 runs of 12 scans each
Review the correlation function — should show a smooth exponential decay
Record the Z-average diameter and polydispersity index (PDI)`,
                shutdownProcedure:
`Remove the sample cuvette immediately after measurement
Dispose of the cuvette or clean thoroughly if reusable
Wipe down the cell holder area if any sample was spilled
Close the software, turn off the instrument or leave in standby
Record usage and results summary in the logbook`,
                troubleshooting:
`Poor or noisy correlation function: Sample too dilute or too concentrated — adjust concentration
Large dust peaks in distribution: Filter both sample and solvent through 0.2 μm filter
Temperature not stabilizing: Wait longer (5–10 min) or check the Peltier element
Very high PDI (> 0.5): Sample is polydisperse or aggregated — try different pH or sonication
Count rate too low (< 10 kcps): Increase sample concentration
Count rate too high (> 100,000 kcps): Dilute the sample significantly`,
                author: 'Dr. Sothea', lastUpdated: '2026-07-20', version: '1.0',
                quiz: [
                    { question: "What filter pore size should you use to remove dust from solvents before DLS measurement?", options: ["5 μm", "1 μm", "0.2 μm", "10 μm"], correctAnswer: 2 },
                    { question: "What does a high polydispersity index (PDI > 0.5) indicate about your sample?", options: ["The sample is perfectly monodisperse", "The sample is polydisperse or aggregated", "The measurement is complete", "The instrument needs calibration"], correctAnswer: 1 },
                    { question: "How long should you wait for temperature equilibration before starting a DLS measurement?", options: ["No waiting needed", "30 seconds", "5–10 minutes", "1 hour"], correctAnswer: 2 },
                    { question: "What should a good DLS correlation function look like?", options: ["A zigzag pattern", "A smooth exponential decay curve", "A flat horizontal line", "A sinusoidal wave"], correctAnswer: 1 },
                    { question: "If the count rate is too low (< 10 kcps), what should you do?", options: ["Dilute the sample further", "Increase the sample concentration", "Replace the laser", "Raise the temperature to 50°C"], correctAnswer: 1 },
                    { question: "Why should you handle DLS cuvettes with gloves?", options: ["To protect your hands from chemicals", "To prevent fingerprint contamination affecting the measurement", "It is only a lab policy with no practical reason", "The cuvettes are hot"], correctAnswer: 1 }
                ]
            },
            {
                id: App.generateId(),
                title: 'Spin Coater — Thin Film Deposition Procedure',
                instrumentId: '', instrumentName: 'Spin Coater - Laurell WS-650',
                safetyPrecautions:
`Wear safety glasses at ALL times — substrates can fly off at high speeds
Always use the spin coater inside a fume hood when working with volatile solvents
Ensure the vacuum chuck is engaged before starting rotation — loose substrates are dangerous
Never open the lid while the chuck is spinning — wait for full stop
Dispose of solvent waste in designated waste bottles, not down the drain
Avoid skin contact with photoresists and coating solutions — wear nitrile gloves`,
                preOperationChecklist:
`Turn on the vacuum pump and verify the gauge reads adequate suction
Check that the fume hood is on and airflow is sufficient
Select and install the correct chuck size for your substrate
Inspect the spin bowl for dried resist or debris — clean with acetone if needed
Have your coating solution, pipettes, and substrates ready
Program your spin recipe before placing the substrate`,
                procedure:
`Clean your substrate with acetone → isopropanol → DI water rinse
Dry the substrate with nitrogen gas
Open the spin coater lid and center the substrate on the vacuum chuck
Turn on the vacuum and verify the substrate is held firmly (check gauge)
Program the spin recipe: Step 1 — slow spread (500 rpm, 10 s); Step 2 — final spin (2000–6000 rpm, 30–60 s)
Using a pipette, dispense the coating solution onto the center (cover about 70% of the surface)
Close the lid completely — verify the interlock LED is green
Press START to run the spin recipe
Wait for rotation to completely stop before opening the lid
Turn off the vacuum and carefully remove the coated substrate with tweezers
If required, perform a soft bake on a hot plate at the recommended temperature
Inspect the film visually for uniformity — look for edge beads, comets, or bare spots`,
                shutdownProcedure:
`Clean the spin bowl with acetone using a lint-free wipe
Remove and clean the vacuum chuck if solution got underneath
Turn off the vacuum pump
Power down the spin coater controller
Close the fume hood sash to the recommended height
Dispose of all chemical waste properly and clean the workspace
Record usage and recipe parameters in the logbook`,
                troubleshooting:
`Substrate flies off during spinning: Vacuum pressure too low — check pump and tubing; substrate not centered
Uneven or streaky coating: Chuck is not level — use a bubble level; improve dispensing technique
Motor won't start: Lid interlock not fully engaged — press lid down firmly
Thick edge bead: Normal for spin coating — remove with edge bead remover or solvent wipe
Pinholes or comets in film: Particulate contamination — filter solution through 0.45 μm filter
Film too thick: Increase spin speed or reduce solution concentration
Film too thin: Decrease spin speed or increase solution concentration`,
                author: 'Dara', lastUpdated: '2026-09-10', version: '1.3',
                quiz: [
                    { question: "Why must you wear safety glasses when using the spin coater?", options: ["To protect from chemical splashes only", "To protect from UV light", "Because substrates can fly off at high speed", "To see the coating better"], correctAnswer: 2 },
                    { question: "What MUST be engaged before starting the spin cycle?", options: ["The heater", "The vacuum chuck", "The exhaust fan only", "The timer"], correctAnswer: 1 },
                    { question: "What is the correct substrate cleaning sequence before spin coating?", options: ["Water → Ethanol → Acetone", "Acetone → Isopropanol → DI water", "Ethanol only", "No cleaning is needed"], correctAnswer: 1 },
                    { question: "Approximately how much of the substrate surface should the coating solution cover when dispensed?", options: ["10%", "30%", "70%", "100%"], correctAnswer: 2 },
                    { question: "What should you NEVER do while the chuck is spinning?", options: ["Monitor the display", "Open the lid", "Stand near the fume hood", "Check the spin recipe"], correctAnswer: 1 },
                    { question: "What is the most likely cause of pinholes or comets in the coated film?", options: ["Spin speed too high", "Spin speed too low", "Particulate contamination in the solution", "Clean substrate surface"], correctAnswer: 2 },
                    { question: "What should you do after finishing all spin coating work?", options: ["Leave the equipment as-is for the next user", "Clean the bowl with acetone and record usage in the logbook", "Turn off the fume hood immediately", "Remove the vacuum pump hose"], correctAnswer: 1 }
                ]
            }
        ];
    }
};
