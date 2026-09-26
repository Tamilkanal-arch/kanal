/**
 * NEST Kuwait — Leave & Attendance Management System
 * UI Controllers, Event Handlers & View Rendering
 */

document.addEventListener('DOMContentLoaded', () => {
  const manager = window.leaveManager;

  // DOM Elements
  const navTabs = document.querySelectorAll('.nav-tab');
  const viewPanels = document.querySelectorAll('.view-panel');
  const asOfDateInput = document.getElementById('asOfDateInput');
  const adminToggleBtn = document.getElementById('adminToggleBtn');
  const adminModal = document.getElementById('adminModal');
  const adminPasswordInput = document.getElementById('adminPasswordInput');
  const adminSubmitBtn = document.getElementById('adminSubmitBtn');
  const addEmployeeModal = document.getElementById('addEmployeeModal');
  const addEmployeeForm = document.getElementById('addEmployeeForm');

  // Search Inputs
  const searchCalInput = document.getElementById('searchCalInput');
  const searchRegInput = document.getElementById('searchRegInput');
  const searchMs1Input = document.getElementById('searchMs1Input');
  const searchMs2Input = document.getElementById('searchMs2Input');

  // Initialize As-Of Date
  if (asOfDateInput) {
    asOfDateInput.value = manager.getAsOfDate();
    asOfDateInput.addEventListener('change', (e) => {
      manager.setAsOfDate(e.target.value);
      renderMasterSheet2();
      showToast('Recalculated accruals for date: ' + e.target.value);
    });
  }

  // Tab Navigation
  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      switchTab(targetId);
    });
  });

  function switchTab(tabId) {
    navTabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
    });
    viewPanels.forEach(p => {
      p.classList.toggle('active', p.id === tabId);
    });

    // Refresh active view
    if (tabId === 'tab-calendar') renderCalendar();
    else if (tabId === 'tab-register') renderRegister();
    else if (tabId === 'tab-master1') renderMasterSheet1();
    else if (tabId === 'tab-master2') renderMasterSheet2();
  }

  // Toast Utility
  function showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ==========================================
  // 1. CALENDAR VIEW RENDERING
  // ==========================================
  function renderCalendar() {
    const calendarData = manager.getCalendar();
    const theadRow1 = document.getElementById('calHeaderRow1');
    const theadRow2 = document.getElementById('calHeaderRow2');
    const theadRow3 = document.getElementById('calHeaderRow3');
    const tbody = document.getElementById('calTableBody');
    const filterText = (searchCalInput?.value || '').toLowerCase();

    if (!theadRow1 || !theadRow2 || !theadRow3 || !tbody) return;

    // Render Month and Day headers if empty
    if (theadRow1.children.length <= 3) {
      theadRow1.innerHTML = '<th class="sticky-col-1" rowspan="3">ID</th><th class="sticky-col-2" rowspan="3">Employee Name</th><th class="sticky-col-3" rowspan="3">Designation</th>';
      theadRow2.innerHTML = '';
      theadRow3.innerHTML = '';

      let currentMonth = -1;
      let monthDaysCount = 0;
      let currentMonthTh = null;

      manager.yearDays.forEach(day => {
        // Month Header Row 1
        if (day.monthIndex !== currentMonth) {
          currentMonth = day.monthIndex;
          currentMonthTh = document.createElement('th');
          currentMonthTh.className = 'month-group-header';
          currentMonthTh.textContent = `${day.monthName} 2026`;
          theadRow1.appendChild(currentMonthTh);
          monthDaysCount = 1;
        } else {
          monthDaysCount++;
          currentMonthTh.colSpan = monthDaysCount;
        }

        // Day Number Row 2
        const dayTh = document.createElement('th');
        dayTh.className = `cal-cell ${day.isFriday ? 'col-friday' : ''}`;
        dayTh.textContent = day.dayNumber;
        theadRow2.appendChild(dayTh);

        // Day of Week Row 3
        const dowTh = document.createElement('th');
        dowTh.className = `cal-cell ${day.isFriday ? 'col-friday' : ''}`;
        dowTh.textContent = day.weekday;
        if (day.isFriday) {
          dowTh.title = 'Friday — Company Holiday (leave excluded from totals)';
        }
        theadRow3.appendChild(dowTh);
      });
    }

    // Render Employee Rows
    tbody.innerHTML = '';
    const filtered = calendarData.filter(emp => 
      (emp.name || '').toLowerCase().includes(filterText) ||
      (emp.designation || '').toLowerCase().includes(filterText) ||
      (emp.id || '').toLowerCase().includes(filterText)
    );

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="${3 + manager.yearDays.length}" style="text-align:center; padding: 2rem; color: var(--text-muted);">No employees found matching filter.</td></tr>`;
      return;
    }

    filtered.forEach((emp, empIdx) => {
      const tr = document.createElement('tr');
      const marks = emp.marks || {};

      tr.innerHTML = `
        <td class="sticky-col-1" style="font-weight: 500; color: var(--text-muted);">${escapeHtml(emp.id || '')}</td>
        <td class="sticky-col-2" style="font-weight: 600;">${escapeHtml(emp.name || '')}</td>
        <td class="sticky-col-3" style="color: var(--text-muted); font-size: 0.8rem;">${escapeHtml(emp.designation || '')}</td>
      `;

      manager.yearDays.forEach(day => {
        const td = document.createElement('td');
        const code = marks[day.dateStr] || '';
        td.className = `cal-cell ${day.isFriday ? 'col-friday' : ''} ${code ? 'leave-' + code : ''}`;
        if (code && day.isFriday) td.classList.add('has-leave');
        td.textContent = code;
        td.dataset.date = day.dateStr;
        td.dataset.empIndex = empIdx;
        td.tabIndex = 0; // Accessible focus

        // Tooltip detail
        const leaveLabel = LEAVE_TYPES[code] ? LEAVE_TYPES[code].label : 'Working Day';
        const holidayNote = day.isFriday ? ' (Friday Holiday - Excluded from official totals)' : '';
        td.title = `${emp.name} | ${day.dateStr} (${day.weekday}): ${leaveLabel}${holidayNote}`;

        // Click handler: cycles blank -> P -> M -> U -> O -> blank
        td.addEventListener('click', (e) => {
          cycleLeaveCode(emp, day.dateStr, td);
        });

        // Keypress handler
        td.addEventListener('keydown', (e) => {
          const key = e.key.toUpperCase();
          if (['P', 'M', 'U', 'O'].includes(key)) {
            e.preventDefault();
            setLeaveCode(emp, day.dateStr, key, td);
          } else if (['BACKSPACE', 'DELETE', ' '].includes(key)) {
            e.preventDefault();
            setLeaveCode(emp, day.dateStr, '', td);
          }
        });

        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
  }

  function cycleLeaveCode(emp, dateStr, cellEl) {
    const sequence = ['', 'P', 'M', 'U', 'O'];
    const current = emp.marks[dateStr] || '';
    const nextIdx = (sequence.indexOf(current) + 1) % sequence.length;
    const nextCode = sequence[nextIdx];
    setLeaveCode(emp, dateStr, nextCode, cellEl);
  }

  function setLeaveCode(emp, dateStr, code, cellEl) {
    if (code) {
      emp.marks[dateStr] = code;
    } else {
      delete emp.marks[dateStr];
    }
    const calendarData = manager.getCalendar();
    const idx = calendarData.findIndex(e => e.name === emp.name);
    if (idx >= 0) {
      calendarData[idx].marks = emp.marks;
      manager.saveCalendar(calendarData);
    }

    // Update cell style live
    cellEl.textContent = code;
    cellEl.className = `cal-cell ${cellEl.dataset.isFriday === 'true' || cellEl.classList.contains('col-friday') ? 'col-friday' : ''} ${code ? 'leave-' + code : ''}`;
    if (code && cellEl.classList.contains('col-friday')) cellEl.classList.add('has-leave');
  }

  // Month Jumper for Calendar
  window.jumpToMonth = function(monthIdx) {
    const thead = document.getElementById('calHeaderRow1');
    if (!thead) return;
    const monthHeaders = thead.querySelectorAll('.month-group-header');
    if (monthHeaders[monthIdx]) {
      monthHeaders[monthIdx].scrollIntoView({ behavior: 'smooth', inline: 'start' });
    }
  };

  // ==========================================
  // 2. LEAVE REGISTER VIEW RENDERING
  // ==========================================
  function renderRegister() {
    const registerData = manager.getRegister();
    const tbody = document.getElementById('regTableBody');
    const filterText = (searchRegInput?.value || '').toLowerCase();
    if (!tbody) return;

    tbody.innerHTML = '';
    const filtered = registerData.filter(emp =>
      (emp.name || '').toLowerCase().includes(filterText) ||
      (emp.designation || '').toLowerCase().includes(filterText) ||
      (emp.id || '').toLowerCase().includes(filterText)
    );

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="54" style="text-align:center; padding: 2rem; color: var(--text-muted);">No records found.</td></tr>`;
      return;
    }

    filtered.forEach((emp, empIdx) => {
      const tr = document.createElement('tr');

      // Sticky columns
      tr.innerHTML = `
        <td class="sticky-col-1" style="font-weight: 500; color: var(--text-muted);">${escapeHtml(emp.id || '')}</td>
        <td class="sticky-col-2" style="font-weight: 600;">${escapeHtml(emp.name || '')}</td>
        <td class="sticky-col-3" style="color: var(--text-muted); font-size: 0.8rem;">${escapeHtml(emp.designation || '')}</td>
        <td>
          <input type="text" class="form-control" style="width: 105px; padding: 0.2rem 0.4rem; font-size: 0.8rem;" 
            value="${escapeHtml(emp.joiningDate || '')}" data-field="joiningDate" data-emp-name="${escapeHtml(emp.name)}">
        </td>
      `;

      // 12 Months * 4 fields (Paid, Med, Oth, Unp)
      const months = emp.months || [];
      for (let m = 0; m < 12; m++) {
        const entry = months[m] || { paid: '', med: '', oth: '', unp: '' };
        
        ['paid', 'med', 'oth', 'unp'].forEach(type => {
          const td = document.createElement('td');
          const input = document.createElement('input');
          input.type = 'number';
          input.step = '0.5';
          input.min = '0';
          input.className = 'num-input';
          input.value = entry[type] !== undefined && entry[type] !== '' && entry[type] !== 0 ? entry[type] : (entry[type] === 0 ? '0' : '');
          input.placeholder = '-';
          
          input.addEventListener('input', () => {
            updateRegisterValue(emp.name, m, type, input.value);
          });

          td.appendChild(input);
          tr.appendChild(td);
        });
      }

      // Annual Paid Entitlement
      const tdEnt = document.createElement('td');
      const inputEnt = document.createElement('input');
      inputEnt.type = 'number';
      inputEnt.className = 'num-input';
      inputEnt.style.fontWeight = '700';
      inputEnt.style.width = '64px';
      inputEnt.value = emp.annualEntitlement || 0;
      inputEnt.addEventListener('input', () => {
        updateRegisterEntitlement(emp.name, inputEnt.value);
      });
      tdEnt.appendChild(inputEnt);
      tr.appendChild(tdEnt);

      tbody.appendChild(tr);
    });

    // Wire up joining date inputs
    tbody.querySelectorAll('input[data-field="joiningDate"]').forEach(input => {
      input.addEventListener('change', (e) => {
        updateRegisterJoiningDate(e.target.dataset.empName, e.target.value);
      });
    });
  }

  function updateRegisterValue(empName, monthIdx, type, val) {
    const register = manager.getRegister();
    const emp = register.find(e => e.name === empName);
    if (!emp) return;
    if (!emp.months) emp.months = Array.from({ length: 12 }, () => ({ paid: 0, med: 0, oth: 0, unp: 0 }));
    if (!emp.months[monthIdx]) emp.months[monthIdx] = { paid: 0, med: 0, oth: 0, unp: 0 };
    
    emp.months[monthIdx][type] = val === '' ? 0 : parseFloat(val) || 0;
    manager.saveRegister(register);
  }

  function updateRegisterEntitlement(empName, val) {
    const register = manager.getRegister();
    const emp = register.find(e => e.name === empName);
    if (!emp) return;
    emp.annualEntitlement = parseFloat(val) || 0;
    manager.saveRegister(register);
  }

  function updateRegisterJoiningDate(empName, val) {
    const register = manager.getRegister();
    const emp = register.find(e => e.name === empName);
    if (!emp) return;
    emp.joiningDate = val.trim();
    manager.saveRegister(register);
    showToast(`Updated joining date for ${empName}`);
  }

  // ==========================================
  // 3. MASTER SHEET 1 (CALENDAR SUMMARY)
  // ==========================================
  function renderMasterSheet1() {
    const rows = manager.calculateMasterSheet1();
    const tbody = document.getElementById('ms1TableBody');
    const filterText = (searchMs1Input?.value || '').toLowerCase();
    if (!tbody) return;

    let kpiPaid = 0, kpiMed = 0, kpiUnp = 0, kpiOth = 0, kpiFri = 0;

    tbody.innerHTML = '';
    const filtered = rows.filter(r => 
      r.name.toLowerCase().includes(filterText) ||
      r.designation.toLowerCase().includes(filterText) ||
      r.id.toLowerCase().includes(filterText)
    );

    filtered.forEach(r => {
      kpiPaid += r.totalP;
      kpiMed += r.totalM;
      kpiUnp += r.totalU;
      kpiOth += r.totalO;
      kpiFri += (r.fridayP + r.fridayM + r.fridayU + r.fridayO);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 500; color: var(--text-muted);">${escapeHtml(r.id)}</td>
        <td style="font-weight: 600;">${escapeHtml(r.name)}</td>
        <td style="color: var(--text-muted);">${escapeHtml(r.designation)}</td>
        <td style="text-align: right; font-weight: 700; color: var(--leave-p-text); background-color: var(--leave-p-bg);">${r.totalP}</td>
        <td style="text-align: right; font-weight: 700; color: var(--leave-m-text); background-color: var(--leave-m-bg);">${r.totalM}</td>
        <td style="text-align: right; font-weight: 700; color: var(--leave-u-text); background-color: var(--leave-u-bg);">${r.totalU}</td>
        <td style="text-align: right; font-weight: 700; color: var(--leave-o-text); background-color: var(--leave-o-bg);">${r.totalO}</td>
        <td style="text-align: right; font-weight: 700;">${r.totalOfficial}</td>
        <td style="text-align: right; color: var(--text-muted); font-size: 0.8rem;" title="Total Friday entries: P:${r.fridayP}, M:${r.fridayM}, U:${r.fridayU}, O:${r.fridayO}">
          ${(r.fridayP + r.fridayM + r.fridayU + r.fridayO) > 0 ? `<span class="badge badge-gray">${r.fridayP + r.fridayM + r.fridayU + r.fridayO} days</span>` : '-'}
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Update KPIs
    document.getElementById('kpiMs1Employees').textContent = rows.length;
    document.getElementById('kpiMs1Paid').textContent = kpiPaid;
    document.getElementById('kpiMs1Med').textContent = kpiMed;
    document.getElementById('kpiMs1FriExcluded').textContent = kpiFri;
  }

  // ==========================================
  // 4. MASTER SHEET 2 (BALANCES & ACCRUALS)
  // ==========================================
  function renderMasterSheet2() {
    const rows = manager.calculateMasterSheet2();
    const tbody = document.getElementById('ms2TableBody');
    const filterText = (searchMs2Input?.value || '').toLowerCase();
    if (!tbody) return;

    let totalLeaveCompany = 0;
    let totalEntitlement = 0;
    let totalRemaining = 0;

    tbody.innerHTML = '';
    const filtered = rows.filter(r =>
      r.name.toLowerCase().includes(filterText) ||
      r.designation.toLowerCase().includes(filterText) ||
      r.id.toLowerCase().includes(filterText)
    );

    filtered.forEach(r => {
      totalLeaveCompany += r.totalAllLeave;
      totalEntitlement += r.annualEntitlement;
      totalRemaining += r.paidLeaveRemaining;

      const balanceBadge = r.balanceVsAccrued < 0 
        ? `<span class="badge badge-red">${r.balanceVsAccrued}</span>`
        : (r.balanceVsAccrued < 5 
            ? `<span class="badge badge-amber">${r.balanceVsAccrued}</span>`
            : `<span class="badge badge-green">${r.balanceVsAccrued}</span>`);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600;">${escapeHtml(r.name)}</td>
        <td style="color: var(--text-muted);">${escapeHtml(r.id)}</td>
        <td style="color: var(--text-muted);">${escapeHtml(r.designation)}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(r.joiningDate)}</td>
        <td style="text-align: right; font-weight: 600;">${r.totalPaidTaken}</td>
        <td style="text-align: right;">${r.totalUnpaidTaken}</td>
        <td style="text-align: right;">${r.totalMedicalTaken}</td>
        <td style="text-align: right;">${r.totalOtherTaken}</td>
        <td style="text-align: right; font-weight: 700; background: #f8fafc;">${r.totalAllLeave}</td>
        <td style="text-align: right; font-weight: 600;">${r.annualEntitlement}</td>
        <td style="text-align: right; font-weight: 700; color: #166534;">${r.paidLeaveRemaining}</td>
        <td style="text-align: right; font-weight: 600; color: #1e3a8a;" title="${r.monthsElapsed} months elapsed">${r.accruedLeaveTillDate}</td>
        <td style="text-align: right;">${balanceBadge}</td>
      `;
      tbody.appendChild(tr);
    });

    // Update KPIs
    document.getElementById('kpiMs2TotalLeave').textContent = totalLeaveCompany.toFixed(1);
    document.getElementById('kpiMs2Entitlement').textContent = totalEntitlement.toFixed(1);
    document.getElementById('kpiMs2Remaining').textContent = totalRemaining.toFixed(1);
  }

  // ==========================================
  // 5. SEARCH / FILTER LISTENERS
  // ==========================================
  searchCalInput?.addEventListener('input', renderCalendar);
  searchRegInput?.addEventListener('input', renderRegister);
  searchMs1Input?.addEventListener('input', renderMasterSheet1);
  searchMs2Input?.addEventListener('input', renderMasterSheet2);

  // ==========================================
  // 6. ADMIN PASSWORD / ROLE CONTROL (NEST@2026)
  // ==========================================
  adminToggleBtn?.addEventListener('click', () => {
    if (manager.isAdminUnlocked()) {
      manager.setAdminUnlocked(false);
      updateAdminButton();
      showToast('Locked: Switched to Read-Only User Mode.');
    } else {
      adminPasswordInput.value = '';
      adminModal.classList.add('open');
      adminPasswordInput.focus();
    }
  });

  adminSubmitBtn?.addEventListener('click', () => {
    const pwd = adminPasswordInput.value.trim();
    if (pwd === 'NEST@2026') {
      manager.setAdminUnlocked(true);
      adminModal.classList.remove('open');
      updateAdminButton();
      showToast('Admin Mode Unlocked successfully');
    } else {
      alert('Incorrect password. Please enter the authorized administrator password.');
    }
  });

  function updateAdminButton() {
    if (manager.isAdminUnlocked()) {
      adminToggleBtn.className = 'btn btn-admin-unlocked';
      adminToggleBtn.innerHTML = '<span>🔓</span> <span>Admin Unlocked</span>';
    } else {
      adminToggleBtn.className = 'btn btn-admin-locked';
      adminToggleBtn.innerHTML = '<span>🔒</span> <span>Read-Only Views</span>';
    }
  }
  updateAdminButton();

  // Close modals
  document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
    });
  });

  // ==========================================
  // 7. ADD NEW EMPLOYEE
  // ==========================================
  window.openAddEmployeeModal = function() {
    addEmployeeForm.reset();
    addEmployeeModal.classList.add('open');
  };

  addEmployeeForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('newEmpId').value.trim();
    const name = document.getElementById('newEmpName').value.trim();
    const designation = document.getElementById('newEmpDesig').value.trim();
    const joiningDate = document.getElementById('newEmpJoiningDate').value;
    const entitlement = parseFloat(document.getElementById('newEmpEntitlement').value) || 30;

    if (!name) {
      alert('Employee Name is required.');
      return;
    }

    // Add to Calendar
    const calendar = manager.getCalendar();
    if (calendar.some(e => e.name.toLowerCase() === name.toLowerCase())) {
      alert('An employee with this name already exists.');
      return;
    }

    calendar.push({
      id: id || '',
      name: name,
      designation: designation || '',
      marks: {}
    });
    manager.saveCalendar(calendar);

    // Add to Register
    const register = manager.getRegister();
    register.push({
      id: id || '',
      name: name,
      designation: designation || '',
      joiningDate: joiningDate || '2026-01-01',
      annualEntitlement: entitlement,
      months: Array.from({ length: 12 }, () => ({ paid: 0, med: 0, oth: 0, unp: 0 }))
    });
    manager.saveRegister(register);

    addEmployeeModal.classList.remove('open');
    showToast(`Added new employee: ${name}`);

    // Refresh current view
    renderCalendar();
    renderRegister();
    renderMasterSheet1();
    renderMasterSheet2();
  });

  // ==========================================
  // 8. BACKUP, EXPORT & RESET DATA
  // ==========================================
  window.exportAllData = function() {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      calendar: manager.getCalendar(),
      register: manager.getRegister(),
      asOfDate: manager.getAsOfDate()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEST_Leave_Record_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Database exported successfully.');
  };

  window.triggerImportData = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed.calendar && parsed.register) {
            manager.saveCalendar(parsed.calendar);
            manager.saveRegister(parsed.register);
            if (parsed.asOfDate) manager.setAsOfDate(parsed.asOfDate);
            showToast('Database restored successfully.');
            renderCalendar();
            renderRegister();
            renderMasterSheet1();
            renderMasterSheet2();
          } else {
            alert('Invalid backup file format.');
          }
        } catch (err) {
          alert('Could not parse JSON backup file: ' + err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  window.resetToExcelBaseline = function() {
    if (confirm('Are you sure you want to reset all data back to the original Excel baseline? Any unsaved manual additions will be reset.')) {
      manager.resetToExcelSeed();
      showToast('Reset data to Excel baseline.');
      renderCalendar();
      renderRegister();
      renderMasterSheet1();
      renderMasterSheet2();
    }
  };

  // ==========================================
  // 8. EXCEL (.XLSX) EXPORT ENGINE (SheetJS)
  // ==========================================
  function getCalendarAoa() {
    const calendarData = manager.getCalendar();
    const aoa = [];

    // Row 1
    const r1 = ['LEAVE CALENDAR - 2026', '', '', 'Paid', '', 'Med', '', 'Unpd', '', 'Othr'];
    aoa.push(r1);

    // Row 2: Month groupings
    const r2 = ['', '', ''];
    let curMonth = -1;
    manager.yearDays.forEach(day => {
      if (day.monthIndex !== curMonth) {
        curMonth = day.monthIndex;
        r2.push(`${day.monthName} 2026`);
      } else {
        r2.push('');
      }
    });
    aoa.push(r2);

    // Row 3: Day numbers
    const r3 = ['Employee ID', 'Employee Name', 'Designation'];
    manager.yearDays.forEach(day => r3.push(day.dayNumber));
    aoa.push(r3);

    // Row 4: Weekday names
    const r4 = ['', '', ''];
    manager.yearDays.forEach(day => r4.push(day.weekday));
    aoa.push(r4);

    // Rows 5+: Employees
    calendarData.forEach(emp => {
      if (!emp.name || !emp.name.trim()) return;
      const row = [emp.id || '', emp.name || '', emp.designation || ''];
      const marks = emp.marks || {};
      manager.yearDays.forEach(day => {
        row.push(marks[day.dateStr] || '');
      });
      aoa.push(row);
    });

    return aoa;
  }

  function getLeaveRegisterAoa() {
    const registerData = manager.getRegister();
    const ms2Rows = manager.calculateMasterSheet2();
    const ms2Map = new Map(ms2Rows.map(r => [r.name, r]));
    const aoa = [];

    // Header 1: Month groups
    const h1 = ['Employee ID', 'Employee Name', 'Designation', 'Joining Date'];
    MONTH_NAMES.forEach(m => {
      h1.push(m, '', '', '');
    });
    h1.push(
      'Total Paid Leave Taken',
      'Total Unpaid Leave Taken',
      'Total Medical Leave Taken',
      'Other Leave Total',
      'TOTAL (paid+unpaid+medical+other)',
      'Annual Paid Leave Entitlement',
      'Paid Leave Remaining',
      'Accrued Leave Till Date',
      'Balance vs Accrued'
    );
    aoa.push(h1);

    // Header 2: Sub-headers
    const h2 = ['', '', '', ''];
    for (let i = 0; i < 12; i++) {
      h2.push('Paid', 'Medical', 'Other', 'Unpaid');
    }
    h2.push('', '', '', '', '', '', '', '', '');
    aoa.push(h2);

    // Rows: Employees
    registerData.forEach(emp => {
      if (!emp.name || !emp.name.trim()) return;
      const calc = ms2Map.get(emp.name) || {};
      const row = [
        emp.id || '',
        emp.name || '',
        emp.designation || '',
        emp.joiningDate || ''
      ];

      const months = emp.months || [];
      for (let m = 0; m < 12; m++) {
        const entry = months[m] || {};
        row.push(
          entry.paid !== undefined && entry.paid !== 0 ? entry.paid : (entry.paid === 0 ? 0 : ''),
          entry.med !== undefined && entry.med !== 0 ? entry.med : (entry.med === 0 ? 0 : ''),
          entry.oth !== undefined && entry.oth !== 0 ? entry.oth : (entry.oth === 0 ? 0 : ''),
          entry.unp !== undefined && entry.unp !== 0 ? entry.unp : (entry.unp === 0 ? 0 : '')
        );
      }

      row.push(
        calc.totalPaidTaken || 0,
        calc.totalUnpaidTaken || 0,
        calc.totalMedicalTaken || 0,
        calc.totalOtherTaken || 0,
        calc.totalAllLeave || 0,
        emp.annualEntitlement || 0,
        calc.paidLeaveRemaining !== undefined ? calc.paidLeaveRemaining : 0,
        calc.accruedLeaveTillDate !== undefined ? calc.accruedLeaveTillDate : 0,
        calc.balanceVsAccrued !== undefined ? calc.balanceVsAccrued : 0
      );

      aoa.push(row);
    });

    return aoa;
  }

  function getMasterSheet1Aoa() {
    const rows = manager.calculateMasterSheet1();
    const aoa = [];
    aoa.push(['MASTER SHEET', '', '', '', '', '', '', '', '']);
    aoa.push([
      'Employee ID',
      'Employee Name',
      'Designation',
      'Total P (Paid)',
      'Total M (Medical)',
      'Total U (Unpaid)',
      'Total O (Other)',
      'Total Official (Excl Fri)',
      'Friday Marks (Excluded)'
    ]);

    rows.forEach(r => {
      aoa.push([
        r.id,
        r.name,
        r.designation,
        r.totalP,
        r.totalM,
        r.totalU,
        r.totalO,
        r.totalOfficial,
        (r.fridayP + r.fridayM + r.fridayU + r.fridayO)
      ]);
    });

    return aoa;
  }

  function getMasterSheet2Aoa() {
    const rows = manager.calculateMasterSheet2();
    const aoa = [];
    aoa.push([
      'Employee Name',
      'Employee ID',
      'Designation',
      'Joining Date',
      'Total Paid Leave Taken',
      'Total Unpaid Leave Taken',
      'Total Medical Leave Taken',
      'Other Leave Total',
      'TOTAL (paid+unpaid+medical+other)',
      'Annual Paid Leave Entitlement',
      'Paid Leave Remaining',
      'Accrued Leave Till Date',
      'Balance vs Accrued'
    ]);

    rows.forEach(r => {
      aoa.push([
        r.name,
        r.id,
        r.designation,
        r.joiningDate,
        r.totalPaidTaken,
        r.totalUnpaidTaken,
        r.totalMedicalTaken,
        r.totalOtherTaken,
        r.totalAllLeave,
        r.annualEntitlement,
        r.paidLeaveRemaining,
        r.accruedLeaveTillDate,
        r.balanceVsAccrued
      ]);
    });

    return aoa;
  }

  function getInstructionsAoa() {
    return [
      ['LEAVE RECORD - HOW TO USE THIS WORKBOOK'],
      [''],
      ['ENTERING DATA IN THE "CALENDAR" SHEET'],
      ['The Calendar sheet has one row per employee and one column per day of the year.'],
      ['1. Fill in the Employee Name (Employee ID and Designation are optional).'],
      ['2. Mark each day with a single-letter code: P (Paid), M (Medical), U (Unpaid), O (Other). Leave cell blank for a normal working day.'],
      ['3. Friday is a company holiday in Kuwait: Any leave marked on a Friday is automatically excluded from official totals in the Master Sheet.'],
      [''],
      ['ENTERING DATA IN THE "LEAVE REGISTER" SHEET'],
      ['The Leave Register tracks monthly leave totals and annual entitlement for each employee.'],
      ['1. Columns A-D: Employee ID, Employee Name, Designation, and Joining Date.'],
      ['2. Monthly breakdown: Enter the NUMBER OF DAYS taken of each leave type (Paid, Medical, Other, Unpaid) for each month.'],
      ['3. Annual Paid Leave Entitlement: Enter total paid leave days employee is entitled to per year.'],
      ['4. Accrued Leave & Balances calculate automatically using: max(0, (Entitlement / 12) * months_elapsed). Leaves accumulate indefinitely across years.'],
      [''],
      ['ABOUT THE MASTER SHEETS (PROTECTED)'],
      ['MASTER SHEET (Calendar) and MASTER SHEET (2) (Leave Register) are read-only views to protect data integrity.'],
      ['Only authorized administrators can edit master configurations using the system administrator password.']
    ];
  }

  // Export Full Multi-Tab Workbook (.xlsx)
  window.exportFullExcelWorkbook = function() {
    if (typeof XLSX === 'undefined') {
      alert('Excel export engine is loading, please try again in a moment.');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // 1. Calendar Sheet
      const wsCal = XLSX.utils.aoa_to_sheet(getCalendarAoa());
      XLSX.utils.book_append_sheet(wb, wsCal, 'Calendar');

      // 2. Leave Register Sheet
      const wsReg = XLSX.utils.aoa_to_sheet(getLeaveRegisterAoa());
      XLSX.utils.book_append_sheet(wb, wsReg, 'Leave Register');

      // 3. Master Sheet 1
      const wsMs1 = XLSX.utils.aoa_to_sheet(getMasterSheet1Aoa());
      XLSX.utils.book_append_sheet(wb, wsMs1, 'MASTER SHEET');

      // 4. Master Sheet 2
      const wsMs2 = XLSX.utils.aoa_to_sheet(getMasterSheet2Aoa());
      XLSX.utils.book_append_sheet(wb, wsMs2, 'MASTER SHEET (2)');

      // 5. Instructions
      const wsIns = XLSX.utils.aoa_to_sheet(getInstructionsAoa());
      XLSX.utils.book_append_sheet(wb, wsIns, 'Instructions');

      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `LEAVE_RECORD_FULL_${dateStr}.xlsx`;
      XLSX.writeFile(wb, fileName);
      showToast(`Exported full Excel workbook: ${fileName}`);
    } catch (err) {
      alert('Error creating Excel file: ' + err.message);
    }
  };

  // Export Individual Sheets to Excel
  window.exportCalendarExcel = function() {
    if (typeof XLSX === 'undefined') return alert('Excel engine not loaded.');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(getCalendarAoa());
    XLSX.utils.book_append_sheet(wb, ws, 'Calendar');
    XLSX.writeFile(wb, `LEAVE_CALENDAR_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Exported Calendar to Excel.');
  };

  window.exportRegisterExcel = function() {
    if (typeof XLSX === 'undefined') return alert('Excel engine not loaded.');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(getLeaveRegisterAoa());
    XLSX.utils.book_append_sheet(wb, ws, 'Leave Register');
    XLSX.writeFile(wb, `LEAVE_REGISTER_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Exported Leave Register to Excel.');
  };

  window.exportMasterSheet1Excel = function() {
    if (typeof XLSX === 'undefined') return alert('Excel engine not loaded.');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(getMasterSheet1Aoa());
    XLSX.utils.book_append_sheet(wb, ws, 'MASTER SHEET');
    XLSX.writeFile(wb, `MASTER_SHEET_Calendar_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Exported Master Sheet 1 to Excel.');
  };

  window.exportMasterSheet2Excel = function() {
    if (typeof XLSX === 'undefined') return alert('Excel engine not loaded.');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(getMasterSheet2Aoa());
    XLSX.utils.book_append_sheet(wb, ws, 'MASTER SHEET (2)');
    XLSX.writeFile(wb, `MASTER_SHEET_2_Balances_${new Date().toISOString().slice(0,10)}.xlsx`);
    showToast('Exported Master Sheet 2 to Excel.');
  };

  window.exportMasterSheet1Csv = function() {
    const rows = manager.calculateMasterSheet1();
    let csv = 'Employee ID,Employee Name,Designation,Total P (Paid),Total M (Medical),Total U (Unpaid),Total O (Other),Total Official,Friday Excluded\r\n';
    rows.forEach(r => {
      csv += `"${r.id}","${r.name}","${r.designation}",${r.totalP},${r.totalM},${r.totalU},${r.totalO},${r.totalOfficial},${r.fridayP + r.fridayM + r.fridayU + r.fridayO}\r\n`;
    });
    downloadCsv(csv, 'MASTER_SHEET_Calendar_Summary.csv');
  };

  window.exportMasterSheet2Csv = function() {
    const rows = manager.calculateMasterSheet2();
    let csv = 'Employee Name,Employee ID,Designation,Joining Date,Total Paid Leave Taken,Total Unpaid Leave Taken,Total Medical Leave Taken,Other Leave Total,TOTAL (all leave),Annual Paid Leave Entitlement,Paid Leave Remaining,Accrued Leave Till Date,Balance vs Accrued\r\n';
    rows.forEach(r => {
      csv += `"${r.name}","${r.id}","${r.designation}","${r.joiningDate}",${r.totalPaidTaken},${r.totalUnpaidTaken},${r.totalMedicalTaken},${r.totalOtherTaken},${r.totalAllLeave},${r.annualEntitlement},${r.paidLeaveRemaining},${r.accruedLeaveTillDate},${r.balanceVsAccrued}\r\n`;
    });
    downloadCsv(csv, 'MASTER_SHEET_2_Balances_Accruals.csv');
  };

  function downloadCsv(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported ${filename}`);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Initial Render
  renderCalendar();
  renderRegister();
  renderMasterSheet1();
  renderMasterSheet2();
});
