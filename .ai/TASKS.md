# **📋 TASKS.md: Daily Phased Tasks Tracker**

This task tracker lists the development pipeline for the **Offline Billing System**. Mark checkpoints as complete `[x]` as we progress through development cycles.

---

## **Phase 1: Project Setup & AI Engine Integration ✅**
- [x] Create workspace directories (`main/`, `src/`, `assets/`, `config/`).
- [x] Configure TypeScript compiler presets (`tsconfig.json`, `tsconfig.node.json`).
- [x] Write AI Agent Rules, overrides, and engine guidelines.
- [x] Establish the system PRD, Schema blueprints, and folder map.
- [x] Write dynamic default settings templates (`config.json`, `default_config.json`).

---

## **Phase 2: Core Platform Foundation ✅**
- [x] **Database Core & Transaction Layer:**
  - [x] Create connection script `main/db/database.ts` using `better-sqlite3`.
  - [x] Implement initial DDL schema migrations: `users`, `products`, `sales`, `sale_items`, `customers`, `credit_ledger`.
  - [x] Seed super-administrator user record (`admin` / `admin123`) securely hashed in migrations.
- [x] **ConfigManager Extensions:**
  - [x] Create `main/managers/ConfigManager.ts` to manage read/write actions.
  - [x] Inject robust JSON schema validator matching template configurations.
- [x] **Secure Authentication Manager:**
  - [x] Create `main/managers/AuthManager.ts` for offline password verification.
  - [x] Expose secure user verification IPC handlers (`auth:login`, `auth:logout`).
- [x] **React State Hydration & Contexts:**
  - [x] Establish `ConfigContext` to supply parsed dynamic parameters globally.
  - [x] Create `AuthContext` to manage active cashier/admin sessions locally in React.

---

## **Phase 3: Dynamic UI Shell & Custom Field Engine ✅**
- [x] **Dynamic Navigation Sidebar:**
  - [x] Design Sidebar component responsive to toggled settings flags (`config.features`).
  - [x] Hide/Show administrative settings panels based on user role (`Admin` vs. `Cashier`).
- [x] **Dynamic Form Renderer (`DynamicForm.tsx`):**
  - [x] Build a generic component that parses the `config.custom_fields` array.
  - [x] Dynamically render corresponding input fields (e.g. text inputs for `Batch No`, date pickers for `Expiry`).
- [x] **Dynamic Brand Theming:**
  - [x] Hook the global styles system into the state, applying colors from `config.theme.primary_color`.
  - [x] Support smooth transitions between light and dark backgrounds.

---

## **Phase 4: Billing Terminal & Native Hardware Integration ⏳**
- [x] **Product Catalog CRUD System:**
  - [x] Develop data management forms for product additions, edits, and deletions.
  - [x] Serialize custom fields into the `metadata` JSON column.
- [x] **Checkout Terminal & Cart Calculations:**
  - [x] Code billing engine layout with automatic input focus on barcode scanning actions.
  - [x] Implement real-time transactional pricing grids.
  - [x] Program tax processing algorithms displaying CGST/SGST/VAT breakdowns.
- [ ] **Native Printing Interface (`PrintManager.ts`):**
  - [ ] Integrate thermal printing mechanisms (ESC/POS) using direct printer driver links.
  - [ ] Design background window standard print models for beautiful A4 layouts.
- [ ] **Inventory Control Alerts:**
  - [ ] Code notification banners warning operators of near-expiry inventory.

---

## **Phase 5: System Reliability & Deployment Packages ⏳**
- [ ] **Daily DB Backups:**
  - [ ] Program scheduled background processes copying SQLite states to a designated `backups/` directory.
- [ ] **Factory Resets:**
  - [ ] Implement utility wiping database states and resetting configuration files back to defaults.
- [ ] **Final Distribution Packaging:**
  - [ ] Test the compilation using `electron-builder` to generate a single self-contained Windows executable (`.exe`).

---
*Last Synchronized: 2026-05-17*
