# Laboratory of Applied Nanomaterial — Management System

A web-based laboratory management platform designed for the **Laboratory of Applied Nanomaterial (LAN)** to streamline chemical tracking, instrument maintenance, standard operating procedures, safety certifications, lab bookings, and team organization.

![Lab Logo](web/assets/logo.png)

---

## 🚀 Key Modules

### 1. 🧪 Chemical Inventory Management
- Real-time stock tracking with color-coded status badges (🟢 Sufficient, 🟡 Low Stock, 🔴 Expired / Out of Stock).
- Track CAS numbers, hazard classifications (Flammable, Toxic, Corrosive, etc.), storage cabinet locations, expiry dates, and supplier information.
- Filter by category and hazard; instant search by name or CAS number.
- One-click CSV export of the entire inventory.

### 2. 🔬 Instrument Inventory Management
- Equipment tracking (SEM, TEM, XRD, UV-Vis, DLS, Spin Coater, Balances, etc.).
- Operational status badges (Available, In Use, Under Maintenance, Out of Order).
- Calibration date tracking with automated 14-day advance alerts.
- Filter by instrument category and status; CSV export.

### 3. 📋 Work Instructions & 🎓 Certification Quiz System
- Standard Operating Procedures (SOPs) for key lab instruments.
- Structured sections:
  - ⚠️ **Safety Precautions**
  - ✅ **Pre-Operation Checklists** (interactive checkable boxes)
  - 📝 **Step-by-Step Operating Procedures**
  - 🔌 **Shutdown Procedures**
  - 🔧 **Troubleshooting Guides**
- **Safety Certification Quiz**:
  - Multiple-choice questions testing safety and correct operation.
  - Automatic scoring with **$\ge$ 70% passing threshold**.
  - Downloadable & printable high-resolution **Certificate of Competency (PNG/PDF)** with official lab seal and credential ID upon passing.
  - Certification history and certified operators directory.

### 4. 📅 Lab Booking Schedule
- Weekly calendar grid (8:00 AM – 6:00 PM) for instrument reservations.
- **Automated Overlap Detection**: Prevents double-booking conflicts for the same instrument.
- Color-coded member reservations.
- Week-by-week navigation and reservation management.

### 5. 👥 Lab Structure & Member Profiles
- Organizational directory for advisors, researchers, graduate students, and technical staff.
- Profile cards with photo upload, academic credentials, research focus areas, and office locations.
- Direct contact links (email and phone).
- Cross-references instrument certifications to show authorized equipment operators.
- Export lab roster as CSV directory.

---

## 💻 Tech Stack & Architecture

- **Frontend**: Pure HTML5, CSS3, Modern JavaScript (ES6+).
- **Zero Server Dependencies**: Runs in any modern web browser (Chrome, Edge, Firefox, Safari).
- **Offline Persistence**: All data persists locally in browser `localStorage`.
- **Data Safety**: Includes full backup and restore functionality (`💾 Backup` / `📂 Restore` JSON file).

---

## 🌐 How to Host on GitHub Pages (Free Online Access)

1. Upload the files in `web/` to the root of your GitHub repository.
2. In your GitHub repository, go to **Settings** $\rightarrow$ **Pages**.
3. Under **Build and deployment** $\rightarrow$ **Branch**, select `main` and `/ (root)`.
4. Click **Save**.
5. Your lab system will be live at:
   ```
   https://<your-username>.github.io/<your-repository-name>/
   ```
