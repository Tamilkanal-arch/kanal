/**
 * NEST Kuwait — Leave & Attendance Management System
 * Core Data Models & Business Logic Engine
 */

const LEAVE_TYPES = {
  P: { code: 'P', label: 'Paid Leave', class: 'leave-P', color: '#166534' },
  M: { code: 'M', label: 'Medical Leave', class: 'leave-M', color: '#92400e' },
  U: { code: 'U', label: 'Unpaid Leave', class: 'leave-U', color: '#991b1b' },
  O: { code: 'O', label: 'Other Leave', class: 'leave-O', color: '#1e40af' }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Storage Keys
const STORAGE_KEYS = {
  CALENDAR: 'nest_leave_calendar_v2',
  REGISTER: 'nest_leave_register_v2',
  AS_OF_DATE: 'nest_leave_as_of_date_v2',
  ADMIN_MODE: 'nest_leave_admin_mode_v2'
};

/**
 * Generate dates for a full year
 */
function generateYearDays(year = 2026) {
  const days = [];
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  
  let current = new Date(start);
  while (current <= end) {
    const y = current.getUTCFullYear();
    const m = current.getUTCMonth(); // 0-11
    const d = current.getUTCDate();
    const dayOfWeekIdx = current.getUTCDay(); // 0=Sun, 5=Fri
    const weekday = WEEKDAY_NAMES[dayOfWeekIdx];
    const isFriday = dayOfWeekIdx === 5; // Friday is company holiday in Kuwait
    
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    days.push({
      dateStr,
      year: y,
      monthIndex: m,
      monthName: MONTH_NAMES[m],
      dayNumber: d,
      weekday,
      isFriday
    });
    
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return days;
}

/**
 * Seed data extracted directly from LEAVE_RECORD.xlsx
 */
function getInitialSeedData() {
  // Calendar seed
  const calendarData = [
    {
      id: 'NEST-41',
      name: 'JOHN',
      designation: 'HSE',
      marks: {
        '2026-01-02': 'M', // Fri (Holiday)
        '2026-01-03': 'U',
        '2026-01-09': 'U', // Fri (Holiday)
        '2026-02-03': 'O'
      }
    },
    {
      id: 'NEST-42',
      name: 'SCOTT SIR',
      designation: 'OPERATIONS MANAGER',
      marks: {
        // Scott Sir has 19 Paid days in Jan (13th to 31st)
        '2026-01-13': 'P', '2026-01-14': 'P', '2026-01-15': 'P', '2026-01-16': 'P', // Fri
        '2026-01-17': 'P', '2026-01-18': 'P', '2026-01-19': 'P', '2026-01-20': 'P',
        '2026-01-21': 'P', '2026-01-22': 'P', '2026-01-23': 'P', // Fri
        '2026-01-24': 'P', '2026-01-25': 'P', '2026-01-26': 'P', '2026-01-27': 'P',
        '2026-01-28': 'P', '2026-01-29': 'P', '2026-01-30': 'P', // Fri
        '2026-01-31': 'P',
        // 14 Medical days in Feb (8th to 21st)
        '2026-02-08': 'M', '2026-02-09': 'M', '2026-02-10': 'M', '2026-02-11': 'M',
        '2026-02-12': 'M', '2026-02-13': 'M', // Fri
        '2026-02-14': 'M', '2026-02-15': 'M', '2026-02-16': 'M', '2026-02-17': 'M',
        '2026-02-18': 'M', '2026-02-19': 'M', '2026-02-20': 'M', // Fri
        '2026-02-21': 'M'
      }
    },
    {
      id: 'NEST-44',
      name: 'BIJU SIR',
      designation: 'ACCOUNTANT',
      marks: {
        '2026-01-04': 'M', '2026-01-05': 'M', '2026-01-06': 'M', '2026-01-07': 'M',
        '2026-01-08': 'M', '2026-01-09': 'M', // Fri
        '2026-01-10': 'M', '2026-01-11': 'M', '2026-01-12': 'M',
        '2026-01-14': 'U',
        '2026-01-16': 'M' // Fri
      }
    }
  ];

  // Leave Register seed
  const registerData = [
    {
      id: 'NEST-41',
      name: 'JOHN SMITH',
      designation: 'HSE',
      joiningDate: '2026-05-01',
      annualEntitlement: 30,
      months: [
        { paid: 0, med: 3, oth: 0, unp: 0 }, // Jan
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Feb
        { paid: 0, med: 1, oth: 0, unp: 0 }, // Mar
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Apr
        { paid: 0, med: 0, oth: 0, unp: 4 }, // May
        { paid: 5, med: 1, oth: 0, unp: 0 }, // Jun
        { paid: 0, med: 1, oth: 0, unp: 3 }, // Jul
        { paid: 2, med: 1, oth: 0, unp: 0 }, // Aug
        { paid: 0, med: 1, oth: 0, unp: 0 }, // Sep
        { paid: 0, med: 1, oth: 0, unp: 0 }, // Oct
        { paid: 0, med: 1, oth: 0, unp: 0 }, // Nov
        { paid: 0, med: 1, oth: 0, unp: 0 }  // Dec
      ]
    },
    {
      id: 'NEST-42',
      name: 'SCOTT SIR',
      designation: 'OPERATIONS MANAGER',
      joiningDate: '2026-01-01',
      annualEntitlement: 45,
      months: [
        { paid: 5, med: 0, oth: 0, unp: 0 }, // Jan
        { paid: 0, med: 3, oth: 0, unp: 0 }, // Feb
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Mar
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Apr
        { paid: 1, med: 0, oth: 0, unp: 3 }, // May
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Jun
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Jul
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Aug
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Sep
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Oct
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Nov
        { paid: 0, med: 0, oth: 0, unp: 0 }  // Dec
      ]
    },
    {
      id: 'NEST-44',
      name: 'BIJU SIR',
      designation: 'ACCOUNTANT',
      joiningDate: '2026-02-01',
      annualEntitlement: 30,
      months: [
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Jan
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Feb
        { paid: 0, med: 5, oth: 0, unp: 0 }, // Mar
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Apr
        { paid: 0, med: 0, oth: 0, unp: 0 }, // May
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Jun
        { paid: 5, med: 0, oth: 0, unp: 0 }, // Jul
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Aug
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Sep
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Oct
        { paid: 0, med: 0, oth: 0, unp: 0 }, // Nov
        { paid: 0, med: 0, oth: 0, unp: 0 }  // Dec
      ]
    }
  ];

  return { calendarData, registerData };
}

/**
 * Storage & State Manager
 */
class LeaveDataManager {
  constructor() {
    this.yearDays = generateYearDays(2026);
    this.daysByDate = new Map(this.yearDays.map(d => [d.dateStr, d]));
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.CALENDAR) || !localStorage.getItem(STORAGE_KEYS.REGISTER)) {
      this.resetToExcelSeed();
    }
  }

  resetToExcelSeed() {
    const seed = getInitialSeedData();
    this.saveCalendar(seed.calendarData);
    this.saveRegister(seed.registerData);
    if (!this.getAsOfDate()) {
      this.setAsOfDate('2026-09-17'); // Excel snapshot active date
    }
  }

  getCalendar() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CALENDAR);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading calendar from localStorage', e);
      return [];
    }
  }

  saveCalendar(data) {
    localStorage.setItem(STORAGE_KEYS.CALENDAR, JSON.stringify(data));
  }

  getRegister() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REGISTER);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading register from localStorage', e);
      return [];
    }
  }

  saveRegister(data) {
    localStorage.setItem(STORAGE_KEYS.REGISTER, JSON.stringify(data));
  }

  getAsOfDate() {
    return localStorage.getItem(STORAGE_KEYS.AS_OF_DATE) || '2026-09-17';
  }

  setAsOfDate(dateStr) {
    localStorage.setItem(STORAGE_KEYS.AS_OF_DATE, dateStr);
  }

  isAdminUnlocked() {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_MODE) === 'true';
  }

  setAdminUnlocked(unlocked) {
    sessionStorage.setItem(STORAGE_KEYS.ADMIN_MODE, unlocked ? 'true' : 'false');
  }

  /**
   * 2.1 Calculate MASTER SHEET (from Calendar)
   * Formula:
   * Total_P = COUNT(days where code == 'P' AND weekday != 'Fri')
   * Total_M = COUNT(days where code == 'M' AND weekday != 'Fri')
   * Total_U = COUNT(days where code == 'U' AND weekday != 'Fri')
   * Total_O = COUNT(days where code == 'O' AND weekday != 'Fri')
   * Gated on Employee Name being non-blank.
   */
  calculateMasterSheet1() {
    const calendar = this.getCalendar();
    const rows = [];

    for (const emp of calendar) {
      if (!emp.name || !emp.name.trim()) continue; // Gated on Employee Name

      let totalP = 0;
      let totalM = 0;
      let totalU = 0;
      let totalO = 0;
      let fridayP = 0;
      let fridayM = 0;
      let fridayU = 0;
      let fridayO = 0;

      const marks = emp.marks || {};
      for (const [dateStr, code] of Object.entries(marks)) {
        if (!code) continue;
        const dayInfo = this.daysByDate.get(dateStr);
        const isFri = dayInfo ? dayInfo.isFriday : false;

        if (code === 'P') {
          if (isFri) fridayP++; else totalP++;
        } else if (code === 'M') {
          if (isFri) fridayM++; else totalM++;
        } else if (code === 'U') {
          if (isFri) fridayU++; else totalU++;
        } else if (code === 'O') {
          if (isFri) fridayO++; else totalO++;
        }
      }

      rows.push({
        id: emp.id || '',
        name: emp.name.trim(),
        designation: emp.designation || '',
        totalP,
        totalM,
        totalU,
        totalO,
        fridayP,
        fridayM,
        fridayU,
        fridayO,
        totalOfficial: totalP + totalM + totalU + totalO,
        totalWithFridays: (totalP + fridayP) + (totalM + fridayM) + (totalU + fridayU) + (totalO + fridayO)
      });
    }

    return rows;
  }

  /**
   * 2.2 & 2.3 Calculate MASTER SHEET (2) (from Leave Register)
   * Live formulas:
   * - Total_Paid_Taken = sum of 12 monthly Paid values
   * - Total_Unpaid_Taken = sum of 12 monthly Unpaid values
   * - Total_Medical_Taken = sum of 12 monthly Medical values
   * - Total_Other_Taken = sum of 12 monthly Other values
   * - Total_All_Leave = sum of four totals
   * - Annual_Paid_Entitlement = entered value
   * - Paid_Leave_Remaining = Annual_Paid_Entitlement - Total_Paid_Taken
   * - Accrued_Leave_Till_Date = max(0, (Annual_Paid_Entitlement / 12) * months_elapsed)
   *   where months_elapsed = (asOf_year - joining_year)*12 + (asOf_month - joining_month) + 1
   * - Balance_vs_Accrued = Accrued_Leave_Till_Date - Total_Paid_Taken
   *
   * Gated strictly on Employee Name being non-blank.
   */
  calculateMasterSheet2(asOfDateStr = this.getAsOfDate()) {
    const register = this.getRegister();
    const asOfDate = new Date(asOfDateStr);
    const asOfYear = asOfDate.getFullYear();
    const asOfMonth = asOfDate.getMonth() + 1; // 1-12

    const rows = [];

    for (const emp of register) {
      if (!emp.name || !emp.name.trim()) continue; // Gated on Employee Name

      let totalPaidTaken = 0;
      let totalUnpaidTaken = 0;
      let totalMedicalTaken = 0;
      let totalOtherTaken = 0;

      const months = emp.months || [];
      for (let m = 0; m < 12; m++) {
        const entry = months[m] || {};
        totalPaidTaken += parseFloat(entry.paid) || 0;
        totalUnpaidTaken += parseFloat(entry.unp) || 0;
        totalMedicalTaken += parseFloat(entry.med) || 0;
        totalOtherTaken += parseFloat(entry.oth) || 0;
      }

      const totalAllLeave = totalPaidTaken + totalUnpaidTaken + totalMedicalTaken + totalOtherTaken;
      const annualEntitlement = parseFloat(emp.annualEntitlement) || 0;
      const paidLeaveRemaining = annualEntitlement - totalPaidTaken;

      // Accrual Calculation
      let accruedLeaveTillDate = 0;
      let monthsElapsed = 0;

      if (emp.joiningDate && emp.joiningDate.trim()) {
        const joinParts = emp.joiningDate.split('-');
        let joinYear, joinMonth;

        if (joinParts.length === 3) {
          if (joinParts[0].length === 4) {
            // YYYY-MM-DD
            joinYear = parseInt(joinParts[0], 10);
            joinMonth = parseInt(joinParts[1], 10);
          } else {
            // DD-MMM-YYYY or DD-MM-YYYY
            joinYear = parseInt(joinParts[2], 10);
            const mText = joinParts[1];
            const mIdx = MONTH_NAMES.findIndex(n => n.toLowerCase().startsWith(mText.toLowerCase()));
            joinMonth = mIdx >= 0 ? mIdx + 1 : parseInt(mText, 10);
          }
        }

        if (joinYear && joinMonth) {
          monthsElapsed = ((asOfYear - joinYear) * 12) + (asOfMonth - joinMonth) + 1;
          accruedLeaveTillDate = Math.max(0, (annualEntitlement / 12) * monthsElapsed);
        }
      }

      const balanceVsAccrued = accruedLeaveTillDate - totalPaidTaken;

      rows.push({
        id: emp.id || '',
        name: emp.name.trim(),
        designation: emp.designation || '',
        joiningDate: emp.joiningDate || '',
        totalPaidTaken: Math.round(totalPaidTaken * 10) / 10,
        totalUnpaidTaken: Math.round(totalUnpaidTaken * 10) / 10,
        totalMedicalTaken: Math.round(totalMedicalTaken * 10) / 10,
        totalOtherTaken: Math.round(totalOtherTaken * 10) / 10,
        totalAllLeave: Math.round(totalAllLeave * 10) / 10,
        annualEntitlement: Math.round(annualEntitlement * 10) / 10,
        paidLeaveRemaining: Math.round(paidLeaveRemaining * 10) / 10,
        monthsElapsed,
        accruedLeaveTillDate: Math.round(accruedLeaveTillDate * 10) / 10,
        balanceVsAccrued: Math.round(balanceVsAccrued * 10) / 10
      });
    }

    return rows;
  }
}

// Global instance
window.leaveManager = new LeaveDataManager();
