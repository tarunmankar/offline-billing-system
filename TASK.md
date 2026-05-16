# **📝 TASK.md: Execution Roadmap**

This file tracks the detailed tasks for the AI Agent. Mark tasks as complete as you progress.

## **Phase 2: Foundation (Post-Setup) 🚧**
- [ ] **SQLite Initialization:** 
    - Create `main/db/database.ts` using `better-sqlite3`.
    - Implement schema: `Users`, `Products`, `Sales`, `Sale_Items`.
    - Set up initial migrations/seed data (Admin user).
- [ ] **Auth Manager:**
    - Implement login logic in the Main process.
    - Create `AuthContext` in React to handle user session.

## **Phase 3: Dynamic UI Logic ⏳**
- [ ] **Dynamic Sidebar Enhancement:**
    - Ensure sidebar items react to `config.features`.
- [ ] **Config-Driven Product Form:**
    - Create a form that dynamically adds input fields based on `config.custom_fields` (e.g., Batch No, Expiry).
- [ ] **Theme Integration:**
    - Apply `config.theme.primary_color` dynamically.

## **Phase 4: Core Billing Features ⏳**
- [ ] **Product Management:**
    - CRUD operations for Inventory.
    - Search logic (Barcode + Name).
- [ ] **Billing Engine:**
    - Real-time GST/VAT calculations based on `config.shop_info.tax_label`.
    - Cart logic (Add, Remove, Update quantity).
- [ ] **Print Manager:**
    - Logic to switch between Thermal (80mm) and A4 formats.
    - PDF generation for invoices.

## **Phase 5: Reliability ⏳**
- [ ] **Database Backups:** 
    - Automated daily export to a `backups/` folder.
- [ ] **Factory Reset:**
    - Feature to wipe data and restore `default_config.json`.

---
### **⚠️ AI Reminders**
1. **Never hardcode!** Always check `config.json` before rendering a UI element.
2. **IPC Security:** All database calls must go through `ipcMain.handle` in `main/` and `window.electronAPI` in `src/`.
3. **Offline First:** Do not add any external script tags or CDN links. All assets must be local.
