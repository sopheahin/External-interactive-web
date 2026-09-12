var BookingManager = {
  currentWeekStart: null,
  memberColors: {},
  palette: [
    '#0ea5e9', '#8b5cf6', '#f97316', '#10b981', '#f43f5e',
    '#6366f1', '#14b8a6', '#e879f9', '#eab308', '#64748b'
  ],
  timeSlots: [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ],

  init: function () {
    this.currentWeekStart = this.getMonday(new Date());
    this.ensureSampleData();
    this.generateMemberColors();
    this.render();
  },

  getMonday: function (d) {
    d = new Date(d);
    var day = d.getDay();
    var diff = d.getDate() - day + (day == 0 ? -6 : 1); 
    var monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  },

  getBookings: function () {
    var stored = localStorage.getItem('lan_bookings');
    return stored ? JSON.parse(stored) : [];
  },

  saveBookings: function (bookings) {
    localStorage.setItem('lan_bookings', JSON.stringify(bookings));
    this.generateMemberColors();
  },

  getInstruments: function () {
    var stored = localStorage.getItem('lan_instruments');
    return stored ? JSON.parse(stored) : [
      { id: '1', name: 'Microscope' },
      { id: '2', name: 'Centrifuge' },
      { id: '3', name: 'Spectrophotometer' },
      { id: '4', name: 'Incubator' }
    ];
  },

  ensureSampleData: function () {
    if (!localStorage.getItem('lan_bookings')) {
      var monday = new Date(this.currentWeekStart);
      var instruments = this.getInstruments();
      
      var addDays = function (date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
      };

      var instId = function (index) {
        return instruments[index % instruments.length].id;
      };
      var instName = function (index) {
        return instruments[index % instruments.length].name;
      };

      var samples = [
        {
          id: App.generateId(),
          memberName: 'Dr. Sothea',
          instrumentId: instId(0),
          instrumentName: instName(0),
          purpose: 'Cell analysis',
          date: addDays(monday, 0),
          startTime: '09:00',
          endTime: '11:00',
          createdAt: new Date().toISOString()
        },
        {
          id: App.generateId(),
          memberName: 'Dr. Vicheka',
          instrumentId: instId(1),
          instrumentName: instName(1),
          purpose: 'Sample preparation',
          date: addDays(monday, 1),
          startTime: '10:00',
          endTime: '12:00',
          createdAt: new Date().toISOString()
        },
        {
          id: App.generateId(),
          memberName: 'Sokha',
          instrumentId: instId(2),
          instrumentName: instName(2),
          purpose: 'Optical density',
          date: addDays(monday, 2),
          startTime: '14:00',
          endTime: '15:00',
          createdAt: new Date().toISOString()
        },
        {
          id: App.generateId(),
          memberName: 'Dara',
          instrumentId: instId(3),
          instrumentName: instName(3),
          purpose: 'Incubation start',
          date: addDays(monday, 3),
          startTime: '08:00',
          endTime: '10:00',
          createdAt: new Date().toISOString()
        },
        {
          id: App.generateId(),
          memberName: 'Sreyleak',
          instrumentId: instId(0),
          instrumentName: instName(0),
          purpose: 'Microscopy',
          date: addDays(monday, 4),
          startTime: '15:00',
          endTime: '17:00',
          createdAt: new Date().toISOString()
        }
      ];
      this.saveBookings(samples);
    }
  },

  generateMemberColors: function () {
    var bookings = this.getBookings();
    this.memberColors = {};
    var colorIndex = 0;
    for (var i = 0; i < bookings.length; i++) {
      var name = bookings[i].memberName;
      if (!this.memberColors[name]) {
        this.memberColors[name] = this.palette[colorIndex % this.palette.length];
        colorIndex++;
      }
      bookings[i].color = this.memberColors[name];
    }
    localStorage.setItem('lan_bookings', JSON.stringify(bookings));
  },

  changeWeek: function (offset) {
    var next = new Date(this.currentWeekStart);
    next.setDate(next.getDate() + (offset * 7));
    this.currentWeekStart = next;
    this.render();
  },

  goToToday: function () {
    this.currentWeekStart = this.getMonday(new Date());
    this.render();
  },

  formatTimeDisplay: function (time24) {
    var parts = time24.split(':');
    var h = parseInt(parts[0], 10);
    var ampm = h >= 12 ? 'PM' : 'AM';
    var h12 = h % 12 || 12;
    return h12 + ':' + parts[1] + ' ' + ampm;
  },

  render: function () {
    var container = document.getElementById('main-content');
    if (!container) return;

    var days = [];
    var currentDay = new Date(this.currentWeekStart);
    for (var i = 0; i < 7; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    var weekEnd = days[6];
    var weekLabel = days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
                    ' &mdash; ' + 
                    weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    var html = `
      <div class="content-header">
        <h2>Lab Schedule</h2>
        <div class="action-buttons">
          <button class="btn btn-primary" onclick="BookingManager.openBookingForm()">New Booking</button>
        </div>
      </div>
      
      <div class="calendar-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div class="calendar-nav" style="display: flex; align-items: center; gap: 10px;">
          <button class="btn btn-outline btn-sm" onclick="BookingManager.changeWeek(-1)">&larr; Prev</button>
          <button class="btn btn-outline btn-sm" onclick="BookingManager.goToToday()">Today</button>
          <button class="btn btn-outline btn-sm" onclick="BookingManager.changeWeek(1)">Next &rarr;</button>
          <strong class="week-label">${weekLabel}</strong>
        </div>
      </div>

      <div class="calendar-grid-wrapper" style="overflow-x: auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border-radius: 8px;">
        <div class="calendar-grid" style="display: grid; grid-template-columns: 80px repeat(7, 1fr); background: #f1f5f9; gap: 1px; min-width: 800px;">
          
          <!-- Header Row -->
          <div class="cal-header-cell" style="background: white; padding: 10px; text-align: center; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Time</div>
    `;

    var todayStr = new Date().toISOString().split('T')[0];

    days.forEach(function (d) {
      var dStr = d.toISOString().split('T')[0];
      var isToday = dStr === todayStr ? 'today' : '';
      var dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      var dateNum = d.getDate();
      var bg = isToday ? '#eff6ff' : 'white';
      var color = isToday ? '#2563eb' : 'inherit';
      html += `
        <div class="cal-header-cell ${isToday}" style="background: ${bg}; color: ${color}; padding: 10px; text-align: center; font-weight: bold; border-bottom: 1px solid #e2e8f0;">
          <div>${dayName}</div>
          <div style="font-size: 1.2em;">${dateNum}</div>
        </div>
      `;
    });

    var bookings = this.getBookings();

    this.timeSlots.forEach(function (slot) {
      // Time cell
      html += `
        <div class="cal-time-cell" style="background: white; padding: 10px 5px; text-align: right; font-size: 0.85em; color: #64748b; border-bottom: 1px solid #e2e8f0;">
          ${BookingManager.formatTimeDisplay(slot)}
        </div>
      `;

      // Day cells
      days.forEach(function (d) {
        var dStr = d.toISOString().split('T')[0];
        var isToday = dStr === todayStr ? 'today-col' : '';
        var bg = isToday ? '#f8fafc' : 'white';
        
        var cellHtml = `
          <div class="cal-cell ${isToday}" 
               style="background: ${bg}; padding: 5px; border-bottom: 1px solid #e2e8f0; cursor: pointer; min-height: 60px; position: relative;" 
               onclick="BookingManager.openBookingForm('${dStr}', '${slot}')">
        `;

        var slotBookings = bookings.filter(function(b) {
          return b.date === dStr && b.startTime <= slot && b.endTime > slot;
        });

        slotBookings.forEach(function(b) {
          var initials = b.memberName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0,2);
          var shortInst = b.instrumentName.length > 10 ? b.instrumentName.substring(0,8) + '..' : b.instrumentName;
          
          cellHtml += `
            <div class="booking-chip" 
                 style="background-color: ${b.color || '#94a3b8'}; color: white; padding: 4px; border-radius: 4px; font-size: 0.75em; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;"
                 onclick="event.stopPropagation(); BookingManager.viewBooking('${b.id}')"
                 title="${App.escapeHtml(b.memberName)} - ${App.escapeHtml(b.instrumentName)} (${BookingManager.formatTimeDisplay(b.startTime)} - ${BookingManager.formatTimeDisplay(b.endTime)})">
              <b>${App.escapeHtml(initials)}</b>: ${App.escapeHtml(shortInst)}
            </div>
          `;
        });

        cellHtml += `</div>`;
        html += cellHtml;
      });
    });

    html += `
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  openBookingForm: function (defaultDate, defaultStartTime) {
    defaultDate = defaultDate || new Date().toISOString().split('T')[0];
    defaultStartTime = defaultStartTime || '09:00';

    var instruments = this.getInstruments();
    var instOptions = instruments.map(function(inst) {
      return `<option value="${App.escapeHtml(inst.id)}">${App.escapeHtml(inst.name)}</option>`;
    }).join('');

    var timeOptions = this.timeSlots.map(function(t) {
      return `<option value="${t}">${BookingManager.formatTimeDisplay(t)}</option>`;
    });
    // Add 18:00 for end time
    timeOptions.push(`<option value="18:00">6:00 PM</option>`);

    var formHtml = `
      <form id="booking-form" onsubmit="event.preventDefault(); BookingManager.saveBooking();">
        <div class="form-group" style="margin-bottom: 15px;">
          <label class="form-label" style="display: block; margin-bottom: 5px;">Member Name</label>
          <input type="text" id="b-member" class="form-input" style="width: 100%; padding: 8px;" required>
        </div>
        <div class="form-group" style="margin-bottom: 15px;">
          <label class="form-label" style="display: block; margin-bottom: 5px;">Instrument</label>
          <select id="b-instrument" class="form-select" style="width: 100%; padding: 8px;" required>
            <option value="">Select Instrument...</option>
            ${instOptions}
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 15px;">
          <label class="form-label" style="display: block; margin-bottom: 5px;">Purpose</label>
          <textarea id="b-purpose" class="form-textarea" style="width: 100%; padding: 8px; min-height: 60px;" required></textarea>
        </div>
        <div class="form-row" style="display: flex; gap: 10px; margin-bottom: 15px;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label" style="display: block; margin-bottom: 5px;">Date</label>
            <input type="date" id="b-date" class="form-input" style="width: 100%; padding: 8px;" value="${defaultDate}" readonly required>
          </div>
        </div>
        <div class="form-row" style="display: flex; gap: 10px; margin-bottom: 20px;">
          <div class="form-group" style="flex: 1;">
            <label class="form-label" style="display: block; margin-bottom: 5px;">Start Time</label>
            <select id="b-start" class="form-select" style="width: 100%; padding: 8px;" required>
              ${timeOptions.join('')}
            </select>
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label" style="display: block; margin-bottom: 5px;">End Time</label>
            <select id="b-end" class="form-select" style="width: 100%; padding: 8px;" required>
              ${timeOptions.join('')}
            </select>
          </div>
        </div>
        <div class="form-actions" style="text-align: right;">
          <button type="button" class="btn btn-outline" onclick="App.closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Booking</button>
        </div>
      </form>
    `;

    App.openModal('New Booking', formHtml);
    document.getElementById('b-start').value = defaultStartTime;
    // Set end time to 1 hour after start time if possible
    var startIndex = this.timeSlots.indexOf(defaultStartTime);
    if (startIndex >= 0 && startIndex < this.timeSlots.length - 1) {
      document.getElementById('b-end').value = this.timeSlots[startIndex + 1];
    } else {
      document.getElementById('b-end').value = '18:00';
    }
  },

  saveBooking: function () {
    var memberName = document.getElementById('b-member').value.trim();
    var instSelect = document.getElementById('b-instrument');
    var instrumentId = instSelect.value;
    var instrumentName = instSelect.options[instSelect.selectedIndex].text;
    var purpose = document.getElementById('b-purpose').value.trim();
    var date = document.getElementById('b-date').value;
    var startTime = document.getElementById('b-start').value;
    var endTime = document.getElementById('b-end').value;

    if (!memberName || !instrumentId || !purpose || !date || !startTime || !endTime) {
      App.showToast('Please fill all fields', 'warning');
      return;
    }

    if (startTime >= endTime) {
      App.showToast('End time must be after start time', 'danger');
      return;
    }

    var bookings = this.getBookings();

    // Check overlaps
    var overlap = bookings.find(function(b) {
      return b.instrumentId === instrumentId && 
             b.date === date && 
             (startTime < b.endTime && endTime > b.startTime);
    });

    if (overlap) {
      App.showToast('Overlap detected with another booking for this instrument', 'danger');
      return;
    }

    // Determine color
    if (!this.memberColors[memberName]) {
      var count = Object.keys(this.memberColors).length;
      this.memberColors[memberName] = this.palette[count % this.palette.length];
    }

    var newBooking = {
      id: App.generateId(),
      memberName: memberName,
      instrumentId: instrumentId,
      instrumentName: instrumentName,
      purpose: purpose,
      date: date,
      startTime: startTime,
      endTime: endTime,
      color: this.memberColors[memberName],
      createdAt: new Date().toISOString()
    };

    bookings.push(newBooking);
    this.saveBookings(bookings);
    
    App.showToast('Booking saved successfully', 'success');
    App.closeModal();
    this.render();
  },

  viewBooking: function (id) {
    var bookings = this.getBookings();
    var b = bookings.find(function(bx) { return bx.id === id; });
    if (!b) return;

    var html = `
      <div style="margin-bottom: 20px;">
        <p><strong>Member:</strong> ${App.escapeHtml(b.memberName)}</p>
        <p><strong>Instrument:</strong> ${App.escapeHtml(b.instrumentName)}</p>
        <p><strong>Date:</strong> ${App.formatDate(b.date)}</p>
        <p><strong>Time:</strong> ${this.formatTimeDisplay(b.startTime)} - ${this.formatTimeDisplay(b.endTime)}</p>
        <p><strong>Purpose:</strong></p>
        <div style="background: #f8fafc; padding: 10px; border-radius: 4px; margin-top: 5px;">
          ${App.escapeHtml(b.purpose).replace(/\\n/g, '<br>')}
        </div>
      </div>
      <div class="form-actions" style="text-align: right; display: flex; justify-content: space-between;">
        <button type="button" class="btn btn-danger" onclick="BookingManager.cancelBooking('${b.id}')">Cancel Booking</button>
        <button type="button" class="btn btn-primary" onclick="App.closeModal()">Close</button>
      </div>
    `;

    App.openModal('Booking Details', html);
  },

  cancelBooking: function (id) {
    App.confirm('Cancel Booking', 'Are you sure you want to cancel this booking?').then(function(confirmed) {
      if (confirmed) {
        var bookings = BookingManager.getBookings();
        bookings = bookings.filter(function(b) { return b.id !== id; });
        BookingManager.saveBookings(bookings);
        App.showToast('Booking cancelled', 'info');
        App.closeModal();
        BookingManager.render();
      }
    });
  }
};

// Auto-init if DOM is ready or wait for it
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { BookingManager.init(); });
} else {
  BookingManager.init();
}
