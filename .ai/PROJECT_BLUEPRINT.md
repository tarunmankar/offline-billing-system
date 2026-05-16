# **🗺️ PROJECT_BLUEPRINT.md: Workspace Folder Map & Screens Blueprint**

This blueprint defines the structural architecture of the application, representing the physical directory map, modules, and the UX/UI screen definitions.

---

## **1. Physical Workspace Directory Structure**

The workspace consists of a highly cohesive Electron-React hierarchy. Below is the blueprint map of the current files and the ones designated for subsequent implementation phases:

```
offline-billing-system/
├── .ai/                            # 🔒 AI Brain Folder (Active Context)
│   ├── 00_PRD.md                   # 🧠 Master Product Requirements Document
│   ├── ARCHITECTURE_MASTER.md      # ⚙️ IPC Engine, Context Isolation & Wiremap
│   ├── SCHEMA.md                   # 🗃️ SQLite DDL, JSON Schema, Indices & Seed
│   ├── AGENTS.md                   # 📜 AI Agent Constitutional Directives
│   ├── GEMINI.md                   # 💻 Windows/Antigravity Execution Overrides
│   ├── PROJECT_BLUEPRINT.md        # 🗺️ [THIS FILE] Workspace Maps & Screen UX
│   ├── TASKS.md                    # 📋 Phased Implementation Daily Tracker
│   └── ERROR_LOGS.md               # 🐛 Diagnostic Memory Bank (Logs)
├── main/                           # 📦 Electron Main Process (Backend)
│   ├── index.ts                    # 🚀 Window Management & IPC Router
│   ├── preload.js                  # 🛡️ Secure ContextBridge IPC Channel Gateway
│   ├── db/                         # 🗃️ SQLite Persistence Layer
│   │   └── database.ts             # ⚙️ connection, migration schema, seeds
│   └── managers/                   # ⚙️ Native Main Process Feature Managers
│       ├── ConfigManager.ts        # 🛠️ config.json dynamic validator & writer
│       ├── AuthManager.ts          # 🔐 Cryptographic password checks & RBAC
│       └── PrintManager.ts         # 🖨️ Native ESC/POS Thermal & hidden A4 PDF printers
├── src/                            # 🎨 React Frontend Process (UI)
│   ├── main.tsx                    # 🚀 Core React Entry Point
│   ├── App.tsx                     # 🔀 Central Router & Global Layout Core
│   ├── index.css                   # 💅 Vanilla Tailwind CSS Styling Declarations
│   ├── context/                    # 🔄 Global React Contexts (State Hydration)
│   │   ├── ConfigContext.tsx       # 🛠️ Config hook injector
│   │   └── AuthContext.tsx         # 🔐 Cashier Session state context
│   ├── hooks/                      # 🪝 Reusable Custom UI Logic Hooks
│   │   ├── useConfig.ts            # 💡 Accesses parsed configuration parameters
│   │   └── useAuth.ts              # 💡 Cashier context shorthand
│   ├── components/                 # 🧱 Reusable Presentation Components
│   │   ├── Sidebar.tsx             # 📑 Dynamic Sidebar (adaptive features & roles)
│   │   ├── DynamicForm.tsx         # 📝 Dynamic Forms (built from custom_fields array)
│   │   └── ExpiryAlert.tsx         # ⚠️ Dynamic Expiry Warnings Widget
│   └── pages/                      # 🖥️ Core Dashboard Layout Views (Screens)
│       ├── Login.tsx               # 🔑 Local Secure Cashier Login portal
│       ├── Dashboard.tsx           # 📊 Financial Summaries, Graphs & Action Cards
│       ├── Billing.tsx             # 🛒 Cart layout, barcode scanning & checks
│       ├── Inventory.tsx           # 📦 Dynamic Catalog CRUD Portal
│       ├── CreditLedger.tsx        # 📓 Offline customer credit bookkeeping
│       └── Settings.tsx            # ⚙️ Admin layout parameters, Backups & Resets
├── assets/                         # 🖼️ Local Static Resources (Logo, Icons)
├── config.json                     # ⚙️ Active Runtime Shop Niche settings
└── default_config.json             # 🔄 Fallback default shop settings template
```

