# NEST Kuwait — Leave & Attendance Management System

A web application converted directly from the Excel workbook (`LEAVE_RECORD.xlsx`) for managing employee leave, attendance, accruals, and balances according to Kuwait operational rules.

---

## 🌐 Live Website URLs

The system is hosted and running locally on port `8080`:

- **Primary Website Link (This PC)**: **[http://localhost:8080/](http://localhost:8080/)**
- **Office Local Network Link (Phones, Tablets & Other PCs on Office Wi-Fi)**: **[http://192.168.71.68:8080/](http://192.168.71.68:8080/)**

---

## 🚀 How to Launch or Re-start the Website

- **Double-click [`start-app.bat`](file:///C:/OFFICE-KUWAIT/leave-management-system/start-app.bat)**: Checks the server and automatically opens `http://localhost:8080/` in your default web browser.
- **Run [`start-app.ps1`](file:///C:/OFFICE-KUWAIT/leave-management-system/start-app.ps1)**: PowerShell launcher that opens the live URL.

### Option 2: Direct File Open
- Double-click **`index.html`** or right-click `index.html` → **Open with** → **Microsoft Edge** / **Google Chrome**.

### Option 3: Host on Office Network / Web Server
Since this is a client-side Single Page Application (SPA):
- You can copy this folder to any internal company server, IIS, Apache, Nginx, or GitHub Pages.
- Every employee or HR manager can access it over the local network via `http://<server-ip>/leave-management-system/`.

---

## 📋 Core Modules & Views

### 1. 📅 Calendar Entry Grid
- Interactive 365-day year grid (currently initialized for 2026).
- **Kuwait Company Weekend / Holiday Rule**: All **Friday** columns are shaded grey.
- **Leave Types**:
  - `P` — Paid leave (Green)
  - `M` — Medical leave (Amber)
  - `U` — Unpaid leave (Red)
  - `O` — Other leave (Blue)
  - Blank — Normal working day
- **Editing**: Click any cell to cycle through leave codes, or focus and press `P`, `M`, `U`, `O`, or `Backspace` / `Delete`.
- **Month Jumpers**: Instant navigation buttons (Jan, Feb, Mar... Dec).
- Sticky columns for Employee ID, Name, and Designation keep context visible during horizontal scrolling.

### 2. 📋 Leave Register
- Monthly day counts per leave type across all 12 months (Jan–Dec).
- Annual Paid Leave Entitlement (e.g. 30 days, 45 days).
- Employee Joining Date management.
- Live auto-save on every keystroke.

### 3. 📊 Master Sheet 1 (Calendar Summary)
- Live auto-calculated summary driven by the Calendar grid.
- **Business Rule (Friday Exclusion)**: Per Section 2.1 of the Build Spec:
  ```
  Total_P = COUNT(days where code == 'P' AND weekday != 'Fri')
  Total_M = COUNT(days where code == 'M' AND weekday != 'Fri')
  Total_U = COUNT(days where code == 'U' AND weekday != 'Fri')
  Total_O = COUNT(days where code == 'O' AND weekday != 'Fri')
  ```
- Leave codes marked on Fridays are automatically excluded from the official totals, with a separate indicator column showing Friday marks.
- Gated strictly on `Employee Name` (Employee ID is optional).
- Export to CSV button.

### 4. 📈 Master Sheet 2 (Balances & Accruals)
- Live pass-through and computed balances:
  - `Total_Paid_Taken` = Sum of 12 monthly Paid values
  - `Total_Unpaid_Taken` = Sum of 12 monthly Unpaid values
  - `Total_Medical_Taken` = Sum of 12 monthly Medical values
  - `Total_Other_Taken` = Sum of 12 monthly Other values
  - `Total_All_Leave` = Sum of all 4 leave types
  - `Annual_Paid_Entitlement` = Entered entitlement
  - `Paid_Leave_Remaining` = `Annual_Paid_Entitlement - Total_Paid_Taken`
  - **Accrued Leave Till Date Formula**:
    ```
    months_elapsed = (current_year - joining_year) * 12 + (current_month - joining_month) + 1
    Accrued_Leave_Till_Date = max(0, (Annual_Paid_Entitlement / 12) * months_elapsed)
    ```
    *Important Business Rule*: Accrues indefinitely across years without resetting each January.
  - `Balance_vs_Accrued` = `Accrued_Leave_Till_Date - Total_Paid_Taken`
- Interactive **"As Of" Date Selector** in header to calculate balances as of any date or month.
- Export to CSV button.

### 5. ℹ️ Instructions & Rules
- Complete user manual reproduced from the original workbook.

---

## 🔒 Access Control & Security

- Summary views (`Master Sheet` and `Master Sheet 2`) are protected.
- To unlock administrator controls, click **Read-Only Views** in the top header and enter:
  ```
  NEST@2026
  ```

---

## 💾 Data Management & Persistence

- **Auto-Save**: All changes are automatically saved to browser storage (`localStorage`).
- **Backup to JSON**: Click **Backup** to export all calendar entries, register counts, and settings into a timestamped `.json` file.
- **Restore from Backup**: Click **Restore** to reload a previously saved backup file.
- **Reset Baseline**: Click **Reset Baseline** to return to the original dataset from `LEAVE_RECORD.xlsx`.

---

## 📁 Project Directory Structure

```
leave-management-system/
├── index.html              # Main application single page interface
├── start-app.bat           # One-click Windows launcher
├── start-app.ps1           # PowerShell launcher
├── README.md               # User & technical documentation
├── css/
│   └── style.css           # Styling, Kuwait Friday highlights, responsive layout
├── js/
│   ├── models.js           # Core calculation engine, business logic & seed data
│   └── app.js              # View controllers, events, modals, export/import
└── data/
    ├── calendar.csv        # Exported Calendar CSV from Excel
    ├── leave_register.csv  # Exported Leave Register CSV from Excel
    ├── master_sheet_1.csv  # Reference Master Sheet 1 CSV
    └── master_sheet_2.csv  # Reference Master Sheet 2 CSV
```