---

## **2. Detailed Screen Blueprints & User Experiences**

### **A. Secure Cashier Login Portal (`Login.tsx`)**
* **Aesthetics:** Sleek dark-mode container using glassmorphism, glowing borders linked to input focus, and smooth logo entry animations.
* **Layout:** Centered interface with simple fields for Username and Password.
* **Logic:** 
  * Restricts access to cashier terminals and administrative tools.
  * Encrypts passwords and authenticates transactions locally against SQLite data.
  * Preserves secure sessions using `AuthContext`.

### **B. Financial Analytics Dashboard (`Dashboard.tsx`)**
* **Aesthetics:** High-fidelity dashboard widgets using a sleek gray palette, vibrant status indicators (blue, green, orange), and layout entry fade-ins.
* **Layout:** 
  * Top metrics strip: Today's Revenue, Outstanding Credit, Total Transactions, Active Alerts.
  * Main Section: Quick action buttons, transaction logs, and real-time inventory alerts (low stock or expired items).
* **Logic:**
  * Only displays features enabled in `config.json`.
  * Cashiers see transaction options; Admins see system settings shortcuts.

### **C. High-Speed Checkout Billing Terminal (`Billing.tsx`)**
* **Aesthetics:** High-contrast layout designed for long hours. Features a dual-pane workspace: Cart on the left, Totals & Payment Actions on the right.
* **Layout:**
  * Floating bar: Continuous barcode scanning input with auto-focus locked.
  * Left area: Dynamic grid showing cart items (Product, Quantity, Base Rate, Tax amount, Discount, Total).
  * Right panel: Clean totalizer breakdown (Taxable amount, SGST/CGST/VAT detail, Round-offs, Grand Total) and checkout buttons.
* **Logic:**
  * Fully operational via keyboard shortcuts (e.g., `F1` opens billing, `F12` checks out).
  * Calculates taxes dynamically based on shop niche parameters.
  * Decrements stock counts automatically upon sale completion.

### **D. Dynamic Catalog Inventory Manager (`Inventory.tsx`)**
* **Aesthetics:** Dynamic data-table, with status-colored badges for stock health (Green = Stable, Red = Out of Stock, Amber = Low Stock).
* **Layout:**
  * Top row: Fast Search filter field and "Add New Product" trigger.
  * Mid section: High-performance dataset grid.
  * Sidebar Slide-out: Product CRUD form.
* **Logic:**
  * **Dynamic Inputs:** The product editing form reads `config.custom_fields` and dynamically appends fields (e.g. Batch, Expiry) without hardcoding UI tags.
  * Stores dynamic fields as JSON strings in the database.

### **E. Credit Ledger "Udhaar Book" Portal (`CreditLedger.tsx`)**
* **Aesthetics:** Clean ledger book aesthetic using subtle borders and clear column styling showing Credits (positive/red) and Payments (negative/green).
* **Layout:**
  * Left column: Scrollable list of active credit customers showing net balance.
  * Right column: Chronological statement showing historical sales with due amounts and ledger payments.
* **Logic:**
  * Links ledger logs to actual sales transactions if they are credit sales.
  * Recalculates net balances on customer profile cards in real time.

### **F. Master System Settings Panel (`Settings.tsx`)**
* **Aesthetics:** Divided settings interface, categorized by card categories with toggles, color pickers, and primary status indicators.
* **Layout:** Sections for Shop Profile, Core Feature Flags, Theme Adjustments, Printer Configurations, and DB Operations.
* **Logic:**
  * Restricts access to Administrators only.
  * Changes save instantly to `config.json` and update UI styles in real-time.
  * Provides backup triggers and complete database resets with confirmation prompts.

---
*Document Status: ACTIVE | Blueprint Roadmap 2026-05-17*
